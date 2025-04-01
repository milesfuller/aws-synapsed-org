import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock Redis
const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue('value'),
  del: jest.fn().mockResolvedValue(1),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    throw new Error('Redis error');
  });
});

// Mock DynamoDB v3
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
  },
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

// Import after mocks are set up
import { handler } from '../../src/websocket/index';

describe('WebSocket handler', () => {
  let event: APIGatewayProxyEvent;

  beforeEach(() => {
    event = {
      requestContext: {
        connectionId: 'test-connection-id',
        routeKey: '$connect',
      },
      body: null,
    } as any;

    // Reset all mocks
    jest.clearAllMocks();
  });

  test('handles connect event', async () => {
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('handles disconnect event', async () => {
    event.requestContext.routeKey = '$disconnect';
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('handles default event', async () => {
    event.requestContext.routeKey = '$default';
    event.body = JSON.stringify({ action: 'test', data: 'test-data' });
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('handles default event with invalid JSON', async () => {
    event.requestContext.routeKey = '$default';
    event.body = 'invalid-json';
    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(response.body).toBe('Internal server error');
  });

  test('handles unknown route', async () => {
    event.requestContext.routeKey = 'unknown';
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBe('Unknown route');
  });
}); 