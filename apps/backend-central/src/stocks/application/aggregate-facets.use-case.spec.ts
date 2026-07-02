import type { CountryCode, LotFacets } from '@futurekawa/contracts';
import { CountryUnavailableError } from '../../country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from '../../country-backends/domain/country-backend.gateway';
import { AggregateFacetsUseCase } from './aggregate-facets.use-case';

const ALL: CountryCode[] = ['BR', 'EC', 'CO'];

describe('AggregateFacetsUseCase', () => {
  let gateway: jest.Mocked<CountryBackendGateway>;
  let useCase: AggregateFacetsUseCase;

  beforeEach(() => {
    gateway = {
      get: jest.fn(),
    } as unknown as jest.Mocked<CountryBackendGateway>;
    useCase = new AggregateFacetsUseCase(gateway);
  });

  it('should merge, dedupe and sort facets across countries', async () => {
    const facets: Record<CountryCode, LotFacets> = {
      BR: { farms: ['Fazenda Aurora'], warehouses: ['Entrepôt Santos'] },
      EC: { farms: ['Hacienda El Roble'], warehouses: ['Entrepôt Santos'] },
      CO: { farms: ['Fazenda Aurora'], warehouses: ['Bodega Bogotá'] },
    };
    gateway.get.mockImplementation((country: CountryCode) =>
      Promise.resolve(facets[country]),
    );

    const result = await useCase.execute({
      countries: ALL,
      correlationId: 'corr-1',
    });

    expect(result.farms).toEqual(['Fazenda Aurora', 'Hacienda El Roble']);
    expect(result.warehouses).toEqual(['Bodega Bogotá', 'Entrepôt Santos']);
    expect(result.unavailable).toEqual([]);
  });

  it('should mark a country unavailable without throwing', async () => {
    gateway.get.mockImplementation((country: CountryCode) => {
      if (country === 'EC') {
        return Promise.reject(new CountryUnavailableError('EC', 'timeout'));
      }
      return Promise.resolve({ farms: ['F'], warehouses: ['W'] });
    });

    const result = await useCase.execute({
      countries: ALL,
      correlationId: 'corr-1',
    });

    expect(result.unavailable).toEqual(['EC']);
    expect(result.farms).toEqual(['F']);
  });
});
