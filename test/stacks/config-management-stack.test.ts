import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ConfigManagementStack } from '../../lib/stacks/config-management-stack';

describe('ConfigManagementStack', () => {
  test('creates Parameter Store parameter with default name', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: 'test-project-test-config',
      Type: 'String',
      Value: 'Default configuration value',
      Description: 'Central configuration parameter',
      Tier: 'Standard'
    });
  });

  test('creates Parameter Store parameter with custom prefix', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project',
      parameterPrefix: '/custom/params'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/custom/params/test-project-test-config',
      Type: 'String',
      Value: 'Default configuration value',
      Description: 'Central configuration parameter',
      Tier: 'Standard'
    });
  });

  test('creates Secrets Manager secret with default name', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'test-project-test-config',
      Description: 'Central configuration secret',
      GenerateSecretString: {
        GenerateStringKey: 'password',
        SecretStringTemplate: '{"username":"admin"}',
        ExcludePunctuation: true,
        PasswordLength: 16,
        ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/,"\\',
      }
    });
  });

  test('creates Secrets Manager secret with custom prefix', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project',
      secretPrefix: '/custom/secrets'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: '/custom/secrets/test-project-test-config',
      Description: 'Central configuration secret',
      GenerateSecretString: {
        GenerateStringKey: 'password',
        SecretStringTemplate: '{"username":"admin"}',
        ExcludePunctuation: true,
        PasswordLength: 16,
        ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/,"\\',
      }
    });
  });

  test('creates AppConfig application with default name', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::AppConfig::Application', {
      Name: 'test-project-test-config',
      Description: 'Central configuration application'
    });
  });

  test('creates AppConfig application with custom prefix', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project',
      applicationPrefix: 'custom-app'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::AppConfig::Application', {
      Name: 'custom-app-test-project-test-config',
      Description: 'Central configuration application'
    });
  });

  test('creates AppConfig resources', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project'
    });

    const template = Template.fromStack(stack);
    template.hasResource('AWS::AppConfig::Environment', {
      Properties: Match.objectLike({
        Description: 'Central configuration environment'
      })
    });

    template.hasResource('AWS::AppConfig::ConfigurationProfile', {
      Properties: Match.objectLike({
        Description: 'Central configuration profile'
      })
    });

    template.hasResource('AWS::AppConfig::HostedConfigurationVersion', {
      Properties: Match.objectLike({
        Content: '{"version":"1.0.0","config":{"key":"value"}}'
      })
    });
  });

  test('creates KMS key with default retention', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project',
      enableKmsEncryption: true
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      PendingWindowInDays: 30,
      Description: 'KMS key for configuration encryption'
    });
  });

  test('creates KMS key with custom retention', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project',
      enableKmsEncryption: true,
      retentionDays: 7
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      PendingWindowInDays: 7,
      Description: 'KMS key for configuration encryption'
    });
  });

  test('does not create KMS key when encryption is disabled', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project',
      enableKmsEncryption: false
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::KMS::Key', 0);
  });

  test('creates IAM role with correct permissions', () => {
    const app = new cdk.App();
    const stack = new ConfigManagementStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'appconfig.amazonaws.com'
          }
        }]
      }),
      Description: 'IAM role for AppConfig',
      RoleName: Match.stringLikeRegexp('.*-appconfig-role'),
      ManagedPolicyArns: Match.absent(),
      Policies: [{
        PolicyDocument: Match.objectLike({
          Statement: [{
            Effect: 'Allow',
            Action: [
              'appconfig:GetConfiguration',
              'appconfig:GetConfigurationProfile',
              'appconfig:GetEnvironment',
              'appconfig:ListApplications',
              'appconfig:ListConfigurationProfiles',
              'appconfig:ListEnvironments',
              'appconfig:ListHostedConfigurationVersions',
              'appconfig:StartDeployment',
              'appconfig:StopDeployment'
            ],
            Resource: '*'
          }]
        }),
        PolicyName: Match.anyValue()
      }]
    });
  });
}); 