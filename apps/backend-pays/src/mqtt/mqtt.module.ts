import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CountryCode } from '@futurekawa/contracts';
import { COUNTRY_CODE } from '../config/country-code.token';
import type { Env } from '../config/env.validation';
import { MeasurementsModule } from '../measurements/measurements.module';
import { MqttMeasurementSubscriber } from '../measurements/infrastructure/mqtt-measurement.subscriber';

// Module MQTT (#28, ADR-0003). Branche le subscriber qui consomme les relevés
// IoT du pays de l'instance et les persiste via IngestMeasurementUseCase (exporté
// par MeasurementsModule). Le token COUNTRY_CODE partagé est lié ici à la valeur
// d'env, pour que le subscriber reste pur (reçoit un CountryCode, pas ConfigService).
@Module({
  imports: [MeasurementsModule],
  providers: [
    MqttMeasurementSubscriber,
    {
      provide: COUNTRY_CODE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): CountryCode =>
        config.get('COUNTRY_CODE', { infer: true }),
    },
  ],
})
export class MqttModule {}
