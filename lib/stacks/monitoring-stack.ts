import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  securityTeamEmail: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: 'Synapsed Alarms',
    });

    // Add email subscription
    alarmTopic.addSubscription(
      new subscriptions.EmailSubscription(props.securityTeamEmail)
    );

    // API Error Rate Alarms
    new cloudwatch.Alarm(this, 'NotesApiErrorRateAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'Synapsed/NotesApi',
        metricName: 'ErrorCount',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          FunctionName: 'notes-api',
          Operation: 'getUser',
        },
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Notes API Error Rate > 0',
      actionsEnabled: true,
      alarmName: 'NotesApiErrorRate',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic));

    new cloudwatch.Alarm(this, 'BudgetApiErrorRateAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'Synapsed/BudgetApi',
        metricName: 'ErrorCount',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          FunctionName: 'budget-api',
          Operation: 'getBudgets',
        },
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Budget API Error Rate > 0',
      actionsEnabled: true,
      alarmName: 'BudgetApiErrorRate',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic));

    // API Latency Alarms
    new cloudwatch.Alarm(this, 'NotesApiLatencyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'Synapsed/NotesApi',
        metricName: 'RequestDuration',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          FunctionName: 'notes-api',
          Operation: 'getUser',
        },
      }),
      threshold: 1000, // 1 second
      evaluationPeriods: 2,
      alarmDescription: 'Notes API Latency > 1s',
      actionsEnabled: true,
      alarmName: 'NotesApiLatency',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic));

    new cloudwatch.Alarm(this, 'BudgetApiLatencyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'Synapsed/BudgetApi',
        metricName: 'RequestDuration',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          FunctionName: 'budget-api',
          Operation: 'getBudgets',
        },
      }),
      threshold: 1000, // 1 second
      evaluationPeriods: 2,
      alarmDescription: 'Budget API Latency > 1s',
      actionsEnabled: true,
      alarmName: 'BudgetApiLatency',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic));

    // Budget Count Alarms
    new cloudwatch.Alarm(this, 'BudgetCountAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'Synapsed/BudgetApi',
        metricName: 'BudgetCount',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          FunctionName: 'budget-api',
          Operation: 'getBudgets',
        },
      }),
      threshold: 100,
      evaluationPeriods: 1,
      alarmDescription: 'Budget Count > 100',
      actionsEnabled: true,
      alarmName: 'BudgetCount',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic));
  }
} 