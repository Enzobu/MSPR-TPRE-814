import { Module } from '@nestjs/common';
import { RaiseMeasurementAlertsUseCase } from './application/raise-measurement-alerts.use-case';
import { ALERT_REPOSITORY } from './domain/alert.repository';
import { PrismaAlertRepository } from './infrastructure/prisma-alert.repository';

// Feature Alerts (CDC §III.4, ADR-0004). Le port ALERT_REPOSITORY est lié à son
// implémentation Prisma ici ; PrismaService vient du PrismaModule global.
// Le use-case d'évaluation à l'ingestion (#32) est exporté pour MeasurementsModule.
// L'envoi d'email (#34), le cron péremption (#33) et l'API alerts (#35) sont
// hors scope de ce module pour l'instant.
const REPOSITORY_PROVIDER = {
  provide: ALERT_REPOSITORY,
  useClass: PrismaAlertRepository,
};

@Module({
  providers: [RaiseMeasurementAlertsUseCase, REPOSITORY_PROVIDER],
  exports: [RaiseMeasurementAlertsUseCase],
})
export class AlertsModule {}
