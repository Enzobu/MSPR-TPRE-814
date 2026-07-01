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

// Intégration de bout en bout de l'API Alerts (#35, CDC §III.4, ADR-0004) contre
// une VRAIE MariaDB. Pré-requis : `docker compose -f docker-compose.test.yml up`.
// Les fixtures sont insérées via Prisma avec un entrepôt préfixé `IT-`, nettoyé
// avant/après la suite.
const PREFIX = 'IT-';
const WAREHOUSE = `${PREFIX}alerts-api`;

interface AlertBody {
  id: string;
  country: string;
  type: string;
  acknowledged: boolean;
  triggeredAt: string;
  warehouse?: string;
}

describe('Alerts API integration (e2e, real DB)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const cleanup = (): Promise<unknown> =>
    prisma.alert.deleteMany({ where: { warehouse: { startsWith: PREFIX } } });

  const seedAlert = (over: {
    type?: 'TEMPERATURE_OUT_OF_RANGE' | 'HUMIDITY_OUT_OF_RANGE' | 'LOT_EXPIRED';
    triggeredAt: string;
    acknowledged?: boolean;
    country?: 'BR' | 'EC' | 'CO';
  }): Promise<{ id: string }> =>
    prisma.alert.create({
      data: {
        country: over.country ?? 'BR',
        type: over.type ?? 'TEMPERATURE_OUT_OF_RANGE',
        message: `${PREFIX}message`,
        warehouse: WAREHOUSE,
        triggeredAt: new Date(over.triggeredAt),
        acknowledged: over.acknowledged ?? false,
      },
      select: { id: true },
    });

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

  const itAlerts = (res: { body: unknown }): AlertBody[] =>
    (res.body as { data: AlertBody[] }).data.filter(
      (a) => a.warehouse === WAREHOUSE,
    );

  it('GET /api/v1/alerts should list IT alerts triggeredAt descending', async () => {
    await seedAlert({ triggeredAt: '2026-03-01T00:00:00.000Z' });
    await seedAlert({ triggeredAt: '2026-01-01T00:00:00.000Z' });
    await seedAlert({ triggeredAt: '2026-05-01T00:00:00.000Z' });

    const res = await request(server())
      .get('/api/v1/alerts?pageSize=100')
      .expect(200);
    const body = res.body as { page: number; pageSize: number };
    expect(body).toMatchObject({ page: 1, pageSize: 100 });

    const order = itAlerts(res).map((a) => a.triggeredAt);
    expect(order).toEqual([
      '2026-05-01T00:00:00.000Z',
      '2026-03-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    ]);
  });

  it('GET /api/v1/alerts?acknowledged=false should exclude acknowledged alerts', async () => {
    await seedAlert({
      triggeredAt: '2026-06-01T00:00:00.000Z',
      acknowledged: true,
    });

    const res = await request(server())
      .get('/api/v1/alerts?pageSize=100&acknowledged=false')
      .expect(200);

    const all = itAlerts(res);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((a) => a.acknowledged === false)).toBe(true);
  });

  it('GET /api/v1/alerts?type=LOT_EXPIRED should filter by type', async () => {
    await seedAlert({
      type: 'LOT_EXPIRED',
      triggeredAt: '2026-04-01T00:00:00.000Z',
    });

    const res = await request(server())
      .get('/api/v1/alerts?pageSize=100&type=LOT_EXPIRED')
      .expect(200);

    const all = itAlerts(res);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((a) => a.type === 'LOT_EXPIRED')).toBe(true);
  });

  it('GET /api/v1/alerts should paginate', async () => {
    const res = await request(server())
      .get('/api/v1/alerts?page=1&pageSize=1')
      .expect(200);
    const body = res.body as { data: unknown[]; pageSize: number };
    expect(body.pageSize).toBe(1);
    expect(body.data.length).toBeLessThanOrEqual(1);
  });

  it('GET /api/v1/alerts?country=EC should return only that country against a shared multi-country DB', async () => {
    // Arrange — démo mono-instance : une seule DB porte plusieurs pays. Le siège
    // scope chaque appel par pays ; on prouve ici que `where.country` filtre bien
    // en base réelle (pas de fuite BR sur un appel EC).
    await seedAlert({ country: 'BR', triggeredAt: '2026-07-01T00:00:00.000Z' });
    await seedAlert({ country: 'EC', triggeredAt: '2026-07-02T00:00:00.000Z' });

    const res = await request(server())
      .get('/api/v1/alerts?pageSize=100&country=EC')
      .expect(200);

    // Assert — seules les alertes EC (de l'entrepôt IT) remontent, aucune BR
    const all = itAlerts(res);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((a) => a.country === 'EC')).toBe(true);
  });

  it('GET /api/v1/alerts should reject an invalid country with 400', async () => {
    await request(server())
      .get('/api/v1/alerts?country=NOPE')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/alerts should reject an invalid acknowledged with 400', async () => {
    await request(server())
      .get('/api/v1/alerts?acknowledged=maybe')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/alerts/:id should return the alert (200) and 404 when unknown', async () => {
    const created = await seedAlert({
      triggeredAt: '2026-02-15T00:00:00.000Z',
    });

    await request(server())
      .get(`/api/v1/alerts/${created.id}`)
      .expect(200)
      .expect((res) => {
        expect((res.body as { id: string }).id).toBe(created.id);
        expect((res.body as { warehouse: string }).warehouse).toBe(WAREHOUSE);
      });

    await request(server())
      .get('/api/v1/alerts/does-not-exist')
      .expect(404)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('PATCH /api/v1/alerts/:id/acknowledge should set acknowledged true (200)', async () => {
    const created = await seedAlert({
      triggeredAt: '2026-02-20T00:00:00.000Z',
    });

    await request(server())
      .patch(`/api/v1/alerts/${created.id}/acknowledge`)
      .expect(200)
      .expect((res) => {
        expect((res.body as { acknowledged: boolean }).acknowledged).toBe(true);
      });

    // Persistance réelle : la relecture confirme l'acquittement.
    await request(server())
      .get(`/api/v1/alerts/${created.id}`)
      .expect(200)
      .expect((res) => {
        expect((res.body as { acknowledged: boolean }).acknowledged).toBe(true);
      });
  });

  it('PATCH /api/v1/alerts/:id/acknowledge should return 404 for an unknown id', async () => {
    await request(server())
      .patch('/api/v1/alerts/ghost/acknowledge')
      .expect(404)
      .expect('Content-Type', /application\/problem\+json/);
  });
});
