import type { Request } from 'express';
import type {
  ConsolidatedList,
  ConsolidatedResponse,
  Measurement,
  MeasurementBucket,
} from '@futurekawa/contracts';
import type { AggregateCountryMeasurementsUseCase } from '../application/aggregate-country-measurements.use-case';
import type { GetCountryMeasurementsUseCase } from '../application/get-country-measurements.use-case';
import type { GetLatestMeasurementsUseCase } from '../application/get-latest-measurements.use-case';
import { MeasurementsController } from './measurements.controller';
import type { MeasurementsAggregateQueryDto } from './dto/measurements-aggregate-query.dto';
import type { MeasurementsQueryDto } from './dto/measurements-query.dto';

type RequestWithId = Request & { id: string };

const req = { id: 'corr-1' } as RequestWithId;

// Stub par défaut pour les tests qui n'exercent pas la route /latest.
const latestStub = (): GetLatestMeasurementsUseCase =>
  ({ execute: jest.fn() }) as unknown as GetLatestMeasurementsUseCase;

function buildMeasurement(): Measurement {
  return {
    id: 'm-1',
    country: 'BR',
    warehouse: 'wh-1',
    temperatureCelsius: 21,
    humidityPercent: 55,
    recordedAt: '2026-06-19T10:00:00.000Z',
  };
}

function buildBucket(): MeasurementBucket {
  return {
    bucketStart: '2026-06-19T10:00:00.000Z',
    avgTemperatureCelsius: 20,
    avgHumidityPercent: 60,
    count: 6,
  };
}

describe('MeasurementsController', () => {
  describe('list', () => {
    it('should pass query params and correlation-id to the use-case and map the data', async () => {
      // Arrange
      const result: ConsolidatedResponse<Measurement> = {
        data: [buildMeasurement()],
        total: 1,
        page: 1,
        pageSize: 20,
        unavailable: [],
      };
      const execute = jest.fn().mockResolvedValue(result);
      const getMeasurements = {
        execute,
      } as unknown as GetCountryMeasurementsUseCase;
      const aggregate = {
        execute: jest.fn(),
      } as unknown as AggregateCountryMeasurementsUseCase;
      const controller = new MeasurementsController(
        getMeasurements,
        aggregate,
        latestStub(),
      );
      const query = {
        country: 'BR',
        warehouse: 'wh-1',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-19T00:00:00.000Z',
        page: 1,
        pageSize: 20,
      } as MeasurementsQueryDto;

      // Act
      const response = await controller.list(query, req);

      // Assert
      expect(execute).toHaveBeenCalledWith({
        country: 'BR',
        warehouse: 'wh-1',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-19T00:00:00.000Z',
        page: 1,
        pageSize: 20,
        correlationId: 'corr-1',
      });
      expect(response).toEqual({
        data: [
          {
            id: 'm-1',
            country: 'BR',
            warehouse: 'wh-1',
            temperatureCelsius: 21,
            humidityPercent: 55,
            recordedAt: '2026-06-19T10:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        unavailable: [],
      });
    });

    it('should relay a partial unavailable response with an empty page', async () => {
      // Arrange
      const result: ConsolidatedResponse<Measurement> = {
        data: [],
        total: 0,
        page: 2,
        pageSize: 10,
        unavailable: ['EC'],
      };
      const getMeasurements = {
        execute: jest.fn().mockResolvedValue(result),
      } as unknown as GetCountryMeasurementsUseCase;
      const aggregate = {
        execute: jest.fn(),
      } as unknown as AggregateCountryMeasurementsUseCase;
      const controller = new MeasurementsController(
        getMeasurements,
        aggregate,
        latestStub(),
      );
      const query = {
        country: 'EC',
        warehouse: 'wh-9',
        page: 2,
        pageSize: 10,
      } as MeasurementsQueryDto;

      // Act
      const response = await controller.list(query, req);

      // Assert
      expect(response.data).toEqual([]);
      expect(response.unavailable).toEqual(['EC']);
    });
  });

  describe('aggregate', () => {
    it('should pass query params and correlation-id to the use-case and map the buckets', async () => {
      // Arrange
      const result: ConsolidatedList<MeasurementBucket> = {
        data: [buildBucket()],
        unavailable: [],
      };
      const execute = jest.fn().mockResolvedValue(result);
      const getMeasurements = {
        execute: jest.fn(),
      } as unknown as GetCountryMeasurementsUseCase;
      const aggregate = {
        execute,
      } as unknown as AggregateCountryMeasurementsUseCase;
      const controller = new MeasurementsController(
        getMeasurements,
        aggregate,
        latestStub(),
      );
      const query = {
        country: 'CO',
        warehouse: 'wh-3',
        bucket: '1h',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-19T00:00:00.000Z',
      } as MeasurementsAggregateQueryDto;

      // Act
      const response = await controller.aggregate(query, req);

      // Assert
      expect(execute).toHaveBeenCalledWith({
        country: 'CO',
        warehouse: 'wh-3',
        bucket: '1h',
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-19T00:00:00.000Z',
        correlationId: 'corr-1',
      });
      expect(response).toEqual({
        data: [
          {
            bucketStart: '2026-06-19T10:00:00.000Z',
            avgTemperatureCelsius: 20,
            avgHumidityPercent: 60,
            count: 6,
          },
        ],
        unavailable: [],
      });
    });

    it('should relay a partial unavailable aggregate response', async () => {
      // Arrange
      const result: ConsolidatedList<MeasurementBucket> = {
        data: [],
        unavailable: ['BR'],
      };
      const getMeasurements = {
        execute: jest.fn(),
      } as unknown as GetCountryMeasurementsUseCase;
      const aggregate = {
        execute: jest.fn().mockResolvedValue(result),
      } as unknown as AggregateCountryMeasurementsUseCase;
      const controller = new MeasurementsController(
        getMeasurements,
        aggregate,
        latestStub(),
      );
      const query = {
        country: 'BR',
        warehouse: 'wh-1',
        bucket: '1d',
      } as MeasurementsAggregateQueryDto;

      // Act
      const response = await controller.aggregate(query, req);

      // Assert
      expect(response.data).toEqual([]);
      expect(response.unavailable).toEqual(['BR']);
    });
  });

  describe('latest', () => {
    it('should forward the correlation-id and map the consolidated latest data', async () => {
      // Arrange
      const result: ConsolidatedList<Measurement> = {
        data: [buildMeasurement()],
        unavailable: ['EC'],
      };
      const execute = jest.fn().mockResolvedValue(result);
      const getLatest = {
        execute,
      } as unknown as GetLatestMeasurementsUseCase;
      const controller = new MeasurementsController(
        {} as unknown as GetCountryMeasurementsUseCase,
        {} as unknown as AggregateCountryMeasurementsUseCase,
        getLatest,
      );

      // Act
      const response = await controller.latest(req);

      // Assert
      expect(execute).toHaveBeenCalledWith({ correlationId: 'corr-1' });
      expect(response.data).toEqual([
        {
          id: 'm-1',
          country: 'BR',
          warehouse: 'wh-1',
          temperatureCelsius: 21,
          humidityPercent: 55,
          recordedAt: '2026-06-19T10:00:00.000Z',
        },
      ]);
      expect(response.unavailable).toEqual(['EC']);
    });
  });
});
