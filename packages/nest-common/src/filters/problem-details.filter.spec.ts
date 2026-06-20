import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { ProblemDetailsFilter } from './problem-details.filter';
import { ProblemDetailsDto } from '../dto/problem-details.dto';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
}));

const captureException = Sentry.captureException as jest.Mock;

interface CapturedResponse {
  statusCode?: number;
  contentType?: string;
  body?: ProblemDetailsDto;
}

function mockHost(
  url = '/api/v1/resource',
  method = 'GET',
  correlationId?: string,
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
  // `id` est posé par nestjs-pino (genReqId) = correlation-id propagé.
  const request = { url, method, id: correlationId };

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
    captureException.mockClear();
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

  it('should report a 5xx to Sentry with the correlation id', () => {
    // Arrange
    const { host } = mockHost('/api/v1/items', 'POST', 'corr-123');
    const exception = new Error('boom');

    // Act
    filter.catch(exception, host);

    // Assert
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(exception, {
      tags: { correlation_id: 'corr-123' },
    });
  });

  it('should not report a 4xx to Sentry (expected business noise)', () => {
    // Arrange
    const { host } = mockHost('/api/v1/items/42');

    // Act
    filter.catch(new NotFoundException('Item not found'), host);

    // Assert
    expect(captureException).not.toHaveBeenCalled();
  });
});
