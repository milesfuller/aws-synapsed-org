import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SecurityMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Enable GuardDuty
    const detector = new cdk.CfnResource(this, 'GuardDutyDetector', {
      type: 'AWS::GuardDuty::Detector',
      properties: {
        Enable: true,
        FindingPublishingFrequency: 'FIFTEEN_MINUTES',
        DataSources: {
          S3Logs: {
            Enable: true
          },
          Kubernetes: {
            AuditLogs: {
              Enable: true
            }
          },
          MalwareProtection: {
            ScanEc2InstanceWithFindings: {
              EbsVolumes: {
                Enable: true
              }
            }
          }
        }
      }
    });

    // Add tags to GuardDuty detector
    cdk.Tags.of(detector).add('Environment', props?.tags?.Environment || 'Dev');
    cdk.Tags.of(detector).add('Project', props?.tags?.Project || 'aws-synapsed-bootstrap');
    cdk.Tags.of(detector).add('ManagedBy', 'CDK');

    // Enable Security Hub
    const hub = new securityhub.CfnHub(this, 'SecurityHub', {
      enableDefaultStandards: true
    });

    // Add tags to Security Hub
    cdk.Tags.of(hub).add('Environment', props?.tags?.Environment || 'Dev');
    cdk.Tags.of(hub).add('Project', props?.tags?.Project || 'aws-synapsed-bootstrap');
    cdk.Tags.of(hub).add('ManagedBy', 'CDK');

    // Add explicit dependency
    hub.addDependency(detector);

    // Enable specific standards using Security Hub constructs
    // AWS Foundational Security Best Practices
    const awsFsbp = new cdk.CfnResource(this, 'AwsFsbpStandard', {
      type: 'AWS::SecurityHub::StandardsSubscription',
      properties: {
        StandardsArn: `arn:aws:securityhub:${this.region}::standards/aws-foundational-security-best-practices/v/1.0.0`
      }
    });

    // CIS AWS Foundations Benchmark
    const cisBenchmark = new cdk.CfnResource(this, 'CisBenchmarkStandard', {
      type: 'AWS::SecurityHub::StandardsSubscription',
      properties: {
        StandardsArn: `arn:aws:securityhub:${this.region}::standards/cis-aws-foundations-benchmark/v/1.2.0`
      }
    });

    // PCI DSS
    const pciDss = new cdk.CfnResource(this, 'PciDssStandard', {
      type: 'AWS::SecurityHub::StandardsSubscription',
      properties: {
        StandardsArn: `arn:aws:securityhub:${this.region}::standards/pci-dss/v/3.2.1`
      }
    });

    // Create IAM role for Security Hub service-linked role if it doesn't exist
    const securityHubServiceRole = new iam.CfnServiceLinkedRole(this, 'SecurityHubServiceLinkedRole', {
      awsServiceName: 'securityhub.amazonaws.com',
      description: 'Service-linked role for AWS Security Hub'
    });

    // Add dependencies
    awsFsbp.node.addDependency(hub);
    cisBenchmark.node.addDependency(hub);
    pciDss.node.addDependency(hub);
    
    // Output the detector ID
    new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
      value: detector.ref,
      description: 'GuardDuty Detector ID',
      exportName: 'GuardDutyDetectorId'
    });
  }
}