import * as cdk from 'aws-cdk-lib';
import * as dotenv from "dotenv";
import { SecurityStack } from '../lib/stacks/security-stack';
import { LoggingStack } from '../lib/stacks/logging-stack';
import { ComplianceStack } from '../lib/stacks/compliance-stack';
import { IncidentResponseStack } from '../lib/stacks/incident-response-stack';
import { AlertingStack } from '../lib/stacks/alerting-stack';
import { SecurityMonitoringStack } from '../lib/stacks/security-monitoring-stack';
import { get } from "env-var";

/**
 * Multi-Account AWS Bootstrap
 * 
 * This is the main entry point for deploying a secure multi-account AWS organization.
 * Stack deployment order is important for dependency management:
 * 1. Security (IAM roles and permissions)
 * 2. Logging (Centralized logging infrastructure)
 * 3. Security Monitoring (GuardDuty and Security Hub)
 * 4. Compliance (AWS Config rules)
 * 5. Incident Response (Automated responses)
 * 6. Alerting (SNS notifications)
 */

// Load environment variables
dotenv.config();

// Required environment variables
const CDK_DEFAULT_ACCOUNT = get("CDK_DEFAULT_ACCOUNT").required().asString();
const CDK_DEFAULT_REGION = get("CDK_DEFAULT_REGION").required().asString();

// Optional environment variables with defaults
const STACK_PREFIX = get("STACK_PREFIX").default("Security").asString();
const ENV_NAME = get("ENV_NAME").default("Dev").asString();

// Initialize CDK app
const app = new cdk.App();

// Common stack properties
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

// Deploy stacks in dependency order
const securityStack = new SecurityStack(app, `${STACK_PREFIX}SecurityStack`, {
  description: 'IAM roles for centralized security & logging',
  ...stackProps
});

const loggingStack = new LoggingStack(app, `${STACK_PREFIX}LoggingStack`, {
  description: 'Centralized logging configuration',
  ...stackProps
});

const securityMonitoringStack = new SecurityMonitoringStack(app, `${STACK_PREFIX}SecurityMonitoringStack`, {
  description: 'Centralized security monitoring with GuardDuty and Security Hub',
  ...stackProps
});

const complianceStack = new ComplianceStack(app, `${STACK_PREFIX}ComplianceStack`, {
  description: 'AWS Config rules for compliance enforcement',
  ...stackProps
});

const incidentResponseStack = new IncidentResponseStack(app, `${STACK_PREFIX}IncidentResponseStack`, {
  description: 'Automated incident response with Lambda and EventBridge',
  ...stackProps
});

const alertingStack = new AlertingStack(app, `${STACK_PREFIX}AlertingStack`, {
  description: 'Security alerts with Amazon SNS',
  ...stackProps
});

// Add explicit dependencies
loggingStack.addDependency(securityStack);
securityMonitoringStack.addDependency(loggingStack);
complianceStack.addDependency(securityMonitoringStack);
incidentResponseStack.addDependency(complianceStack);
alertingStack.addDependency(incidentResponseStack);

app.synth();