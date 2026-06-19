import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AggregateMeasurementsUseCase } from '../application/aggregate-measurements.use-case';
import { GetMeasurementHistoryUseCase } from '../application/get-measurement-history.use-case';
import { AggregateMeasurementsQueryDto } from './dto/aggregate-measurements-query.dto';
import { MeasurementBucketResponseDto } from './dto/measurement-bucket-response.dto';
import { MeasurementHistoryQueryDto } from './dto/measurement-history-query.dto';
import { PaginatedMeasurementsResponseDto } from './dto/paginated-measurements-response.dto';
import { toBucketResponse, toMeasurementResponse } from './measurement.mapper';

@ApiTags('measurements')
@Controller({ path: 'measurements', version: '1' })
export class MeasurementsController {
  constructor(
    private readonly getHistory: GetMeasurementHistoryUseCase,
    private readonly aggregate: AggregateMeasurementsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Historique des relevés d'un entrepôt (paginé)",
    description:
      'Relevés T°/humidité triés par date décroissante (plus récent d’abord). `warehouse` requis ; `from`/`to` bornent la plage (ISO 8601).',
  })
  @ApiOkResponse({ type: PaginatedMeasurementsResponseDto })
  async list(
    @Query() query: MeasurementHistoryQueryDto,
  ): Promise<PaginatedMeasurementsResponseDto> {
    const result = await this.getHistory.execute({
      warehouse: query.warehouse,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });
    return { ...result, data: result.data.map(toMeasurementResponse) };
  }

  @Get('aggregate')
  @ApiOperation({
    summary: "Agrégat T°/humidité d'un entrepôt par fenêtre temporelle",
    description:
      'Moyennes T°/humidité groupées par fenêtre (`bucket` ∈ {1h, 1d}), triées chronologiquement. `warehouse` et `bucket` requis ; `from`/`to` optionnels.',
  })
  @ApiOkResponse({ type: [MeasurementBucketResponseDto] })
  async aggregateHistory(
    @Query() query: AggregateMeasurementsQueryDto,
  ): Promise<MeasurementBucketResponseDto[]> {
    const buckets = await this.aggregate.execute({
      warehouse: query.warehouse,
      bucket: query.bucket,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
    return buckets.map(toBucketResponse);
  }
}
