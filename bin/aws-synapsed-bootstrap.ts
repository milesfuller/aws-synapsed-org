import * as cdk from 'aws-cdk-lib';
import * as dotenv from "dotenv";
import { SecurityStack } from '../lib/stacks/security-stack';
import { LoggingStack } from '../lib/stacks/logging-stack';
import { ComplianceStack } from '../lib/stacks/compliance-stack';
import { IncidentResponseStack } from '../lib/stacks/incident-response-stack';
import { AlertingStack } from '../lib/stacks/alerting-stack';
import { SecurityMonitoringStack } from '../lib/stacks/security-monitoring-stack';
import { get } from "env-var";

dotenv.config();

const CDK_DEFAULT_ACCOUNT = get("CDK_DEFAULT_ACCOUNT").required().asString();
const CDK_DEFAULT_REGION = get("CDK_DEFAULT_REGION").required().asString();

const app = new cdk.App();

new SecurityStack(app, 'SecurityStack', {
  description: 'IAM roles for centralized security & logging',
  env: { 
    account: CDK_DEFAULT_ACCOUNT,
    region: CDK_DEFAULT_REGION 
  },
});

new LoggingStack(app, 'LoggingStack', {
  description: 'Centralized logging configuration',
  env: { 
    account: CDK_DEFAULT_ACCOUNT,
    region: CDK_DEFAULT_REGION 
  },
});

new ComplianceStack(app, 'ComplianceStack', {
  description: 'AWS Config rules for compliance enforcement',
  env: { 
    account: CDK_DEFAULT_ACCOUNT,
    region: CDK_DEFAULT_REGION 
  },
});

new IncidentResponseStack(app, 'IncidentResponseStack', {
  description: 'Automated incident response with Lambda and EventBridge',
  env: { 
    account: CDK_DEFAULT_ACCOUNT,
    region: CDK_DEFAULT_REGION 
  },
});

new SecurityMonitoringStack(app, 'SecurityMonitoringStack', {
  description: 'Centralized security monitoring with GuardDuty and Security Hub',
  env: { 
    account: CDK_DEFAULT_ACCOUNT,
    region: CDK_DEFAULT_REGION 
  },
});

new AlertingStack(app, 'AlertingStack', {
  description: 'Security alerts with Amazon SNS',
  env: { 
    account: CDK_DEFAULT_ACCOUNT,
    region: CDK_DEFAULT_REGION 
  },
});

app.synth();