import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { AlertingStack } from '../../lib/stacks/alerting-stack';

describe('AlertingStack', () => {
  test('creates SNS topic with email subscription', () => {
    const app = new App();
    const stack = new AlertingStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      securityTeamEmail: 'security@example.com',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'test-project-test-security-alerts',
      TopicName: 'test-project-test-security-alerts'
    });

    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'email',
      Endpoint: 'security@example.com'
    });
  });

  test('creates SNS topic with email and SMS subscriptions', () => {
    const app = new App();
    const stack = new AlertingStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      securityTeamEmail: 'security@example.com',
      securityTeamPhone: '+1234567890',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'email',
      Endpoint: 'security@example.com'
    });

    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'sms',
      Endpoint: '+1234567890'
    });
  });

  test('creates EventBridge rule for high severity findings', () => {
    const app = new App();
    const stack = new AlertingStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      securityTeamEmail: 'security@example.com',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Detects high severity security findings',
      EventPattern: {
        source: ['aws.securityhub'],
        'detail-type': ['Security Hub Findings - Imported'],
        detail: {
          findings: {
            Severity: {
              Label: ['CRITICAL', 'HIGH']
            }
          }
        }
      }
    });
  });

  test('creates EventBridge rule for GuardDuty findings with default threshold', () => {
    const app = new App();
    const stack = new AlertingStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      securityTeamEmail: 'security@example.com',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Detects GuardDuty high severity findings',
      EventPattern: {
        source: ['aws.guardduty'],
        'detail-type': ['GuardDuty Finding'],
        detail: {
          severity: [{ numeric: ['>=', 7] }]
        }
      }
    });
  });

  test('creates EventBridge rule for GuardDuty findings with custom threshold', () => {
    const app = new App();
    const stack = new AlertingStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      securityTeamEmail: 'security@example.com',
      highSeverityThreshold: 8,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Detects GuardDuty high severity findings',
      EventPattern: {
        source: ['aws.guardduty'],
        'detail-type': ['GuardDuty Finding'],
        detail: {
          severity: [{ numeric: ['>=', 8] }]
        }
      }
    });
  });
}); 