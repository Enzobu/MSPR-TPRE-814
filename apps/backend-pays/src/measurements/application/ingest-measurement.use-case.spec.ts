import type { PinoLogger } from 'nestjs-pino';
import type { CountryCode } from '@futurekawa/contracts';
import type { RaiseMeasurementAlertsUseCase } from '../../alerts/application/raise-measurement-alerts.use-case';
import type { SyncWarehouseLotStatusUseCase } from '../../lots/application/sync-warehouse-lot-status.use-case';
import type { Measurement, NewMeasurement } from '../domain/measurement';
import type { MeasurementRepository } from '../domain/measurement.repository';
import { IngestMeasurementUseCase } from './ingest-measurement.use-case';

// WHY: seul `warn` est appelé ; on type vers PinoLogger pour éviter un `any`.
const silentLogger = { warn: jest.fn() } as unknown as PinoLogger;

describe('IngestMeasurementUseCase', () => {
  let save: jest.Mock;
  let measurements: jest.Mocked<MeasurementRepository>;
  let raiseAlerts: jest.Mocked<Pick<RaiseMeasurementAlertsUseCase, 'execute'>>;
  let syncLotStatus: jest.Mocked<Pick<SyncWarehouseLotStatusUseCase, 'execute'>>;
  let useCase: IngestMeasurementUseCase;

  // BR (idéal 29°C/55%, tol ±3/±2) → plages [26;32] et [53;57]. 21°C et 50%
  // sont tous deux HORS plage → outOfRange attendu.
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
    syncLotStatus = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new IngestMeasurementUseCase(
      measurements,
      raiseAlerts as unknown as RaiseMeasurementAlertsUseCase,
      syncLotStatus as unknown as SyncWarehouseLotStatusUseCase,
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

  it('should reflect an out-of-range measurement on the warehouse lots', async () => {
    const saved: Measurement = { id: 'm1', ...input };
    save.mockResolvedValue(saved);

    await useCase.execute(input);

    expect(syncLotStatus.execute).toHaveBeenCalledWith({
      country: 'BR',
      warehouse: 'W1',
      outOfRange: true,
    });
  });

  it('should mark an in-range measurement as not out of range', async () => {
    // 29°C / 55% = pile les idéaux BR → dans la plage.
    const inRange: NewMeasurement = {
      ...input,
      temperatureCelsius: 29,
      humidityPercent: 55,
    };
    save.mockResolvedValue({ id: 'm2', ...inRange });

    await useCase.execute(inRange);

    expect(syncLotStatus.execute).toHaveBeenCalledWith({
      country: 'BR',
      warehouse: 'W1',
      outOfRange: false,
    });
  });

  it('should keep the ingestion successful when lot status sync fails', async () => {
    const saved: Measurement = { id: 'm1', ...input };
    save.mockResolvedValue(saved);
    syncLotStatus.execute.mockRejectedValue(new Error('db down'));

    const result = await useCase.execute(input);

    expect(result).toBe(saved);
  });
});
