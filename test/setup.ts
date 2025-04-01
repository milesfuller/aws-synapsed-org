import { Template } from 'aws-cdk-lib/assertions';

// Configure Jest to handle CDK synthesis
jest.setTimeout(30000); // Increase timeout for synthesis

// Add custom matchers for CDK assertions
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveResourceType: (type: string) => R;
      toHaveResourceProperties: (type: string, props: any) => R;
      toHaveOutput: (name: string) => R;
      resourceCountIs: (type: string, count: number) => R;
    }
  }
}

expect.extend({
  toHaveResourceType(received: Template, expected: string) {
    const template = received.toJSON();
    const resources = Object.values(template.Resources || {});
    const hasResource = resources.some((resource: any) => resource.Type === expected);
    
    return {
      message: () => `expected template to ${hasResource ? 'not ' : ''}have resource of type ${expected}`,
      pass: hasResource
    };
  },
  
  toHaveResourceProperties(received: Template, type: string, props: any) {
    const template = received.toJSON();
    const resources = Object.values(template.Resources || {});
    const hasResource = resources.some((resource: any) => {
      if (resource.Type !== type) return false;
      return Object.entries(props).every(([key, value]) => {
        if (typeof value === 'object') {
          return JSON.stringify(resource.Properties[key]) === JSON.stringify(value);
        }
        return resource.Properties[key] === value;
      });
    });
    
    return {
      message: () => `expected template to ${hasResource ? 'not ' : ''}have resource of type ${type} with properties ${JSON.stringify(props)}`,
      pass: hasResource
    };
  },
  
  toHaveOutput(received: Template, expected: string) {
    const template = received.toJSON();
    const hasOutput = expected in (template.Outputs || {});
    
    return {
      message: () => `expected template to ${hasOutput ? 'not ' : ''}have output ${expected}`,
      pass: hasOutput
    };
  },
  
  resourceCountIs(received: Template, type: string, expected: number) {
    const template = received.toJSON();
    const resources = Object.values(template.Resources || {});
    const count = resources.filter((resource: any) => resource.Type === type).length;
    
    return {
      message: () => `expected template to have ${expected} resources of type ${type}, but found ${count}`,
      pass: count === expected
    };
  }
});

// Set up environment variables for testing
process.env.DYNAMODB_TABLE = 'test-did-table';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.LOG_LEVEL = 'error';

// Mock console methods to reduce noise during tests
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();
console.info = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 