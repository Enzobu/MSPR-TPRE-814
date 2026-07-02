import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CountryCode } from '@futurekawa/contracts';
import type { Env } from '../config/env.validation';
import { COUNTRY_CODE } from './application/country.token';
import { CreateLotUseCase } from './application/create-lot.use-case';
import { GetLotFacetsUseCase } from './application/get-lot-facets.use-case';
import { GetLotUseCase } from './application/get-lot.use-case';
import { ListLotsUseCase } from './application/list-lots.use-case';
import { UpdateLotStatusUseCase } from './application/update-lot-status.use-case';
import { LOT_REPOSITORY } from './domain/lot.repository';
import { PrismaLotRepository } from './infrastructure/prisma-lot.repository';
import { LotsController } from './interface/lots.controller';

// Feature Lots (CDC §III.1). Les ports (LOT_REPOSITORY, COUNTRY_CODE) sont liés
// à leurs implémentations ici ; PrismaService vient du PrismaModule global.
@Module({
  controllers: [LotsController],
  providers: [
    CreateLotUseCase,
    ListLotsUseCase,
    GetLotFacetsUseCase,
    GetLotUseCase,
    UpdateLotStatusUseCase,
    { provide: LOT_REPOSITORY, useClass: PrismaLotRepository },
    {
      provide: COUNTRY_CODE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): CountryCode =>
        config.get('COUNTRY_CODE', { infer: true }),
    },
  ],
  // LOT_REPOSITORY est exporté pour AlertsModule (cron péremption #33).
  exports: [LOT_REPOSITORY],
})
export class LotsModule {}
