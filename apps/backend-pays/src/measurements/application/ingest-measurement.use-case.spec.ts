import type { PinoLogger } from 'nestjs-pino';
import type { CountryCode } from '@futurekawa/contracts';
import type { RaiseMeasurementAlertsUseCase } from '../../alerts/application/raise-measurement-alerts.use-case';
import type { Measurement, NewMeasurement } from '../domain/measurement';
import type { MeasurementRepository } from '../domain/measurement.repository';
import { IngestMeasurementUseCase } from './ingest-measurement.use-case';

// WHY: seul `warn` est appelé ; on type vers PinoLogger pour éviter un `any`.
const silentLogger = { warn: jest.fn() } as unknown as PinoLogger;

describe('IngestMeasurementUseCase', () => {
  let save: jest.Mock;
  let measurements: jest.Mocked<MeasurementRepository>;
  let raiseAlerts: jest.Mocked<Pick<RaiseMeasurementAlertsUseCase, 'execute'>>;
  let useCase: IngestMeasurementUseCase;

  const input: NewMeasurement = {
    country: 'BR' as CountryCode,
    warehouse: 'W1',
    temperatureCelsius: 21,
    humidityPercent: 50,
    recordedAt: new Date('2026-06-01T08:00:00.000Z'),
  };

  beforeEach(() => {
    save = jest.fn();
    measurements = {
      save,
      findHistory: jest.fn(),
      aggregate: jest.fn(),
    };
    raiseAlerts = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new IngestMeasurementUseCase(
      measurements,
      raiseAlerts as unknown as RaiseMeasurementAlertsUseCase,
      silentLogger,
    );
  });

  it('should persist the measurement through the repository port', async () => {
    // Arrange
    const saved: Measurement = { id: 'm1', ...input };
    save.mockResolvedValue(saved);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(save).toHaveBeenCalledWith(input);
    expect(result).toBe(saved);
  });

  it('should evaluate alerts after persisting the measurement', async () => {
    // Arrange
    const saved: Measurement = { id: 'm1', ...input };
    save.mockResolvedValue(saved);

    // Act
    await useCase.execute(input);

    // Assert
    expect(raiseAlerts.execute).toHaveBeenCalledWith({
      country: saved.country,
      warehouse: saved.warehouse,
      temperatureCelsius: saved.temperatureCelsius,
      humidityPercent: saved.humidityPercent,
    });
  });

  it('should keep the ingestion successful when alerting fails', async () => {
    // Arrange
    const saved: Measurement = { id: 'm1', ...input };
    save.mockResolvedValue(saved);
    raiseAlerts.execute.mockRejectedValue(new Error('alerting down'));

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toBe(saved);
  });
});
