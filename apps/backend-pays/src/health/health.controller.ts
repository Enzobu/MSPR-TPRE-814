import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseHealthIndicator } from './database.health';
import { MqttHealthIndicator } from './mqtt.health';

// Exposés hors préfixe /api et hors versioning (cf. main.ts) : /health et /ready
// sont consommés par Docker Compose et un futur orchestrateur (rules/08-observability.md).
@ApiTags('health')
@Controller({ version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
    private readonly mqtt: MqttHealthIndicator,
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
      'Vérifie les dépendances critiques (base de données, broker MQTT). 503 si une dépendance est indisponible.',
  })
  @ApiResponse({
    status: 200,
    description: 'Toutes les dépendances sont prêtes.',
  })
  @ApiResponse({
    status: 503,
    description: 'Au moins une dépendance est indisponible.',
  })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.database.isHealthy('database'),
      () => this.mqtt.isHealthy('mqtt'),
    ]);
  }
}
