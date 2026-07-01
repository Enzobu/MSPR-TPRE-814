import { Module } from '@nestjs/common';
import { CountryBackendsModule } from '../country-backends/country-backends.module';
import { AggregateCountryMeasurementsUseCase } from './application/aggregate-country-measurements.use-case';
import { GetCountryMeasurementsUseCase } from './application/get-country-measurements.use-case';
import { GetLatestMeasurementsUseCase } from './application/get-latest-measurements.use-case';
import { MeasurementsController } from './interface/measurements.controller';

// Proxy siège résilient des mesures (partie de #36, ADR-0007). Mono-pays (une
// mesure appartient à UN pays) mais avec la garantie partial-response : jamais
// 500 si le pays est down. Consomme le port COUNTRY_BACKEND_GATEWAY.
@Module({
  imports: [CountryBackendsModule],
  controllers: [MeasurementsController],
  providers: [
    GetCountryMeasurementsUseCase,
    AggregateCountryMeasurementsUseCase,
    GetLatestMeasurementsUseCase,
  ],
})
export class MeasurementsModule {}
