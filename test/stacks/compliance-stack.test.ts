import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ComplianceStack } from '../../lib/stacks/compliance-stack';

describe('ComplianceStack', () => {
  test('creates AWS Config recorder with default settings', () => {
    const app = new App();
    const stack = new ComplianceStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Config::ConfigurationRecorder', {
      RecordingGroup: {
        AllSupported: true,
        IncludeGlobalResourceTypes: true,
      },
      RoleARN: {
        'Fn::Join': [
          '',
          [
            'arn:aws:iam::',
            { Ref: 'AWS::AccountId' },
            ':role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig'
          ]
        ]
      }
    });
  });

  test('creates AWS Config recorder with global resource types disabled', () => {
    const app = new App();
    const stack = new ComplianceStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      includeGlobalResourceTypes: false,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Config::ConfigurationRecorder', {
      RecordingGroup: {
        AllSupported: true,
        IncludeGlobalResourceTypes: false,
      }
    });
  });

  test('creates delivery channel with default settings', () => {
    const app = new App();
    const stack = new ComplianceStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Config::DeliveryChannel', {
      ConfigSnapshotDeliveryProperties: {
        DeliveryFrequency: 'One_Hour'
      },
      S3BucketName: {
        'Fn::Join': [
          '',
          [
            'config-bucket-',
            { Ref: 'AWS::AccountId' }
          ]
        ]
      }
    });
  });

  test('creates delivery channel with custom settings', () => {
    const app = new App();
    const stack = new ComplianceStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
      configBucketName: 'custom-bucket',
      deliveryFrequency: 'Twelve_Hours',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Config::DeliveryChannel', {
      ConfigSnapshotDeliveryProperties: {
        DeliveryFrequency: 'Twelve_Hours'
      },
      S3BucketName: 'custom-bucket'
    });
  });

  test('creates managed rules', () => {
    const app = new App();
    const stack = new ComplianceStack(app, 'TestStack', {
      projectName: 'test-project',
      environment: 'test',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Config::ConfigRule', {
      Source: {
        Owner: 'AWS',
        SourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      }
    });

    template.hasResourceProperties('AWS::Config::ConfigRule', {
      Source: {
        Owner: 'AWS',
        SourceIdentifier: 'IAM_ROOT_ACCESS_KEY_CHECK'
      }
    });

    template.hasResourceProperties('AWS::Config::ConfigRule', {
      Source: {
        Owner: 'AWS',
        SourceIdentifier: 'IAM_USER_MFA_ENABLED'
      }
    });
  });
}); 