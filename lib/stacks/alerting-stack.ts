import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { get } from "env-var";

export class AlertingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get alert destinations from environment variables
    const securityTeamEmail = get('SECURITY_TEAM_EMAIL').required().asString();
    const securityTeamPhone = get('SECURITY_TEAM_PHONE').default('').asString();

    // SNS Topic for security alerts
    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      displayName: 'Security Alerts',
    });

    // Add email subscription
    securityAlertsTopic.addSubscription(
      new subscriptions.EmailSubscription(securityTeamEmail)
    );
    
    // Add SMS subscription if phone number is provided
    if (securityTeamPhone) {
      securityAlertsTopic.addSubscription(
        new subscriptions.SmsSubscription(securityTeamPhone)
      );
    }

    // Rule to send high-severity findings to SNS
    const highSeverityFindingsRule = new events.Rule(this, 'HighSeverityFindingsRule', {
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

    highSeverityFindingsRule.addTarget(new targets.SnsTopic(securityAlertsTopic));

    // Rule for GuardDuty high-severity findings
    const guardDutyFindingsRule = new events.Rule(this, 'GuardDutyFindingsRule', {
      description: 'Detects GuardDuty high severity findings',
      eventPattern: {
        source: ['aws.guardduty'],
        detailType: ['GuardDuty Finding'],
        detail: {
          severity: [{ numeric: ['>=', 7] }], // High and Critical severity
        },
      },
    });

    guardDutyFindingsRule.addTarget(new targets.SnsTopic(securityAlertsTopic));
  }
}