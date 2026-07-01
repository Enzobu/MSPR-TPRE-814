import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CountryCode } from '@futurekawa/contracts';
import { AlertsModule } from '../alerts/alerts.module';
import { COUNTRY_CODE } from '../config/country-code.token';
import type { Env } from '../config/env.validation';
import { AggregateMeasurementsUseCase } from './application/aggregate-measurements.use-case';
import { GetLatestMeasurementUseCase } from './application/get-latest-measurement.use-case';
import { GetMeasurementHistoryUseCase } from './application/get-measurement-history.use-case';
import { IngestMeasurementUseCase } from './application/ingest-measurement.use-case';
import { MEASUREMENT_REPOSITORY } from './domain/measurement.repository';
import { PrismaMeasurementRepository } from './infrastructure/prisma-measurement.repository';
import { MeasurementsController } from './interface/measurements.controller';

// Feature Measurements (CDC §III.2). Le port MEASUREMENT_REPOSITORY est lié à
// son implémentation Prisma ici ; PrismaService vient du PrismaModule global.
// L'ingestion (MQTT #28 + fallback REST POST) passe par IngestMeasurementUseCase,
// exporté (avec le port) pour le MqttModule. Le token COUNTRY_CODE est lié ici
// pour le fallback REST (le `country` n'est jamais dans le body).
const REPOSITORY_PROVIDER = {
  provide: MEASUREMENT_REPOSITORY,
  useClass: PrismaMeasurementRepository,
};

const COUNTRY_CODE_PROVIDER = {
  provide: COUNTRY_CODE,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): CountryCode =>
    config.get('COUNTRY_CODE', { infer: true }),
};

@Module({
  imports: [AlertsModule],
  controllers: [MeasurementsController],
  providers: [
    GetMeasurementHistoryUseCase,
    AggregateMeasurementsUseCase,
    GetLatestMeasurementUseCase,
    IngestMeasurementUseCase,
    REPOSITORY_PROVIDER,
    COUNTRY_CODE_PROVIDER,
  ],
  exports: [IngestMeasurementUseCase, REPOSITORY_PROVIDER],
})
export class MeasurementsModule {}
