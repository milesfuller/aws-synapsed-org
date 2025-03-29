import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BaseStack, BaseStackProps } from '../interfaces/base-stack';

export interface SecurityStackProps extends BaseStackProps {
  orgId?: string;
}

export class SecurityStack extends BaseStack {
  public readonly securityAuditRole: iam.Role;
  public readonly loggingReadRole: iam.Role;

  constructor(scope: cdk.App, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Security Audit Role with OU-aware permissions
    this.securityAuditRole = new iam.Role(this, 'SecurityAuditRole', {
      roleName: this.createResourceName('security-audit-role'),
      assumedBy: new iam.OrganizationPrincipal(props.orgId || process.env.AWS_ORG_ID!),
      description: 'Role that allows Security Account to audit across OUs',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSConfigUserAccess'),
      ],
    });

    // Logging Read Role with OU-aware permissions
    this.loggingReadRole = new iam.Role(this, 'LoggingReadRole', {
      roleName: this.createResourceName('logging-read-role'),
      assumedBy: new iam.OrganizationPrincipal(props.orgId || process.env.AWS_ORG_ID!),
      description: 'Role that grants Logging Account access across OUs',
    });

    // Add bucket permissions with OU conditions
    this.loggingReadRole.addToPolicy(new iam.PolicyStatement({
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
          'aws:PrincipalOrgID': props.orgId || process.env.AWS_ORG_ID
        }
      }
    }));

    // Add CloudWatch Logs permissions with OU conditions
    this.loggingReadRole.addToPolicy(new iam.PolicyStatement({
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
          'aws:PrincipalOrgID': props.orgId || process.env.AWS_ORG_ID
        }
      }
    }));

    // Create outputs
    new cdk.CfnOutput(this, 'SecurityAuditRoleArn', {
      value: this.securityAuditRole.roleArn,
      description: 'Security Audit Role ARN',
      exportName: 'SecurityAuditRoleArn'
    });

    new cdk.CfnOutput(this, 'LoggingReadRoleArn', {
      value: this.loggingReadRole.roleArn,
      description: 'Logging Read Role ARN',
      exportName: 'LoggingReadRoleArn'
    });
  }
}