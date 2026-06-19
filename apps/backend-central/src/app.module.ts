import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import {
  ProblemDetailsFilter,
  buildPinoOptions,
} from '@futurekawa/nest-common';
import { AuthModule } from './auth/auth.module';
import type { Env } from './config/env.validation';
import { validateEnv } from './config/env.validation';
import { CountryBackendsModule } from './country-backends/country-backends.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        buildPinoOptions(config.get('LOG_LEVEL')),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL_MS'),
            limit: config.get('THROTTLE_LIMIT'),
          },
        ],
      }),
    }),
    PrismaModule,
    HealthModule,
    CountryBackendsModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class AppModule {}
