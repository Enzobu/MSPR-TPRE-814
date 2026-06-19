import type { Measurement, PaginatedResponse } from '@futurekawa/contracts';
import { CountryUnavailableError } from '../../country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from '../../country-backends/domain/country-backend.gateway';
import { GetCountryMeasurementsUseCase } from './get-country-measurements.use-case';

const measurement = (id: string): Measurement => ({
  id,
  country: 'BR',
  warehouse: 'W1',
  temperatureCelsius: 22.5,
  humidityPercent: 55,
  recordedAt: '2026-06-01T08:00:00.000Z',
});

const page = (data: Measurement[]): PaginatedResponse<Measurement> => ({
  data,
  total: data.length,
  page: 1,
  pageSize: 20,
});

describe('GetCountryMeasurementsUseCase', () => {
  let gateway: jest.Mocked<CountryBackendGateway>;
  let useCase: GetCountryMeasurementsUseCase;

  const params = (
    over: Partial<Parameters<GetCountryMeasurementsUseCase['execute']>[0]> = {},
  ) => ({
    country: 'BR' as const,
    warehouse: 'W1',
    page: 1,
    pageSize: 20,
    correlationId: 'corr-1',
    ...over,
  });

  beforeEach(() => {
    gateway = { get: jest.fn() };
    useCase = new GetCountryMeasurementsUseCase(gateway);
  });

  it('should proxy the country page and report no unavailable on success', async () => {
    gateway.get.mockResolvedValue(page([measurement('m-1')]));

    const result = await useCase.execute(params());

    expect(result.data.map((m) => m.id)).toEqual(['m-1']);
    expect(result.total).toBe(1);
    expect(result.unavailable).toEqual([]);
  });

  it('should pass the country and the built query string to the gateway', async () => {
    gateway.get.mockResolvedValue(page([]));

    await useCase.execute(
      params({
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-19T00:00:00.000Z',
        page: 2,
        pageSize: 50,
      }),
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(gateway.get).toHaveBeenCalledWith(
      'BR',
      '/api/v1/measurements?warehouse=W1&page=2&pageSize=50&from=2026-06-01T00%3A00%3A00.000Z&to=2026-06-19T00%3A00%3A00.000Z',
      { correlationId: 'corr-1' },
    );
  });

  it('should return a partial response (no throw) when the country is unavailable', async () => {
    gateway.get.mockRejectedValue(new CountryUnavailableError('BR', 'timeout'));

    const result = await useCase.execute(params({ page: 3, pageSize: 10 }));

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
    expect(result.unavailable).toEqual(['BR']);
  });

  it('should rethrow unexpected (non-unavailable) errors', async () => {
    gateway.get.mockRejectedValue(new Error('boom'));

    await expect(useCase.execute(params())).rejects.toThrow('boom');
  });
});
