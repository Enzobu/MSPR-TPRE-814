import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ProblemDetailsFilter } from '@futurekawa/nest-common';
import type {
  CountryCode,
  Lot,
  PaginatedResponse,
} from '@futurekawa/contracts';
import { AppModule } from './../src/app.module';
import {
  COUNTRY_BACKEND_GATEWAY,
  CountryUnavailableError,
} from './../src/country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from './../src/country-backends/domain/country-backend.gateway';

// Intégration de l'agrégation /stocks (ADR-0007) avec les backends pays MOCKÉS
// au niveau du port CountryBackendGateway : pas de vraie DB ni de vrai pays.
// Couvre : 3 pays up → complet ; 1 pays down → partiel (pas de 500) ; FIFO.
const lot = (id: string, country: CountryCode, storedAt: string): Lot => ({
  id,
  country,
  farm: 'Farm',
  warehouse: 'WH',
  storedAt,
  status: 'CONFORME',
});

const page = (data: Lot[]): PaginatedResponse<Lot> => ({
  data,
  total: data.length,
  page: 1,
  pageSize: 100,
});

// Gateway en mémoire : BR & CO répondent, EC est down.
class FakeGateway implements CountryBackendGateway {
  get<T>(country: CountryCode): Promise<T> {
    if (country === 'EC') {
      return Promise.reject(
        new CountryUnavailableError('EC', 'connection refused'),
      );
    }
    const data: Record<string, Lot[]> = {
      BR: [
        // Champ interne en trop : le mapper siège doit le filtrer (découplage).
        {
          ...lot('BR-new', 'BR', '2026-09-01T00:00:00.000Z'),
          leaked: 'secret',
        } as Lot,
        lot('BR-old', 'BR', '2025-02-01T00:00:00.000Z'),
      ],
      CO: [lot('CO-mid', 'CO', '2026-03-01T00:00:00.000Z')],
    };
    return Promise.resolve(page(data[country] ?? []) as T);
  }

  patch<T>(): Promise<T> {
    return Promise.reject(new Error('patch not used by /stocks'));
  }
}

describe('Stocks aggregation (e2e, mocked country backends)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(COUNTRY_BACKEND_GATEWAY)
      .useClass(FakeGateway)
      .compile();

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
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  it('GET /api/v1/stocks should consolidate available countries FIFO and report the unavailable one (200, not 500)', async () => {
    const res = await request(server())
      .get('/api/v1/stocks?pageSize=100')
      .expect(200);
    const body = res.body as {
      data: { id: string }[];
      total: number;
      unavailable: string[];
    };

    // BR + CO disponibles (3 lots), EC down.
    expect(body.unavailable).toEqual(['EC']);
    expect(body.total).toBe(3);
    // FIFO global croissant : old (2025) < mid (2026-03) < new (2026-09).
    expect(body.data.map((l) => l.id)).toEqual(['BR-old', 'CO-mid', 'BR-new']);
    // Le mapper siège filtre les champs internes du pays (découplage).
    expect(body.data.every((l) => !('leaked' in l))).toBe(true);
  });

  it('GET /api/v1/stocks?sort=storedAt:desc should reverse the FIFO order', async () => {
    const res = await request(server())
      .get('/api/v1/stocks?sort=storedAt:desc&pageSize=100')
      .expect(200);
    const ids = (res.body as { data: { id: string }[] }).data.map((l) => l.id);
    expect(ids).toEqual(['BR-new', 'CO-mid', 'BR-old']);
  });

  it('GET /api/v1/stocks?country=BR should return only that country', async () => {
    const res = await request(server())
      .get('/api/v1/stocks?country=BR&pageSize=100')
      .expect(200);
    const body = res.body as {
      data: { country: string }[];
      unavailable: string[];
    };
    expect(body.unavailable).toEqual([]);
    expect(body.data.every((l) => l.country === 'BR')).toBe(true);
  });

  it('GET /api/v1/stocks?country=EC should return empty data and mark EC unavailable (no 500)', async () => {
    const res = await request(server())
      .get('/api/v1/stocks?country=EC')
      .expect(200);
    const body = res.body as { data: unknown[]; unavailable: string[] };
    expect(body.data).toEqual([]);
    expect(body.unavailable).toEqual(['EC']);
  });

  it('GET /api/v1/stocks should paginate the merged set', async () => {
    const res = await request(server())
      .get('/api/v1/stocks?page=1&pageSize=2')
      .expect(200);
    const body = res.body as {
      data: unknown[];
      total: number;
      pageSize: number;
    };
    expect(body.total).toBe(3);
    expect(body.pageSize).toBe(2);
    expect(body.data).toHaveLength(2);
  });

  it('GET /api/v1/stocks should reject an invalid sort with 400 (RFC 7807)', async () => {
    await request(server())
      .get('/api/v1/stocks?sort=farm:asc')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/stocks should reject an invalid country with 400', async () => {
    await request(server()).get('/api/v1/stocks?country=XX').expect(400);
  });
});
