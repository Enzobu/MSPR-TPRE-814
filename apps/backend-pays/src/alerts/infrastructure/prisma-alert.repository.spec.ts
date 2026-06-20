import type { PrismaService } from '../../infrastructure/persistence/prisma.service';
import type { NewAlert } from '../domain/alert';
import { PrismaAlertRepository } from './prisma-alert.repository';

const buildRow = (
  overrides: Record<string, unknown> = {},
): {
  id: string;
  country: string;
  type: string;
  message: string;
  lotId: string | null;
  warehouse: string | null;
  triggeredAt: Date;
  acknowledged: boolean;
} => ({
  id: 'a-1',
  country: 'BR',
  type: 'LOT_EXPIRED',
  message: 'Lot BR-1 périmé',
  lotId: 'BR-1',
  warehouse: 'W1',
  triggeredAt: new Date('2026-06-01T02:00:00.000Z'),
  acknowledged: false,
  ...overrides,
});

const newAlert: NewAlert = {
  country: 'BR',
  type: 'LOT_EXPIRED',
  message: 'Lot BR-1 périmé',
  lotId: 'BR-1',
  warehouse: 'W1',
  triggeredAt: new Date('2026-06-01T02:00:00.000Z'),
};

describe('PrismaAlertRepository', () => {
  let alert: {
    count: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  let prisma: PrismaService;
  let repository: PrismaAlertRepository;

  beforeEach(() => {
    alert = {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    };
    prisma = {
      alert,
      $transaction: jest.fn(
        (operations: Array<Promise<unknown>>): Promise<unknown[]> =>
          Promise.all(operations),
      ),
    } as unknown as PrismaService;
    repository = new PrismaAlertRepository(prisma);
  });

  describe('existsForWarehouseOnDay', () => {
    it('should count alerts within the UTC day window for the warehouse', async () => {
      // Arrange
      const dayUtc = new Date('2026-06-01T00:00:00.000Z');
      alert.count.mockResolvedValue(1);

      // Act
      const exists = await repository.existsForWarehouseOnDay(
        'TEMP_HIGH',
        'W1',
        dayUtc,
      );

      // Assert
      expect(exists).toBe(true);
      expect(alert.count).toHaveBeenCalledWith({
        where: {
          type: 'TEMP_HIGH',
          warehouse: 'W1',
          triggeredAt: {
            gte: dayUtc,
            lt: new Date('2026-06-02T00:00:00.000Z'),
          },
        },
      });
    });

    it('should return false when no alert exists', async () => {
      alert.count.mockResolvedValue(0);

      await expect(
        repository.existsForWarehouseOnDay(
          'TEMP_HIGH',
          'W1',
          new Date('2026-06-01T00:00:00.000Z'),
        ),
      ).resolves.toBe(false);
    });
  });

  describe('existsForLotOnDay', () => {
    it('should count alerts within the UTC day window for the lot', async () => {
      const dayUtc = new Date('2026-06-01T00:00:00.000Z');
      alert.count.mockResolvedValue(2);

      const exists = await repository.existsForLotOnDay(
        'LOT_EXPIRED',
        'BR-1',
        dayUtc,
      );

      expect(exists).toBe(true);
      expect(alert.count).toHaveBeenCalledWith({
        where: {
          type: 'LOT_EXPIRED',
          lotId: 'BR-1',
          triggeredAt: {
            gte: dayUtc,
            lt: new Date('2026-06-02T00:00:00.000Z'),
          },
        },
      });
    });
  });

  describe('save', () => {
    it('should insert the alert and map the row to a domain alert', async () => {
      alert.create.mockResolvedValue(buildRow());

      const result = await repository.save(newAlert);

      expect(alert.create).toHaveBeenCalledWith({
        data: {
          country: 'BR',
          type: 'LOT_EXPIRED',
          message: 'Lot BR-1 périmé',
          lotId: 'BR-1',
          warehouse: 'W1',
          triggeredAt: new Date('2026-06-01T02:00:00.000Z'),
        },
      });
      expect(result.id).toBe('a-1');
      expect(result.lotId).toBe('BR-1');
    });
  });

  describe('findMany', () => {
    it('should apply type and acknowledged filters and paginate', async () => {
      // Arrange
      alert.findMany.mockResolvedValue([buildRow()]);
      alert.count.mockResolvedValue(1);

      // Act
      const page = await repository.findMany({
        type: 'LOT_EXPIRED',
        acknowledged: false,
        skip: 0,
        take: 20,
      });

      // Assert
      expect(alert.findMany).toHaveBeenCalledWith({
        where: { type: 'LOT_EXPIRED', acknowledged: false },
        skip: 0,
        take: 20,
        orderBy: [{ triggeredAt: 'desc' }, { id: 'asc' }],
      });
      expect(page.total).toBe(1);
      expect(page.data[0].id).toBe('a-1');
    });

    it('should omit filters when type and acknowledged are undefined', async () => {
      alert.findMany.mockResolvedValue([]);
      alert.count.mockResolvedValue(0);

      await repository.findMany({ skip: 0, take: 20 });

      expect(alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('should map a null lotId and warehouse to undefined', async () => {
      alert.findMany.mockResolvedValue([
        buildRow({ lotId: null, warehouse: null }),
      ]);
      alert.count.mockResolvedValue(1);

      const page = await repository.findMany({ skip: 0, take: 20 });

      expect(page.data[0].lotId).toBeUndefined();
      expect(page.data[0].warehouse).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should map the row when the alert exists', async () => {
      alert.findUnique.mockResolvedValue(buildRow());

      const result = await repository.findById('a-1');

      expect(alert.findUnique).toHaveBeenCalledWith({ where: { id: 'a-1' } });
      expect(result?.id).toBe('a-1');
    });

    it('should return null when the alert does not exist', async () => {
      alert.findUnique.mockResolvedValue(null);

      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('acknowledge', () => {
    it('should set acknowledged to true and map the row', async () => {
      alert.update.mockResolvedValue(buildRow({ acknowledged: true }));

      const result = await repository.acknowledge('a-1');

      expect(alert.update).toHaveBeenCalledWith({
        where: { id: 'a-1' },
        data: { acknowledged: true },
      });
      expect(result?.acknowledged).toBe(true);
    });

    it('should return null when the record is not found (P2025)', async () => {
      alert.update.mockRejectedValue({ code: 'P2025' });

      await expect(repository.acknowledge('missing')).resolves.toBeNull();
    });

    it('should rethrow non-not-found errors untouched', async () => {
      const error = new Error('db down');
      alert.update.mockRejectedValue(error);

      await expect(repository.acknowledge('a-1')).rejects.toBe(error);
    });
  });
});
