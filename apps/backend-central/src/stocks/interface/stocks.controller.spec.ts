import type { Request } from 'express';
import type { ConsolidatedResponse, Lot } from '@futurekawa/contracts';
import type { AggregateStocksUseCase } from '../application/aggregate-stocks.use-case';
import { StocksController } from './stocks.controller';
import type { StocksQueryDto } from './dto/stocks-query.dto';

type RequestWithId = Request & { id: string };

const req = { id: 'corr-1' } as RequestWithId;

function buildLot(): Lot {
  return {
    id: 'lot-1',
    country: 'BR',
    farm: 'farm-1',
    warehouse: 'wh-1',
    storedAt: '2026-01-01T00:00:00.000Z',
    status: 'CONFORME',
  };
}

describe('StocksController', () => {
  describe('list', () => {
    it('should aggregate all three countries when no country filter is given', async () => {
      // Arrange
      const result: ConsolidatedResponse<Lot> = {
        data: [buildLot()],
        total: 1,
        page: 1,
        pageSize: 20,
        unavailable: [],
      };
      const execute = jest.fn().mockResolvedValue(result);
      const aggregateStocks = { execute } as unknown as AggregateStocksUseCase;
      const controller = new StocksController(aggregateStocks);
      const query = {
        page: 1,
        pageSize: 20,
        sort: 'storedAt:asc',
      } as StocksQueryDto;

      // Act
      const response = await controller.list(query, req);

      // Assert
      expect(execute).toHaveBeenCalledWith({
        countries: ['BR', 'EC', 'CO'],
        page: 1,
        pageSize: 20,
        direction: 'asc',
        correlationId: 'corr-1',
      });
      expect(response).toEqual({
        data: [
          {
            id: 'lot-1',
            country: 'BR',
            farm: 'farm-1',
            warehouse: 'wh-1',
            storedAt: '2026-01-01T00:00:00.000Z',
            status: 'CONFORME',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        unavailable: [],
      });
    });

    it('should restrict to a single country and parse the desc direction from sort', async () => {
      // Arrange
      const result: ConsolidatedResponse<Lot> = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        unavailable: [],
      };
      const execute = jest.fn().mockResolvedValue(result);
      const aggregateStocks = { execute } as unknown as AggregateStocksUseCase;
      const controller = new StocksController(aggregateStocks);
      const query = {
        country: 'CO',
        page: 1,
        pageSize: 20,
        sort: 'storedAt:desc',
      } as StocksQueryDto;

      // Act
      await controller.list(query, req);

      // Assert
      expect(execute).toHaveBeenCalledWith({
        countries: ['CO'],
        page: 1,
        pageSize: 20,
        direction: 'desc',
        correlationId: 'corr-1',
      });
    });

    it('should relay a partial unavailable response without throwing', async () => {
      // Arrange
      const result: ConsolidatedResponse<Lot> = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        unavailable: ['EC'],
      };
      const aggregateStocks = {
        execute: jest.fn().mockResolvedValue(result),
      } as unknown as AggregateStocksUseCase;
      const controller = new StocksController(aggregateStocks);
      const query = {
        page: 1,
        pageSize: 20,
        sort: 'storedAt:asc',
      } as StocksQueryDto;

      // Act
      const response = await controller.list(query, req);

      // Assert
      expect(response.unavailable).toEqual(['EC']);
      expect(response.data).toEqual([]);
    });
  });
});
