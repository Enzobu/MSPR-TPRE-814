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

// Intégration de bout en bout de l'API Measurements (CDC §III.2, ADR-0008)
// contre une VRAIE MariaDB. Pré-requis : `docker compose -f docker-compose.test.yml up -d`
// puis DATABASE_URL pointant sur la DB de test (défaut :3399 via setup-e2e.ts).
//
// Toutes les fixtures utilisent un entrepôt préfixé `IT-` et sont nettoyées
// avant/après la suite : la DB de test (tmpfs) repart à neuf, mais le préfixe
// garde le test inoffensif même lancé par erreur contre une autre base.
const PREFIX = 'IT-';
const WAREHOUSE = `${PREFIX}W1`;
const PERF_WAREHOUSE = `${PREFIX}perf`;
const PERF_BUDGET_MS = 200;

interface HistoryBody {
  data: { id: string; warehouse: string; recordedAt: string }[];
  total: number;
  page: number;
  pageSize: number;
}

interface BucketBody {
  bucketStart: string;
  avgTemperatureCelsius: number;
  avgHumidityPercent: number;
  count: number;
}

describe('Measurements integration (e2e, real DB)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const cleanup = (): Promise<unknown> =>
    prisma.measurement.deleteMany({
      where: { warehouse: { startsWith: PREFIX } },
    });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Réplique du bootstrap (main.ts) requis par le contrat : validation + RFC 7807.
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

  // Trois relevés espacés d'une heure, insérés dans le désordre chronologique.
  const seedWindowFixtures = async (): Promise<void> => {
    await prisma.measurement.createMany({
      data: [
        {
          country: 'BR',
          warehouse: WAREHOUSE,
          temperatureCelsius: 20,
          humidityPercent: 50,
          recordedAt: new Date('2026-06-01T09:30:00.000Z'),
        },
        {
          country: 'BR',
          warehouse: WAREHOUSE,
          temperatureCelsius: 22,
          humidityPercent: 54,
          recordedAt: new Date('2026-06-01T08:00:00.000Z'),
        },
        {
          country: 'BR',
          warehouse: WAREHOUSE,
          temperatureCelsius: 24,
          humidityPercent: 60,
          recordedAt: new Date('2026-06-01T10:15:00.000Z'),
        },
      ],
    });
  };

  it('POST /api/v1/measurements should persist a relevé and expose it via history', async () => {
    const postWarehouse = `${PREFIX}post`;
    const recordedAt = '2026-06-02T12:00:00.000Z';

    const created = await request(server())
      .post('/api/v1/measurements')
      .send({
        warehouse: postWarehouse,
        temperatureCelsius: 23.5,
        humidityPercent: 57,
        recordedAt,
      })
      .expect(201);
    expect(created.body).toMatchObject({
      country: 'BR',
      warehouse: postWarehouse,
      temperatureCelsius: 23.5,
      humidityPercent: 57,
      recordedAt,
    });
    expect(created.body).toHaveProperty('id');

    const history = await request(server())
      .get(`/api/v1/measurements?warehouse=${postWarehouse}&pageSize=100`)
      .expect(200);
    const body = history.body as HistoryBody;
    expect(body.total).toBe(1);
    expect(body.data[0].recordedAt).toBe(recordedAt);
  });

  it('POST /api/v1/measurements should reject a temperature out of range (400)', async () => {
    await request(server())
      .post('/api/v1/measurements')
      .send({
        warehouse: `${PREFIX}post`,
        temperatureCelsius: 999,
        humidityPercent: 57,
        recordedAt: '2026-06-02T12:00:00.000Z',
      })
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('POST /api/v1/measurements should reject a missing warehouse (400)', async () => {
    await request(server())
      .post('/api/v1/measurements')
      .send({
        temperatureCelsius: 22,
        humidityPercent: 57,
        recordedAt: '2026-06-02T12:00:00.000Z',
      })
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/measurements should require the warehouse param (400)', async () => {
    await request(server())
      .get('/api/v1/measurements')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/measurements should return history sorted by recordedAt desc', async () => {
    await seedWindowFixtures();

    const res = await request(server())
      .get(`/api/v1/measurements?warehouse=${WAREHOUSE}&pageSize=100`)
      .expect(200);
    const body = res.body as HistoryBody;
    expect(body).toMatchObject({ page: 1, pageSize: 100, total: 3 });

    const times = body.data.map((m) => new Date(m.recordedAt).getTime());
    const sortedDesc = [...times].sort((a, b) => b - a);
    expect(times).toEqual(sortedDesc);
    expect(body.data[0].recordedAt).toBe('2026-06-01T10:15:00.000Z');
  });

  it('GET /api/v1/measurements should paginate the history', async () => {
    const first = await request(server())
      .get(`/api/v1/measurements?warehouse=${WAREHOUSE}&page=1&pageSize=2`)
      .expect(200);
    const firstBody = first.body as HistoryBody;
    expect(firstBody.total).toBe(3);
    expect(firstBody.data).toHaveLength(2);

    const second = await request(server())
      .get(`/api/v1/measurements?warehouse=${WAREHOUSE}&page=2&pageSize=2`)
      .expect(200);
    const secondBody = second.body as HistoryBody;
    expect(secondBody.data).toHaveLength(1);
  });

  it('GET /api/v1/measurements should filter by from/to bounds (inclusive)', async () => {
    const res = await request(server())
      .get(
        `/api/v1/measurements?warehouse=${WAREHOUSE}&from=2026-06-01T08:00:00.000Z&to=2026-06-01T09:30:00.000Z&pageSize=100`,
      )
      .expect(200);
    const body = res.body as HistoryBody;
    expect(body.total).toBe(2);
    const times = body.data.map((m) => m.recordedAt);
    expect(times).not.toContain('2026-06-01T10:15:00.000Z');
  });

  it('GET /api/v1/measurements should reject a malformed from with 400', async () => {
    await request(server())
      .get(`/api/v1/measurements?warehouse=${WAREHOUSE}&from=not-a-date`)
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/measurements/aggregate should bucket measurements per hour', async () => {
    const res = await request(server())
      .get(`/api/v1/measurements/aggregate?warehouse=${WAREHOUSE}&bucket=1h`)
      .expect(200);
    const buckets = res.body as BucketBody[];

    // 3 relevés sur 08h / 09h / 10h → 3 buckets horaires, triés chronologiquement.
    expect(buckets).toHaveLength(3);
    const starts = buckets.map((b) => b.bucketStart);
    expect(starts).toEqual([
      '2026-06-01T08:00:00.000Z',
      '2026-06-01T09:00:00.000Z',
      '2026-06-01T10:00:00.000Z',
    ]);
    expect(buckets[0]).toMatchObject({
      avgTemperatureCelsius: 22,
      avgHumidityPercent: 54,
      count: 1,
    });
  });

  it('GET /api/v1/measurements/aggregate should average measurements sharing a daily bucket', async () => {
    const res = await request(server())
      .get(`/api/v1/measurements/aggregate?warehouse=${WAREHOUSE}&bucket=1d`)
      .expect(200);
    const buckets = res.body as BucketBody[];

    // Les 3 relevés tombent le même jour → un seul bucket, moyenne des 3.
    expect(buckets).toHaveLength(1);
    expect(buckets[0].count).toBe(3);
    expect(buckets[0].avgTemperatureCelsius).toBeCloseTo(22, 5);
    expect(buckets[0].avgHumidityPercent).toBeCloseTo(54.6667, 3);
  });

  it('GET /api/v1/measurements/aggregate should reject an unsupported bucket with 400', async () => {
    await request(server())
      .get(`/api/v1/measurements/aggregate?warehouse=${WAREHOUSE}&bucket=1w`)
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/measurements should stay under the perf budget on 1000 rows', async () => {
    const base = new Date('2026-01-01T00:00:00.000Z').getTime();
    const data = Array.from({ length: 1000 }, (_, i) => ({
      country: 'BR' as const,
      warehouse: PERF_WAREHOUSE,
      temperatureCelsius: 20 + (i % 10),
      humidityPercent: 50 + (i % 20),
      // Une mesure par minute.
      recordedAt: new Date(base + i * 60_000),
    }));
    await prisma.measurement.createMany({ data });

    const start = Date.now();
    const res = await request(server())
      .get(
        `/api/v1/measurements?warehouse=${PERF_WAREHOUSE}&page=1&pageSize=20`,
      )
      .expect(200);
    const elapsed = Date.now() - start;

    const body = res.body as HistoryBody;
    expect(body.total).toBe(1000);
    expect(body.data).toHaveLength(20);
    expect(elapsed).toBeLessThan(PERF_BUDGET_MS);
  });
});
