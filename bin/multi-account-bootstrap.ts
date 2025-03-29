import * as cdk from 'aws-cdk-lib';
import * as dotenv from "dotenv";
import { SecurityStack } from '../lib/stacks/security-stack';
import { LoggingStack } from '../lib/stacks/logging-stack';
import { ComplianceStack } from '../lib/stacks/compliance-stack';
import { IncidentResponseStack } from '../lib/stacks/incident-response-stack';
import { AlertingStack } from '../lib/stacks/alerting-stack';
import { SecurityMonitoringStack } from '../lib/stacks/security-monitoring-stack';
import { ConfigManagementStack } from '../lib/stacks/config-management-stack';
import { getEnvironmentConfig } from '../lib/config/environment';

/**
 * Multi-Account AWS Bootstrap
 * 
 * This is the main entry point for deploying a secure multi-account AWS organization.
 * Stack deployment order is important for dependency management:
 * 1. Config Management (Parameter Store, Secrets Manager, AppConfig)
 * 2. Security (IAM roles and permissions)
 * 3. Logging (Centralized logging infrastructure)
 * 4. Security Monitoring (GuardDuty and Security Hub)
 * 5. Compliance (AWS Config rules)
 * 6. Incident Response (Automated responses)
 * 7. Alerting (SNS notifications)
 */

// Load environment variables
dotenv.config();

// Get validated environment configuration
const env = getEnvironmentConfig();

// Initialize CDK app
const app = new cdk.App();

// Common stack properties
const stackProps = {
  env: {
    account: env.cdkDefaultAccount,
    region: env.cdkDefaultRegion
  },
  tags: {
    Environment: env.envName,
    Framework: "CDK",
    DeployedBy: "aws-synapsed-bootstrap"
  },
  environment: env.envName,
  projectName: env.projectName
};

// Deploy Config Management Stack first
const configStack = new ConfigManagementStack(app, `${env.stackPrefix}ConfigStack`, {
  description: 'Configuration management with Parameter Store, Secrets Manager, and AppConfig',
  ...stackProps
});

// Deploy remaining stacks in dependency order
const securityStack = new SecurityStack(app, `${env.stackPrefix}SecurityStack`, {
  description: 'IAM roles for centralized security & logging',
  ...stackProps
});

const loggingStack = new LoggingStack(app, `${env.stackPrefix}LoggingStack`, {
  description: 'Centralized logging configuration',
  ...stackProps
});

const securityMonitoringStack = new SecurityMonitoringStack(app, `${env.stackPrefix}SecurityMonitoringStack`, {
  description: 'Centralized security monitoring with GuardDuty and Security Hub',
  ...stackProps
});

const complianceStack = new ComplianceStack(app, `${env.stackPrefix}ComplianceStack`, {
  description: 'AWS Config rules for compliance enforcement',
  ...stackProps
});

const incidentResponseStack = new IncidentResponseStack(app, `${env.stackPrefix}IncidentResponseStack`, {
  description: 'Automated incident response with Lambda and EventBridge',
  ...stackProps
});

const alertingStack = new AlertingStack(app, `${env.stackPrefix}AlertingStack`, {
  description: 'Security alerts with Amazon SNS',
  securityTeamEmail: env.securityTeamEmail,
  securityTeamPhone: env.securityTeamPhone,
  highSeverityThreshold: env.highSeverityThreshold,
  ...stackProps
});

// Add explicit dependencies
securityStack.addDependency(configStack);
loggingStack.addDependency(securityStack);
securityMonitoringStack.addDependency(loggingStack);
complianceStack.addDependency(securityMonitoringStack);
incidentResponseStack.addDependency(complianceStack);
alertingStack.addDependency(incidentResponseStack);

app.synth();