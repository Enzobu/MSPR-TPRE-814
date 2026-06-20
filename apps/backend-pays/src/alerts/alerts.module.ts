import { Module } from '@nestjs/common';
import { LotsModule } from '../lots/lots.module';
import { AcknowledgeAlertUseCase } from './application/acknowledge-alert.use-case';
import { ExpireLotsUseCase } from './application/expire-lots.use-case';
import { GetAlertUseCase } from './application/get-alert.use-case';
import { ListAlertsUseCase } from './application/list-alerts.use-case';
import { RaiseMeasurementAlertsUseCase } from './application/raise-measurement-alerts.use-case';
import { ALERT_NOTIFIER } from './domain/alert-notifier';
import { ALERT_REPOSITORY } from './domain/alert.repository';
import { AppMailerModule } from './infrastructure/email/mailer.module';
import { MailerAlertNotifier } from './infrastructure/email/mailer-alert.notifier';
import { LotExpirationCron } from './infrastructure/lot-expiration.cron';
import { PrismaAlertRepository } from './infrastructure/prisma-alert.repository';
import { AlertsController } from './interface/alerts.controller';

// Feature Alerts (CDC §III.4, ADR-0004). Le port ALERT_REPOSITORY est lié à son
// implémentation Prisma ici ; PrismaService vient du PrismaModule global.
// Le use-case d'évaluation à l'ingestion (#32) est exporté pour MeasurementsModule.
// Le cron péremption (#33) consomme LOT_REPOSITORY exporté par LotsModule.
// L'API alerts (#35) expose liste/détail/acquittement via AlertsController.
const REPOSITORY_PROVIDER = {
  provide: ALERT_REPOSITORY,
  useClass: PrismaAlertRepository,
};

// Notifier email best-effort (ADR-0004, #34) consommé par les use-cases.
const NOTIFIER_PROVIDER = {
  provide: ALERT_NOTIFIER,
  useClass: MailerAlertNotifier,
};

@Module({
  imports: [LotsModule, AppMailerModule],
  controllers: [AlertsController],
  providers: [
    RaiseMeasurementAlertsUseCase,
    ExpireLotsUseCase,
    LotExpirationCron,
    ListAlertsUseCase,
    GetAlertUseCase,
    AcknowledgeAlertUseCase,
    REPOSITORY_PROVIDER,
    NOTIFIER_PROVIDER,
  ],
  exports: [RaiseMeasurementAlertsUseCase, ExpireLotsUseCase],
})
export class AlertsModule {}
