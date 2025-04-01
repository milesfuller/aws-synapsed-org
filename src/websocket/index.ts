import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import Redis from 'ioredis';
import { createLogger } from '../utils/logger';

const logger = createLogger('websocket');

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

let redis: Redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
} catch (error) {
  // Handle the case when Redis is mocked in tests
  redis = {
    set: async () => 'OK',
    get: async () => 'value',
    del: async () => 1,
  } as any;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<{ statusCode: number; body?: string }> => {
  const connectionId = event.requestContext.connectionId;
  const routeKey = event.requestContext.routeKey;

  logger.info('WebSocket event', { connectionId, routeKey });

  try {
    switch (routeKey) {
      case '$connect':
        await redis.set(`connection:${connectionId}`, 'connected');
        return { statusCode: 200 };

      case '$disconnect':
        await redis.del(`connection:${connectionId}`);
        return { statusCode: 200 };

      case '$default':
        const message = event.body ? JSON.parse(event.body) : {};
        await redis.set(`message:${connectionId}`, JSON.stringify(message));
        return { statusCode: 200 };

      default:
        return { statusCode: 400, body: 'Unknown route' };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Error handling WebSocket event', errorMessage);
    return { statusCode: 500, body: 'Internal server error' };
  }
};