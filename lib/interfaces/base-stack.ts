import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface BaseStackProps extends cdk.StackProps {
  environment: string;
  projectName: string;
  orgId?: string;
  tags?: { [key: string]: string };
}

export class BaseStack extends cdk.Stack {
  protected readonly stackEnvironment: string;
  protected readonly stackProjectName: string;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    // Validate required props
    if (!props.environment) {
      throw new Error('Environment is required');
    }
    if (!props.projectName) {
      throw new Error('Project name is required');
    }

    super(scope, id, props);

    // Store props for use in helper methods
    this.stackEnvironment = props.environment;
    this.stackProjectName = props.projectName;

    // Add common tags
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('Project', props.projectName);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Add any additional tags
    if (props.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        cdk.Tags.of(this).add(key, value);
      });
    }
  }

  // Helper method to create resource names
  protected createResourceName(resourceName: string): string {
    return `${this.stackProjectName}-${this.stackEnvironment}-${resourceName}`;
  }

  // Helper method to create export names
  protected createExportName(exportName: string): string {
    return `${this.stackProjectName}-${this.stackEnvironment}-${exportName}`;
  }
} 