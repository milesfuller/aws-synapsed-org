import { App, RemovalPolicy } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { BaseStack } from '../../lib/interfaces/base-stack';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';

class TestStack extends BaseStack {
  constructor(scope: App, id: string, props: any) {
    super(scope, id, props);

    // Create a test bucket
    new s3.Bucket(this, 'TestBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });
  }
}

describe('BaseStack', () => {
  const context = {
    projectName: 'test-project',
    environment: 'test'
  };

  test('synthesizes valid stack with required properties', () => {
    const app = new App({
      context
    });

    const stack = new TestStack(app, 'TestStack', {
      environment: context.environment,
      projectName: context.projectName
    });

    const template = Template.fromStack(stack);

    // Verify S3 bucket creation and tagging
    template.hasResource('AWS::S3::Bucket', {
      Properties: {
        Tags: Match.arrayEquals([
          { Key: 'aws-cdk:auto-delete-objects', Value: 'true' },
          { Key: 'Environment', Value: context.environment },
          { Key: 'ManagedBy', Value: 'CDK' },
          { Key: 'Project', Value: context.projectName }
        ])
      },
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete'
    });
  });

  test('synthesizes stack with custom tags', () => {
    const app = new App({
      context
    });

    const stack = new TestStack(app, 'TestStack', {
      environment: context.environment,
      projectName: context.projectName,
      tags: {
        CustomTag1: 'Value1',
        CustomTag2: 'Value2'
      }
    });

    const template = Template.fromStack(stack);

    // Verify both common and custom tags are applied
    template.hasResource('AWS::S3::Bucket', {
      Properties: {
        Tags: Match.arrayEquals([
          { Key: 'aws-cdk:auto-delete-objects', Value: 'true' },
          { Key: 'CustomTag1', Value: 'Value1' },
          { Key: 'CustomTag2', Value: 'Value2' },
          { Key: 'Environment', Value: context.environment },
          { Key: 'ManagedBy', Value: 'CDK' },
          { Key: 'Project', Value: context.projectName }
        ])
      },
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete'
    });
  });

  test('fails synthesis when required properties are missing', () => {
    const app = new App();

    expect(() => {
      new TestStack(app, 'TestStack', {});
    }).toThrow('Environment is required');

    expect(() => {
      new TestStack(app, 'TestStack', {
        environment: 'test'
      });
    }).toThrow('Project name is required');
  });

  test('validates required props', () => {
    const app = new cdk.App();

    // Test missing environment
    expect(() => {
      new BaseStack(app, 'TestStack', {
        projectName: 'test'
      } as any);
    }).toThrow('Environment is required');

    // Test missing project name
    expect(() => {
      new BaseStack(app, 'TestStack', {
        environment: 'test'
      } as any);
    }).toThrow('Project name is required');
  });

  test('adds common tags', () => {
    const app = new cdk.App();
    const stack = new BaseStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project'
    });

    // Create a test bucket
    new s3.Bucket(stack, 'TestBucket');

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Environment', Value: 'test' })
      ])
    });
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Project', Value: 'test-project' })
      ])
    });
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'ManagedBy', Value: 'CDK' })
      ])
    });
  });

  test('adds additional tags', () => {
    const app = new cdk.App();
    const stack = new BaseStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project',
      tags: {
        'CustomTag': 'custom-value'
      }
    });

    // Create a test bucket
    new s3.Bucket(stack, 'TestBucket');

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Environment', Value: 'test' })
      ])
    });
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Project', Value: 'test-project' })
      ])
    });
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'ManagedBy', Value: 'CDK' })
      ])
    });
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'CustomTag', Value: 'custom-value' })
      ])
    });
  });

  test('creates resource name', () => {
    const app = new cdk.App({
      context: {
        projectName: 'test-project',
        environment: 'test'
      }
    });
    const stack = new BaseStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project'
    });

    // Call createResourceName through a test method
    const testStack = stack as any;
    const resourceName = testStack.createResourceName('test-resource');
    expect(resourceName).toBe('test-project-test-test-resource');
  });

  test('creates export name', () => {
    const app = new cdk.App({
      context: {
        projectName: 'test-project',
        environment: 'test'
      }
    });
    const stack = new BaseStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'test-project'
    });

    // Call createExportName through a test method
    const testStack = stack as any;
    const exportName = testStack.createExportName('test-export');
    expect(exportName).toBe('test-project-test-test-export');
  });
}); 