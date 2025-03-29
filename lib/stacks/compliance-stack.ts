import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as config from 'aws-cdk-lib/aws-config';
import { BaseStack, BaseStackProps } from '../interfaces/base-stack';

export interface ComplianceStackProps extends BaseStackProps {
  configBucketName?: string;
  deliveryFrequency?: string;
  includeGlobalResourceTypes?: boolean;
}

export class ComplianceStack extends BaseStack {
  public readonly configRecorder: config.CfnConfigurationRecorder;
  public readonly configDeliveryChannel: config.CfnDeliveryChannel;
  public readonly s3EncryptionRule: config.ManagedRule;
  public readonly iamRootUserCheck: config.ManagedRule;
  public readonly mfaEnforcementRule: config.ManagedRule;

  constructor(scope: cdk.App, id: string, props: ComplianceStackProps) {
    super(scope, id, props);

    // Enable AWS Config Recording
    this.configRecorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: props.includeGlobalResourceTypes ?? true,
      },
      roleArn: `arn:aws:iam::${this.account}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig`,
    });

    // Configure delivery channel
    this.configDeliveryChannel = new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      configSnapshotDeliveryProperties: {
        deliveryFrequency: props.deliveryFrequency || 'One_Hour',
      },
      s3BucketName: props.configBucketName || `config-bucket-${this.account}`, // This bucket must exist or be created separately
    });

    // S3 Encryption Rule
    this.s3EncryptionRule = new config.ManagedRule(this, 'S3EncryptionRule', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
    });

    // IAM Root User Check
    this.iamRootUserCheck = new config.ManagedRule(this, 'IamRootUserCheck', {
      identifier: config.ManagedRuleIdentifiers.IAM_ROOT_ACCESS_KEY_CHECK,
    });

    // MFA Enforcement Rule
    this.mfaEnforcementRule = new config.ManagedRule(this, 'MfaEnforcementRule', {
      identifier: config.ManagedRuleIdentifiers.IAM_USER_MFA_ENABLED,
    });

    // Create outputs
    new cdk.CfnOutput(this, 'ConfigRecorderRoleArn', {
      value: this.configRecorder.roleArn,
      description: 'AWS Config Recorder Role ARN',
      exportName: 'ConfigRecorderRoleArn'
    });

    new cdk.CfnOutput(this, 'ConfigDeliveryChannelName', {
      value: this.configDeliveryChannel.ref,
      description: 'AWS Config Delivery Channel Name',
      exportName: 'ConfigDeliveryChannelName'
    });
  }
}