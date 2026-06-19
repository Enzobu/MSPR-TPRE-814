import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ProblemDetailsFilter } from '@futurekawa/nest-common';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/persistence/prisma.service';

// Le mailer pointe sur le faux SMTP MailDev (docker-compose.test.yml). On câble
// l'env ici plutôt que via `.env.test.example` car `process.loadEnvFile`
// (setup-e2e) écrit dans l'env natif que le sandbox VM de Jest ne reflète pas.
// `??=` laisse la CI / un override manuel prioritaires.
process.env.SMTP_HOST ??= 'localhost';
process.env.SMTP_PORT ??= '1026';
process.env.SMTP_SECURE ??= 'false';
process.env.SMTP_FROM ??= 'alerts@futurekawa.test';
process.env.ALERT_RECIPIENT ??= 'responsable@futurekawa.test';

// Intégration de bout en bout de l'alerting (CDC §III.4, ADR-0004) contre une
// VRAIE MariaDB, déclenché via le POST REST /api/v1/measurements (déterministe).
// Pré-requis : `docker compose -f docker-compose.test.yml up -d`. Le pays de
// l'instance de test est BR (setup-e2e.ts) : T° [26;32], humidité [53;57].
// Toutes les fixtures utilisent un entrepôt préfixé `IT-` nettoyé avant/après.
const PREFIX = 'IT-';
const WAREHOUSE = `${PREFIX}alert`;
const IN_RANGE_WAREHOUSE = `${PREFIX}ok`;
const MAIL_WAREHOUSE = `${PREFIX}mail`;

// API REST de MailDev (docker-compose.test.yml) interrogée pour vérifier l'email.
const MAILDEV_API_URL = process.env.MAILDEV_API_URL ?? 'http://localhost:1081';

interface MailDevAddress {
  address: string;
}
interface MailDevEmail {
  subject: string;
  to: MailDevAddress[];
  from: MailDevAddress[];
  text: string;
  html: string;
}

const clearMailbox = async (): Promise<void> => {
  await fetch(`${MAILDEV_API_URL}/email/all`, { method: 'DELETE' });
};

// L'envoi est awaité dans le handler d'ingestion mais on tolère un court délai
// de remise SMTP : on poll l'API REST jusqu'à trouver l'email attendu.
const waitForEmail = async (
  predicate: (email: MailDevEmail) => boolean,
): Promise<MailDevEmail> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(`${MAILDEV_API_URL}/email`);
    const emails = (await response.json()) as MailDevEmail[];
    const match = emails.find(predicate);
    if (match) {
      return match;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Aucun email reçu dans MailDev pour le prédicat fourni');
};

describe('Alerting integration (e2e, real DB)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const server = () => app.getHttpServer();

  const postMeasurement = (
    warehouse: string,
    temperatureCelsius: number,
    humidityPercent: number,
  ): request.Test =>
    request(server())
      .post('/api/v1/measurements')
      .send({
        warehouse,
        temperatureCelsius,
        humidityPercent,
        recordedAt: '2026-06-02T12:00:00.000Z',
      })
      .expect(201);

  const findAlerts = (warehouse: string) =>
    prisma.alert.findMany({ where: { warehouse } });

  it('should persist an alert when an out-of-range measurement is ingested', async () => {
    // BR T° max 32 → 40°C hors plage.
    await postMeasurement(WAREHOUSE, 40, 55);

    const alerts = await findAlerts(WAREHOUSE);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      type: 'TEMPERATURE_OUT_OF_RANGE',
      warehouse: WAREHOUSE,
      country: 'BR',
      acknowledged: false,
    });
  });

  it('should deduplicate alerts of the same type for the same warehouse on the same day', async () => {
    // 2e mesure hors plage le même jour, même entrepôt → toujours 1 alerte.
    await postMeasurement(WAREHOUSE, 41, 55);

    const alerts = await findAlerts(WAREHOUSE);
    expect(alerts).toHaveLength(1);
  });

  it('should not raise any alert for an in-range measurement', async () => {
    await postMeasurement(IN_RANGE_WAREHOUSE, 29, 55);

    const alerts = await findAlerts(IN_RANGE_WAREHOUSE);
    expect(alerts).toHaveLength(0);
  });

  it('should send an alert email to MailDev when an out-of-range measurement is ingested', async () => {
    // Arrange : boîte vide pour isoler l'email de ce test.
    await clearMailbox();

    // Act : BR humidité max 57 → 80% hors plage déclenche HUMIDITY_OUT_OF_RANGE.
    await postMeasurement(MAIL_WAREHOUSE, 29, 80);

    // Assert : email reçu, headers et corps corrects (variables substituées).
    const email = await waitForEmail((mail) =>
      mail.subject.includes('Humidité hors plage'),
    );
    expect(email.to[0].address).toBe('responsable@futurekawa.test');
    expect(email.from[0].address).toBe('alerts@futurekawa.test');
    expect(email.subject).toBe(
      '[FutureKawa] Humidité hors plage — Brésil / IT-mail',
    );
    expect(email.text).toContain('Pays : Brésil');
    expect(email.text).toContain('IT-mail');
    expect(email.html).toContain('hors plage');
  });
});
