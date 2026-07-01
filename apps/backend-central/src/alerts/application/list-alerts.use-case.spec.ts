import type {
  Alert,
  CountryCode,
  PaginatedResponse,
} from '@futurekawa/contracts';
import {
  CountryUnavailableError,
  type CountryBackendGateway,
} from '../../country-backends/domain/country-backend.gateway';
import { ListAlertsUseCase } from './list-alerts.use-case';

const alert = (
  id: string,
  country: CountryCode,
  triggeredAt: string,
): Alert => ({
  id,
  country,
  type: 'TEMPERATURE_OUT_OF_RANGE',
  message: 'msg',
  triggeredAt,
  acknowledged: false,
});

const page = (data: Alert[]): PaginatedResponse<Alert> => ({
  data,
  total: data.length,
  page: 1,
  pageSize: 100,
});

interface GatewayMock extends CountryBackendGateway {
  get: jest.Mock;
  patch: jest.Mock;
}

function buildGateway(
  byCountry: Partial<Record<CountryCode, Alert[] | 'down'>>,
): GatewayMock {
  const get = jest.fn((country: CountryCode) => {
    const value = byCountry[country];
    if (value === 'down' || value === undefined) {
      return Promise.reject(new CountryUnavailableError(country, 'down'));
    }
    return Promise.resolve(page(value));
  });
  return { get, patch: jest.fn() };
}

describe('ListAlertsUseCase', () => {
  it('should return a single country page when one country is targeted', async () => {
    // Arrange
    const gateway = buildGateway({
      BR: [alert('a', 'BR', '2026-06-01T00:00:00.000Z')],
    });
    const useCase = new ListAlertsUseCase(gateway);

    // Act
    const result = await useCase.execute({
      countries: ['BR'],
      page: 1,
      pageSize: 20,
      correlationId: 'corr',
    });

    // Assert
    expect(result.total).toBe(1);
    expect(result.unavailable).toEqual([]);
    expect(result.data.map((a) => a.id)).toEqual(['a']);
  });

  it('should merge multiple countries sorted by triggeredAt descending', async () => {
    // Arrange
    const gateway = buildGateway({
      BR: [
        alert('br-old', 'BR', '2026-01-01T00:00:00.000Z'),
        alert('br-new', 'BR', '2026-09-01T00:00:00.000Z'),
      ],
      CO: [alert('co-mid', 'CO', '2026-05-01T00:00:00.000Z')],
    });
    const useCase = new ListAlertsUseCase(gateway);

    // Act
    const result = await useCase.execute({
      countries: ['BR', 'CO'],
      page: 1,
      pageSize: 20,
      correlationId: 'corr',
    });

    // Assert — récentes d'abord
    expect(result.data.map((a) => a.id)).toEqual([
      'br-new',
      'co-mid',
      'br-old',
    ]);
  });

  it('should relay type and acknowledged filters plus a wide pageSize to each country', async () => {
    // Arrange
    const gateway = buildGateway({ BR: [] });
    const useCase = new ListAlertsUseCase(gateway);

    // Act
    await useCase.execute({
      countries: ['BR'],
      type: 'LOT_EXPIRED',
      acknowledged: false,
      page: 1,
      pageSize: 20,
      correlationId: 'corr-123',
    });

    // Assert
    const call = gateway.get.mock.calls[0] as [
      CountryCode,
      string,
      { correlationId: string },
    ];
    const [, path, options] = call;
    expect(path).toContain('type=LOT_EXPIRED');
    expect(path).toContain('acknowledged=false');
    expect(path).toContain('pageSize=100');
    expect(options).toEqual({ correlationId: 'corr-123' });
  });

  it('should scope each country fetch with its own country filter', async () => {
    // Arrange — le scope pays évite la fuite/triplication inter-régions
    // quand les 3 URLs pointent vers une même instance (démo mono-instance).
    const gateway = buildGateway({ BR: [], EC: [], CO: [] });
    const useCase = new ListAlertsUseCase(gateway);

    // Act
    await useCase.execute({
      countries: ['BR', 'EC', 'CO'],
      page: 1,
      pageSize: 20,
      correlationId: 'corr',
    });

    // Assert — chaque appel porte le filtre du pays qu'il cible
    const paths = gateway.get.mock.calls.map(
      (call: [CountryCode, string, unknown]) => call[1],
    );
    expect(paths).toEqual([
      expect.stringContaining('country=BR'),
      expect.stringContaining('country=EC'),
      expect.stringContaining('country=CO'),
    ]);
  });

  it('should surface alerts only for the breaching country and none for the others', async () => {
    // Arrange — seule la région BR dépasse les seuils ; EC/CO sans alerte.
    const gateway = buildGateway({
      BR: [
        alert('br-temp', 'BR', '2026-06-02T00:00:00.000Z'),
        alert('br-hum', 'BR', '2026-06-01T00:00:00.000Z'),
      ],
      EC: [],
      CO: [],
    });
    const useCase = new ListAlertsUseCase(gateway);

    // Act
    const result = await useCase.execute({
      countries: ['BR', 'EC', 'CO'],
      page: 1,
      pageSize: 20,
      correlationId: 'corr',
    });

    // Assert — seules les alertes BR remontent, sans duplication
    expect(result.total).toBe(2);
    expect(result.unavailable).toEqual([]);
    expect(result.data.map((a) => a.id)).toEqual(['br-temp', 'br-hum']);
    expect(result.data.every((a) => a.country === 'BR')).toBe(true);
  });

  it('should mark a failing country as unavailable without throwing', async () => {
    // Arrange
    const gateway = buildGateway({
      BR: [alert('br', 'BR', '2026-06-01T00:00:00.000Z')],
      EC: 'down',
    });
    const useCase = new ListAlertsUseCase(gateway);

    // Act
    const result = await useCase.execute({
      countries: ['BR', 'EC'],
      page: 1,
      pageSize: 20,
      correlationId: 'corr',
    });

    // Assert
    expect(result.unavailable).toEqual(['EC']);
    expect(result.data.map((a) => a.id)).toEqual(['br']);
    expect(result.total).toBe(1);
  });

  it('should paginate the merged set', async () => {
    // Arrange
    const gateway = buildGateway({
      BR: [
        alert('a', 'BR', '2026-03-01T00:00:00.000Z'),
        alert('b', 'BR', '2026-02-01T00:00:00.000Z'),
        alert('c', 'BR', '2026-01-01T00:00:00.000Z'),
      ],
    });
    const useCase = new ListAlertsUseCase(gateway);

    // Act
    const result = await useCase.execute({
      countries: ['BR'],
      page: 2,
      pageSize: 2,
      correlationId: 'corr',
    });

    // Assert
    expect(result.total).toBe(3);
    expect(result.pageSize).toBe(2);
    expect(result.data.map((a) => a.id)).toEqual(['c']);
  });
});
