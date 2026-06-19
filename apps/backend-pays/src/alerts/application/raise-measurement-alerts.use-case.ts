import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { CountryCode } from '@futurekawa/contracts';
import { COUNTRY_CONDITIONS } from '@futurekawa/contracts';
import { evaluateMeasurement } from '../domain/alert-rule';
import type { AlertEvaluation } from '../domain/alert-rule';
import { ALERT_NOTIFIER } from '../domain/alert-notifier';
import type { AlertNotifier } from '../domain/alert-notifier';
import { ALERT_REPOSITORY } from '../domain/alert.repository';
import type { AlertRepository } from '../domain/alert.repository';
import { startOfDayUtc } from '../domain/day';

export interface MeasurementForAlerting {
  country: CountryCode;
  warehouse: string;
  temperatureCelsius: number;
  humidityPercent: number;
}

// Évalue une mesure (ADR-0004), déduplique par (type, entrepôt, jour UTC) et
// persiste les alertes manquantes. Déclenché à chaque ingestion (MQTT + REST).
@Injectable()
export class RaiseMeasurementAlertsUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY) private readonly alerts: AlertRepository,
    @Inject(ALERT_NOTIFIER) private readonly notifier: AlertNotifier,
    @InjectPinoLogger(RaiseMeasurementAlertsUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(measurement: MeasurementForAlerting): Promise<void> {
    const evaluations = evaluateMeasurement(
      measurement,
      COUNTRY_CONDITIONS[measurement.country],
    );
    if (evaluations.length === 0) {
      return;
    }

    const now = new Date();
    const dayUtc = startOfDayUtc(now);
    for (const evaluation of evaluations) {
      await this.persistIfNew(measurement, evaluation, now, dayUtc);
    }
  }

  private async persistIfNew(
    measurement: MeasurementForAlerting,
    evaluation: AlertEvaluation,
    triggeredAt: Date,
    dayUtc: Date,
  ): Promise<void> {
    const alreadyRaised = await this.alerts.existsForWarehouseOnDay(
      evaluation.type,
      measurement.warehouse,
      dayUtc,
    );
    if (alreadyRaised) {
      return;
    }

    const alert = await this.alerts.save({
      country: measurement.country,
      type: evaluation.type,
      message: evaluation.message,
      warehouse: measurement.warehouse,
      triggeredAt,
    });
    this.logger.warn(
      { type: evaluation.type, warehouse: measurement.warehouse },
      'Alerte levée',
    );
    // Notification best-effort (ADR-0004) : ne throw jamais, n'attend rien de
    // critique côté ingestion.
    await this.notifier.notify(alert);
  }
}
