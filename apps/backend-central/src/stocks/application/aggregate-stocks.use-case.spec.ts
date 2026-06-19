import type {
  CountryCode,
  Lot,
  PaginatedResponse,
} from '@futurekawa/contracts';
import { CountryUnavailableError } from '../../country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from '../../country-backends/domain/country-backend.gateway';
import { AggregateStocksUseCase } from './aggregate-stocks.use-case';
import type { StocksCache } from './stocks-cache';

const lot = (id: string, country: CountryCode, storedAt: string): Lot => ({
  id,
  country,
  farm: 'Farm',
  warehouse: 'WH',
  storedAt,
  status: 'CONFORME',
});

const page = (data: Lot[]): PaginatedResponse<Lot> => ({
  data,
  total: data.length,
  page: 1,
  pageSize: 100,
});

const ALL: CountryCode[] = ['BR', 'EC', 'CO'];

describe('AggregateStocksUseCase', () => {
  let gateway: jest.Mocked<CountryBackendGateway>;
  let cache: jest.Mocked<Pick<StocksCache, 'get' | 'set'>>;
  let useCase: AggregateStocksUseCase;

  const params = (
    over: Partial<Parameters<AggregateStocksUseCase['execute']>[0]> = {},
  ) => ({
    countries: ALL,
    page: 1,
    pageSize: 20,
    direction: 'asc' as const,
    correlationId: 'corr-1',
    ...over,
  });

  beforeEach(() => {
    gateway = { get: jest.fn() };
    cache = { get: jest.fn(), set: jest.fn() };
    useCase = new AggregateStocksUseCase(
      gateway,
      cache as unknown as StocksCache,
    );
  });

  it('should merge all countries FIFO (storedAt ascending) when all are up', async () => {
    cache.get.mockReturnValue(undefined);
    gateway.get.mockImplementation((country: CountryCode) => {
      const data: Record<CountryCode, Lot[]> = {
        BR: [lot('BR-2', 'BR', '2026-05-01T00:00:00.000Z')],
        EC: [lot('EC-1', 'EC', '2025-01-01T00:00:00.000Z')],
        CO: [lot('CO-3', 'CO', '2026-12-01T00:00:00.000Z')],
      };
      return Promise.resolve(page(data[country]));
    });

    const result = await useCase.execute(params());

    expect(result.data.map((l) => l.id)).toEqual(['EC-1', 'BR-2', 'CO-3']);
    expect(result.total).toBe(3);
    expect(result.unavailable).toEqual([]);
  });

  it('should return a partial response (no throw) when a country is unavailable', async () => {
    cache.get.mockReturnValue(undefined);
    gateway.get.mockImplementation((country: CountryCode) => {
      if (country === 'EC') {
        return Promise.reject(new CountryUnavailableError('EC', 'timeout'));
      }
      return Promise.resolve(
        page([lot(`${country}-1`, country, '2026-01-01T00:00:00.000Z')]),
      );
    });

    const result = await useCase.execute(params());

    expect(result.unavailable).toEqual(['EC']);
    expect(result.data).toHaveLength(2);
    expect(result.data.map((l) => l.country)).not.toContain('EC');
  });

  it('should query only the requested country when filtered', async () => {
    cache.get.mockReturnValue(undefined);
    gateway.get.mockResolvedValue(
      page([lot('BR-1', 'BR', '2026-01-01T00:00:00.000Z')]),
    );

    await useCase.execute(params({ countries: ['BR'] }));

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(gateway.get).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(gateway.get).toHaveBeenCalledWith('BR', expect.any(String), {
      correlationId: 'corr-1',
    });
  });

  it('should paginate the merged set', async () => {
    cache.get.mockReturnValue(undefined);
    gateway.get.mockImplementation((country: CountryCode) =>
      Promise.resolve(
        page([
          lot(`${country}-a`, country, '2026-01-01T00:00:00.000Z'),
          lot(`${country}-b`, country, '2026-06-01T00:00:00.000Z'),
        ]),
      ),
    );

    const result = await useCase.execute(params({ page: 2, pageSize: 2 }));

    expect(result.total).toBe(6);
    expect(result.page).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('should fetch every page of a country until exhausted (no 100-lot truncation)', async () => {
    cache.get.mockReturnValue(undefined);
    const makeLots = (count: number, tag: string): Lot[] =>
      Array.from({ length: count }, (_unused, i) =>
        lot(
          `BR-${tag}-${i}`,
          'BR',
          `2026-01-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
        ),
      );
    gateway.get.mockImplementation((_country: CountryCode, path: string) => {
      const pageNum = Number(
        new URLSearchParams(path.split('?')[1]).get('page'),
      );
      const data = pageNum === 1 ? makeLots(100, 'p1') : makeLots(50, 'p2');
      return Promise.resolve({
        data,
        total: 150,
        page: pageNum,
        pageSize: 100,
      });
    });

    const result = await useCase.execute(
      params({ countries: ['BR'], pageSize: 1000 }),
    );

    expect(result.total).toBe(150);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(gateway.get).toHaveBeenCalledTimes(2);
  });

  it('should serve from cache without hitting the gateway', async () => {
    const cached = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      unavailable: [] as CountryCode[],
    };
    cache.get.mockReturnValue(cached);

    const result = await useCase.execute(params());

    expect(result).toBe(cached);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(gateway.get).not.toHaveBeenCalled();
  });

  it('should not cache a partial (degraded) response', async () => {
    cache.get.mockReturnValue(undefined);
    gateway.get.mockImplementation((country: CountryCode) => {
      if (country === 'CO') {
        return Promise.reject(new CountryUnavailableError('CO', 'down'));
      }
      return Promise.resolve(
        page([lot(`${country}-1`, country, '2026-01-01T00:00:00.000Z')]),
      );
    });

    await useCase.execute(params());

    expect(cache.set).not.toHaveBeenCalled();
  });

  it('should cache a complete response', async () => {
    cache.get.mockReturnValue(undefined);
    gateway.get.mockResolvedValue(
      page([lot('BR-1', 'BR', '2026-01-01T00:00:00.000Z')]),
    );

    await useCase.execute(params({ countries: ['BR'] }));

    expect(cache.set).toHaveBeenCalledTimes(1);
  });
});
