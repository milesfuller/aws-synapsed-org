# CDK Aspects Documentation

This document describes the custom CDK aspects used in the AWS Synapsed Bootstrap project to enforce consistent resource naming and tagging across all stacks.

## Overview

CDK aspects are a powerful feature that allows you to apply modifications to all constructs in a scope. We use aspects to enforce consistent naming conventions and tagging across all resources in our infrastructure.

## Tagging Aspect

The `TaggingAspect` ensures that all resources are tagged consistently with environment, project, and management information.

### Features

- Automatically applies common tags to all resources:
  - `Environment`: The environment name (e.g., Dev, Prod)
  - `Project`: The project name
  - `ManagedBy`: Set to "CDK" to indicate infrastructure as code
- Supports additional custom tags through the `additionalTags` property
- Works with all CloudFormation resources that support tagging

### Usage

```typescript
// Apply the tagging aspect to a stack
cdk.Aspects.of(stack).add(new TaggingAspect({
  environment: 'Dev',
  projectName: 'my-project',
  additionalTags: {
    'CostCenter': '12345',
    'Owner': 'team-name'
  }
}));
```

### Example Output

```json
{
  "Resources": {
    "MyBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "Tags": [
          { "Key": "Environment", "Value": "Dev" },
          { "Key": "Project", "Value": "my-project" },
          { "Key": "ManagedBy", "Value": "CDK" },
          { "Key": "CostCenter", "Value": "12345" },
          { "Key": "Owner", "Value": "team-name" }
        ]
      }
    }
  }
}
```

## Naming Aspect

The `NamingAspect` ensures consistent resource naming across all stacks by automatically generating resource names based on a standardized pattern.

### Features

- Generates consistent resource names using the pattern: `[prefix-]project-environment-resourcetype`
- Automatically converts resource types to lowercase
- Removes AWS:: prefix from resource types
- Optional prefix support for resource name customization
- Works with all CloudFormation resources that have a Name property

### Usage

```typescript
// Apply the naming aspect to a stack
cdk.Aspects.of(stack).add(new NamingAspect({
  environment: 'Dev',
  projectName: 'my-project',
  prefix: 'app' // optional
}));
```

### Example Output

```json
{
  "Resources": {
    "MyBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "Name": "app-my-project-dev-bucket"
      }
    },
    "MyTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "Name": "app-my-project-dev-table"
      }
    }
  }
}
```

## Best Practices

1. **Consistent Application**: Apply both aspects to all stacks to maintain consistency
2. **Environment Separation**: Use different environment names for different environments (Dev, Staging, Prod)
3. **Project Identification**: Always provide a meaningful project name
4. **Resource Type Handling**: The naming aspect automatically handles AWS:: prefixes and case conversion
5. **Tag Management**: Use additionalTags for environment-specific or resource-specific tags

## Implementation Details

Both aspects are implemented as CDK aspects that visit all constructs in a scope. They:

1. Check if the construct is a CloudFormation resource
2. Apply the appropriate modifications (tags or name)
3. Use `addPropertyOverride` to ensure changes are applied during synthesis

## Testing

Both aspects have comprehensive test coverage that verifies:
- Correct tag application
- Proper name generation
- Handling of optional properties
- Resource type-specific behavior

## Integration with Multi-Account Bootstrap

The aspects are integrated into the multi-account bootstrap process through the `multi-account-bootstrap.ts` file, where they are applied to all stacks using the environment variables:

```typescript
const stackProps = {
  env: { 
    account: CDK_DEFAULT_ACCOUNT,
    region: CDK_DEFAULT_REGION 
  },
  tags: {
    Environment: ENV_NAME,
    Framework: 'Multi-Account-Bootstrap',
    DeployedBy: 'CDK'
  }
};
```

This ensures consistent naming and tagging across all resources in the multi-account setup. 