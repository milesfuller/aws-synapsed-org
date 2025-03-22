import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class LoggingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Central logging bucket
    const logBucket = new s3.Bucket(this, 'CentralLogsBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // CloudWatch Logs destination for centralized logging
    const logGroup = new logs.LogGroup(this, 'CentralizedLogGroup', {
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Policy to allow other accounts to write logs to this bucket
    const centralLogPolicy = new iam.PolicyStatement({
      actions: [
        's3:PutObject',
        's3:PutObjectAcl'
      ],
      resources: [
        logBucket.bucketArn,
        `${logBucket.bucketArn}/*`
      ],
      principals: [new iam.AccountPrincipal(this.account)] // Current account for now
    });

    logBucket.addToResourcePolicy(centralLogPolicy);
  }
}