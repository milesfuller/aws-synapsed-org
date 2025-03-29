import { IAspect, CfnResource } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

export interface NamingAspectProps {
  /**
   * The environment name
   */
  environment: string;

  /**
   * The project name
   */
  projectName: string;

  /**
   * Optional prefix for resource names
   */
  prefix?: string;
}

export class NamingAspect implements IAspect {
  constructor(private props: NamingAspectProps) {}

  visit(node: IConstruct): void {
    if (CfnResource.isCfnResource(node)) {
      const resource = node as CfnResource;
      const resourceType = resource.cfnResourceType;

      // Get the resource type without the AWS:: prefix
      const shortType = resourceType.split('::').pop()?.toLowerCase() || '';

      // Generate a consistent name
      const nameParts = [
        this.props.prefix,
        this.props.projectName,
        this.props.environment,
        shortType,
      ].filter(Boolean);

      const resourceName = nameParts.join('-').toLowerCase();

      // Set the name property directly on the resource
      resource.addPropertyOverride('Name', resourceName);
    }
  }
} 