import { Module } from '@nestjs/common';
import { LotsModule } from '../lots/lots.module';
import { ExpireLotsUseCase } from './application/expire-lots.use-case';
import { RaiseMeasurementAlertsUseCase } from './application/raise-measurement-alerts.use-case';
import { ALERT_REPOSITORY } from './domain/alert.repository';
import { LotExpirationCron } from './infrastructure/lot-expiration.cron';
import { PrismaAlertRepository } from './infrastructure/prisma-alert.repository';

// Feature Alerts (CDC §III.4, ADR-0004). Le port ALERT_REPOSITORY est lié à son
// implémentation Prisma ici ; PrismaService vient du PrismaModule global.
// Le use-case d'évaluation à l'ingestion (#32) est exporté pour MeasurementsModule.
// Le cron péremption (#33) consomme LOT_REPOSITORY exporté par LotsModule.
// L'envoi d'email (#34) et l'API alerts (#35) sont hors scope pour l'instant.
const REPOSITORY_PROVIDER = {
  provide: ALERT_REPOSITORY,
  useClass: PrismaAlertRepository,
};

@Module({
  imports: [LotsModule],
  providers: [
    RaiseMeasurementAlertsUseCase,
    ExpireLotsUseCase,
    LotExpirationCron,
    REPOSITORY_PROVIDER,
  ],
  exports: [RaiseMeasurementAlertsUseCase, ExpireLotsUseCase],
})
export class AlertsModule {}
