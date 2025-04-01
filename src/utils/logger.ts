import { CloudWatchLogs } from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import winston from 'winston';

interface LogContext {
  userId?: string;
  requestId?: string;
  functionName: string;
  [key: string]: any;
}

class Logger {
  private logGroupName: string;
  private logStreamName: string;
  private context: LogContext;
  private cloudWatchLogs: CloudWatchLogs;

  constructor(functionName: string) {
    this.logGroupName = `/aws/lambda/${functionName}`;
    this.logStreamName = new Date().toISOString().split('T')[0];
    this.context = {
      functionName,
      timestamp: new Date().toISOString(),
    };
    this.cloudWatchLogs = AWSXRay.captureAWSClient(new CloudWatchLogs());
  }

  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context };
  }

  private async log(level: string, message: string, data?: any) {
    const logEvent = {
      timestamp: Date.now(),
      message: JSON.stringify({
        level,
        message,
        ...this.context,
        ...data,
      }),
    };

    try {
      await this.cloudWatchLogs.putLogEvents({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent],
      }).promise();
    } catch (error) {
      console.error('Failed to write to CloudWatch Logs:', error);
    }
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  error(message: string, error?: Error, data?: any) {
    this.log('ERROR', message, {
      ...data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }
}

export const createLogger = (functionName: string) => new Logger(functionName);

export function createWinstonLogger(service: string) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });
} 