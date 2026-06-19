import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Lot } from '../domain/lot';
import {
  LotAlreadyExistsError,
  LotCountryMismatchError,
  LotNotFoundError,
} from '../domain/lot.errors';
import type { CreateLotUseCase } from '../application/create-lot.use-case';
import type { GetLotUseCase } from '../application/get-lot.use-case';
import type { ListLotsUseCase } from '../application/list-lots.use-case';
import type { UpdateLotStatusUseCase } from '../application/update-lot-status.use-case';
import { LotsController } from './lots.controller';
import type { CreateLotDto } from './dto/create-lot.dto';
import type { ListLotsQueryDto } from './dto/list-lots-query.dto';
import type { UpdateLotStatusDto } from './dto/update-lot-status.dto';

const buildLot = (overrides: Partial<Lot> = {}): Lot => ({
  id: 'BR-2026-008',
  country: 'BR',
  farm: 'Fazenda Aurora',
  warehouse: 'Entrepôt Sul-1',
  storedAt: new Date('2026-06-01T08:00:00.000Z'),
  status: 'CONFORME',
  ...overrides,
});

describe('LotsController', () => {
  let createLot: { execute: jest.Mock };
  let listLots: { execute: jest.Mock };
  let getLot: { execute: jest.Mock };
  let updateLotStatus: { execute: jest.Mock };
  let controller: LotsController;

  beforeEach(() => {
    createLot = { execute: jest.fn() };
    listLots = { execute: jest.fn() };
    getLot = { execute: jest.fn() };
    updateLotStatus = { execute: jest.fn() };
    controller = new LotsController(
      createLot as unknown as CreateLotUseCase,
      listLots as unknown as ListLotsUseCase,
      getLot as unknown as GetLotUseCase,
      updateLotStatus as unknown as UpdateLotStatusUseCase,
    );
  });

  describe('create', () => {
    const dto: CreateLotDto = {
      id: 'BR-2026-008',
      country: 'BR',
      farm: 'Fazenda Aurora',
      warehouse: 'Entrepôt Sul-1',
      storedAt: '2026-06-01T08:00:00.000Z',
    };

    it('should forward the parsed dto to the use case and map the result', async () => {
      // Arrange
      createLot.execute.mockResolvedValue(buildLot());

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(createLot.execute).toHaveBeenCalledWith({
        id: 'BR-2026-008',
        country: 'BR',
        farm: 'Fazenda Aurora',
        warehouse: 'Entrepôt Sul-1',
        storedAt: new Date('2026-06-01T08:00:00.000Z'),
      });
      expect(result.storedAt).toBe('2026-06-01T08:00:00.000Z');
      expect(result.status).toBe('CONFORME');
    });

    it('should translate LotAlreadyExistsError into a ConflictException', async () => {
      createLot.execute.mockRejectedValue(
        new LotAlreadyExistsError('BR-2026-008'),
      );

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('should translate LotCountryMismatchError into an UnprocessableEntityException', async () => {
      createLot.execute.mockRejectedValue(
        new LotCountryMismatchError('BR', 'EC'),
      );

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('should rethrow unknown errors untouched', async () => {
      const error = new Error('db down');
      createLot.execute.mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toBe(error);
    });
  });

  describe('list', () => {
    it('should derive the direction from the sort query and map the page', async () => {
      // Arrange
      const data = [buildLot({ id: 'BR-1' }), buildLot({ id: 'BR-2' })];
      listLots.execute.mockResolvedValue({
        data,
        total: 2,
        page: 1,
        pageSize: 20,
      });
      const query: ListLotsQueryDto = {
        page: 1,
        pageSize: 20,
        sort: 'storedAt:desc',
      };

      // Act
      const result = await controller.list(query);

      // Assert
      expect(listLots.execute).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        direction: 'desc',
      });
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('BR-1');
      expect(result.data[0].storedAt).toBe('2026-06-01T08:00:00.000Z');
    });
  });

  describe('getById', () => {
    it('should map the lot returned by the use case', async () => {
      getLot.execute.mockResolvedValue(buildLot());

      const result = await controller.getById('BR-2026-008');

      expect(getLot.execute).toHaveBeenCalledWith('BR-2026-008');
      expect(result.id).toBe('BR-2026-008');
    });

    it('should translate LotNotFoundError into a NotFoundException', async () => {
      getLot.execute.mockRejectedValue(new LotNotFoundError('BR-404'));

      await expect(controller.getById('BR-404')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('patchStatus', () => {
    const dto: UpdateLotStatusDto = { status: 'PERIME' };

    it('should forward the id and status and map the updated lot', async () => {
      updateLotStatus.execute.mockResolvedValue(buildLot({ status: 'PERIME' }));

      const result = await controller.patchStatus('BR-2026-008', dto);

      expect(updateLotStatus.execute).toHaveBeenCalledWith(
        'BR-2026-008',
        'PERIME',
      );
      expect(result.status).toBe('PERIME');
    });

    it('should translate LotNotFoundError into a NotFoundException', async () => {
      updateLotStatus.execute.mockRejectedValue(new LotNotFoundError('BR-404'));

      await expect(
        controller.patchStatus('BR-404', dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
