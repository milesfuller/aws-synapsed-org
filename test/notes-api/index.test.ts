import { handler } from '../../src/notes-api';
import { DynamoDB, CloudWatch } from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';

jest.mock('aws-sdk', () => {
  const mockDynamoDBGet = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({ Item: { userId: '123', type: 'USER' } }),
  });

  const mockPutMetricData = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({}),
  });

  const mockPutLogEvents = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({}),
  });

  return {
    DynamoDB: {
      DocumentClient: jest.fn().mockImplementation(() => ({
        get: mockDynamoDBGet,
      })),
    },
    CloudWatch: jest.fn().mockImplementation(() => ({
      putMetricData: mockPutMetricData,
    })),
    CloudWatchLogs: jest.fn().mockImplementation(() => ({
      putLogEvents: mockPutLogEvents,
    })),
  };
});

jest.mock('aws-xray-sdk', () => {
  const mockSubsegment = {
    addError: jest.fn(),
    close: jest.fn(),
  };
  const mockSegment = {
    addNewSubsegment: jest.fn().mockReturnValue(mockSubsegment),
  };
  return {
    getSegment: jest.fn().mockReturnValue(mockSegment),
    captureAWSClient: jest.fn().mockImplementation((client) => client),
  };
});

jest.mock('../../src/utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('Notes API Handler', () => {
  let mockDynamoDBGet: jest.Mock;
  let mockPutMetricData: jest.Mock;
  let mockPutLogEvents: jest.Mock;
  let mockSegment: any;
  let mockSubsegment: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set environment variables
    process.env.DYNAMODB_TABLE = 'test-users-table';

    // Get references to the mock functions from the aws-sdk mock
    const awsSdkMock = require('aws-sdk');
    mockDynamoDBGet = awsSdkMock.DynamoDB.DocumentClient().get;
    mockPutMetricData = awsSdkMock.CloudWatch().putMetricData;
    mockPutLogEvents = awsSdkMock.CloudWatchLogs().putLogEvents;

    // Get references to the mock functions from aws-xray-sdk mock
    const awsXRayMock = require('aws-xray-sdk');
    mockSegment = awsXRayMock.getSegment();
    mockSubsegment = mockSegment.addNewSubsegment();
  });

  it('should successfully process a request', async () => {
    const event = {
      requestContext: {
        requestId: 'test-request-id',
        authorizer: {
          claims: {
            sub: 'test-user-id',
          },
        },
      },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject({
      message: 'Notes API is working',
      user: { userId: '123', type: 'USER' },
    });

    // Verify DynamoDB call
    expect(mockDynamoDBGet).toHaveBeenCalledWith({
      TableName: expect.any(String),
      Key: {
        userId: 'test-user-id',
        type: 'USER',
      },
    });

    // Verify CloudWatch metrics
    expect(mockPutMetricData).toHaveBeenCalledWith({
      Namespace: 'Synapsed/NotesApi',
      MetricData: [
        {
          MetricName: 'RequestDuration',
          Value: expect.any(Number),
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'FunctionName', Value: 'notes-api' },
            { Name: 'Operation', Value: 'getUser' },
          ],
        },
        {
          MetricName: 'RequestCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'FunctionName', Value: 'notes-api' },
            { Name: 'Operation', Value: 'getUser' },
          ],
        },
      ],
    });

    // Verify X-Ray tracing
    expect(mockSegment.addNewSubsegment).toHaveBeenCalledWith('processRequest');
    expect(mockSubsegment.close).toHaveBeenCalled();
  });

  it('should handle missing user ID', async () => {
    const event = {
      requestContext: {
        requestId: 'test-request-id',
        authorizer: {},
      },
    };

    await expect(handler(event as any)).rejects.toThrow('User ID not found in token');

    // Verify error metric was recorded
    expect(mockPutMetricData).toHaveBeenCalledWith({
      Namespace: 'Synapsed/NotesApi',
      MetricData: [
        {
          MetricName: 'ErrorCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'FunctionName', Value: 'notes-api' },
            { Name: 'Operation', Value: 'getUser' },
          ],
        },
      ],
    });

    // Verify X-Ray error was recorded
    expect(mockSubsegment.addError).toHaveBeenCalled();
  });

  it('should handle DynamoDB errors', async () => {
    const event = {
      requestContext: {
        requestId: 'test-request-id',
        authorizer: {
          claims: {
            sub: 'test-user-id',
          },
        },
      },
    };

    mockDynamoDBGet.mockReturnValueOnce({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error')),
    });

    await expect(handler(event as any)).rejects.toThrow('DynamoDB error');

    // Verify error metric was recorded
    expect(mockPutMetricData).toHaveBeenCalledWith({
      Namespace: 'Synapsed/NotesApi',
      MetricData: [
        {
          MetricName: 'ErrorCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'FunctionName', Value: 'notes-api' },
            { Name: 'Operation', Value: 'getUser' },
          ],
        },
      ],
    });

    // Verify X-Ray error was recorded
    expect(mockSubsegment.addError).toHaveBeenCalled();
  });
}); 