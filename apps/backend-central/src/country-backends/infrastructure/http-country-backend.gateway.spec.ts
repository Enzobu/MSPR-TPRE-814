import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import {
  CountryRequestError,
  CountryUnavailableError,
} from '../domain/country-backend.gateway';
import { HttpCountryBackendGateway } from './http-country-backend.gateway';

const CONFIG: Partial<Env> = {
  BACKEND_PAYS_BR_URL: 'http://br:3000',
  BACKEND_PAYS_EC_URL: 'http://ec:3000',
  BACKEND_PAYS_CO_URL: 'http://co:3000',
  PAYS_REQUEST_TIMEOUT_MS: 50,
  PAYS_REQUEST_RETRIES: 2,
  PAYS_RETRY_BASE_MS: 1,
  PAYS_BREAKER_FAILURE_THRESHOLD: 2,
  PAYS_BREAKER_COOLDOWN_MS: 1000,
};

function axiosError(status?: number): unknown {
  return {
    isAxiosError: true,
    message: status ? `Request failed with status ${status}` : 'timeout',
    response: status ? { status } : undefined,
  };
}

function buildGateway(
  get: jest.Mock,
  patch: jest.Mock = jest.fn(),
): HttpCountryBackendGateway {
  const http = { axiosRef: { get, patch } } as unknown as HttpService;
  const config = {
    get: (key: keyof Env) => CONFIG[key],
  } as unknown as ConfigService<Env, true>;
  return new HttpCountryBackendGateway(http, config);
}

describe('HttpCountryBackendGateway', () => {
  it('should return data and propagate the correlation-id header', async () => {
    // Arrange
    const get = jest.fn().mockResolvedValue({ data: { status: 'ok' } });
    const gateway = buildGateway(get);

    // Act
    const result = await gateway.get<{ status: string }>('BR', '/health', {
      correlationId: 'corr-123',
    });

    // Assert
    expect(result).toEqual({ status: 'ok' });
    expect(get).toHaveBeenCalledWith('/health', {
      baseURL: 'http://br:3000',
      timeout: 50,
      headers: { 'x-correlation-id': 'corr-123' },
    });
  });

  it('should retry on a 5xx error then succeed', async () => {
    // Arrange
    const get = jest
      .fn()
      .mockRejectedValueOnce(axiosError(503))
      .mockResolvedValueOnce({ data: { status: 'ok' } });
    const gateway = buildGateway(get);

    // Act
    const result = await gateway.get('BR', '/health', { correlationId: 'x' });

    // Assert
    expect(result).toEqual({ status: 'ok' });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on a 4xx error', async () => {
    // Arrange
    const get = jest.fn().mockRejectedValue(axiosError(404));
    const gateway = buildGateway(get);

    // Act / Assert
    await expect(
      gateway.get('BR', '/lots', { correlationId: 'x' }),
    ).rejects.toBeInstanceOf(CountryUnavailableError);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('should open the breaker after consecutive failures and short-circuit', async () => {
    // Arrange — threshold 2, retries 2 (3 http calls per get())
    const get = jest.fn().mockRejectedValue(axiosError(500));
    const gateway = buildGateway(get);

    // Act — two failing calls trip the breaker
    await expect(
      gateway.get('BR', '/x', { correlationId: 'x' }),
    ).rejects.toBeInstanceOf(CountryUnavailableError);
    await expect(
      gateway.get('BR', '/x', { correlationId: 'x' }),
    ).rejects.toBeInstanceOf(CountryUnavailableError);
    get.mockClear();

    // Assert — third call short-circuits without hitting HTTP
    await expect(
      gateway.get('BR', '/x', { correlationId: 'x' }),
    ).rejects.toThrow(/circuit breaker open/);
    expect(get).not.toHaveBeenCalled();
  });

  it('should patch with body and correlation-id, returning data', async () => {
    // Arrange
    const patch = jest.fn().mockResolvedValue({ data: { acknowledged: true } });
    const gateway = buildGateway(jest.fn(), patch);

    // Act
    const result = await gateway.patch<{ acknowledged: boolean }>(
      'BR',
      '/api/v1/alerts/a-1/acknowledge',
      undefined,
      { correlationId: 'corr-1' },
    );

    // Assert
    expect(result).toEqual({ acknowledged: true });
    expect(patch).toHaveBeenCalledWith(
      '/api/v1/alerts/a-1/acknowledge',
      undefined,
      {
        baseURL: 'http://br:3000',
        timeout: 50,
        headers: { 'x-correlation-id': 'corr-1' },
      },
    );
  });

  it('should surface a 404 on patch as CountryRequestError carrying the status (no retry)', async () => {
    // Arrange — distinguishing a 4xx (alert unknown) from an unavailability.
    const patch = jest.fn().mockRejectedValue(axiosError(404));
    const gateway = buildGateway(jest.fn(), patch);

    // Act
    const error = await gateway
      .patch('BR', '/api/v1/alerts/nope/acknowledge', undefined, {
        correlationId: 'x',
      })
      .catch((e: unknown) => e);

    // Assert
    expect(error).toBeInstanceOf(CountryRequestError);
    expect((error as CountryRequestError).status).toBe(404);
    expect(patch).toHaveBeenCalledTimes(1);
  });

  it('should retry a 5xx on patch then fail as CountryUnavailableError', async () => {
    // Arrange
    const patch = jest.fn().mockRejectedValue(axiosError(503));
    const gateway = buildGateway(jest.fn(), patch);

    // Act / Assert — retries 2 → 3 attempts, then unavailable
    await expect(
      gateway.patch('BR', '/x', undefined, { correlationId: 'x' }),
    ).rejects.toBeInstanceOf(CountryUnavailableError);
    expect(patch).toHaveBeenCalledTimes(3);
  });
});
