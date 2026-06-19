// Le subscriber MQTT lit MQTT_URL au boot d'AppModule : on pointe le broker de
// test (docker-compose.test.yml, port 1893) AVANT tout import d'AppModule.
process.env.MQTT_URL = 'mqtt://localhost:1893';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { connect, MqttClient } from 'mqtt';
import { App } from 'supertest/types';
import { measurementTopic } from '@futurekawa/contracts';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/persistence/prisma.service';

// Intégration de bout en bout de l'ingestion MQTT (#28, ADR-0003) contre un VRAI
// broker Mosquitto et une VRAIE MariaDB. Pré-requis :
//   docker compose -f docker-compose.test.yml up -d   (DB + mosquitto-test)
// Le subscriber d'AppModule s'abonne à `futurekawa/BR/warehouse/+/measurement` ;
// le test publie une mesure et poll la DB jusqu'à persistance.
const PREFIX = 'IT-';
const WAREHOUSE = `${PREFIX}MQTT`;
const INVALID_WAREHOUSE = `${PREFIX}MQTT-INVALID`;
const RESILIENCE_WAREHOUSE = `${PREFIX}MQTT-AFTER`;
const POLL_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 100;
const QUIET_WAIT_MS = 1000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe('MQTT ingestion integration (e2e, real broker + DB)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let publisher: MqttClient;

  const cleanup = (): Promise<unknown> =>
    prisma.measurement.deleteMany({
      where: { warehouse: { startsWith: PREFIX } },
    });

  const countFor = (warehouse: string): Promise<number> =>
    prisma.measurement.count({ where: { warehouse } });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // onModuleInit du subscriber connecte au broker et s'abonne pendant init().
    await app.init();

    prisma = app.get(PrismaService);
    await cleanup();

    publisher = connect('mqtt://localhost:1893', {
      clientId: 'it-mqtt-publisher',
      reconnectPeriod: 0,
    });
    await new Promise<void>((resolve, reject) => {
      publisher.once('connect', () => resolve());
      publisher.once('error', reject);
    });
  }, 30000);

  afterAll(async () => {
    await cleanup();
    publisher.end(true);
    await app.close();
  });

  const publish = (warehouse: string, payload: unknown): Promise<void> =>
    new Promise((resolve, reject) => {
      publisher.publish(
        measurementTopic('BR', warehouse),
        JSON.stringify(payload),
        { qos: 1 },
        (error) => (error ? reject(error) : resolve()),
      );
    });

  // Poll la DB jusqu'à ce qu'une mesure de l'entrepôt apparaisse (livraison MQTT
  // + persistance asynchrones) ou que le timeout expire.
  const waitForMeasurement = async (
    warehouse: string,
  ): Promise<{
    country: string;
    warehouse: string;
    recordedAt: Date;
    temperatureCelsius: number;
    humidityPercent: number;
  } | null> => {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    for (;;) {
      const row = await prisma.measurement.findFirst({ where: { warehouse } });
      if (row !== null || Date.now() >= deadline) {
        return row;
      }
      await sleep(POLL_INTERVAL_MS);
    }
  };

  it('should persist a valid measurement published over MQTT', async () => {
    await publish(WAREHOUSE, {
      temperatureCelsius: 21.4,
      humidityPercent: 58.2,
      recordedAt: '2026-06-01T08:00:00.000Z',
    });

    const persisted = await waitForMeasurement(WAREHOUSE);

    expect(persisted).not.toBeNull();
    expect(persisted?.country).toBe('BR');
    expect(persisted?.warehouse).toBe(WAREHOUSE);
    expect(persisted?.temperatureCelsius).toBeCloseTo(21.4, 5);
    expect(persisted?.humidityPercent).toBeCloseTo(58.2, 5);
    expect(persisted?.recordedAt.toISOString()).toBe(
      '2026-06-01T08:00:00.000Z',
    );
  }, 15000);

  it('should drop an invalid payload, then keep ingesting (no crash)', async () => {
    await publish(INVALID_WAREHOUSE, {
      temperatureCelsius: 999,
      humidityPercent: 58,
      recordedAt: '2026-06-01T08:00:00.000Z',
    });
    // Laisse au subscriber le temps de recevoir et de dropper le message.
    await sleep(QUIET_WAIT_MS);
    expect(await countFor(INVALID_WAREHOUSE)).toBe(0);

    // Le subscriber est toujours vivant : un message valide publié APRÈS l'invalide
    // est bien persisté (preuve que le drop n'a pas tué la souscription).
    await publish(RESILIENCE_WAREHOUSE, {
      temperatureCelsius: 19,
      humidityPercent: 60,
      recordedAt: '2026-06-01T09:00:00.000Z',
    });
    const persisted = await waitForMeasurement(RESILIENCE_WAREHOUSE);
    expect(persisted).not.toBeNull();
  }, 15000);
});
