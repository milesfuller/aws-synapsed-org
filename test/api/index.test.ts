import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../src/api';

describe('API Handler', () => {
  let event: Partial<APIGatewayProxyEvent>;

  beforeEach(() => {
    event = {
      httpMethod: 'GET',
      path: '/test',
    };
  });

  describe('HTTP Methods', () => {
    it('should handle GET requests', async () => {
      const response = await handler(event as APIGatewayProxyEvent);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        message: 'GET request processed successfully',
      });
    });

    it('should handle POST requests', async () => {
      event.httpMethod = 'POST';
      event.body = JSON.stringify({ data: 'test' });

      const response = await handler(event as APIGatewayProxyEvent);
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        message: 'POST request processed successfully',
      });
    });

    it('should handle PUT requests', async () => {
      event.httpMethod = 'PUT';
      event.body = JSON.stringify({ data: 'test' });

      const response = await handler(event as APIGatewayProxyEvent);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        message: 'PUT request processed successfully',
      });
    });

    it('should handle DELETE requests', async () => {
      event.httpMethod = 'DELETE';

      const response = await handler(event as APIGatewayProxyEvent);
      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
    });

    it('should reject unsupported methods', async () => {
      event.httpMethod = 'PATCH';

      const response = await handler(event as APIGatewayProxyEvent);
      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Method not allowed',
      });
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully', async () => {
      event.body = 'invalid-json';
      event.httpMethod = 'POST';

      const response = await handler(event as APIGatewayProxyEvent);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Invalid request body',
      });
    });

    it('should handle internal errors', async () => {
      // Simulate an internal error by providing invalid data
      event.body = null;
      event.httpMethod = 'POST';

      const response = await handler(event as APIGatewayProxyEvent);
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Internal server error',
      });
    });
  });
}); 