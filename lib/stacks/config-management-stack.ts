import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BaseStack, BaseStackProps } from '../interfaces/base-stack';

export interface ConfigManagementStackProps extends BaseStackProps {
  parameterPrefix?: string;
  secretPrefix?: string;
  applicationPrefix?: string;
  enableKmsEncryption?: boolean;
  retentionDays?: number;
}

export class ConfigManagementStack extends BaseStack {
  public readonly parameterStore: ssm.StringParameter;
  public readonly secret: secretsmanager.Secret;
  public readonly appConfigApplication: appconfig.CfnApplication;
  public readonly appConfigEnvironment: appconfig.CfnEnvironment;
  public readonly appConfigProfile: appconfig.CfnConfigurationProfile;
  public readonly appConfigVersion: appconfig.CfnHostedConfigurationVersion;
  public readonly appConfigRole: iam.Role;
  public readonly encryptionKey?: kms.Key;

  constructor(scope: cdk.App, id: string, props: ConfigManagementStackProps) {
    super(scope, id, props);

    // Create KMS key if encryption is enabled
    if (props.enableKmsEncryption) {
      this.encryptionKey = new kms.Key(this, 'EncryptionKey', {
        enableKeyRotation: true,
        pendingWindow: cdk.Duration.days(props.retentionDays || 30),
        description: 'KMS key for configuration encryption',
        alias: this.createResourceName('config-key'),
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });
    }

    // Create Parameter Store parameter
    const parameterName = props.parameterPrefix 
      ? `${props.parameterPrefix}/${this.createResourceName('config')}`
      : this.createResourceName('config');
    
    this.parameterStore = new ssm.StringParameter(this, 'ConfigParameter', {
      parameterName,
      stringValue: 'Default configuration value',
      description: 'Central configuration parameter',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Create Secrets Manager secret
    const secretName = props.secretPrefix 
      ? `${props.secretPrefix}/${this.createResourceName('config')}`
      : this.createResourceName('config');
    
    this.secret = new secretsmanager.Secret(this, 'ConfigSecret', {
      secretName,
      description: 'Central configuration secret',
      generateSecretString: {
        generateStringKey: 'password',
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        excludePunctuation: true,
        passwordLength: 16,
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/,"\\',
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryptionKey: this.encryptionKey,
    });

    // Create AppConfig application
    const appName = props.applicationPrefix 
      ? `${props.applicationPrefix}-${this.createResourceName('config')}`
      : this.createResourceName('config');
    
    this.appConfigApplication = new appconfig.CfnApplication(this, 'ConfigApplication', {
      name: appName,
      description: 'Central configuration application',
    });

    // Create AppConfig environment
    this.appConfigEnvironment = new appconfig.CfnEnvironment(this, 'ConfigEnvironment', {
      name: this.createResourceName('config-env'),
      description: 'Central configuration environment',
      applicationId: this.appConfigApplication.ref,
    });

    // Create AppConfig configuration profile
    this.appConfigProfile = new appconfig.CfnConfigurationProfile(this, 'ConfigProfile', {
      name: this.createResourceName('config-profile'),
      description: 'Central configuration profile',
      locationUri: 'hosted',
      type: 'AWS.Freeform',
      applicationId: this.appConfigApplication.ref,
      validators: [{
        type: 'JSON_SCHEMA',
        content: JSON.stringify({
          type: 'object',
          properties: {
            version: { type: 'string' },
            settings: { type: 'object' }
          },
          required: ['version', 'settings']
        })
      }]
    });

    // Create AppConfig hosted configuration version
    this.appConfigVersion = new appconfig.CfnHostedConfigurationVersion(this, 'ConfigVersion', {
      applicationId: this.appConfigApplication.ref,
      configurationProfileId: this.appConfigProfile.ref,
      contentType: 'application/json',
      description: 'Initial configuration version',
      content: JSON.stringify({
        version: '1.0.0',
        config: {
          key: 'value'
        }
      })
    });

    // Create AppConfig IAM role
    this.appConfigRole = new iam.Role(this, 'AppConfigRole', {
      roleName: this.createResourceName('appconfig-role'),
      assumedBy: new iam.ServicePrincipal('appconfig.amazonaws.com'),
      description: 'IAM role for AppConfig',
      inlinePolicies: {
        'AppConfigAccess': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
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
              resources: ['*']
            })
          ]
        })
      }
    });

    // Create outputs
    new cdk.CfnOutput(this, 'ParameterStoreName', {
      value: this.parameterStore.parameterName,
      description: 'Parameter Store parameter name',
    });

    new cdk.CfnOutput(this, 'SecretsManagerArn', {
      value: this.secret.secretArn,
      description: 'Secrets Manager secret ARN',
    });

    new cdk.CfnOutput(this, 'AppConfigApplicationId', {
      value: this.appConfigApplication.ref,
      description: 'AppConfig application ID',
    });

    new cdk.CfnOutput(this, 'AppConfigEnvironmentId', {
      value: this.appConfigEnvironment.ref,
      description: 'AppConfig environment ID',
    });

    new cdk.CfnOutput(this, 'AppConfigConfigurationProfileId', {
      value: this.appConfigProfile.ref,
      description: 'AppConfig configuration profile ID',
    });

    new cdk.CfnOutput(this, 'AppConfigHostedConfigurationVersionId', {
      value: this.appConfigVersion.ref,
      description: 'AppConfig hosted configuration version ID',
    });

    if (this.encryptionKey) {
      new cdk.CfnOutput(this, 'EncryptionKeyArn', {
        value: this.encryptionKey.keyArn,
        description: 'KMS key ARN',
      });
    }

    new cdk.CfnOutput(this, 'AppConfigRoleArn', {
      value: this.appConfigRole.roleArn,
      description: 'AppConfig IAM role ARN',
    });
  }
} 