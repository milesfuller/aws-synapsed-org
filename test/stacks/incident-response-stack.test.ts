import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { IncidentResponseStack } from '../../lib/stacks/incident-response-stack';

describe('IncidentResponseStack', () => {
  test('creates Lambda function with correct configuration', () => {
    const app = new App();
    const stack = new IncidentResponseStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: Match.stringLikeRegexp('.*-incident-response'),
      Handler: 'index.handler',
      Runtime: 'nodejs18.x'
    });
  });

  test('creates IAM role for Lambda function', () => {
    const app = new App();
    const stack = new IncidentResponseStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          }
        }],
        Version: '2012-10-17'
      }
    });
  });

  test('creates IAM policy for Lambda function', () => {
    const app = new App();
    const stack = new IncidentResponseStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Action: [
            'iam:GetUser',
            'iam:UpdateUser',
            'iam:ListUserPolicies',
            'iam:ListAttachedUserPolicies',
            'iam:ListAccessKeys',
            'iam:UpdateAccessKey'
          ],
          Resource: {
            'Fn::Join': ['', ['arn:aws:iam::', { Ref: 'AWS::AccountId' }, ':user/*']]
          }
        }],
        Version: '2012-10-17'
      }
    });
  });

  test('creates EventBridge rule for suspicious activity with default threshold', () => {
    const app = new App();
    const stack = new IncidentResponseStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Detects suspicious IAM user activity',
      EventPattern: {
        source: ['aws.guardduty'],
        'detail-type': ['GuardDuty Finding'],
        detail: {
          type: ['UnauthorizedAccess:IAMUser'],
          severity: [{ numeric: ['>', 7] }]
        }
      }
    });
  });

  test('creates EventBridge rule for suspicious activity with custom threshold', () => {
    const app = new App();
    const stack = new IncidentResponseStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      severityThreshold: 8
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Detects suspicious IAM user activity',
      EventPattern: {
        source: ['aws.guardduty'],
        'detail-type': ['GuardDuty Finding'],
        detail: {
          type: ['UnauthorizedAccess:IAMUser'],
          severity: [{ numeric: ['>', 8] }]
        }
      }
    });
  });

  test('creates EventBridge rule for Security Hub findings', () => {
    const app = new App();
    const stack = new IncidentResponseStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Events::Rule', {
      Description: 'Processes critical Security Hub findings',
      EventPattern: {
        source: ['aws.securityhub'],
        'detail-type': ['Security Hub Findings - Imported'],
        detail: {
          findings: {
            Severity: {
              Label: ['CRITICAL']
            },
            Compliance: {
              Status: ['FAILED']
            }
          }
        }
      }
    });
  });
}); 