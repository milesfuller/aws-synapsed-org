import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as config from 'aws-cdk-lib/aws-config';

export class ComplianceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Enable AWS Config Recording
    const configRecorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
      roleArn: `arn:aws:iam::${this.account}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig`,
    });

    // Configure delivery channel
    const configDeliveryChannel = new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'One_Hour',
      },
      s3BucketName: `config-bucket-${this.account}`, // This bucket must exist or be created separately
    });

    // S3 Encryption Rule
    new config.ManagedRule(this, 'S3EncryptionRule', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
    });

    // IAM Root User Check
    new config.ManagedRule(this, 'IamRootUserCheck', {
      identifier: config.ManagedRuleIdentifiers.IAM_ROOT_ACCESS_KEY_CHECK,
    });

    // MFA Enforcement Rule
    new config.ManagedRule(this, 'MfaEnforcementRule', {
      identifier: config.ManagedRuleIdentifiers.IAM_USER_MFA_ENABLED,
    });
  }
}