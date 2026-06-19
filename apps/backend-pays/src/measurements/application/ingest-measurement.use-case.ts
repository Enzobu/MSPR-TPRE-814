import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RaiseMeasurementAlertsUseCase } from '../../alerts/application/raise-measurement-alerts.use-case';
import type { Measurement, NewMeasurement } from '../domain/measurement';
import { MEASUREMENT_REPOSITORY } from '../domain/measurement.repository';
import type { MeasurementRepository } from '../domain/measurement.repository';

// Persiste un relevé validé. Point d'entrée unique de l'ingestion, partagé par
// le subscriber MQTT (#28) et le fallback REST POST /api/v1/measurements. La
// validation des plages/format vit en amont (DTO REST + parsing MQTT) ; ce
// use-case suppose un NewMeasurement déjà valide. Après persistance, déclenche
// l'évaluation d'alertes (#32) en best-effort : son échec ne fait jamais
// échouer l'ingestion (ADR-0004 — alerting best-effort vis-à-vis de l'ingestion).
@Injectable()
export class IngestMeasurementUseCase {
  constructor(
    @Inject(MEASUREMENT_REPOSITORY)
    private readonly measurements: MeasurementRepository,
    private readonly raiseAlerts: RaiseMeasurementAlertsUseCase,
    @InjectPinoLogger(IngestMeasurementUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(input: NewMeasurement): Promise<Measurement> {
    const measurement = await this.measurements.save(input);
    await this.evaluateAlerts(measurement);
    return measurement;
  }

  private async evaluateAlerts(measurement: Measurement): Promise<void> {
    try {
      await this.raiseAlerts.execute({
        country: measurement.country,
        warehouse: measurement.warehouse,
        temperatureCelsius: measurement.temperatureCelsius,
        humidityPercent: measurement.humidityPercent,
      });
    } catch (error: unknown) {
      this.logger.warn(
        { err: error, warehouse: measurement.warehouse },
        "Évaluation d'alertes échouée (ingestion conservée)",
      );
    }
  }
}
