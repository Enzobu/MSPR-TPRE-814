import type { PrismaService } from '../../infrastructure/persistence/prisma.service';
import type { NewLot } from '../domain/lot';
import { LotAlreadyExistsError } from '../domain/lot.errors';
import { PrismaLotRepository } from './prisma-lot.repository';

const buildRow = (
  overrides: Record<string, unknown> = {},
): {
  id: string;
  country: string;
  farm: string;
  warehouse: string;
  storedAt: Date;
  status: string;
} => ({
  id: 'BR-2026-008',
  country: 'BR',
  farm: 'Fazenda Aurora',
  warehouse: 'Entrepôt Sul-1',
  storedAt: new Date('2026-06-01T08:00:00.000Z'),
  status: 'CONFORME',
  ...overrides,
});

const newLot: NewLot = {
  id: 'BR-2026-008',
  country: 'BR',
  farm: 'Fazenda Aurora',
  warehouse: 'Entrepôt Sul-1',
  storedAt: new Date('2026-06-01T08:00:00.000Z'),
};

describe('PrismaLotRepository', () => {
  let lot: {
    create: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  let prisma: PrismaService;
  let repository: PrismaLotRepository;

  beforeEach(() => {
    lot = {
      create: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    };
    prisma = {
      lot,
      $transaction: jest.fn(
        (operations: Array<Promise<unknown>>): Promise<unknown[]> =>
          Promise.all(operations),
      ),
    } as unknown as PrismaService;
    repository = new PrismaLotRepository(prisma);
  });

  describe('create', () => {
    it('should insert the lot and map the row to a domain lot', async () => {
      // Arrange
      lot.create.mockResolvedValue(buildRow());

      // Act
      const result = await repository.create(newLot);

      // Assert
      expect(lot.create).toHaveBeenCalledWith({
        data: {
          id: 'BR-2026-008',
          country: 'BR',
          farm: 'Fazenda Aurora',
          warehouse: 'Entrepôt Sul-1',
          storedAt: new Date('2026-06-01T08:00:00.000Z'),
        },
      });
      expect(result.id).toBe('BR-2026-008');
      expect(result.status).toBe('CONFORME');
    });

    it('should translate a P2002 unique violation into LotAlreadyExistsError', async () => {
      lot.create.mockRejectedValue({ code: 'P2002' });

      await expect(repository.create(newLot)).rejects.toBeInstanceOf(
        LotAlreadyExistsError,
      );
    });

    it('should rethrow non-unique errors untouched', async () => {
      const error = new Error('db down');
      lot.create.mockRejectedValue(error);

      await expect(repository.create(newLot)).rejects.toBe(error);
    });
  });

  describe('existsById', () => {
    it('should return true when count is positive', async () => {
      lot.count.mockResolvedValue(1);

      await expect(repository.existsById('BR-2026-008')).resolves.toBe(true);
      expect(lot.count).toHaveBeenCalledWith({
        where: { id: 'BR-2026-008' },
      });
    });

    it('should return false when count is zero', async () => {
      lot.count.mockResolvedValue(0);

      await expect(repository.existsById('missing')).resolves.toBe(false);
    });
  });

  describe('findById', () => {
    it('should map the row when the lot exists', async () => {
      lot.findUnique.mockResolvedValue(buildRow());

      const result = await repository.findById('BR-2026-008');

      expect(lot.findUnique).toHaveBeenCalledWith({
        where: { id: 'BR-2026-008' },
      });
      expect(result?.id).toBe('BR-2026-008');
    });

    it('should return null when the lot does not exist', async () => {
      lot.findUnique.mockResolvedValue(null);

      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('findManyByStoredAt', () => {
    it('should paginate, order by storedAt then id, and return total', async () => {
      // Arrange
      lot.findMany.mockResolvedValue([buildRow({ id: 'BR-1' })]);
      lot.count.mockResolvedValue(5);

      // Act
      const page = await repository.findManyByStoredAt({
        skip: 20,
        take: 20,
        direction: 'desc',
      });

      // Assert
      expect(lot.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 20,
        take: 20,
        orderBy: [{ storedAt: 'desc' }, { id: 'asc' }],
      });
      expect(lot.count).toHaveBeenCalledWith({ where: {} });
      expect(page.total).toBe(5);
      expect(page.data[0].id).toBe('BR-1');
    });

    it('should scope findMany and count to the country when provided', async () => {
      // Arrange
      lot.findMany.mockResolvedValue([buildRow({ id: 'EC-1', country: 'EC' })]);
      lot.count.mockResolvedValue(2);

      // Act
      await repository.findManyByStoredAt({
        skip: 0,
        take: 20,
        direction: 'asc',
        country: 'EC',
      });

      // Assert
      expect(lot.findMany).toHaveBeenCalledWith({
        where: { country: 'EC' },
        skip: 0,
        take: 20,
        orderBy: [{ storedAt: 'asc' }, { id: 'asc' }],
      });
      expect(lot.count).toHaveBeenCalledWith({ where: { country: 'EC' } });
    });
  });

  describe('findExpirable', () => {
    it('should query lots before the cutoff that are not yet PERIME', async () => {
      // Arrange
      const cutoff = new Date('2025-06-01T00:00:00.000Z');
      lot.findMany.mockResolvedValue([buildRow({ id: 'BR-OLD' })]);

      // Act
      const result = await repository.findExpirable(cutoff);

      // Assert
      expect(lot.findMany).toHaveBeenCalledWith({
        where: {
          storedAt: { lt: cutoff },
          status: { not: 'PERIME' },
        },
      });
      expect(result[0].id).toBe('BR-OLD');
    });
  });

  describe('updateStatus', () => {
    it('should update the status and map the row', async () => {
      lot.update.mockResolvedValue(buildRow({ status: 'PERIME' }));

      const result = await repository.updateStatus('BR-2026-008', 'PERIME');

      expect(lot.update).toHaveBeenCalledWith({
        where: { id: 'BR-2026-008' },
        data: { status: 'PERIME' },
      });
      expect(result?.status).toBe('PERIME');
    });

    it('should return null when the record is not found (P2025)', async () => {
      lot.update.mockRejectedValue({ code: 'P2025' });

      await expect(
        repository.updateStatus('missing', 'PERIME'),
      ).resolves.toBeNull();
    });

    it('should rethrow non-not-found errors untouched', async () => {
      const error = new Error('db down');
      lot.update.mockRejectedValue(error);

      await expect(
        repository.updateStatus('BR-2026-008', 'PERIME'),
      ).rejects.toBe(error);
    });
  });
});
