import type { CountryCode, Measurement } from '@futurekawa/contracts';
import {
  CountryUnavailableError,
  type CountryBackendGateway,
} from '../../country-backends/domain/country-backend.gateway';
import { GetLatestMeasurementsUseCase } from './get-latest-measurements.use-case';

const measurement = (country: CountryCode): Measurement => ({
  id: `m-${country}`,
  country,
  warehouse: `${country}-W1`,
  temperatureCelsius: 22,
  humidityPercent: 55,
  recordedAt: '2026-06-01T08:00:00.000Z',
});

interface GatewayMock extends CountryBackendGateway {
  get: jest.Mock;
  patch: jest.Mock;
}

// Chaque pays répond `{ measurement }` (ou null), 'down' rejette, 'empty' → null.
function buildGateway(
  byCountry: Partial<Record<CountryCode, Measurement | 'down' | 'empty'>>,
): GatewayMock {
  const get = jest.fn((country: CountryCode) => {
    const value = byCountry[country];
    if (value === 'down' || value === undefined) {
      return Promise.reject(new CountryUnavailableError(country, 'down'));
    }
    if (value === 'empty') {
      return Promise.resolve({ measurement: null });
    }
    return Promise.resolve({ measurement: value });
  });
  return { get, patch: jest.fn() };
}

describe('GetLatestMeasurementsUseCase', () => {
  it('should collect the latest measurement of each responding country', async () => {
    // Arrange
    const gateway = buildGateway({
      BR: measurement('BR'),
      EC: measurement('EC'),
      CO: measurement('CO'),
    });
    const useCase = new GetLatestMeasurementsUseCase(gateway);

    // Act
    const result = await useCase.execute({ correlationId: 'corr' });

    // Assert
    expect(result.unavailable).toEqual([]);
    expect(result.data.map((m) => m.country)).toEqual(['BR', 'EC', 'CO']);
  });

  it('should omit a country that has no measurement yet (null, not unavailable)', async () => {
    // Arrange — EC répond mais n'a aucun relevé.
    const gateway = buildGateway({
      BR: measurement('BR'),
      EC: 'empty',
      CO: measurement('CO'),
    });
    const useCase = new GetLatestMeasurementsUseCase(gateway);

    // Act
    const result = await useCase.execute({ correlationId: 'corr' });

    // Assert
    expect(result.unavailable).toEqual([]);
    expect(result.data.map((m) => m.country)).toEqual(['BR', 'CO']);
  });

  it('should list an unreachable country as unavailable without throwing', async () => {
    // Arrange
    const gateway = buildGateway({
      BR: measurement('BR'),
      EC: 'down',
      CO: 'empty',
    });
    const useCase = new GetLatestMeasurementsUseCase(gateway);

    // Act
    const result = await useCase.execute({ correlationId: 'corr' });

    // Assert
    expect(result.unavailable).toEqual(['EC']);
    expect(result.data.map((m) => m.country)).toEqual(['BR']);
  });

  it('should scope each latest request to its country and forward the correlation-id', async () => {
    // Arrange
    const gateway = buildGateway({ BR: 'empty', EC: 'empty', CO: 'empty' });
    const useCase = new GetLatestMeasurementsUseCase(gateway);

    // Act
    await useCase.execute({ correlationId: 'corr-42' });

    // Assert — chaque appel porte le filtre de son pays (anti-fuite mono-instance)
    expect(gateway.get).toHaveBeenCalledTimes(3);
    const paths = gateway.get.mock.calls.map(
      (call: [CountryCode, string, unknown]) => call[1],
    );
    expect(paths).toEqual([
      '/api/v1/measurements/latest?country=BR',
      '/api/v1/measurements/latest?country=EC',
      '/api/v1/measurements/latest?country=CO',
    ]);
    gateway.get.mock.calls.forEach((call: [CountryCode, string, unknown]) => {
      expect(call[2]).toEqual({ correlationId: 'corr-42' });
    });
  });
});
