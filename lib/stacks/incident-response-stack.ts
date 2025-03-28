import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BaseStack, BaseStackProps } from '../interfaces/base-stack';

export interface IncidentResponseStackProps extends BaseStackProps {
  severityThreshold?: number;
  enableAutomaticUserDisable?: boolean;
}

export class IncidentResponseStack extends BaseStack {
  public readonly incidentResponseFunction: lambda.Function;
  public readonly suspiciousActivityRule: events.Rule;
  public readonly securityHubRule: events.Rule;

  constructor(scope: cdk.App, id: string, props: IncidentResponseStackProps) {
    super(scope, id, props);

    // Lambda for automatic security responses
    this.incidentResponseFunction = new lambda.Function(this, 'IncidentResponseFunction', {
      functionName: this.createResourceName('incident-response'),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing security incident:', JSON.stringify(event));
          
          // This is a placeholder - in a real implementation, you would:
          // 1. Extract the username from the event
          // 2. Use AWS SDK to disable the IAM user
          // 3. Log the incident and actions taken
          
          return { statusCode: 200, body: 'Incident processed' };
        };
      `),
    });

    // Grant the lambda permission to disable IAM users
    this.incidentResponseFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'iam:GetUser',
        'iam:UpdateUser',
        'iam:ListUserPolicies',
        'iam:ListAttachedUserPolicies',
        'iam:ListAccessKeys',
        'iam:UpdateAccessKey'
      ],
      resources: [`arn:aws:iam::${this.account}:user/*`],
    }));

    // EventBridge rule for suspicious activity
    this.suspiciousActivityRule = new events.Rule(this, 'SuspiciousActivityRule', {
      description: 'Detects suspicious IAM user activity',
      eventPattern: {
        source: ['aws.guardduty'],
        detailType: ['GuardDuty Finding'],
        detail: {
          type: ['UnauthorizedAccess:IAMUser'],
          severity: [{ numeric: ['>', props.severityThreshold || 7] }], // High severity
        },
      },
    });

    this.suspiciousActivityRule.addTarget(new targets.LambdaFunction(this.incidentResponseFunction));

    // Integration with Security Hub
    this.securityHubRule = new events.Rule(this, 'SecurityHubFindingsRule', {
      description: 'Processes critical Security Hub findings',
      eventPattern: {
        source: ['aws.securityhub'],
        detailType: ['Security Hub Findings - Imported'],
        detail: {
          findings: {
            Severity: {
              Label: ['CRITICAL'],
            },
            Compliance: {
              Status: ['FAILED'],
            },
          },
        },
      },
    });

    this.securityHubRule.addTarget(new targets.LambdaFunction(this.incidentResponseFunction));

    // Create outputs
    new cdk.CfnOutput(this, 'IncidentResponseFunctionArn', {
      value: this.incidentResponseFunction.functionArn,
      description: 'Incident Response Lambda Function ARN',
      exportName: 'IncidentResponseFunctionArn'
    });
  }
}