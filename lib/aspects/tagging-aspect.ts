import { IAspect, CfnResource } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

export interface TaggingAspectProps {
  /**
   * The environment name
   */
  environment: string;

  /**
   * The project name
   */
  projectName: string;

  /**
   * Additional tags to apply
   */
  additionalTags?: { [key: string]: string };
}

export class TaggingAspect implements IAspect {
  constructor(private props: TaggingAspectProps) {}

  visit(node: IConstruct): void {
    if (CfnResource.isCfnResource(node)) {
      const resource = node as CfnResource;

      // Create common tags
      const commonTags = [
        { Key: 'Environment', Value: this.props.environment },
        { Key: 'Project', Value: this.props.projectName },
        { Key: 'ManagedBy', Value: 'CDK' },
      ];

      // Create additional tags
      const additionalTags = Object.entries(this.props.additionalTags || {}).map(([key, value]) => ({
        Key: key,
        Value: value,
      }));

      // Combine all tags
      const allTags = [...commonTags, ...additionalTags];

      // Set tags directly on the resource
      resource.addPropertyOverride('Tags', allTags);
    }
  }
} 