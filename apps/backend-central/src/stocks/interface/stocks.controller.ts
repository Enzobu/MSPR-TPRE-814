import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import { AggregateStocksUseCase } from '../application/aggregate-stocks.use-case';
import { StocksQueryDto } from './dto/stocks-query.dto';
import { StocksResponseDto } from './dto/stocks-response.dto';
import { toStockLot } from './stock-lot.mapper';

// req.id est injecté par nestjs-pino (genReqId) : c'est le correlation-id propagé.
type RequestWithId = Request & { id: string };

@ApiTags('stocks')
@Controller({ path: 'stocks', version: '1' })
export class StocksController {
  constructor(private readonly aggregateStocks: AggregateStocksUseCase) {}

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
    });
    // Mapping explicite vers le DTO siège (découplage du contrat pays).
    return { ...result, data: result.data.map(toStockLot) };
  }
}
