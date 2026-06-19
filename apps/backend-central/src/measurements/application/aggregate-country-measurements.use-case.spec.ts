import type { MeasurementBucket } from '@futurekawa/contracts';
import { CountryUnavailableError } from '../../country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from '../../country-backends/domain/country-backend.gateway';
import { AggregateCountryMeasurementsUseCase } from './aggregate-country-measurements.use-case';

const bucket = (bucketStart: string): MeasurementBucket => ({
  bucketStart,
  avgTemperatureCelsius: 22.4,
  avgHumidityPercent: 54.8,
  count: 12,
});

describe('AggregateCountryMeasurementsUseCase', () => {
  let gateway: jest.Mocked<CountryBackendGateway>;
  let useCase: AggregateCountryMeasurementsUseCase;

  const params = (
    over: Partial<
      Parameters<AggregateCountryMeasurementsUseCase['execute']>[0]
    > = {},
  ) => ({
    country: 'BR' as const,
    warehouse: 'W1',
    bucket: '1h' as const,
    correlationId: 'corr-1',
    ...over,
  });

  beforeEach(() => {
    gateway = { get: jest.fn() };
    useCase = new AggregateCountryMeasurementsUseCase(gateway);
  });

  it('should proxy the buckets and report no unavailable on success', async () => {
    gateway.get.mockResolvedValue([bucket('2026-06-01T08:00:00.000Z')]);

    const result = await useCase.execute(params());

    expect(result.data).toHaveLength(1);
    expect(result.data[0].bucketStart).toBe('2026-06-01T08:00:00.000Z');
    expect(result.unavailable).toEqual([]);
  });

  it('should pass the country and the built query string to the gateway', async () => {
    gateway.get.mockResolvedValue([]);

    await useCase.execute(
      params({ bucket: '1d', from: '2026-06-01T00:00:00.000Z' }),
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(gateway.get).toHaveBeenCalledWith(
      'BR',
      '/api/v1/measurements/aggregate?warehouse=W1&bucket=1d&from=2026-06-01T00%3A00%3A00.000Z',
      { correlationId: 'corr-1' },
    );
  });

  it('should return a partial response (no throw) when the country is unavailable', async () => {
    gateway.get.mockRejectedValue(
      new CountryUnavailableError('BR', 'breaker open'),
    );

    const result = await useCase.execute(params());

    expect(result.data).toEqual([]);
    expect(result.unavailable).toEqual(['BR']);
  });

  it('should rethrow unexpected (non-unavailable) errors', async () => {
    gateway.get.mockRejectedValue(new Error('boom'));

    await expect(useCase.execute(params())).rejects.toThrow('boom');
  });
});
