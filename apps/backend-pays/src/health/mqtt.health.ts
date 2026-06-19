import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { connect, IClientOptions } from 'mqtt';
import type { Env } from '../config/env.validation';

const CONNECT_TIMEOUT_MS = 2000;

// Readiness MQTT : ouvre une connexion courte au broker et la referme aussitôt.
// Pas de reconnexion (reconnectPeriod: 0) pour que l'échec remonte immédiatement.
@Injectable()
export class MqttHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.tryConnect();
      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'unreachable',
      });
    }
  }

  private tryConnect(): Promise<void> {
    const options: IClientOptions = {
      username: this.config.get('MQTT_USERNAME'),
      password: this.config.get('MQTT_PASSWORD'),
      clientId: `${this.config.get('MQTT_CLIENT_ID')}-health-${randomUUID()}`,
      connectTimeout: CONNECT_TIMEOUT_MS,
      reconnectPeriod: 0,
    };

    return new Promise<void>((resolve, reject) => {
      const client = connect(this.config.get('MQTT_URL'), options);
      const settle = (error?: Error): void => {
        client.end(true);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };
      client.once('connect', () => settle());
      client.once('error', (error: Error) => settle(error));
    });
  }
}
