# CDK Aspects

This directory contains custom CDK aspects used to enforce consistent resource naming and tagging across all stacks in the AWS Synapsed Bootstrap project.

## Available Aspects

### TaggingAspect

Enforces consistent tagging across all resources by automatically applying:
- Environment tag
- Project tag
- ManagedBy tag
- Any additional custom tags

```typescript
new TaggingAspect({
  environment: 'Dev',
  projectName: 'my-project',
  additionalTags: {
    'CostCenter': '12345'
  }
});
```

### NamingAspect

Enforces consistent resource naming using the pattern:
`[prefix-]project-environment-resourcetype`

```typescript
new NamingAspect({
  environment: 'Dev',
  projectName: 'my-project',
  prefix: 'app' // optional
});
```

## Usage

Apply aspects to a stack:

```typescript
const stack = new cdk.Stack(app, 'MyStack');

// Apply tagging
cdk.Aspects.of(stack).add(new TaggingAspect({
  environment: 'Dev',
  projectName: 'my-project'
}));

// Apply naming
cdk.Aspects.of(stack).add(new NamingAspect({
  environment: 'Dev',
  projectName: 'my-project'
}));
```

## Testing

Run the tests:

```bash
npm test test/aspects/
```

## Documentation

For detailed documentation, see [Aspects Documentation](../../docs/aspects.md). 