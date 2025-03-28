import * as cdk from 'aws-cdk-lib';
import { BaseStack, BaseStackProps } from '../../lib/interfaces/base-stack';

describe('BaseStack', () => {
  let app: cdk.App;
  let stack: BaseStack;

  beforeEach(() => {
    app = new cdk.App();
    const props: BaseStackProps = {
      environment: 'test',
      projectName: 'test-project',
      tags: {
        TestTag: 'test-value'
      }
    };
    stack = new BaseStack(app, 'TestStack', props);
  });

  test('creates stack with required props', () => {
    expect(stack).toBeDefined();
  });

  test('throws error when environment is missing', () => {
    const props: BaseStackProps = {
      projectName: 'test-project'
    };
    expect(() => new BaseStack(app, 'TestStack', props)).toThrow('Environment is required');
  });

  test('throws error when projectName is missing', () => {
    const props: BaseStackProps = {
      environment: 'test'
    };
    expect(() => new BaseStack(app, 'TestStack', props)).toThrow('Project name is required');
  });

  test('adds common tags', () => {
    const tags = cdk.Tags.of(stack).tags;
    expect(tags).toHaveProperty('Environment', 'test');
    expect(tags).toHaveProperty('Project', 'test-project');
    expect(tags).toHaveProperty('ManagedBy', 'CDK');
  });

  test('adds custom tags', () => {
    const tags = cdk.Tags.of(stack).tags;
    expect(tags).toHaveProperty('TestTag', 'test-value');
  });

  test('creates resource name with correct format', () => {
    const resourceName = stack.createResourceName('test-resource');
    expect(resourceName).toBe('test-project-test-test-resource');
  });

  test('creates export name with correct format', () => {
    const exportName = stack.createExportName('test-export');
    expect(exportName).toBe('test-project-test-test-export');
  });
}); 