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

// Intégration de bout en bout de l'alerting (CDC §III.4, ADR-0004) contre une
// VRAIE MariaDB, déclenché via le POST REST /api/v1/measurements (déterministe).
// Pré-requis : `docker compose -f docker-compose.test.yml up -d`. Le pays de
// l'instance de test est BR (setup-e2e.ts) : T° [26;32], humidité [53;57].
// Toutes les fixtures utilisent un entrepôt préfixé `IT-` nettoyé avant/après.
const PREFIX = 'IT-';
const WAREHOUSE = `${PREFIX}alert`;
const IN_RANGE_WAREHOUSE = `${PREFIX}ok`;

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
});
