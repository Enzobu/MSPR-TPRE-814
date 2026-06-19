import {
  Controller,
  Get,
  HttpException,
  Param,
  Patch,
  Query,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import {
  CountryRequestError,
  CountryUnavailableError,
} from '../../country-backends/domain/country-backend.gateway';
import { AcknowledgeAlertUseCase } from '../application/acknowledge-alert.use-case';
import { ListAlertsUseCase } from '../application/list-alerts.use-case';
import { AcknowledgeAlertQueryDto } from './dto/acknowledge-alert-query.dto';
import { AlertsQueryDto } from './dto/alerts-query.dto';
import {
  AlertDto,
  ConsolidatedAlertsResponseDto,
} from './dto/alerts-response.dto';
import { toAlert } from './alert.mapper';

// req.id est injecté par nestjs-pino (genReqId) : c'est le correlation-id propagé.
type RequestWithId = Request & { id: string };

@ApiTags('alerts')
@Controller({ path: 'alerts', version: '1' })
export class AlertsController {
  constructor(
    private readonly listAlerts: ListAlertsUseCase,
    private readonly acknowledgeAlert: AcknowledgeAlertUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Alertes consolidées (multi-pays, récentes d’abord)',
    description:
      'Agrège les alertes des backends pays (ADR-0007). Tri `triggeredAt` décroissant, pagination sur l’ensemble fusionné, réponse partielle `unavailable` si un pays est injoignable (jamais 500). Filtrable par pays, type et acquittement.',
  })
  @ApiOkResponse({ type: ConsolidatedAlertsResponseDto })
  async list(
    @Query() query: AlertsQueryDto,
    @Req() req: RequestWithId,
  ): Promise<ConsolidatedAlertsResponseDto> {
    const countries: CountryCode[] = query.country
      ? [query.country]
      : [...COUNTRY_CODES];

    const result = await this.listAlerts.execute({
      countries,
      type: query.type,
      acknowledged: query.acknowledged,
      page: query.page,
      pageSize: query.pageSize,
      correlationId: req.id,
    });
    // Mapping explicite vers le DTO siège (découplage du contrat pays).
    return { ...result, data: result.data.map(toAlert) };
  }

  @Patch(':id/acknowledge')
  @ApiOperation({
    summary: 'Acquitte une alerte (proxy vers le pays propriétaire)',
    description:
      'Relaie l’acquittement vers le backend pays propriétaire (ADR-0007). `country` est requis (écriture ciblée). Alerte inconnue côté pays → 404 ; pays injoignable → 503 (jamais une fausse confirmation).',
  })
  @ApiParam({ name: 'id', example: 'clz9x2k4p0000abcd1234efgh' })
  @ApiOkResponse({ type: AlertDto })
  @ApiNotFoundResponse({ description: 'Alerte inconnue côté pays (RFC 7807).' })
  @ApiServiceUnavailableResponse({
    description: 'Pays propriétaire injoignable (RFC 7807).',
  })
  async acknowledge(
    @Param('id') id: string,
    @Query() query: AcknowledgeAlertQueryDto,
    @Req() req: RequestWithId,
  ): Promise<AlertDto> {
    try {
      const alert = await this.acknowledgeAlert.execute({
        country: query.country,
        id,
        correlationId: req.id,
      });
      return toAlert(alert);
    } catch (error) {
      this.rethrowAsHttp(error);
    }
  }

  // Traduit les erreurs du gateway en HttpException ; le ProblemDetailsFilter
  // global les normalise en RFC 7807. Un 4xx pays remonte tel quel (404 → 404) ;
  // une indisponibilité (5xx/réseau/breaker) devient 503. Le reste → 500.
  private rethrowAsHttp(error: unknown): never {
    if (error instanceof CountryRequestError) {
      throw new HttpException(error.message, error.status);
    }
    if (error instanceof CountryUnavailableError) {
      throw new ServiceUnavailableException(error.message);
    }
    throw error;
  }
}
