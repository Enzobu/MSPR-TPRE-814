import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, IClientOptions, MqttClient } from 'mqtt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { measurementSubscriptionTopic } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import type { Env } from '../../config/env.validation';
import { COUNTRY_CODE } from '../../config/country-code.token';
import { IngestMeasurementUseCase } from '../application/ingest-measurement.use-case';
import { parseMeasurementMessage } from './measurement-message.parser';

const RECONNECT_PERIOD_MS = 2000;
const CONNECT_TIMEOUT_MS = 5000;
const MEASUREMENT_QOS = 1;

// Subscriber MQTT (ADR-0003) : s'abonne au pays de l'instance, valide et persiste
// chaque relevé via IngestMeasurementUseCase. Le boot ne bloque pas si le broker
// est down : auto-reconnexion (reconnectPeriod > 0), aucun throw qui casse le
// démarrage. Tout message invalide est droppé (warn), jamais de crash.
@Injectable()
export class MqttMeasurementSubscriber
  implements OnModuleInit, OnModuleDestroy
{
  private client?: MqttClient;
  private persisted = 0;
  private dropped = 0;

  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(COUNTRY_CODE) private readonly country: CountryCode,
    private readonly ingest: IngestMeasurementUseCase,
    @InjectPinoLogger(MqttMeasurementSubscriber.name)
    private readonly logger: PinoLogger,
  ) {}

  // Options de connexion extraites pour être assertables en test (reconnectPeriod
  // > 0 garantit l'auto-reconnexion exigée par ADR-0003 si le broker redémarre).
  buildClientOptions(): IClientOptions {
    return {
      username: this.config.get('MQTT_USERNAME'),
      password: this.config.get('MQTT_PASSWORD'),
      clientId: `${this.config.get('MQTT_CLIENT_ID')}-sub`,
      reconnectPeriod: RECONNECT_PERIOD_MS,
      connectTimeout: CONNECT_TIMEOUT_MS,
    };
  }

  onModuleInit(): void {
    const topic = measurementSubscriptionTopic(this.country);
    const client = connect(
      this.config.get('MQTT_URL'),
      this.buildClientOptions(),
    );
    this.client = client;

    client.on('connect', () => {
      client.subscribe(topic, { qos: MEASUREMENT_QOS }, (error) => {
        if (error) {
          this.logger.error({ err: error, topic }, 'MQTT subscribe failed');
          return;
        }
        this.logger.info({ topic, qos: MEASUREMENT_QOS }, 'MQTT subscribed');
      });
    });

    client.on('reconnect', () =>
      this.logger.warn('MQTT broker unreachable, reconnecting'),
    );
    client.on('error', (error) =>
      this.logger.warn({ err: error }, 'MQTT client error'),
    );

    client.on('message', (messageTopic, payload) => {
      // L'erreur asynchrone est gérée dans handleMessage : on n'attend pas.
      void this.handleMessage(messageTopic, payload);
    });
  }

  async handleMessage(topic: string, payload: Buffer): Promise<void> {
    const result = parseMeasurementMessage(topic, payload, this.country);
    if (!result.ok) {
      this.dropped += 1;
      this.logger.warn(
        { topic, reason: result.reason, dropped: this.dropped },
        'MQTT measurement dropped',
      );
      return;
    }

    try {
      await this.ingest.execute(result.measurement);
      this.persisted += 1;
      this.logger.debug(
        {
          topic,
          warehouse: result.measurement.warehouse,
          persisted: this.persisted,
        },
        'MQTT measurement persisted',
      );
    } catch (error: unknown) {
      this.dropped += 1;
      this.logger.error(
        { err: error, topic, dropped: this.dropped },
        'MQTT measurement persistence failed',
      );
    }
  }

  onModuleDestroy(): void {
    this.client?.end(true);
  }
}
