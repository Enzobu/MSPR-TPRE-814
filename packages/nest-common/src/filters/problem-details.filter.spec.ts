import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ProblemDetailsFilter } from './problem-details.filter';
import { ProblemDetailsDto } from '../dto/problem-details.dto';

interface CapturedResponse {
  statusCode?: number;
  contentType?: string;
  body?: ProblemDetailsDto;
}

function mockHost(
  url = '/api/v1/resource',
  method = 'GET',
): {
  host: ArgumentsHost;
  captured: CapturedResponse;
} {
  const captured: CapturedResponse = {};
  const response: {
    status: (code: number) => typeof response;
    type: (value: string) => typeof response;
    json: (payload: ProblemDetailsDto) => typeof response;
  } = {
    status: (code: number) => {
      captured.statusCode = code;
      return response;
    },
    type: (value: string) => {
      captured.contentType = value;
      return response;
    },
    json: (payload: ProblemDetailsDto) => {
      captured.body = payload;
      return response;
    },
  };
  const request = { url, method };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, captured };
}

describe('ProblemDetailsFilter', () => {
  let filter: ProblemDetailsFilter;

  beforeEach(() => {
    filter = new ProblemDetailsFilter();
  });

  it('should map a validation error to an RFC 7807 problem with field errors', () => {
    // Arrange
    const { host, captured } = mockHost('/api/v1/items', 'POST');
    const exception = new BadRequestException([
      'name must not be empty',
      'amount must be a number',
    ]);

    // Act
    filter.catch(exception, host);

    // Assert
    expect(captured.statusCode).toBe(400);
    expect(captured.contentType).toBe('application/problem+json');
    expect(captured.body).toMatchObject({
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      instance: '/api/v1/items',
      errors: ['name must not be empty', 'amount must be a number'],
    });
  });

  it('should map a NotFoundException to a 404 problem without field errors', () => {
    // Arrange
    const { host, captured } = mockHost('/api/v1/items/42');

    // Act
    filter.catch(new NotFoundException('Item not found'), host);

    // Assert
    expect(captured.statusCode).toBe(404);
    expect(captured.body).toMatchObject({
      title: 'Not Found',
      status: 404,
      detail: 'Item not found',
      instance: '/api/v1/items/42',
    });
    expect(captured.body?.errors).toBeUndefined();
  });

  it('should not leak internal details for an unexpected error', () => {
    // Arrange
    const { host, captured } = mockHost();

    // Act
    filter.catch(new Error('connection string mysql://secret'), host);

    // Assert
    expect(captured.statusCode).toBe(500);
    expect(captured.body?.title).toBe('Internal Server Error');
    expect(captured.body?.detail).toBe('An unexpected error occurred.');
  });
});
