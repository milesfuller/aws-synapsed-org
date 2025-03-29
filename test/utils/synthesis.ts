import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

export interface SynthesisContext {
  projectName: string;
  environment: string;
}

export function createTestApp(context: SynthesisContext): cdk.App {
  const app = new cdk.App({
    context: {
      projectName: context.projectName,
      environment: context.environment
    }
  });
  return app;
}

export function synthesizeStack<T extends cdk.Stack>(
  stack: T,
  context: SynthesisContext
): { template: Template; stack: T } {
  const app = createTestApp(context);
  const synthesizedStack = stack as T;
  const template = Template.fromStack(synthesizedStack);
  return { template, stack: synthesizedStack };
}

export function validateTemplate(template: Template): void {
  // Validate template structure
  const templateJson = template.toJSON();
  
  // Check for required sections
  expect(templateJson).toHaveProperty('Resources');
  expect(templateJson).toHaveProperty('Outputs');
  
  // Validate resource naming conventions
  Object.entries(templateJson.Resources).forEach(([logicalId, resource]: [string, any]) => {
    expect(logicalId).toMatch(/^[A-Za-z0-9]+$/);
    expect(resource).toHaveProperty('Type');
    expect(resource).toHaveProperty('Properties');
  });
  
  // Validate output naming conventions
  Object.entries(templateJson.Outputs).forEach(([logicalId, output]: [string, any]) => {
    expect(logicalId).toMatch(/^[A-Za-z0-9]+$/);
    expect(output).toHaveProperty('Value');
  });
} 