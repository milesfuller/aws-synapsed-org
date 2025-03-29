import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface SecureConfigProps {
  /**
   * The name of the configuration
   */
  name: string;

  /**
   * The value to store
   */
  value: string;

  /**
   * The description of the configuration
   */
  description?: string;

  /**
   * The KMS key to use for encryption
   */
  encryptionKey?: kms.Key;

  /**
   * The prefix to use for the parameter name
   */
  parameterPrefix?: string;

  /**
   * The prefix to use for the secret name
   */
  secretPrefix?: string;

  /**
   * Whether to create a secret in addition to the parameter
   */
  createSecret?: boolean;

  /**
   * The secret string template to use
   */
  secretStringTemplate?: string;

  /**
   * The generate string key to use
   */
  generateStringKey?: string;

  /**
   * The password length for generated secrets
   */
  passwordLength?: number;
}

export class SecureConfig extends Construct {
  public readonly parameter: ssm.StringParameter;
  public readonly secret?: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecureConfigProps) {
    super(scope, id);

    // Create Parameter Store parameter
    const parameterName = props.parameterPrefix 
      ? `${props.parameterPrefix}/${props.name}`
      : props.name;
    
    this.parameter = new ssm.StringParameter(this, 'Parameter', {
      parameterName,
      stringValue: props.value,
      description: props.description,
      tier: ssm.ParameterTier.STANDARD,
    });

    // Create Secrets Manager secret if requested
    if (props.createSecret) {
      const secretName = props.secretPrefix 
        ? `${props.secretPrefix}/${props.name}`
        : props.name;
      
      this.secret = new secretsmanager.Secret(this, 'Secret', {
        secretName,
        description: props.description,
        generateSecretString: {
          generateStringKey: props.generateStringKey || 'password',
          secretStringTemplate: props.secretStringTemplate || '{"username":"admin"}',
          excludePunctuation: true,
          passwordLength: props.passwordLength || 16,
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/,"\\',
        },
        encryptionKey: props.encryptionKey,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });
    }
  }
} 