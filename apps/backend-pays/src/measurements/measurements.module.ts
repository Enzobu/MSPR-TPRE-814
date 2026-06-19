import { Module } from '@nestjs/common';
import { AggregateMeasurementsUseCase } from './application/aggregate-measurements.use-case';
import { GetMeasurementHistoryUseCase } from './application/get-measurement-history.use-case';
import { MEASUREMENT_REPOSITORY } from './domain/measurement.repository';
import { PrismaMeasurementRepository } from './infrastructure/prisma-measurement.repository';
import { MeasurementsController } from './interface/measurements.controller';

// Feature Measurements (CDC §III.2). Le port MEASUREMENT_REPOSITORY est lié à
// son implémentation Prisma ici ; PrismaService vient du PrismaModule global.
// L'ingestion (POST) n'existe pas : les mesures arrivent par MQTT (#28).
@Module({
  controllers: [MeasurementsController],
  providers: [
    GetMeasurementHistoryUseCase,
    AggregateMeasurementsUseCase,
    {
      provide: MEASUREMENT_REPOSITORY,
      useClass: PrismaMeasurementRepository,
    },
  ],
})
export class MeasurementsModule {}
