import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TaggingAspect } from '../../lib/aspects/tagging-aspect';

describe('TaggingAspect', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app);
  });

  it('applies common tags to all resources', () => {
    // Create some test resources
    new cdk.aws_s3.Bucket(stack, 'TestBucket');
    new cdk.aws_dynamodb.Table(stack, 'TestTable', {
      partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Apply the tagging aspect
    cdk.Aspects.of(stack).add(new TaggingAspect({
      environment: 'test',
      projectName: 'test-project',
    }));

    // Synthesize the stack once
    template = Template.fromStack(stack);

    // Verify tags are applied to S3 bucket
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: [
        { Key: 'Environment', Value: 'test' },
        { Key: 'Project', Value: 'test-project' },
        { Key: 'ManagedBy', Value: 'CDK' },
      ],
    });

    // Verify tags are applied to DynamoDB table
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      Tags: [
        { Key: 'Environment', Value: 'test' },
        { Key: 'Project', Value: 'test-project' },
        { Key: 'ManagedBy', Value: 'CDK' },
      ],
    });
  });

  it('applies additional tags when provided', () => {
    // Create a test resource
    new cdk.aws_s3.Bucket(stack, 'TestBucket');

    // Apply the tagging aspect with additional tags
    cdk.Aspects.of(stack).add(new TaggingAspect({
      environment: 'test',
      projectName: 'test-project',
      additionalTags: {
        'CostCenter': '12345',
        'Owner': 'test-team',
      },
    }));

    // Synthesize the stack once
    template = Template.fromStack(stack);

    // Verify all tags are applied
    template.hasResourceProperties('AWS::S3::Bucket', {
      Tags: [
        { Key: 'Environment', Value: 'test' },
        { Key: 'Project', Value: 'test-project' },
        { Key: 'ManagedBy', Value: 'CDK' },
        { Key: 'CostCenter', Value: '12345' },
        { Key: 'Owner', Value: 'test-team' },
      ],
    });
  });
}); 