import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { LoggingStack } from '../../lib/stacks/logging-stack';

describe('LoggingStack', () => {
  test('creates central logging bucket with correct configuration', () => {
    const app = new App();
    const stack = new LoggingStack(app, 'TestStack');

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled'
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [{
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256'
          }
        }]
      }
    });
  });

  test('creates bucket policy for central logging', () => {
    const app = new App();
    const stack = new LoggingStack(app, 'TestStack');

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([{
          Action: [
            's3:PutObject',
            's3:PutObjectAcl'
          ],
          Effect: 'Allow',
          Principal: {
            AWS: {
              'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::', { Ref: 'AWS::AccountId' }, ':root']]
            }
          },
          Resource: [
            { 'Fn::GetAtt': ['CentralLogsBucket33603207', 'Arn'] },
            { 'Fn::Join': ['', [{ 'Fn::GetAtt': ['CentralLogsBucket33603207', 'Arn'] }, '/*']] }
          ]
        }])
      }
    });
  });

  test('creates log group with default retention', () => {
    const app = new App();
    const stack = new LoggingStack(app, 'TestStack');

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 90
    });
  });
});