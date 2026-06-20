import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule } from '@sentry/nestjs/setup';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import {
  ProblemDetailsFilter,
  buildPinoOptions,
} from '@futurekawa/nest-common';
import type { Env } from './config/env.validation';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { LotsModule } from './lots/lots.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { MqttModule } from './mqtt/mqtt.module';

@Module({
  imports: [
    // En premier : branche Sentry sur le cycle de requête Nest (contexte/erreurs).
    // No-op si SENTRY_DSN absent (src/instrument.ts n'a pas initialisé le SDK).
    SentryModule.forRoot(),
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
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    LotsModule,
    MeasurementsModule,
    MqttModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class AppModule {}
