import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { CountryUnavailableError } from '../domain/country-backend.gateway';
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

function buildGateway(get: jest.Mock): HttpCountryBackendGateway {
  const http = { axiosRef: { get } } as unknown as HttpService;
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
});
