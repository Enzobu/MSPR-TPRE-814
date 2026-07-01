import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AggregateCountryMeasurementsUseCase } from '../application/aggregate-country-measurements.use-case';
import { GetCountryMeasurementsUseCase } from '../application/get-country-measurements.use-case';
import { GetLatestMeasurementsUseCase } from '../application/get-latest-measurements.use-case';
import { MeasurementsAggregateQueryDto } from './dto/measurements-aggregate-query.dto';
import { ConsolidatedBucketsResponseDto } from './dto/measurements-aggregate-response.dto';
import { ConsolidatedLatestMeasurementsResponseDto } from './dto/latest-measurements-response.dto';
import { MeasurementsQueryDto } from './dto/measurements-query.dto';
import { ConsolidatedMeasurementsResponseDto } from './dto/measurements-response.dto';
import { toBucket, toMeasurement } from './measurement.mapper';

// req.id est injecté par nestjs-pino (genReqId) : c'est le correlation-id propagé.
type RequestWithId = Request & { id: string };

@ApiTags('measurements')
@Controller({ path: 'measurements', version: '1' })
export class MeasurementsController {
  constructor(
    private readonly getMeasurements: GetCountryMeasurementsUseCase,
    private readonly aggregateMeasurements: AggregateCountryMeasurementsUseCase,
    private readonly getLatestMeasurements: GetLatestMeasurementsUseCase,
  ) {}

  @Get('latest')
  @ApiOperation({
    summary: 'Dernier relevé par région (consolidé multi-pays)',
    description:
      'Agrège le dernier relevé de chaque pays (fan-out résilient, ADR-0007). ' +
      'Un pays sans relevé est absent de `data` ; un pays injoignable figure ' +
      'dans `unavailable` (jamais 500). Alimente la vue monitoring du siège.',
  })
  @ApiOkResponse({ type: ConsolidatedLatestMeasurementsResponseDto })
  async latest(
    @Req() req: RequestWithId,
  ): Promise<ConsolidatedLatestMeasurementsResponseDto> {
    const result = await this.getLatestMeasurements.execute({
      correlationId: req.id,
    });
    // Mapping explicite vers le DTO siège (découplage du contrat pays).
    return { ...result, data: result.data.map(toMeasurement) };
  }

  @Get()
  @ApiOperation({
    summary: "Historique des mesures d'un entrepôt (proxy mono-pays résilient)",
    description:
      "Relaie l'historique paginé du backend pays (ADR-0007). Une mesure appartient à UN pays/entrepôt : `country` et `warehouse` sont requis. Pays injoignable → page vide + `unavailable: [country]` (jamais 500).",
  })
  @ApiOkResponse({ type: ConsolidatedMeasurementsResponseDto })
  async list(
    @Query() query: MeasurementsQueryDto,
    @Req() req: RequestWithId,
  ): Promise<ConsolidatedMeasurementsResponseDto> {
    const result = await this.getMeasurements.execute({
      country: query.country,
      warehouse: query.warehouse,
      from: query.from,
      to: query.to,
      page: query.page,
      pageSize: query.pageSize,
      correlationId: req.id,
    });
    // Mapping explicite vers le DTO siège (découplage du contrat pays).
    return { ...result, data: result.data.map(toMeasurement) };
  }

  @Get('aggregate')
  @ApiOperation({
    summary: "Moyennes T°/humidité par fenêtre d'un entrepôt (proxy résilient)",
    description:
      'Relaie les moyennes agrégées (1h / 1d) du backend pays (ADR-0007). Pays injoignable → liste vide + `unavailable: [country]` (jamais 500).',
  })
  @ApiOkResponse({ type: ConsolidatedBucketsResponseDto })
  async aggregate(
    @Query() query: MeasurementsAggregateQueryDto,
    @Req() req: RequestWithId,
  ): Promise<ConsolidatedBucketsResponseDto> {
    const result = await this.aggregateMeasurements.execute({
      country: query.country,
      warehouse: query.warehouse,
      bucket: query.bucket,
      from: query.from,
      to: query.to,
      correlationId: req.id,
    });
    return { ...result, data: result.data.map(toBucket) };
  }
}
