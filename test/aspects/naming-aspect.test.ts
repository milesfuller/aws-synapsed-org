import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NamingAspect } from '../../lib/aspects/naming-aspect';
import { Stack, Aspects } from 'aws-cdk-lib';
import { CfnResource } from 'aws-cdk-lib';
import { BaseStack } from '../../lib/interfaces/base-stack';

describe('NamingAspect', () => {
  it('applies consistent naming to resources', () => {
    const app = new cdk.App();
    const stack = new Stack(app);
    let template: Template;

    // Create some test resources
    new cdk.aws_s3.Bucket(stack, 'TestBucket');
    new cdk.aws_dynamodb.Table(stack, 'TestTable', {
      partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Apply the naming aspect
    cdk.Aspects.of(stack).add(new NamingAspect({
      environment: 'test',
      projectName: 'test-project',
    }));

    // Synthesize the stack once
    template = Template.fromStack(stack);

    // Verify S3 bucket name
    template.hasResourceProperties('AWS::S3::Bucket', {
      Name: 'test-project-test-bucket',
    });

    // Verify DynamoDB table name
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      Name: 'test-project-test-table',
    });
  });

  it('applies naming with custom prefix', () => {
    const app = new cdk.App();
    const stack = new Stack(app);
    let template: Template;

    // Create a test resource
    new cdk.aws_s3.Bucket(stack, 'TestBucket');

    // Apply the naming aspect with a prefix
    cdk.Aspects.of(stack).add(new NamingAspect({
      environment: 'test',
      projectName: 'test-project',
      prefix: 'myapp',
    }));

    // Synthesize the stack once
    template = Template.fromStack(stack);

    // Verify resource name includes prefix
    template.hasResourceProperties('AWS::S3::Bucket', {
      Name: 'myapp-test-project-test-bucket',
    });
  });

  it('skips resources without name property', () => {
    const app = new cdk.App();
    const stack = new Stack(app);
    let template: Template;

    // Create a test resource without a name property
    new cdk.aws_iam.Role(stack, 'TestRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // Apply the naming aspect
    cdk.Aspects.of(stack).add(new NamingAspect({
      environment: 'test',
      projectName: 'test-project',
    }));

    // Synthesize the stack once
    template = Template.fromStack(stack);

    // Verify the role exists but doesn't have a name property
    template.hasResource('AWS::IAM::Role', {});
  });

  test('applies naming convention to resources', () => {
    const app = new cdk.App();
    const stack = new BaseStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'myproject'
    });

    const aspect = new NamingAspect({
      environment: 'test',
      projectName: 'myproject'
    });

    // Create a test resource
    new cdk.CfnResource(stack, 'TestResource', {
      type: 'AWS::Test::Resource',
      properties: {
        Name: 'test'
      }
    });

    cdk.Aspects.of(stack).add(aspect);

    const template = Template.fromStack(stack);

    // Verify the resource has the correct name
    template.hasResource('AWS::Test::Resource', {
      Properties: {
        Name: 'myproject-test-resource'
      }
    });
  });

  test('handles missing prefix', () => {
    const app = new cdk.App();
    const stack = new BaseStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'myproject'
    });

    const aspect = new NamingAspect({
      environment: 'test',
      projectName: 'myproject'
    });

    // Create a test resource without a prefix
    new cdk.CfnResource(stack, 'TestResource', {
      type: 'AWS::Test::Resource',
      properties: {}
    });

    cdk.Aspects.of(stack).add(aspect);

    const template = Template.fromStack(stack);

    // Verify the resource has the correct name
    template.hasResource('AWS::Test::Resource', {
      Properties: {
        Name: 'myproject-test-resource'
      }
    });
  });

  test('handles malformed resource type', () => {
    const app = new cdk.App();
    const stack = new BaseStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'myproject'
    });

    const aspect = new NamingAspect({
      environment: 'test',
      projectName: 'myproject'
    });

    // Create a test resource with malformed type
    new cdk.CfnResource(stack, 'TestResource', {
      type: 'MalformedType',
      properties: {
        Name: 'test'
      }
    });

    cdk.Aspects.of(stack).add(aspect);

    const template = Template.fromStack(stack);

    // Verify the resource has the correct name with malformed type
    template.hasResource('MalformedType', {
      Properties: {
        Name: 'myproject-test-malformedtype'
      }
    });
  });

  test('handles resource type without double colons', () => {
    const app = new cdk.App();
    const stack = new BaseStack(app, 'TestStack', {
      environment: 'test',
      projectName: 'myproject'
    });

    const aspect = new NamingAspect({
      environment: 'test',
      projectName: 'myproject'
    });

    // Create a test resource with a type that has no double colons
    new cdk.CfnResource(stack, 'TestResource', {
      type: 'SimpleType',
      properties: {
        Name: 'test'
      }
    });

    cdk.Aspects.of(stack).add(aspect);

    const template = Template.fromStack(stack);

    // Verify the resource has the correct name
    template.hasResource('SimpleType', {
      Properties: {
        Name: 'myproject-test-simpletype'
      }
    });
  });
}); 