import type { CountryCode } from '@futurekawa/contracts';
import type { Measurement, NewMeasurement } from '../domain/measurement';
import type { MeasurementRepository } from '../domain/measurement.repository';
import { IngestMeasurementUseCase } from './ingest-measurement.use-case';

describe('IngestMeasurementUseCase', () => {
  let save: jest.Mock;
  let measurements: jest.Mocked<MeasurementRepository>;
  let useCase: IngestMeasurementUseCase;

  beforeEach(() => {
    save = jest.fn();
    measurements = {
      save,
      findHistory: jest.fn(),
      aggregate: jest.fn(),
    };
    useCase = new IngestMeasurementUseCase(measurements);
  });

  it('should persist the measurement through the repository port', async () => {
    // Arrange
    const input: NewMeasurement = {
      country: 'BR' as CountryCode,
      warehouse: 'W1',
      temperatureCelsius: 21,
      humidityPercent: 50,
      recordedAt: new Date('2026-06-01T08:00:00.000Z'),
    };
    const saved: Measurement = { id: 'm1', ...input };
    save.mockResolvedValue(saved);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(save).toHaveBeenCalledWith(input);
    expect(result).toBe(saved);
  });
});
