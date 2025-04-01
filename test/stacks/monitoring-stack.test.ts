import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MonitoringStack } from '../../lib/stacks/monitoring-stack';

describe('MonitoringStack', () => {
  let stack: MonitoringStack;
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new MonitoringStack(app, 'TestMonitoringStack', {
      securityTeamEmail: 'test@example.com',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  it('should create an SNS topic for alarms', () => {
    template.hasResource('AWS::SNS::Topic', {
      Properties: {
        DisplayName: 'Synapsed Alarms',
      },
    });
  });

  it('should create an email subscription for the SNS topic', () => {
    template.hasResource('AWS::SNS::Subscription', {
      Properties: {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      },
    });
  });

  it('should create Notes API error rate alarm', () => {
    template.hasResource('AWS::CloudWatch::Alarm', {
      Properties: {
        AlarmName: 'NotesApiErrorRate',
        AlarmDescription: 'Notes API Error Rate > 0',
        MetricName: 'ErrorCount',
        Namespace: 'Synapsed/NotesApi',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: 'notes-api',
          },
          {
            Name: 'Operation',
            Value: 'getUser',
          },
        ],
      },
    });
  });

  it('should create Budget API error rate alarm', () => {
    template.hasResource('AWS::CloudWatch::Alarm', {
      Properties: {
        AlarmName: 'BudgetApiErrorRate',
        AlarmDescription: 'Budget API Error Rate > 0',
        MetricName: 'ErrorCount',
        Namespace: 'Synapsed/BudgetApi',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: 'budget-api',
          },
          {
            Name: 'Operation',
            Value: 'getBudgets',
          },
        ],
      },
    });
  });

  it('should create Notes API latency alarm', () => {
    template.hasResource('AWS::CloudWatch::Alarm', {
      Properties: {
        AlarmName: 'NotesApiLatency',
        AlarmDescription: 'Notes API Latency > 1s',
        MetricName: 'RequestDuration',
        Namespace: 'Synapsed/NotesApi',
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 1000,
        ComparisonOperator: 'GreaterThanThreshold',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: 'notes-api',
          },
          {
            Name: 'Operation',
            Value: 'getUser',
          },
        ],
      },
    });
  });

  it('should create Budget API latency alarm', () => {
    template.hasResource('AWS::CloudWatch::Alarm', {
      Properties: {
        AlarmName: 'BudgetApiLatency',
        AlarmDescription: 'Budget API Latency > 1s',
        MetricName: 'RequestDuration',
        Namespace: 'Synapsed/BudgetApi',
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 1000,
        ComparisonOperator: 'GreaterThanThreshold',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: 'budget-api',
          },
          {
            Name: 'Operation',
            Value: 'getBudgets',
          },
        ],
      },
    });
  });

  it('should create Budget count alarm', () => {
    template.hasResource('AWS::CloudWatch::Alarm', {
      Properties: {
        AlarmName: 'BudgetCount',
        AlarmDescription: 'Budget Count > 100',
        MetricName: 'BudgetCount',
        Namespace: 'Synapsed/BudgetApi',
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 100,
        ComparisonOperator: 'GreaterThanThreshold',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: 'budget-api',
          },
          {
            Name: 'Operation',
            Value: 'getBudgets',
          },
        ],
      },
    });
  });

  it('should add SNS actions to all alarms', () => {
    const alarms = template.findResources('AWS::CloudWatch::Alarm');
    Object.values(alarms).forEach((alarm: any) => {
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
    });
  });
}); 