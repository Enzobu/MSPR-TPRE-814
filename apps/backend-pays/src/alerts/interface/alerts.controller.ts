import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AcknowledgeAlertUseCase } from '../application/acknowledge-alert.use-case';
import { GetAlertUseCase } from '../application/get-alert.use-case';
import { ListAlertsUseCase } from '../application/list-alerts.use-case';
import { AlertNotFoundError } from '../domain/alert.errors';
import { AlertResponseDto } from './dto/alert-response.dto';
import { ListAlertsQueryDto } from './dto/list-alerts-query.dto';
import { PaginatedAlertsResponseDto } from './dto/paginated-alerts-response.dto';
import { toAlertResponse } from './alert.mapper';

@ApiTags('alerts')
@Controller({ path: 'alerts', version: '1' })
export class AlertsController {
  constructor(
    private readonly listAlerts: ListAlertsUseCase,
    private readonly getAlert: GetAlertUseCase,
    private readonly acknowledgeAlert: AcknowledgeAlertUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Liste les alertes (récentes d’abord, paginé)',
    description:
      'Tri par défaut : `triggeredAt` décroissant. Filtres optionnels `type` et `acknowledged`. Pagination `{ data, total, page, pageSize }`.',
  })
  @ApiOkResponse({ type: PaginatedAlertsResponseDto })
  async list(
    @Query() query: ListAlertsQueryDto,
  ): Promise<PaginatedAlertsResponseDto> {
    const result = await this.listAlerts.execute({
      type: query.type,
      acknowledged: query.acknowledged,
      page: query.page,
      pageSize: query.pageSize,
      country: query.country,
    });
    return { ...result, data: result.data.map(toAlertResponse) };
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une alerte" })
  @ApiParam({ name: 'id', example: 'clz9x2k4p0000abcd1234efgh' })
  @ApiOkResponse({ type: AlertResponseDto })
  @ApiNotFoundResponse({ description: 'Alerte inconnue (RFC 7807).' })
  async getById(@Param('id') id: string): Promise<AlertResponseDto> {
    try {
      return toAlertResponse(await this.getAlert.execute(id));
    } catch (error) {
      this.rethrowAsHttp(error);
    }
  }

  @Patch(':id/acknowledge')
  @ApiOperation({
    summary: 'Acquitte une alerte',
    description: 'Passe `acknowledged` à `true`. Idempotent.',
  })
  @ApiParam({ name: 'id', example: 'clz9x2k4p0000abcd1234efgh' })
  @ApiOkResponse({ type: AlertResponseDto })
  @ApiNotFoundResponse({ description: 'Alerte inconnue (RFC 7807).' })
  async acknowledge(@Param('id') id: string): Promise<AlertResponseDto> {
    try {
      return toAlertResponse(await this.acknowledgeAlert.execute(id));
    } catch (error) {
      this.rethrowAsHttp(error);
    }
  }

  // Traduit les erreurs métier en HttpException ; le ProblemDetailsFilter global
  // les normalise ensuite en RFC 7807. Toute autre erreur remonte (→ 500).
  private rethrowAsHttp(error: unknown): never {
    if (error instanceof AlertNotFoundError) {
      throw new NotFoundException(error.message);
    }
    throw error;
  }
}
