import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseHealthIndicator } from './database.health';

// /health et /ready exposés hors préfixe /api et hors versioning (cf. main.ts).
// La readiness ne vérifie QUE la DB siège : un backend pays down ne doit pas
// rendre le central « not ready » (agrégation best-effort, ADR-0007).
@ApiTags('health')
@Controller({ version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
  ) {}

  @Get('health')
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Le process répond. Ne vérifie aucune dépendance externe.',
  })
  @ApiResponse({ status: 200, description: 'Le service est vivant.' })
  liveness(): HealthCheckResult {
    return { status: 'ok', info: {}, error: {}, details: {} };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Vérifie la base de données du siège. 503 si elle est indisponible. Les backends pays ne sont pas vérifiés ici (agrégation best-effort).',
  })
  @ApiResponse({ status: 200, description: 'La base du siège est prête.' })
  @ApiResponse({
    status: 503,
    description: 'La base du siège est indisponible.',
  })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([() => this.database.isHealthy('database')]);
  }
}
