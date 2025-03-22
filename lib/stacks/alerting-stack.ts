import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class AlertingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SNS Topic for security alerts
    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      displayName: 'Security Alerts',
    });

    // Add email subscription - replace with your team's email
    securityAlertsTopic.addSubscription(
      new subscriptions.EmailSubscription('security-team@example.com')
    );
    
    // Optional: Add SMS subscription - replace with your team's phone number
    // securityAlertsTopic.addSubscription(
    //   new subscriptions.SmsSubscription('+1234567890')
    // );

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