// Mock AWS CDK constructs
jest.mock('aws-cdk-lib', () => {
  const actual = jest.requireActual('aws-cdk-lib');
  return {
    ...actual,
    Stack: jest.fn().mockImplementation(function (scope, id, props) {
      return actual.Stack.call(this, scope, id, props);
    }),
    CfnOutput: jest.fn().mockImplementation(function (scope, id, props) {
      return actual.CfnOutput.call(this, scope, id, props);
    }),
    Tags: {
      of: jest.fn().mockReturnValue({
        add: jest.fn(),
        tags: {}
      })
    }
  };
});

// Mock AWS CDK constructs
jest.mock('aws-cdk-lib/aws-ssm', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-ssm');
  return {
    ...actual,
    StringParameter: jest.fn().mockImplementation(function (scope, id, props) {
      return actual.StringParameter.call(this, scope, id, props);
    })
  };
});

jest.mock('aws-cdk-lib/aws-secretsmanager', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-secretsmanager');
  return {
    ...actual,
    Secret: jest.fn().mockImplementation(function (scope, id, props) {
      return actual.Secret.call(this, scope, id, props);
    })
  };
});

jest.mock('aws-cdk-lib/aws-appconfig', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-appconfig');
  return {
    ...actual,
    CfnApplication: jest.fn().mockImplementation(function (scope, id, props) {
      return actual.CfnApplication.call(this, scope, id, props);
    }),
    CfnEnvironment: jest.fn().mockImplementation(function (scope, id, props) {
      return actual.CfnEnvironment.call(this, scope, id, props);
    }),
    CfnConfigurationProfile: jest.fn().mockImplementation(function (scope, id, props) {
      return actual.CfnConfigurationProfile.call(this, scope, id, props);
    }),
    CfnHostedConfigurationVersion: jest.fn().mockImplementation(function (scope, id, props) {
      return actual.CfnHostedConfigurationVersion.call(this, scope, id, props);
    })
  };
});

jest.mock('aws-cdk-lib/aws-kms', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-kms');
  return {
    ...actual,
    Key: jest.fn().mockImplementation(function (scope, id, props) {
      return actual.Key.call(this, scope, id, props);
    })
  };
});

jest.mock('aws-cdk-lib/aws-iam', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-iam');
  return {
    ...actual,
    Role: jest.fn().mockImplementation(function (scope, id, props) {
      return actual.Role.call(this, scope, id, props);
    }),
    ServicePrincipal: jest.fn().mockImplementation(function (service) {
      return actual.ServicePrincipal.call(this, service);
    }),
    PolicyStatement: jest.fn().mockImplementation(function (props) {
      return actual.PolicyStatement.call(this, props);
    }),
    Effect: {
      ALLOW: 'Allow',
      DENY: 'Deny'
    }
  };
}); 