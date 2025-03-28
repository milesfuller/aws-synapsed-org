import * as cdk from 'aws-cdk-lib';
import { ConfigManagementStack, ConfigManagementStackProps } from '../../lib/stacks/config-management-stack';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';

describe('ConfigManagementStack', () => {
  let app: cdk.App;
  let stack: ConfigManagementStack;

  beforeEach(() => {
    app = new cdk.App();
    const props: ConfigManagementStackProps = {
      environment: 'test',
      projectName: 'test-project',
      enableKmsEncryption: true,
      parameterPrefix: 'test',
      secretPrefix: 'test',
      applicationPrefix: 'test'
    };
    stack = new ConfigManagementStack(app, 'TestStack', props);
  });

  test('creates stack with required props', () => {
    expect(stack).toBeDefined();
  });

  test('creates KMS key when encryption is enabled', () => {
    expect(stack.encryptionKey).toBeDefined();
    expect(stack.encryptionKey).toBeInstanceOf(kms.Key);
  });

  test('creates Parameter Store parameter', () => {
    expect(stack.parameterStore).toBeDefined();
    expect(stack.parameterStore).toBeInstanceOf(ssm.StringParameter);
    expect(stack.parameterStore.parameterName).toContain('test-project-test-test');
  });

  test('creates Secrets Manager secret', () => {
    expect(stack.secretsManager).toBeDefined();
    expect(stack.secretsManager).toBeInstanceOf(secretsmanager.Secret);
    expect(stack.secretsManager.secretName).toContain('test-project-test-test');
  });

  test('creates AppConfig application', () => {
    expect(stack.appConfig).toBeDefined();
    expect(stack.appConfig).toBeInstanceOf(appconfig.CfnApplication);
    expect(stack.appConfig.name).toContain('test-project-test-test');
  });

  test('creates AppConfig environment', () => {
    const environment = stack.node.findChild('ConfigEnvironment') as appconfig.CfnEnvironment;
    expect(environment).toBeDefined();
    expect(environment).toBeInstanceOf(appconfig.CfnEnvironment);
    expect(environment.name).toContain('test-project-test-config-env');
  });

  test('creates AppConfig configuration profile', () => {
    const profile = stack.node.findChild('ConfigProfile') as appconfig.CfnConfigurationProfile;
    expect(profile).toBeDefined();
    expect(profile).toBeInstanceOf(appconfig.CfnConfigurationProfile);
    expect(profile.name).toContain('test-project-test-config-profile');
  });

  test('creates AppConfig hosted configuration version', () => {
    const version = stack.node.findChild('ConfigVersion') as appconfig.CfnHostedConfigurationVersion;
    expect(version).toBeDefined();
    expect(version).toBeInstanceOf(appconfig.CfnHostedConfigurationVersion);
    expect(version.content).toContain('version');
    expect(version.content).toContain('settings');
  });

  test('creates AppConfig IAM role', () => {
    const role = stack.node.findChild('AppConfigRole') as iam.Role;
    expect(role).toBeDefined();
    expect(role).toBeInstanceOf(iam.Role);
    expect(role.roleName).toContain('test-project-test-appconfig-role');
  });

  test('creates all required outputs', () => {
    const outputs = stack.node.findAll().filter(node => node instanceof cdk.CfnOutput);
    expect(outputs).toHaveLength(7); // ParameterStoreName, SecretsManagerArn, AppConfigApplicationId, AppConfigEnvironmentId, AppConfigProfileId, EncryptionKeyArn, AppConfigRoleArn
  });

  test('does not create KMS key when encryption is disabled', () => {
    const props: ConfigManagementStackProps = {
      environment: 'test',
      projectName: 'test-project',
      enableKmsEncryption: false
    };
    const stackWithoutEncryption = new ConfigManagementStack(app, 'TestStackWithoutEncryption', props);
    expect(stackWithoutEncryption.encryptionKey).toBeUndefined();
  });
}); 