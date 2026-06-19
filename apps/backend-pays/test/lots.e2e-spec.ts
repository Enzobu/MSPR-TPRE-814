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

// Intégration de bout en bout de l'API Lots (CDC §III.1, ADR-0008) contre une
// VRAIE MariaDB. Pré-requis : `docker compose -f docker-compose.test.yml up -d`
// puis DATABASE_URL pointant sur la DB de test. Non exécuté par `pnpm -r test`
// (seulement les .spec.ts) ; lancer via `pnpm --filter backend-pays test:e2e`.
//
// Toutes les fixtures utilisent le préfixe `IT-` et sont nettoyées avant/après
// la suite : la DB de test (tmpfs) repart à neuf, mais le préfixe garde le test
// inoffensif même lancé par erreur contre une autre base.
const PREFIX = 'IT-';

const buildBody = (over: Record<string, unknown> = {}) => ({
  id: `${PREFIX}001`,
  country: 'BR',
  farm: 'Fazenda Aurora',
  warehouse: 'Entrepôt Sul-1',
  storedAt: '2026-06-01T08:00:00.000Z',
  ...over,
});

describe('Lots integration (e2e, real DB)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const cleanup = (): Promise<unknown> =>
    prisma.lot.deleteMany({ where: { id: { startsWith: PREFIX } } });

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

  it('POST /api/v1/lots should persist a lot (201) retrievable by id', async () => {
    const create = await request(server())
      .post('/api/v1/lots')
      .send(buildBody({ id: `${PREFIX}create` }))
      .expect(201);
    expect(create.body).toMatchObject({
      id: `${PREFIX}create`,
      country: 'BR',
      status: 'CONFORME',
    });

    // Persistance réelle : relecture par un second appel HTTP.
    await request(server())
      .get(`/api/v1/lots/${PREFIX}create`)
      .expect(200)
      .expect((res) => {
        expect((res.body as { id: string }).id).toBe(`${PREFIX}create`);
      });
  });

  it('POST /api/v1/lots should reject a duplicate id with 409 (RFC 7807)', async () => {
    await request(server())
      .post('/api/v1/lots')
      .send(buildBody({ id: `${PREFIX}dup` }))
      .expect(201);

    const res = await request(server())
      .post('/api/v1/lots')
      .send(buildBody({ id: `${PREFIX}dup` }))
      .expect(409)
      .expect('Content-Type', /application\/problem\+json/);
    expect(res.body).toMatchObject({ status: 409 });
  });

  it('POST /api/v1/lots should reject a country other than the backend country with 422', async () => {
    const res = await request(server())
      .post('/api/v1/lots')
      .send(buildBody({ id: `${PREFIX}ec`, country: 'EC' }))
      .expect(422)
      .expect('Content-Type', /application\/problem\+json/);
    expect(res.body).toMatchObject({ status: 422 });
  });

  it('POST /api/v1/lots should reject an invalid payload with 400', async () => {
    // Date invalide + champs manquants.
    const res = await request(server())
      .post('/api/v1/lots')
      .send({ id: `${PREFIX}bad`, country: 'BR', storedAt: 'not-a-date' })
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
    expect(res.body).toMatchObject({ status: 400 });
  });

  it('GET /api/v1/lots should return lots FIFO (storedAt ascending)', async () => {
    // 3 lots créés dans le désordre chronologique.
    await request(server())
      .post('/api/v1/lots')
      .send(
        buildBody({
          id: `${PREFIX}fifo-mid`,
          storedAt: '2026-03-01T00:00:00.000Z',
        }),
      )
      .expect(201);
    await request(server())
      .post('/api/v1/lots')
      .send(
        buildBody({
          id: `${PREFIX}fifo-old`,
          storedAt: '2025-01-01T00:00:00.000Z',
        }),
      )
      .expect(201);
    await request(server())
      .post('/api/v1/lots')
      .send(
        buildBody({
          id: `${PREFIX}fifo-new`,
          storedAt: '2026-12-01T00:00:00.000Z',
        }),
      )
      .expect(201);

    const res = await request(server())
      .get('/api/v1/lots?pageSize=100')
      .expect(200);
    const body = res.body as {
      data: { id: string }[];
      total: number;
      page: number;
      pageSize: number;
    };
    expect(body).toMatchObject({ page: 1, pageSize: 100 });

    const order = body.data
      .map((l) => l.id)
      .filter((id) => id.startsWith(`${PREFIX}fifo-`));
    expect(order).toEqual([
      `${PREFIX}fifo-old`,
      `${PREFIX}fifo-mid`,
      `${PREFIX}fifo-new`,
    ]);
  });

  it('GET /api/v1/lots?sort=storedAt:desc should reverse the order', async () => {
    // Réutilise les 3 lots IT-fifo-* créés par le test précédent.
    const res = await request(server())
      .get('/api/v1/lots?sort=storedAt:desc&pageSize=100')
      .expect(200);
    const order = (res.body as { data: { id: string }[] }).data
      .map((l) => l.id)
      .filter((id) => id.startsWith(`${PREFIX}fifo-`));
    expect(order).toEqual([
      `${PREFIX}fifo-new`,
      `${PREFIX}fifo-mid`,
      `${PREFIX}fifo-old`,
    ]);
  });

  it('GET /api/v1/lots should reject an unsupported sort with 400', async () => {
    await request(server())
      .get('/api/v1/lots?sort=farm:asc')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/lots/:id should return 404 (RFC 7807) for an unknown id', async () => {
    await request(server())
      .get(`/api/v1/lots/${PREFIX}does-not-exist`)
      .expect(404)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('PATCH /api/v1/lots/:id/status should persist the new status (200)', async () => {
    await request(server())
      .post('/api/v1/lots')
      .send(buildBody({ id: `${PREFIX}patch` }))
      .expect(201);

    await request(server())
      .patch(`/api/v1/lots/${PREFIX}patch/status`)
      .send({ status: 'PERIME' })
      .expect(200)
      .expect((res) => {
        expect((res.body as { status: string }).status).toBe('PERIME');
      });

    // Persistance réelle : la relecture confirme le nouveau statut.
    await request(server())
      .get(`/api/v1/lots/${PREFIX}patch`)
      .expect(200)
      .expect((res) => {
        expect((res.body as { status: string }).status).toBe('PERIME');
      });
  });

  it('PATCH /api/v1/lots/:id/status should reject an invalid status with 400', async () => {
    const res = await request(server())
      .patch(`/api/v1/lots/${PREFIX}patch/status`)
      .send({ status: 'WHATEVER' })
      .expect(400);
    expect(res.body).toMatchObject({ status: 400 });
  });

  it('PATCH /api/v1/lots/:id/status should return 404 for an unknown id', async () => {
    const res = await request(server())
      .patch(`/api/v1/lots/${PREFIX}ghost/status`)
      .send({ status: 'EN_ALERTE' })
      .expect(404);
    expect(res.body).toMatchObject({ status: 404 });
  });
});
