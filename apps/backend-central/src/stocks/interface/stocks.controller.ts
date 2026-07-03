import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import { AggregateFacetsUseCase } from '../application/aggregate-facets.use-case';
import { AggregateStocksUseCase } from '../application/aggregate-stocks.use-case';
import { StocksFacetsQueryDto } from './dto/stocks-facets-query.dto';
import { StocksFacetsResponseDto } from './dto/stocks-facets-response.dto';
import { StocksQueryDto } from './dto/stocks-query.dto';
import { StocksResponseDto } from './dto/stocks-response.dto';
import { toStockLot } from './stock-lot.mapper';

// req.id est injecté par nestjs-pino (genReqId) : c'est le correlation-id propagé.
type RequestWithId = Request & { id: string };

@ApiTags('stocks')
@Controller({ path: 'stocks', version: '1' })
export class StocksController {
  constructor(
    private readonly aggregateStocks: AggregateStocksUseCase,
    private readonly aggregateFacets: AggregateFacetsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Stocks consolidés (lots multi-pays, FIFO)',
    description:
      'Agrège les lots des backends pays (ADR-0007). Tri FIFO, pagination sur l’ensemble fusionné, réponse partielle `unavailable` si un pays est injoignable (jamais 500). Filtrable par pays.',
  })
  @ApiOkResponse({ type: StocksResponseDto })
  async list(
    @Query() query: StocksQueryDto,
    @Req() req: RequestWithId,
  ): Promise<StocksResponseDto> {
    const countries: CountryCode[] = query.country
      ? [query.country]
      : [...COUNTRY_CODES];
    // WHY: `sort` est validé par SORT_PATTERN (storedAt:asc|desc) dans le DTO.
    const direction = query.sort.split(':')[1] as 'asc' | 'desc';

    const result = await this.aggregateStocks.execute({
      countries,
      page: query.page,
      pageSize: query.pageSize,
      direction,
      correlationId: req.id,
      farm: query.farm,
      warehouse: query.warehouse,
    });
    // Mapping explicite vers le DTO siège (découplage du contrat pays).
    return { ...result, data: result.data.map(toStockLot) };
  }

  @Get('facets')
  @ApiOperation({
    summary: 'Facettes de filtrage consolidées (exploitations, entrepôts)',
    description:
      'Union dédupliquée des facettes des backends pays (CDC §III.3). Réponse ' +
      'partielle `unavailable` si un pays est injoignable (jamais 500).',
  })
  @ApiOkResponse({ type: StocksFacetsResponseDto })
  async facets(
    @Query() query: StocksFacetsQueryDto,
    @Req() req: RequestWithId,
  ): Promise<StocksFacetsResponseDto> {
    const countries: CountryCode[] = query.country
      ? [query.country]
      : [...COUNTRY_CODES];
    return this.aggregateFacets.execute({ countries, correlationId: req.id });
  }
}
