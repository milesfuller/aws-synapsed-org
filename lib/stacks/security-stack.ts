import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SecurityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Security Audit Role with OU-aware permissions
    const securityAuditRole = new iam.Role(this, 'SecurityAuditRole', {
      assumedBy: new iam.OrganizationPrincipal(process.env.AWS_ORG_ID!),
      description: 'Role that allows Security Account to audit across OUs',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSConfigUserAccess'),
      ],
    });

    // Logging Read Role with OU-aware permissions
    const loggingReadRole = new iam.Role(this, 'LoggingReadRole', {
      assumedBy: new iam.OrganizationPrincipal(process.env.AWS_ORG_ID!),
      description: 'Role that grants Logging Account access across OUs',
    });

    // Add bucket permissions with OU conditions
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
      conditions: {
        'StringEquals': {
          'aws:PrincipalOrgID': process.env.AWS_ORG_ID
        }
      }
    }));

    // Add CloudWatch Logs permissions with OU conditions
    loggingReadRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowCloudWatchLogsRead',
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
        'logs:GetLogEvents'
      ],
      resources: ['*'],
      conditions: {
        'StringEquals': {
          'aws:PrincipalOrgID': process.env.AWS_ORG_ID
        }
      }
    }));
  }
}