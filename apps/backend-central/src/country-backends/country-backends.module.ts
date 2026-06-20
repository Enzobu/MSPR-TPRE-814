import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { COUNTRY_BACKEND_GATEWAY } from './domain/country-backend.gateway';
import { HttpCountryBackendGateway } from './infrastructure/http-country-backend.gateway';
import { CountryPingController } from './interface/country-ping.controller';

// Expose le port CountryBackendGateway (ADR-0007). Les futures features
// d'agrégation injectent COUNTRY_BACKEND_GATEWAY, jamais l'adapter directement.
@Module({
  imports: [HttpModule],
  controllers: [CountryPingController],
  providers: [
    {
      provide: COUNTRY_BACKEND_GATEWAY,
      useClass: HttpCountryBackendGateway,
    },
  ],
  exports: [COUNTRY_BACKEND_GATEWAY],
})
export class CountryBackendsModule {}
