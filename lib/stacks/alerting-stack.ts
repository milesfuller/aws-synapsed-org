import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { BaseStack, BaseStackProps } from '../interfaces/base-stack';

export interface AlertingStackProps extends BaseStackProps {
  securityTeamEmail: string;
  securityTeamPhone?: string;
  highSeverityThreshold?: number;
}

export class AlertingStack extends BaseStack {
  public readonly securityAlertsTopic: sns.Topic;
  public readonly highSeverityFindingsRule: events.Rule;
  public readonly guardDutyFindingsRule: events.Rule;

  constructor(scope: cdk.App, id: string, props: AlertingStackProps) {
    super(scope, id, props);

    // SNS Topic for security alerts
    this.securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      displayName: this.createResourceName('security-alerts'),
      topicName: this.createResourceName('security-alerts'),
    });

    // Add email subscription
    this.securityAlertsTopic.addSubscription(
      new subscriptions.EmailSubscription(props.securityTeamEmail)
    );
    
    // Add SMS subscription if phone number is provided
    if (props.securityTeamPhone) {
      this.securityAlertsTopic.addSubscription(
        new subscriptions.SmsSubscription(props.securityTeamPhone)
      );
    }

    // Rule to send high-severity findings to SNS
    this.highSeverityFindingsRule = new events.Rule(this, 'HighSeverityFindingsRule', {
      description: 'Detects high severity security findings',
      eventPattern: {
        source: ['aws.securityhub'],
        detailType: ['Security Hub Findings - Imported'],
        detail: {
          findings: {
            Severity: {
              Label: ['CRITICAL', 'HIGH'],
            },
          },
        },
      },
    });

    this.highSeverityFindingsRule.addTarget(new targets.SnsTopic(this.securityAlertsTopic));

    // Rule for GuardDuty high-severity findings
    this.guardDutyFindingsRule = new events.Rule(this, 'GuardDutyFindingsRule', {
      description: 'Detects GuardDuty high severity findings',
      eventPattern: {
        source: ['aws.guardduty'],
        detailType: ['GuardDuty Finding'],
        detail: {
          severity: [{ numeric: ['>=', props.highSeverityThreshold || 7] }], // High and Critical severity
        },
      },
    });

    this.guardDutyFindingsRule.addTarget(new targets.SnsTopic(this.securityAlertsTopic));

    // Create outputs
    new cdk.CfnOutput(this, 'SecurityAlertsTopicArn', {
      value: this.securityAlertsTopic.topicArn,
      description: 'Security Alerts SNS Topic ARN',
      exportName: 'SecurityAlertsTopicArn'
    });
  }
}