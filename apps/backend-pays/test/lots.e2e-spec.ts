import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import type { LotStatus } from '@futurekawa/contracts';
import { AppModule } from './../src/app.module';
import type { Lot, NewLot } from './../src/lots/domain/lot';
import {
  LOT_REPOSITORY,
  type FindManyParams,
  type LotRepository,
  type Page,
} from './../src/lots/domain/lot.repository';

// Repository en mémoire : ce test couvre le contrat HTTP (validation, status
// codes, RFC 7807, tri FIFO, pagination) sans DB réelle — l'intégration DB est
// le ticket #26 (rules/04-tests.md : pas de hit DB hors docker-compose.test.yml).
class InMemoryLotRepository implements LotRepository {
  private readonly store = new Map<string, Lot>();

  create(lot: NewLot): Promise<Lot> {
    const created: Lot = { ...lot, status: 'CONFORME' };
    this.store.set(lot.id, created);
    return Promise.resolve(created);
  }

  existsById(id: string): Promise<boolean> {
    return Promise.resolve(this.store.has(id));
  }

  findById(id: string): Promise<Lot | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findManyByStoredAt(params: FindManyParams): Promise<Page<Lot>> {
    const sorted = [...this.store.values()].sort((a, b) => {
      const diff = a.storedAt.getTime() - b.storedAt.getTime();
      // Clé secondaire `id` (parité avec le repo Prisma) : ordre stable.
      const primary = params.direction === 'asc' ? diff : -diff;
      return primary !== 0 ? primary : a.id.localeCompare(b.id);
    });
    const data = sorted.slice(params.skip, params.skip + params.take);
    return Promise.resolve({ data, total: this.store.size });
  }

  updateStatus(id: string, status: LotStatus): Promise<Lot | null> {
    const lot = this.store.get(id);
    if (!lot) {
      return Promise.resolve(null);
    }
    const updated: Lot = { ...lot, status };
    this.store.set(id, updated);
    return Promise.resolve(updated);
  }
}

const buildCreateBody = (over: Record<string, unknown> = {}) => ({
  id: 'BR-2026-100',
  country: 'BR',
  farm: 'Fazenda Aurora',
  warehouse: 'Entrepôt Sul-1',
  storedAt: '2026-06-01T08:00:00.000Z',
  ...over,
});

describe('Lots (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LOT_REPOSITORY)
      .useClass(InMemoryLotRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    // Réplique du bootstrap (main.ts) nécessaire au contrat : validation + prefix.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api', { exclude: ['health', 'ready'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  it('POST /api/v1/lots should create a lot (201) with the contract shape', async () => {
    const res = await request(server())
      .post('/api/v1/lots')
      .send(buildCreateBody({ id: 'BR-2026-001' }))
      .expect(201);

    expect(res.body).toMatchObject({
      id: 'BR-2026-001',
      country: 'BR',
      farm: 'Fazenda Aurora',
      warehouse: 'Entrepôt Sul-1',
      storedAt: '2026-06-01T08:00:00.000Z',
      status: 'CONFORME',
    });
  });

  it('POST /api/v1/lots should reject a duplicate id (409, RFC 7807)', async () => {
    await request(server())
      .post('/api/v1/lots')
      .send(buildCreateBody({ id: 'BR-2026-dup' }))
      .expect(201);

    await request(server())
      .post('/api/v1/lots')
      .send(buildCreateBody({ id: 'BR-2026-dup' }))
      .expect(409)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('POST /api/v1/lots should reject a country that is not the backend country (422)', async () => {
    await request(server())
      .post('/api/v1/lots')
      .send(buildCreateBody({ id: 'EC-2026-x', country: 'EC' }))
      .expect(422)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('POST /api/v1/lots should reject an invalid payload (400) and unknown fields', async () => {
    await request(server())
      .post('/api/v1/lots')
      .send(buildCreateBody({ id: 'BR-bad', storedAt: 'not-a-date' }))
      .expect(400);

    await request(server())
      .post('/api/v1/lots')
      .send(buildCreateBody({ id: 'BR-extra', injected: 'nope' }))
      .expect(400);
  });

  it('GET /api/v1/lots should return lots FIFO (storedAt asc) by default, paginated', async () => {
    await request(server())
      .post('/api/v1/lots')
      .send(
        buildCreateBody({
          id: 'FIFO-late',
          storedAt: '2026-09-01T00:00:00.000Z',
        }),
      )
      .expect(201);
    await request(server())
      .post('/api/v1/lots')
      .send(
        buildCreateBody({
          id: 'FIFO-early',
          storedAt: '2024-01-01T00:00:00.000Z',
        }),
      )
      .expect(201);

    const res = await request(server())
      .get('/api/v1/lots?page=1&pageSize=100')
      .expect(200);

    const body = res.body as {
      data: { id: string; storedAt: string }[];
      total: number;
      page: number;
      pageSize: number;
    };
    expect(body).toMatchObject({ page: 1, pageSize: 100 });
    expect(body.total).toBeGreaterThanOrEqual(2);
    const earlyIndex = body.data.findIndex((l) => l.id === 'FIFO-early');
    const lateIndex = body.data.findIndex((l) => l.id === 'FIFO-late');
    expect(earlyIndex).toBeLessThan(lateIndex);
  });

  it('GET /api/v1/lots?sort=storedAt:desc should reverse the order', async () => {
    const res = await request(server())
      .get('/api/v1/lots?sort=storedAt:desc&pageSize=100')
      .expect(200);
    const body = res.body as { data: { id: string }[] };
    const earlyIndex = body.data.findIndex((l) => l.id === 'FIFO-early');
    const lateIndex = body.data.findIndex((l) => l.id === 'FIFO-late');
    expect(lateIndex).toBeLessThan(earlyIndex);
  });

  it('GET /api/v1/lots should reject an invalid sort (400)', async () => {
    await request(server()).get('/api/v1/lots?sort=farm:asc').expect(400);
  });

  it('GET /api/v1/lots/:id should return 200 then 404 for an unknown id', async () => {
    await request(server())
      .post('/api/v1/lots')
      .send(buildCreateBody({ id: 'BR-detail' }))
      .expect(201);

    await request(server()).get('/api/v1/lots/BR-detail').expect(200);
    await request(server())
      .get('/api/v1/lots/UNKNOWN')
      .expect(404)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('PATCH /api/v1/lots/:id/status should update the status (200)', async () => {
    await request(server())
      .post('/api/v1/lots')
      .send(buildCreateBody({ id: 'BR-patch' }))
      .expect(201);

    const res = await request(server())
      .patch('/api/v1/lots/BR-patch/status')
      .send({ status: 'EN_ALERTE' })
      .expect(200);
    expect((res.body as { status: string }).status).toBe('EN_ALERTE');
  });

  it('PATCH /api/v1/lots/:id/status should reject an invalid status (400)', async () => {
    await request(server())
      .patch('/api/v1/lots/BR-patch/status')
      .send({ status: 'WHATEVER' })
      .expect(400);
  });

  it('PATCH /api/v1/lots/:id/status should return 404 for an unknown id', async () => {
    await request(server())
      .patch('/api/v1/lots/UNKNOWN/status')
      .send({ status: 'PERIME' })
      .expect(404);
  });
});
