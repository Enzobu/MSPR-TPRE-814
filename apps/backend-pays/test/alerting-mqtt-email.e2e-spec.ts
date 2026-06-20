// Le subscriber MQTT lit MQTT_URL au boot d'AppModule : on pointe le broker de
// test (1893) AVANT tout import. Le mailer pointe sur MailDev (1026) ; `??=`
// laisse la CI / un override prioritaires.
process.env.MQTT_URL = 'mqtt://localhost:1893';
process.env.SMTP_HOST ??= 'localhost';
process.env.SMTP_PORT ??= '1026';
process.env.SMTP_SECURE ??= 'false';
process.env.SMTP_FROM ??= 'alerts@futurekawa.test';
process.env.ALERT_RECIPIENT ??= 'responsable@futurekawa.test';

import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { connect, MqttClient } from 'mqtt';
import request from 'supertest';
import { App } from 'supertest/types';
import { measurementTopic } from '@futurekawa/contracts';
import { ProblemDetailsFilter } from '@futurekawa/nest-common';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/persistence/prisma.service';

// Scénario d'alerting bout-en-bout (#39, ADR-0003/0004/0008) contre un VRAI
// broker Mosquitto, une VRAIE MariaDB et un faux SMTP MailDev. Pré-requis :
//   docker compose -f docker-compose.test.yml up -d
// Chaîne validée : publication MQTT d'une mesure HORS PLAGE (anomalie, cf.
// /mqtt-simulate --anomaly) → backend-pays persiste l'alerte → exposée par
// GET /api/v1/alerts → email envoyé et reçu sur MailDev.
const PREFIX = 'IT-';
const WAREHOUSE = `${PREFIX}MQTT-ALERT`;
const MAILDEV_API_URL = process.env.MAILDEV_API_URL ?? 'http://localhost:1081';

const POLL_INTERVAL_MS = 150;
const POLL_TIMEOUT_MS = 8000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface AlertRow {
  type: string;
  warehouse?: string;
  country: string;
  acknowledged: boolean;
}

interface MailDevAddress {
  address: string;
}
interface MailDevEmail {
  subject: string;
  to: MailDevAddress[];
  from: MailDevAddress[];
  text: string;
}

describe('Alerting MQTT → email integration (e2e, real broker + DB + MailDev)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let publisher: MqttClient;

  const cleanup = async (): Promise<void> => {
    await prisma.alert.deleteMany({
      where: { warehouse: { startsWith: PREFIX } },
    });
    await prisma.measurement.deleteMany({
      where: { warehouse: { startsWith: PREFIX } },
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ProblemDetailsFilter());
    app.setGlobalPrefix('api', { exclude: ['health', 'ready'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();

    prisma = app.get(PrismaService);
    await cleanup();

    publisher = connect('mqtt://localhost:1893', {
      clientId: 'it-alerting-mqtt-publisher',
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

  const server = () => app.getHttpServer();

  const publishAnomaly = (): Promise<void> =>
    new Promise((resolve, reject) => {
      // BR T° max 32 → 41°C hors plage (anomalie) déclenche TEMPERATURE_OUT_OF_RANGE.
      publisher.publish(
        measurementTopic('BR', WAREHOUSE),
        JSON.stringify({
          temperatureCelsius: 41,
          humidityPercent: 55,
          recordedAt: '2026-06-02T12:00:00.000Z',
        }),
        { qos: 1 },
        (error) => (error ? reject(error) : resolve()),
      );
    });

  // Poll GET /api/v1/alerts jusqu'à trouver l'alerte de l'entrepôt, ou timeout.
  const waitForAlertViaApi = async (): Promise<AlertRow | undefined> => {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    for (;;) {
      const response = await request(server())
        .get('/api/v1/alerts')
        .query({ type: 'TEMPERATURE_OUT_OF_RANGE' });
      const body = response.body as { data?: AlertRow[] };
      const alerts = body.data ?? [];
      const match = alerts.find((alert) => alert.warehouse === WAREHOUSE);
      if (match || Date.now() >= deadline) {
        return match;
      }
      await sleep(POLL_INTERVAL_MS);
    }
  };

  const clearMailbox = async (): Promise<void> => {
    await fetch(`${MAILDEV_API_URL}/email/all`, { method: 'DELETE' });
  };

  const waitForEmail = async (
    predicate: (email: MailDevEmail) => boolean,
  ): Promise<MailDevEmail | undefined> => {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    for (;;) {
      const response = await fetch(`${MAILDEV_API_URL}/email`);
      const emails = (await response.json()) as MailDevEmail[];
      const match = emails.find(predicate);
      if (match || Date.now() >= deadline) {
        return match;
      }
      await sleep(POLL_INTERVAL_MS);
    }
  };

  it('should raise an alert and send an email when an out-of-range measurement is published over MQTT', async () => {
    // Arrange : boîte mail vide pour isoler l'email de ce scénario.
    await clearMailbox();

    // Act : publier l'anomalie sur le broker MQTT réel.
    await publishAnomaly();

    // Assert 1 : l'alerte est exposée par l'API (contrat consommé par l'UI #35).
    const alert = await waitForAlertViaApi();
    expect(alert).toBeDefined();
    expect(alert).toMatchObject({
      type: 'TEMPERATURE_OUT_OF_RANGE',
      warehouse: WAREHOUSE,
      country: 'BR',
      acknowledged: false,
    });

    // Assert 2 : l'email correspondant est reçu sur MailDev.
    const email = await waitForEmail((mail) =>
      mail.subject.includes('Température hors plage'),
    );
    expect(email).toBeDefined();
    expect(email?.to[0].address).toBe('responsable@futurekawa.test');
    expect(email?.from[0].address).toBe('alerts@futurekawa.test');
    expect(email?.text).toContain(WAREHOUSE);
  }, 30000);
});
