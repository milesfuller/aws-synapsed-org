import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SecurityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Security Audit Role - use the current account ID
    const securityAuditRole = new iam.Role(this, 'SecurityAuditRole', {
      assumedBy: new iam.AccountPrincipal(this.account),
      description: 'Role that allows Security Account to audit other accounts',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSConfigUserAccess'),
      ],
    });

    // Logging Read Role - use the current account ID
    const loggingReadRole = new iam.Role(this, 'LoggingReadRole', {
      assumedBy: new iam.AccountPrincipal(this.account),
      description: 'Role that grants Logging Account access to S3 logs',
    });

    // Using specific permissions instead of AmazonS3ReadOnlyAccess for better security
    // This follows the principle of least privilege by limiting access to only logging buckets
    loggingReadRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowLoggingBucketRead',
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:ListBucket',
        's3:ListBucketVersions'
      ],
      resources: [
        'arn:aws:s3:::*-logs',
        'arn:aws:s3:::*-logs/*',
      ],
    }));
    
    // Add additional permissions for CloudWatch Logs if needed
    loggingReadRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowCloudWatchLogsRead',
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
        'logs:GetLogEvents'
      ],
      resources: ['*']  // Scope this further if needed
    }));
  }
}