import type { Measurement } from '../domain/measurement';
import type { MeasurementRepository } from '../domain/measurement.repository';
import { GetMeasurementHistoryUseCase } from './get-measurement-history.use-case';

const buildMeasurement = (id: string, recordedAt: string): Measurement => ({
  id,
  country: 'BR',
  warehouse: 'W1',
  temperatureCelsius: 22.5,
  humidityPercent: 55,
  recordedAt: new Date(recordedAt),
});

describe('GetMeasurementHistoryUseCase', () => {
  let measurements: jest.Mocked<MeasurementRepository>;
  let useCase: GetMeasurementHistoryUseCase;

  beforeEach(() => {
    measurements = {
      save: jest.fn(),
      findHistory: jest.fn(),
      aggregate: jest.fn(),
    };
    useCase = new GetMeasurementHistoryUseCase(measurements);
  });

  it('should translate page/pageSize into skip/take and forward warehouse/from/to', async () => {
    // Arrange
    measurements.findHistory.mockResolvedValue({ data: [], total: 0 });
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-02-01T00:00:00.000Z');

    // Act
    await useCase.execute({ warehouse: 'W1', from, to, page: 3, pageSize: 20 });

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(measurements.findHistory).toHaveBeenCalledWith({
      warehouse: 'W1',
      from,
      to,
      skip: 40,
      take: 20,
    });
  });

  it('should wrap the repository page into the paginated response shape', async () => {
    // Arrange
    const data = [
      buildMeasurement('m2', '2026-02-01T00:00:00.000Z'),
      buildMeasurement('m1', '2026-01-01T00:00:00.000Z'),
    ];
    measurements.findHistory.mockResolvedValue({ data, total: 42 });

    // Act
    const result = await useCase.execute({
      warehouse: 'W1',
      page: 1,
      pageSize: 20,
    });

    // Assert
    expect(result).toEqual({ data, total: 42, page: 1, pageSize: 20 });
  });
});
