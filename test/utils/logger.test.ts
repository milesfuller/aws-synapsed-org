import { CloudWatchLogs } from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { createLogger } from '../../src/utils/logger';

jest.mock('aws-sdk', () => {
  const mockPutLogEvents = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({}),
  });

  return {
    CloudWatchLogs: jest.fn().mockImplementation(() => ({
      putLogEvents: mockPutLogEvents,
    })),
  };
});

jest.mock('aws-xray-sdk', () => ({
  captureAWSClient: jest.fn().mockImplementation((client) => client),
}));

describe('Logger', () => {
  let logger: any;
  let mockPutLogEvents: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = createLogger('test-function');
    mockPutLogEvents = (new CloudWatchLogs()).putLogEvents as jest.Mock;
  });

  it('should create logger with correct log group name', () => {
    expect(logger.logGroupName).toBe('/aws/lambda/test-function');
  });

  it('should set context correctly', () => {
    const context = { userId: 'test-user', requestId: 'test-request' };
    logger.setContext(context);
    expect(logger.context).toMatchObject(context);
  });

  it('should log info message', async () => {
    await logger.info('test message', { data: 'test' });
    expect(mockPutLogEvents).toHaveBeenCalledWith({
      logGroupName: '/aws/lambda/test-function',
      logStreamName: expect.any(String),
      logEvents: [
        {
          timestamp: expect.any(Number),
          message: expect.stringContaining('test message'),
        },
      ],
    });
  });

  it('should log error message with error details', async () => {
    const error = new Error('test error');
    await logger.error('error message', error, { data: 'test' });
    expect(mockPutLogEvents).toHaveBeenCalledWith({
      logGroupName: '/aws/lambda/test-function',
      logStreamName: expect.any(String),
      logEvents: [
        {
          timestamp: expect.any(Number),
          message: expect.stringContaining('error message'),
        },
      ],
    });
  });

  it('should handle CloudWatch Logs error gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockPutLogEvents.mockReturnValueOnce({
      promise: jest.fn().mockRejectedValue(new Error('CloudWatch error')),
    });

    await logger.info('test message');
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to write to CloudWatch Logs:',
      expect.any(Error)
    );
    consoleError.mockRestore();
  });
}); 