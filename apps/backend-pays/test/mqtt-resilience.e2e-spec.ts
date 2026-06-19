// Le subscriber MQTT lit MQTT_URL au boot d'AppModule : on pointe le broker de
// test (docker-compose.test.yml, port 1893) AVANT tout import d'AppModule.
process.env.MQTT_URL = 'mqtt://localhost:1893';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { connect, MqttClient } from 'mqtt';
import { App } from 'supertest/types';
import { measurementTopic } from '@futurekawa/contracts';
import { AppModule } from './../src/app.module';
import { MqttMeasurementSubscriber } from './../src/measurements/infrastructure/mqtt-measurement.subscriber';
import { PrismaService } from './../src/infrastructure/persistence/prisma.service';

// Tests d'intégration de la résilience d'ingestion MQTT (#31, ADR-0003/0008)
// contre un VRAI broker Mosquitto + une VRAIE MariaDB. Pré-requis :
//   docker compose -f docker-compose.test.yml up -d
// Couvre le DÉBIT (100 mesures → 100 en DB) et la REPRISE après une coupure de
// connexion broker. Le cas « payload invalide → drop sans crash » est déjà
// couvert par mqtt-ingestion.e2e-spec.ts (#28), non dupliqué ici.
// Topic + payload identiques à la commande /mqtt-simulate.
const PREFIX = 'IT-';
const LOAD_WAREHOUSE = `${PREFIX}MQTT-LOAD`;
const RECONNECT_BEFORE = `${PREFIX}MQTT-RC-BEFORE`;
const RECONNECT_AFTER = `${PREFIX}MQTT-RC-AFTER`;

const MESSAGE_COUNT = 100;
const PUBLISH_BUDGET_MS = 10_000;
const PERSIST_TIMEOUT_MS = 20_000;
const RECONNECT_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 100;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Conditions BR conformes (T° [26;32], humidité [53;57]) → pas d'alerte parasite.
const conformPayload = (index: number): Record<string, unknown> => ({
  temperatureCelsius: 29,
  humidityPercent: 55,
  // recordedAt distinct par message (lisibilité ; aucune contrainte d'unicité).
  recordedAt: new Date(Date.UTC(2026, 5, 1, 0, 0, index)).toISOString(),
});

describe('MQTT resilience integration (e2e, real broker + DB)', () => {
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
    await app.init();

    prisma = app.get(PrismaService);
    await cleanup();

    publisher = connect('mqtt://localhost:1893', {
      clientId: 'it-mqtt-resilience-publisher',
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

  // Poll la DB jusqu'à atteindre `expected` lignes pour l'entrepôt, ou timeout.
  const waitForCount = async (
    warehouse: string,
    expected: number,
    timeoutMs: number,
  ): Promise<number> => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const count = await countFor(warehouse);
      if (count >= expected || Date.now() >= deadline) {
        return count;
      }
      await sleep(POLL_INTERVAL_MS);
    }
  };

  it('should persist all 100 measurements published in a burst', async () => {
    // Arrange + Act : publication en rafale (QoS 1), budget < 10s.
    const startedAt = Date.now();
    await Promise.all(
      Array.from({ length: MESSAGE_COUNT }, (_, index) =>
        publish(LOAD_WAREHOUSE, conformPayload(index)),
      ),
    );
    const publishDuration = Date.now() - startedAt;

    // Assert : les 100 sont publiées dans le budget puis toutes persistées.
    expect(publishDuration).toBeLessThan(PUBLISH_BUDGET_MS);
    const persisted = await waitForCount(
      LOAD_WAREHOUSE,
      MESSAGE_COUNT,
      PERSIST_TIMEOUT_MS,
    );
    expect(persisted).toBe(MESSAGE_COUNT);
  }, 40000);

  it('should resume ingestion after the broker connection drops', async () => {
    // Arrange : une mesure persiste normalement avant la coupure.
    await publish(RECONNECT_BEFORE, conformPayload(0));
    expect(await waitForCount(RECONNECT_BEFORE, 1, PERSIST_TIMEOUT_MS)).toBe(1);

    // Act : on coupe la connexion du subscriber (simule une perte broker). Le
    // client a reconnectPeriod > 0 (ADR-0003) → il doit se reconnecter seul.
    const subscriber = app.get(MqttMeasurementSubscriber);
    const client = (subscriber as unknown as { client: MqttClient }).client;
    const reconnected = new Promise<void>((resolve, reject) => {
      // Timer nettoyé dès la reconnexion : pas de handle pendant qui retarde la
      // sortie de Jest.
      const timer = setTimeout(
        () =>
          reject(new Error('Le subscriber ne s’est pas reconnecté à temps')),
        RECONNECT_TIMEOUT_MS,
      );
      client.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
    });
    (
      client as unknown as { stream: { destroy: (err?: Error) => void } }
    ).stream.destroy(new Error('forced broker drop'));

    await reconnected;

    // Assert : une mesure publiée APRÈS reconnexion est bien persistée (reprise,
    // pas de blocage permanent — la perte pendant la coupure est acceptée, pas
    // de session persistante, ADR-0003).
    await publish(RECONNECT_AFTER, conformPayload(0));
    expect(await waitForCount(RECONNECT_AFTER, 1, PERSIST_TIMEOUT_MS)).toBe(1);
  }, 40000);
});
