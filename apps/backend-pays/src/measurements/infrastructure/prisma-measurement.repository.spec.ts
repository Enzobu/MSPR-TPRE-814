import type { PrismaService } from '../../infrastructure/persistence/prisma.service';
import type { NewMeasurement } from '../domain/measurement';
import { PrismaMeasurementRepository } from './prisma-measurement.repository';

const buildRow = (
  overrides: Record<string, unknown> = {},
): {
  id: string;
  country: string;
  warehouse: string;
  temperatureCelsius: number;
  humidityPercent: number;
  recordedAt: Date;
} => ({
  id: 'm-1',
  country: 'BR',
  warehouse: 'W1',
  temperatureCelsius: 22.5,
  humidityPercent: 55,
  recordedAt: new Date('2026-06-01T08:00:00.000Z'),
  ...overrides,
});

const newMeasurement: NewMeasurement = {
  country: 'BR',
  warehouse: 'W1',
  temperatureCelsius: 22.5,
  humidityPercent: 55,
  recordedAt: new Date('2026-06-01T08:00:00.000Z'),
};

describe('PrismaMeasurementRepository', () => {
  let measurement: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  let queryRaw: jest.Mock;
  let prisma: PrismaService;
  let repository: PrismaMeasurementRepository;

  beforeEach(() => {
    measurement = {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    };
    queryRaw = jest.fn();
    prisma = {
      measurement,
      $queryRaw: queryRaw,
      $transaction: jest.fn(
        (operations: Array<Promise<unknown>>): Promise<unknown[]> =>
          Promise.all(operations),
      ),
    } as unknown as PrismaService;
    repository = new PrismaMeasurementRepository(prisma);
  });

  describe('save', () => {
    it('should insert the measurement and map the row', async () => {
      // Arrange
      measurement.create.mockResolvedValue(buildRow());

      // Act
      const result = await repository.save(newMeasurement);

      // Assert
      expect(measurement.create).toHaveBeenCalledWith({
        data: {
          country: 'BR',
          warehouse: 'W1',
          temperatureCelsius: 22.5,
          humidityPercent: 55,
          recordedAt: new Date('2026-06-01T08:00:00.000Z'),
        },
      });
      expect(result.id).toBe('m-1');
    });
  });

  describe('findHistory', () => {
    it('should filter on warehouse with a recordedAt range and order by recent first', async () => {
      // Arrange
      measurement.findMany.mockResolvedValue([buildRow()]);
      measurement.count.mockResolvedValue(1);
      const from = new Date('2026-06-01T00:00:00.000Z');
      const to = new Date('2026-06-02T00:00:00.000Z');

      // Act
      const page = await repository.findHistory({
        warehouse: 'W1',
        from,
        to,
        skip: 0,
        take: 20,
      });

      // Assert
      expect(measurement.findMany).toHaveBeenCalledWith({
        where: { warehouse: 'W1', recordedAt: { gte: from, lte: to } },
        skip: 0,
        take: 20,
        orderBy: [{ recordedAt: 'desc' }, { id: 'asc' }],
      });
      expect(page.total).toBe(1);
      expect(page.data[0].id).toBe('m-1');
    });

    it('should omit the recordedAt filter when no bounds are given', async () => {
      measurement.findMany.mockResolvedValue([]);
      measurement.count.mockResolvedValue(0);

      await repository.findHistory({
        warehouse: 'W1',
        skip: 0,
        take: 20,
      });

      expect(measurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { warehouse: 'W1', recordedAt: undefined },
        }),
      );
    });

    it('should build a lower-bound-only filter when only from is given', async () => {
      measurement.findMany.mockResolvedValue([]);
      measurement.count.mockResolvedValue(0);
      const from = new Date('2026-06-01T00:00:00.000Z');

      await repository.findHistory({
        warehouse: 'W1',
        from,
        skip: 0,
        take: 20,
      });

      expect(measurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { warehouse: 'W1', recordedAt: { gte: from } },
        }),
      );
    });
  });

  describe('aggregate', () => {
    it('should map raw bucket rows into domain buckets with computed start', async () => {
      // Arrange
      // bucketIndex * bucketSeconds * 1000 = bucketStart epoch ms.
      queryRaw.mockResolvedValue([
        {
          bucketIndex: '480000', // 480000 * 3600 = 1_728_000_000 s
          avgTemperatureCelsius: '21.5',
          avgHumidityPercent: '60',
          count: BigInt(4),
        },
      ]);

      // Act
      const buckets = await repository.aggregate({
        warehouse: 'W1',
        bucketSeconds: 3600,
      });

      // Assert
      expect(queryRaw).toHaveBeenCalledTimes(1);
      expect(buckets).toHaveLength(1);
      expect(buckets[0].avgTemperatureCelsius).toBe(21.5);
      expect(buckets[0].avgHumidityPercent).toBe(60);
      expect(buckets[0].count).toBe(4);
      expect(buckets[0].bucketStart).toEqual(new Date(480000 * 3600 * 1000));
    });

    it('should pass the raw filter clauses when from and to are given', async () => {
      queryRaw.mockResolvedValue([]);

      await repository.aggregate({
        warehouse: 'W1',
        bucketSeconds: 86_400,
        from: new Date('2026-06-01T00:00:00.000Z'),
        to: new Date('2026-06-02T00:00:00.000Z'),
      });

      expect(queryRaw).toHaveBeenCalledTimes(1);
    });
  });
});
