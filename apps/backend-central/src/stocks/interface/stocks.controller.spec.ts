import type { Request } from 'express';
import type { ConsolidatedResponse, Lot } from '@futurekawa/contracts';
import type { AggregateFacetsUseCase } from '../application/aggregate-facets.use-case';
import type { AggregateStocksUseCase } from '../application/aggregate-stocks.use-case';
import { StocksController } from './stocks.controller';
import type { StocksFacetsQueryDto } from './dto/stocks-facets-query.dto';
import type { StocksQueryDto } from './dto/stocks-query.dto';

type RequestWithId = Request & { id: string };

const req = { id: 'corr-1' } as RequestWithId;

// Stub de facettes injecté aux tests de `list` (non utilisé par ces cas).
const facetsStub = {
  execute: jest.fn(),
} as unknown as AggregateFacetsUseCase;

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
      const controller = new StocksController(aggregateStocks, facetsStub);
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
      const controller = new StocksController(aggregateStocks, facetsStub);
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
      const controller = new StocksController(aggregateStocks, facetsStub);
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

    it('should forward the farm and warehouse filters to the use case', async () => {
      const execute = jest.fn().mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        unavailable: [],
      });
      const aggregateStocks = { execute } as unknown as AggregateStocksUseCase;
      const controller = new StocksController(aggregateStocks, facetsStub);
      const query = {
        page: 1,
        pageSize: 20,
        sort: 'storedAt:asc',
        farm: 'Fazenda Aurora',
        warehouse: 'Entrepôt Santos',
      } as StocksQueryDto;

      await controller.list(query, req);

      expect(execute).toHaveBeenCalledWith(
        expect.objectContaining({
          farm: 'Fazenda Aurora',
          warehouse: 'Entrepôt Santos',
        }),
      );
    });
  });

  describe('facets', () => {
    it('should consolidate facets across all countries by default', async () => {
      const execute = jest.fn().mockResolvedValue({
        farms: ['Fazenda Aurora'],
        warehouses: ['Entrepôt Santos'],
        unavailable: [],
      });
      const aggregateFacets = { execute } as unknown as AggregateFacetsUseCase;
      const controller = new StocksController(
        { execute: jest.fn() } as unknown as AggregateStocksUseCase,
        aggregateFacets,
      );
      const query = {} as StocksFacetsQueryDto;

      const response = await controller.facets(query, req);

      expect(execute).toHaveBeenCalledWith({
        countries: ['BR', 'EC', 'CO'],
        correlationId: 'corr-1',
      });
      expect(response.farms).toEqual(['Fazenda Aurora']);
      expect(response.unavailable).toEqual([]);
    });
  });
});
