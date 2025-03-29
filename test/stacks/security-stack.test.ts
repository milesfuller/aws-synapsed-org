import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityStack } from '../../lib/stacks/security-stack';

describe('SecurityStack', () => {
  const testOrgId = 'o-1234567890';
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('creates security audit role with correct permissions', () => {
    const app = new App();
    const stack = new SecurityStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      orgId: testOrgId,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            AWS: '*'
          },
          Condition: {
            StringEquals: {
              'aws:PrincipalOrgID': testOrgId
            }
          }
        }],
        Version: '2012-10-17'
      },
      Description: 'Role that allows Security Account to audit across OUs',
      RoleName: 'test-project-test-security-audit-role',
      ManagedPolicyArns: [
        { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/SecurityAudit']] },
        { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/AWSConfigUserAccess']] }
      ]
    });
  });

  test('creates security audit role with orgId from environment variable', () => {
    process.env.AWS_ORG_ID = 'o-env123456';
    const app = new App();
    const stack = new SecurityStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            AWS: '*'
          },
          Condition: {
            StringEquals: {
              'aws:PrincipalOrgID': 'o-env123456'
            }
          }
        }],
        Version: '2012-10-17'
      }
    });
  });

  test('creates logging read role with correct permissions', () => {
    const app = new App();
    const stack = new SecurityStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      orgId: testOrgId,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            AWS: '*'
          },
          Condition: {
            StringEquals: {
              'aws:PrincipalOrgID': testOrgId
            }
          }
        }],
        Version: '2012-10-17'
      },
      Description: 'Role that grants Logging Account access across OUs',
      RoleName: 'test-project-test-logging-read-role'
    });

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Sid: 'AllowLoggingBucketRead',
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:GetObjectVersion',
              's3:ListBucket',
              's3:ListBucketVersions'
            ],
            Resource: [
              'arn:aws:s3:::*-logs',
              'arn:aws:s3:::*-logs/*'
            ],
            Condition: {
              StringEquals: {
                'aws:PrincipalOrgID': testOrgId
              }
            }
          },
          {
            Sid: 'AllowCloudWatchLogsRead',
            Effect: 'Allow',
            Action: [
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
              'logs:GetLogEvents'
            ],
            Resource: '*',
            Condition: {
              StringEquals: {
                'aws:PrincipalOrgID': testOrgId
              }
            }
          }
        ],
        Version: '2012-10-17'
      },
      PolicyName: Match.stringLikeRegexp('LoggingReadRoleDefaultPolicy.*'),
      Roles: [
        {
          Ref: Match.stringLikeRegexp('LoggingReadRole.*')
        }
      ]
    });
  });

  test('creates logging read role with bucket permissions', () => {
    const app = new App();
    const stack = new SecurityStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      orgId: testOrgId,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'AllowLoggingBucketRead',
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:GetObjectVersion',
              's3:ListBucket',
              's3:ListBucketVersions'
            ],
            Resource: [
              'arn:aws:s3:::*-logs',
              'arn:aws:s3:::*-logs/*'
            ],
            Condition: {
              StringEquals: {
                'aws:PrincipalOrgID': testOrgId
              }
            }
          })
        ])
      }
    });
  });

  test('creates logging read role with CloudWatch Logs permissions', () => {
    const app = new App();
    const stack = new SecurityStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      orgId: testOrgId,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'AllowCloudWatchLogsRead',
            Effect: 'Allow',
            Action: [
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
              'logs:GetLogEvents'
            ],
            Resource: '*',
            Condition: {
              StringEquals: {
                'aws:PrincipalOrgID': testOrgId
              }
            }
          })
        ])
      }
    });
  });

  test('creates required outputs', () => {
    const app = new App();
    const stack = new SecurityStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      orgId: testOrgId,
    });

    const template = Template.fromStack(stack);
    template.hasOutput('SecurityAuditRoleArn', {
      Description: 'Security Audit Role ARN'
    });
    template.hasOutput('LoggingReadRoleArn', {
      Description: 'Logging Read Role ARN'
    });
  });
});