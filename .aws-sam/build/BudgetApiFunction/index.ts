import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Configure DynamoDB for local development
const dynamoDbConfig = {
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
    }
  })
};

const dynamoDbClient = new DynamoDBClient(dynamoDbConfig);
const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Environment:', {
      DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
      NODE_ENV: process.env.NODE_ENV
    });
    
    // For local development, return a simple response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Budget API is working locally',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        config: {
          dynamodbEndpoint: process.env.DYNAMODB_ENDPOINT,
          region: process.env.AWS_DEFAULT_REGION
        }
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    };
  }
}; 