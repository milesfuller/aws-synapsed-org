import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BaseStack, BaseStackProps } from '../interfaces/base-stack';

export interface SecurityMonitoringStackProps extends BaseStackProps {
  enableKubernetesAudit?: boolean;
  enableMalwareProtection?: boolean;
  findingPublishingFrequency?: string;
}

export class SecurityMonitoringStack extends BaseStack {
  public readonly detector: cdk.CfnResource;
  public readonly hub: securityhub.CfnHub;
  public readonly awsFsbp: cdk.CfnResource;
  public readonly cisBenchmark: cdk.CfnResource;
  public readonly pciDss: cdk.CfnResource;
  public readonly securityHubServiceRole: iam.CfnServiceLinkedRole;

  constructor(scope: cdk.App, id: string, props: SecurityMonitoringStackProps) {
    super(scope, id, props);

    // Enable GuardDuty
    this.detector = new cdk.CfnResource(this, 'GuardDutyDetector', {
      type: 'AWS::GuardDuty::Detector',
      properties: {
        Enable: true,
        FindingPublishingFrequency: props.findingPublishingFrequency || 'FIFTEEN_MINUTES',
        DataSources: {
          S3Logs: {
            Enable: true
          },
          Kubernetes: {
            AuditLogs: {
              Enable: props.enableKubernetesAudit ?? true
            }
          },
          MalwareProtection: {
            ScanEc2InstanceWithFindings: {
              EbsVolumes: {
                Enable: props.enableMalwareProtection ?? true
              }
            }
          }
        }
      }
    });

    // Add tags to GuardDuty detector
    cdk.Tags.of(this.detector).add('Environment', props?.tags?.Environment || 'Dev');
    cdk.Tags.of(this.detector).add('Project', props?.tags?.Project || 'aws-synapsed-bootstrap');
    cdk.Tags.of(this.detector).add('ManagedBy', 'CDK');

    // Enable Security Hub
    this.hub = new securityhub.CfnHub(this, 'SecurityHub', {
      enableDefaultStandards: true
    });

    // Add tags to Security Hub
    cdk.Tags.of(this.hub).add('Environment', props?.tags?.Environment || 'Dev');
    cdk.Tags.of(this.hub).add('Project', props?.tags?.Project || 'aws-synapsed-bootstrap');
    cdk.Tags.of(this.hub).add('ManagedBy', 'CDK');

    // Add explicit dependency
    this.hub.addDependency(this.detector);

    // Enable specific standards using Security Hub constructs
    // AWS Foundational Security Best Practices
    this.awsFsbp = new cdk.CfnResource(this, 'AwsFsbpStandard', {
      type: 'AWS::SecurityHub::StandardsSubscription',
      properties: {
        StandardsArn: `arn:aws:securityhub:${this.region}::standards/aws-foundational-security-best-practices/v/1.0.0`
      }
    });

    // CIS AWS Foundations Benchmark
    this.cisBenchmark = new cdk.CfnResource(this, 'CisBenchmarkStandard', {
      type: 'AWS::SecurityHub::StandardsSubscription',
      properties: {
        StandardsArn: `arn:aws:securityhub:${this.region}::standards/cis-aws-foundations-benchmark/v/1.2.0`
      }
    });

    // PCI DSS
    this.pciDss = new cdk.CfnResource(this, 'PciDssStandard', {
      type: 'AWS::SecurityHub::StandardsSubscription',
      properties: {
        StandardsArn: `arn:aws:securityhub:${this.region}::standards/pci-dss/v/3.2.1`
      }
    });

    // Create IAM role for Security Hub service-linked role if it doesn't exist
    this.securityHubServiceRole = new iam.CfnServiceLinkedRole(this, 'SecurityHubServiceLinkedRole', {
      awsServiceName: 'securityhub.amazonaws.com',
      description: 'Service-linked role for AWS Security Hub'
    });

    // Add dependencies
    this.awsFsbp.node.addDependency(this.hub);
    this.cisBenchmark.node.addDependency(this.hub);
    this.pciDss.node.addDependency(this.hub);
    
    // Output the detector ID
    new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
      value: this.detector.ref,
      description: 'GuardDuty Detector ID',
      exportName: 'GuardDutyDetectorId'
    });
  }
}