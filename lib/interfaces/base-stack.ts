import * as cdk from 'aws-cdk-lib';

export interface BaseStackProps extends cdk.StackProps {
  environment: string;
  projectName: string;
  orgId?: string;
  tags?: Record<string, string>;
}

export class BaseStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: BaseStackProps) {
    super(scope, id, props);

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

    // Validate required props
    if (!props.environment) {
      throw new Error('Environment is required');
    }
    if (!props.projectName) {
      throw new Error('Project name is required');
    }
  }

  // Helper method to create resource names
  protected createResourceName(resourceId: string): string {
    return `${this.node.tryGetContext('projectName')}-${this.node.tryGetContext('environment')}-${resourceId}`;
  }

  // Helper method to create export names
  protected createExportName(resourceId: string): string {
    return `${this.node.tryGetContext('projectName')}-${this.node.tryGetContext('environment')}-${resourceId}`;
  }
} 