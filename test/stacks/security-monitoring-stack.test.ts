import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityMonitoringStack } from '../../lib/stacks/security-monitoring-stack';

describe('SecurityMonitoringStack', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new SecurityMonitoringStack(app, 'TestStack', {
      tags: {
        Environment: 'test',
        Project: 'test-project'
      }
    });
    template = Template.fromStack(stack);
  });

  test('creates GuardDuty detector with correct configuration', () => {
    template.hasResource('AWS::GuardDuty::Detector', {
      Properties: Match.objectLike({
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
      })
    });
  });

  test('creates Security Hub with default standards enabled', () => {
    template.hasResource('AWS::SecurityHub::Hub', {
      Properties: Match.objectLike({
        EnableDefaultStandards: true
      })
    });
  });

  test('creates Security Hub standards subscriptions', () => {
    template.resourceCountIs('AWS::SecurityHub::StandardsSubscription', 3);

    // AWS Foundational Security Best Practices
    template.hasResource('AWS::SecurityHub::StandardsSubscription', {
      Properties: Match.objectLike({
        StandardsArn: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp('.*aws-foundational-security-best-practices.*')
            ])
          ])
        })
      })
    });

    // CIS AWS Foundations Benchmark
    template.hasResource('AWS::SecurityHub::StandardsSubscription', {
      Properties: Match.objectLike({
        StandardsArn: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp('.*cis-aws-foundations-benchmark.*')
            ])
          ])
        })
      })
    });

    // PCI DSS
    template.hasResource('AWS::SecurityHub::StandardsSubscription', {
      Properties: Match.objectLike({
        StandardsArn: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp('.*pci-dss.*')
            ])
          ])
        })
      })
    });
  });

  test('creates Security Hub service-linked role', () => {
    template.hasResource('AWS::IAM::ServiceLinkedRole', {
      Properties: Match.objectLike({
        AWSServiceName: 'securityhub.amazonaws.com'
      })
    });
  });

  test('sets up correct dependencies between resources', () => {
    // Verify that Security Hub depends on GuardDuty detector
    const resources = template.findResources('AWS::SecurityHub::Hub');
    const hub = Object.values(resources)[0];
    expect(hub.DependsOn).toBeDefined();
    expect(hub.DependsOn).toContain('GuardDutyDetector');

    // Verify that standards subscriptions depend on Security Hub
    const subscriptions = template.findResources('AWS::SecurityHub::StandardsSubscription');
    Object.values(subscriptions).forEach(subscription => {
      expect(subscription.DependsOn).toBeDefined();
      expect(subscription.DependsOn).toContain('SecurityHub');
    });
  });

  test('creates GuardDuty detector ID output', () => {
    template.hasOutput('GuardDutyDetectorId', {
      Export: {
        Name: 'GuardDutyDetectorId'
      }
    });
  });

  test('applies correct tags to resources', () => {
    // Get all resources
    const allResources = template.findResources('*');
    
    // Helper function to check tags
    const hasExpectedTags = (tags: any[]) => {
      expect(tags).toBeDefined();
      expect(tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'test' }),
          expect.objectContaining({ Key: 'Project', Value: 'test-project' }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' })
        ])
      );
    };

    // Check each resource for tags
    Object.values(allResources).forEach(resource => {
      if (resource.Properties && resource.Properties.Tags) {
        hasExpectedTags(resource.Properties.Tags);
      }
    });
  });

  test('uses default values when stack props are not provided', () => {
    // Create a new stack without props
    const app = new cdk.App();
    const stackWithoutProps = new SecurityMonitoringStack(app, 'TestStackNoProps');
    const templateWithoutProps = Template.fromStack(stackWithoutProps);

    // Get all resources
    const allResources = templateWithoutProps.findResources('*');
    
    // Helper function to check default tags
    const hasDefaultTags = (tags: any[]) => {
      expect(tags).toBeDefined();
      expect(tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'Dev' }),
          expect.objectContaining({ Key: 'Project', Value: 'aws-synapsed-bootstrap' }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' })
        ])
      );
    };

    // Check each resource for default tags
    Object.values(allResources).forEach(resource => {
      if (resource.Properties && resource.Properties.Tags) {
        hasDefaultTags(resource.Properties.Tags);
      }
    });
  });
}); 