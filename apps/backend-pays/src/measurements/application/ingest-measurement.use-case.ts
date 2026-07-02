import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { COUNTRY_CONDITIONS } from '@futurekawa/contracts';
import { evaluateMeasurement } from '../../alerts/domain/alert-rule';
import { RaiseMeasurementAlertsUseCase } from '../../alerts/application/raise-measurement-alerts.use-case';
import { SyncWarehouseLotStatusUseCase } from '../../lots/application/sync-warehouse-lot-status.use-case';
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
    private readonly syncLotStatus: SyncWarehouseLotStatusUseCase,
    @InjectPinoLogger(IngestMeasurementUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(input: NewMeasurement): Promise<Measurement> {
    const measurement = await this.measurements.save(input);
    await this.evaluateAlerts(measurement);
    await this.reflectOnLotStatus(measurement);
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

  // Reflète l'état de l'entrepôt sur ses lots (#151, ADR-0013), best-effort :
  // hors plage → CONFORME devient EN_ALERTE ; retour dans la plage → EN_ALERTE
  // revient CONFORME. Un échec ne fait jamais échouer l'ingestion.
  private async reflectOnLotStatus(measurement: Measurement): Promise<void> {
    try {
      const outOfRange =
        evaluateMeasurement(
          measurement,
          COUNTRY_CONDITIONS[measurement.country],
        ).length > 0;
      await this.syncLotStatus.execute({
        country: measurement.country,
        warehouse: measurement.warehouse,
        outOfRange,
      });
    } catch (error: unknown) {
      this.logger.warn(
        { err: error, warehouse: measurement.warehouse },
        'Sync du statut des lots échouée (ingestion conservée)',
      );
    }
  }
}
