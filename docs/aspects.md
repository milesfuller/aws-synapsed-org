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

## Core Aspects

### 1. Security Aspect

The security aspect ensures secure communication and data handling:

```typescript
// Example security aspect
@Aspect()
class SecurityAspect {
  @Before('execution(* *.*(..))')
  async validateSecurity(context: ExecutionContext): Promise<void> {
    const request = context.getRequest();
    if (!request.headers.authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }
    await this.validateToken(request.headers.authorization);
  }

  @After('execution(* *.*(..))')
  async auditLog(context: ExecutionContext): Promise<void> {
    const request = context.getRequest();
    await this.logger.info('Request processed', {
      method: request.method,
      path: request.path,
      user: request.user,
      timestamp: new Date()
    });
  }
}
```

### 2. WebSocket Aspect

The WebSocket aspect handles real-time communication:

```typescript
// Example WebSocket aspect
@Aspect()
class WebSocketAspect {
  @Before('execution(* *.*(..))')
  async validateConnection(context: ExecutionContext): Promise<void> {
    const connection = context.getConnection();
    if (!connection.isAuthenticated()) {
      throw new UnauthorizedException('Invalid connection');
    }
    await this.validateRateLimit(connection);
  }

  @After('execution(* *.*(..))')
  async trackMetrics(context: ExecutionContext): Promise<void> {
    const message = context.getMessage();
    await this.metrics.recordMessage(message);
  }
}
```

### 3. Logging Aspect

The logging aspect provides comprehensive logging:

```typescript
// Example logging aspect
@Aspect()
class LoggingAspect {
  @Before('execution(* *.*(..))')
  async logRequest(context: ExecutionContext): Promise<void> {
    const request = context.getRequest();
    await this.logger.info('Request received', {
      method: request.method,
      path: request.path,
      headers: request.headers,
      timestamp: new Date()
    });
  }

  @After('execution(* *.*(..))')
  async logResponse(context: ExecutionContext): Promise<void> {
    const response = context.getResponse();
    await this.logger.info('Response sent', {
      status: response.status,
      headers: response.headers,
      timestamp: new Date()
    });
  }
}
```

## Implementation Details

### 1. Security Implementation

```typescript
// Example security implementation
class SecurityManager {
  constructor(private jwtService: JWTService) {}

  async validateToken(token: string): Promise<void> {
    try {
      const payload = await this.jwtService.verify(token);
      if (!payload.isValid) {
        throw new UnauthorizedException('Invalid token');
      }
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  async generateToken(payload: any): Promise<string> {
    return this.jwtService.sign(payload);
  }
}
```

### 2. WebSocket Implementation

```typescript
// Example WebSocket implementation
class WebSocketManager {
  constructor(private redis: Redis) {}

  async validateConnection(connection: WebSocket): Promise<void> {
    const rateLimit = await this.redis.get(`rate:${connection.id}`);
    if (rateLimit && parseInt(rateLimit) > 100) {
      throw new RateLimitException('Rate limit exceeded');
    }
  }

  async trackMetrics(message: WebSocketMessage): Promise<void> {
    await this.redis.incr(`metrics:${message.type}`);
  }
}
```

### 3. Logging Implementation

```typescript
// Example logging implementation
class LoggingManager {
  constructor(private logger: Logger) {}

  async logRequest(request: Request): Promise<void> {
    await this.logger.info('Request received', {
      method: request.method,
      path: request.path,
      headers: request.headers,
      timestamp: new Date()
    });
  }

  async logResponse(response: Response): Promise<void> {
    await this.logger.info('Response sent', {
      status: response.status,
      headers: response.headers,
      timestamp: new Date()
    });
  }
}
```

## Recent Improvements

### 1. AWS SDK v3 Migration

- Updated AWS service clients
- Enhanced error handling
- Improved type safety
- Better performance

### 2. Testing Infrastructure

- Added aspect tests
- Enhanced mocking
- Improved coverage
- Better organization

### 3. Code Quality

- Enhanced type safety
- Improved error handling
- Better logging
- Cleaner code organization

## Future Improvements

### 1. Aspect Enhancement

- Additional aspects
- Better composition
- Performance optimization
- Enhanced monitoring

### 2. Testing Enhancement

- More test cases
- Better coverage
- Performance tests
- Integration tests

### 3. Monitoring Enhancement

- Better metrics
- Enhanced logging
- Performance tracking
- Resource monitoring

## Best Practices

### 1. Security

- Token validation
- Rate limiting
- Access control
- Audit logging

### 2. WebSocket

- Connection management
- Message validation
- Error handling
- Performance monitoring

### 3. Logging

- Structured logging
- Log levels
- Log rotation
- Log analysis

## Support

### 1. Troubleshooting

- Common issues
- Resolution steps
- Log analysis
- Performance tuning

### 2. Documentation

- Aspect guide
- API reference
- Examples
- Best practices

### 3. Training

- Aspect overview
- Implementation guide
- Security practices
- Maintenance procedures 