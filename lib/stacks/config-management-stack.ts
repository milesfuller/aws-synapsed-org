import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BaseStack, BaseStackProps } from '../interfaces/base-stack';

interface ConfigManagementStackProps extends BaseStackProps {
  parameterPrefix?: string;
  secretPrefix?: string;
  applicationPrefix?: string;
  enableKmsEncryption?: boolean;
  retentionDays?: number;
}

export class ConfigManagementStack extends BaseStack {
  public readonly encryptionKey?: kms.Key;
  public readonly parameterStore: ssm.StringParameter;
  public readonly secretsManager: secretsmanager.Secret;
  public readonly appConfig: appconfig.CfnApplication;

  constructor(scope: cdk.App, id: string, props: ConfigManagementStackProps) {
    super(scope, id, props);

    // Create KMS key for encryption if enabled
    if (props.enableKmsEncryption !== false) {
      this.encryptionKey = new kms.Key(this, 'ConfigEncryptionKey', {
        alias: this.createResourceName('config-encryption'),
        description: 'KMS key for configuration encryption',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        pendingWindow: cdk.Duration.days(7),
      });
    }

    // Create Parameter Store parameter
    this.parameterStore = new ssm.StringParameter(this, 'ConfigParameter', {
      parameterName: this.createResourceName(props.parameterPrefix || 'config'),
      stringValue: 'Default configuration value',
      description: 'Central configuration parameter',
    });

    // Create Secrets Manager secret
    this.secretsManager = new secretsmanager.Secret(this, 'ConfigSecret', {
      secretName: this.createResourceName(props.secretPrefix || 'config'),
      description: 'Central configuration secret',
      generateSecretString: {
        generateStringKey: 'password',
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        excludePunctuation: true,
        passwordLength: 16,
        includeSpace: false,
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/,"\\',
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create AppConfig application
    this.appConfig = new appconfig.CfnApplication(this, 'ConfigApplication', {
      name: this.createResourceName(props.applicationPrefix || 'config'),
      description: 'Central configuration application',
    });

    // Create AppConfig environment
    const environment = new appconfig.CfnEnvironment(this, 'ConfigEnvironment', {
      applicationId: this.appConfig.ref,
      name: this.createResourceName('config-env'),
      description: 'Configuration environment',
    });

    // Create AppConfig configuration profile
    const profile = new appconfig.CfnConfigurationProfile(this, 'ConfigProfile', {
      applicationId: this.appConfig.ref,
      name: this.createResourceName('config-profile'),
      locationUri: 'hosted',
      type: 'AWS.Freeform',
      validators: [
        {
          type: 'JSON_SCHEMA',
          content: JSON.stringify({
            type: 'object',
            properties: {
              version: { type: 'string' },
              settings: { type: 'object' },
            },
            required: ['version', 'settings'],
          }),
        },
      ],
    });

    // Create AppConfig hosted configuration version
    new appconfig.CfnHostedConfigurationVersion(this, 'ConfigVersion', {
      applicationId: this.appConfig.ref,
      configurationProfileId: profile.ref,
      content: JSON.stringify({
        version: '1.0',
        settings: {
          featureFlags: {
            enabled: true,
            features: {
              newFeature: {
                enabled: false,
                description: 'New feature flag',
              },
            },
          },
        },
      }),
      contentType: 'application/json',
      description: 'Initial configuration version',
      latestVersionNumber: 1,
    });

    // Create IAM role for AppConfig
    const appConfigRole = new iam.Role(this, 'AppConfigRole', {
      roleName: this.createResourceName('appconfig-role'),
      assumedBy: new iam.ServicePrincipal('appconfig.amazonaws.com'),
      description: 'Role for AppConfig to access resources',
    });

    // Add required permissions for AppConfig
    appConfigRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'appconfig:GetApplication',
        'appconfig:GetConfiguration',
        'appconfig:GetConfigurationProfile',
        'appconfig:GetEnvironment',
        'appconfig:GetHostedConfigurationVersion',
        'appconfig:ListApplications',
        'appconfig:ListConfigurationProfiles',
        'appconfig:ListEnvironments',
        'appconfig:ListHostedConfigurationVersions',
        'appconfig:ListTagsForResource',
        'appconfig:StartDeployment',
        'appconfig:StopDeployment',
        'appconfig:TagResource',
        'appconfig:UntagResource',
        'appconfig:UpdateApplication',
        'appconfig:UpdateConfigurationProfile',
        'appconfig:UpdateEnvironment',
        'appconfig:ValidateConfiguration',
      ],
      resources: ['*'],
    }));

    // Output important values
    new cdk.CfnOutput(this, 'ParameterStoreName', {
      value: this.parameterStore.parameterName,
      description: 'Name of the Parameter Store parameter',
      exportName: this.createExportName('ParameterStoreName'),
    });

    new cdk.CfnOutput(this, 'SecretsManagerArn', {
      value: this.secretsManager.secretArn,
      description: 'ARN of the Secrets Manager secret',
      exportName: this.createExportName('SecretsManagerArn'),
    });

    new cdk.CfnOutput(this, 'AppConfigApplicationId', {
      value: this.appConfig.ref,
      description: 'ID of the AppConfig application',
      exportName: this.createExportName('AppConfigApplicationId'),
    });

    new cdk.CfnOutput(this, 'AppConfigEnvironmentId', {
      value: environment.ref,
      description: 'ID of the AppConfig environment',
      exportName: this.createExportName('AppConfigEnvironmentId'),
    });

    new cdk.CfnOutput(this, 'AppConfigProfileId', {
      value: profile.ref,
      description: 'ID of the AppConfig configuration profile',
      exportName: this.createExportName('AppConfigProfileId'),
    });

    if (this.encryptionKey) {
      new cdk.CfnOutput(this, 'EncryptionKeyArn', {
        value: this.encryptionKey.keyArn,
        description: 'ARN of the KMS key used for encryption',
        exportName: this.createExportName('EncryptionKeyArn'),
      });
    }

    new cdk.CfnOutput(this, 'AppConfigRoleArn', {
      value: appConfigRole.roleArn,
      description: 'ARN of the AppConfig IAM role',
      exportName: this.createExportName('AppConfigRoleArn'),
    });
  }
} 