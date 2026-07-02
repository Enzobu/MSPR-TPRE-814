import { Module } from '@nestjs/common';
import { CountryBackendsModule } from '../country-backends/country-backends.module';
import { AggregateFacetsUseCase } from './application/aggregate-facets.use-case';
import { AggregateStocksUseCase } from './application/aggregate-stocks.use-case';
import { StocksCache } from './application/stocks-cache';
import { StocksController } from './interface/stocks.controller';

// Agrégation siège des stocks (lots) multi-pays (#36, ADR-0007). Consomme le
// port COUNTRY_BACKEND_GATEWAY exporté par CountryBackendsModule.
@Module({
  imports: [CountryBackendsModule],
  controllers: [StocksController],
  providers: [AggregateStocksUseCase, AggregateFacetsUseCase, StocksCache],
})
export class StocksModule {}
