import type { MeasurementRepository } from '../domain/measurement.repository';
import { AggregateMeasurementsUseCase } from './aggregate-measurements.use-case';

describe('AggregateMeasurementsUseCase', () => {
  let measurements: jest.Mocked<MeasurementRepository>;
  let useCase: AggregateMeasurementsUseCase;

  beforeEach(() => {
    measurements = {
      save: jest.fn(),
      findHistory: jest.fn(),
      aggregate: jest.fn(),
    };
    useCase = new AggregateMeasurementsUseCase(measurements);
  });

  it('should translate the 1h bucket into 3600 seconds', async () => {
    // Arrange
    measurements.aggregate.mockResolvedValue([]);

    // Act
    await useCase.execute({ warehouse: 'W1', bucket: '1h' });

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(measurements.aggregate).toHaveBeenCalledWith({
      warehouse: 'W1',
      bucketSeconds: 3600,
      from: undefined,
      to: undefined,
    });
  });

  it('should translate the 1d bucket into 86400 seconds and forward from/to', async () => {
    // Arrange
    measurements.aggregate.mockResolvedValue([]);
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-08T00:00:00.000Z');

    // Act
    await useCase.execute({ warehouse: 'W1', bucket: '1d', from, to });

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(measurements.aggregate).toHaveBeenCalledWith({
      warehouse: 'W1',
      bucketSeconds: 86_400,
      from,
      to,
    });
  });

  it('should return the repository buckets unchanged', async () => {
    // Arrange
    const buckets = [
      {
        bucketStart: new Date('2026-01-01T00:00:00.000Z'),
        avgTemperatureCelsius: 22.5,
        avgHumidityPercent: 55,
        count: 12,
      },
    ];
    measurements.aggregate.mockResolvedValue(buckets);

    // Act
    const result = await useCase.execute({ warehouse: 'W1', bucket: '1h' });

    // Assert
    expect(result).toBe(buckets);
  });
});
