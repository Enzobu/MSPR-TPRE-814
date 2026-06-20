import { Module } from '@nestjs/common';
import { CountryBackendsModule } from '../country-backends/country-backends.module';
import { AcknowledgeAlertUseCase } from './application/acknowledge-alert.use-case';
import { ListAlertsUseCase } from './application/list-alerts.use-case';
import { AlertsController } from './interface/alerts.controller';

// Agrégation siège des alertes multi-pays + proxy d'ACK (#36, ADR-0007).
// Consomme le port COUNTRY_BACKEND_GATEWAY exporté par CountryBackendsModule.
// Pas de cache : alertes dynamiques + mutation par ACK.
@Module({
  imports: [CountryBackendsModule],
  controllers: [AlertsController],
  providers: [ListAlertsUseCase, AcknowledgeAlertUseCase],
})
export class AlertsModule {}
