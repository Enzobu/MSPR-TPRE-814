import type { CountryCode } from '@futurekawa/contracts';
import type { Measurement, MeasurementBucket } from '../domain/measurement';
import type { AggregateMeasurementsUseCase } from '../application/aggregate-measurements.use-case';
import type { GetMeasurementHistoryUseCase } from '../application/get-measurement-history.use-case';
import type { IngestMeasurementUseCase } from '../application/ingest-measurement.use-case';
import { MeasurementsController } from './measurements.controller';
import type { AggregateMeasurementsQueryDto } from './dto/aggregate-measurements-query.dto';
import type { IngestMeasurementDto } from './dto/ingest-measurement.dto';
import type { MeasurementHistoryQueryDto } from './dto/measurement-history-query.dto';

const COUNTRY: CountryCode = 'BR';

const buildMeasurement = (
  overrides: Partial<Measurement> = {},
): Measurement => ({
  id: 'm-1',
  country: COUNTRY,
  warehouse: 'W1',
  temperatureCelsius: 22.5,
  humidityPercent: 55,
  recordedAt: new Date('2026-06-01T08:00:00.000Z'),
  ...overrides,
});

describe('MeasurementsController', () => {
  let getHistory: { execute: jest.Mock };
  let aggregate: { execute: jest.Mock };
  let ingest: { execute: jest.Mock };
  let controller: MeasurementsController;

  beforeEach(() => {
    getHistory = { execute: jest.fn() };
    aggregate = { execute: jest.fn() };
    ingest = { execute: jest.fn() };
    controller = new MeasurementsController(
      getHistory as unknown as GetMeasurementHistoryUseCase,
      aggregate as unknown as AggregateMeasurementsUseCase,
      ingest as unknown as IngestMeasurementUseCase,
      COUNTRY,
    );
  });

  describe('create', () => {
    it('should impose the instance country and forward the parsed payload', async () => {
      // Arrange
      ingest.execute.mockResolvedValue(buildMeasurement());
      const dto: IngestMeasurementDto = {
        warehouse: 'W1',
        temperatureCelsius: 22.5,
        humidityPercent: 55,
        recordedAt: '2026-06-01T08:00:00.000Z',
      };

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(ingest.execute).toHaveBeenCalledWith({
        country: COUNTRY,
        warehouse: 'W1',
        temperatureCelsius: 22.5,
        humidityPercent: 55,
        recordedAt: new Date('2026-06-01T08:00:00.000Z'),
      });
      expect(result.recordedAt).toBe('2026-06-01T08:00:00.000Z');
    });
  });

  describe('list', () => {
    it('should parse the date bounds and map the paginated history', async () => {
      // Arrange
      getHistory.execute.mockResolvedValue({
        data: [buildMeasurement()],
        total: 1,
        page: 1,
        pageSize: 20,
      });
      const query: MeasurementHistoryQueryDto = {
        warehouse: 'W1',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-02T00:00:00.000Z',
        page: 1,
        pageSize: 20,
      };

      // Act
      const result = await controller.list(query);

      // Assert
      expect(getHistory.execute).toHaveBeenCalledWith({
        warehouse: 'W1',
        from: new Date('2026-06-01T00:00:00.000Z'),
        to: new Date('2026-06-02T00:00:00.000Z'),
        page: 1,
        pageSize: 20,
      });
      expect(result.data[0].id).toBe('m-1');
      expect(result.total).toBe(1);
    });

    it('should pass undefined bounds when from and to are absent', async () => {
      getHistory.execute.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
      const query: MeasurementHistoryQueryDto = {
        warehouse: 'W1',
        page: 1,
        pageSize: 20,
      };

      await controller.list(query);

      expect(getHistory.execute).toHaveBeenCalledWith({
        warehouse: 'W1',
        from: undefined,
        to: undefined,
        page: 1,
        pageSize: 20,
      });
    });
  });

  describe('aggregateHistory', () => {
    it('should parse the date bounds and map the buckets', async () => {
      // Arrange
      const bucket: MeasurementBucket = {
        bucketStart: new Date('2026-06-01T00:00:00.000Z'),
        avgTemperatureCelsius: 21,
        avgHumidityPercent: 60,
        count: 4,
      };
      aggregate.execute.mockResolvedValue([bucket]);
      const query: AggregateMeasurementsQueryDto = {
        warehouse: 'W1',
        bucket: '1h',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-02T00:00:00.000Z',
      };

      // Act
      const result = await controller.aggregateHistory(query);

      // Assert
      expect(aggregate.execute).toHaveBeenCalledWith({
        warehouse: 'W1',
        bucket: '1h',
        from: new Date('2026-06-01T00:00:00.000Z'),
        to: new Date('2026-06-02T00:00:00.000Z'),
      });
      expect(result).toHaveLength(1);
      expect(result[0].bucketStart).toBe('2026-06-01T00:00:00.000Z');
    });

    it('should pass undefined bounds when from and to are absent', async () => {
      aggregate.execute.mockResolvedValue([]);
      const query: AggregateMeasurementsQueryDto = {
        warehouse: 'W1',
        bucket: '1d',
      };

      await controller.aggregateHistory(query);

      expect(aggregate.execute).toHaveBeenCalledWith({
        warehouse: 'W1',
        bucket: '1d',
        from: undefined,
        to: undefined,
      });
    });
  });
});
