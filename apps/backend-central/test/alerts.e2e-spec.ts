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
  Alert,
  CountryCode,
  PaginatedResponse,
} from '@futurekawa/contracts';
import { AppModule } from './../src/app.module';
import {
  COUNTRY_BACKEND_GATEWAY,
  CountryRequestError,
  CountryUnavailableError,
} from './../src/country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from './../src/country-backends/domain/country-backend.gateway';

// Intégration de l'agrégation /alerts (ADR-0007) avec les backends pays MOCKÉS au
// niveau du port CountryBackendGateway : pas de vraie DB ni de vrai pays.
// Couvre : liste consolidée (2 up + 1 down) ; filtres relayés ; 400 ; ACK proxy
// (200 / 503 si pays down / 404 si alerte inconnue / 400 si country manquant).
const alert = (
  id: string,
  country: CountryCode,
  triggeredAt: string,
): Alert => ({
  id,
  country,
  type: 'TEMPERATURE_OUT_OF_RANGE',
  message: 'msg',
  triggeredAt,
  acknowledged: false,
});

const page = (data: Alert[]): PaginatedResponse<Alert> => ({
  data,
  total: data.length,
  page: 1,
  pageSize: 100,
});

// BR & CO répondent (BR avec un champ interne en trop), EC est down.
// PATCH : BR ack OK pour 'br-new', 404 pour 'unknown' ; EC down → unavailable.
class FakeGateway implements CountryBackendGateway {
  get<T>(country: CountryCode): Promise<T> {
    if (country === 'EC') {
      return Promise.reject(
        new CountryUnavailableError('EC', 'connection refused'),
      );
    }
    const data: Record<string, Alert[]> = {
      BR: [
        {
          ...alert('br-new', 'BR', '2026-09-01T00:00:00.000Z'),
          leaked: 'secret',
        } as Alert,
        alert('br-old', 'BR', '2025-02-01T00:00:00.000Z'),
      ],
      CO: [alert('co-mid', 'CO', '2026-03-01T00:00:00.000Z')],
    };
    return Promise.resolve(page(data[country] ?? []) as T);
  }

  patch<T>(country: CountryCode, path: string): Promise<T> {
    if (country === 'EC') {
      return Promise.reject(new CountryUnavailableError('EC', 'down'));
    }
    if (path.includes('/unknown/')) {
      return Promise.reject(new CountryRequestError('BR', 404, 'not found'));
    }
    return Promise.resolve({
      ...alert('br-new', 'BR', '2026-09-01T00:00:00.000Z'),
      acknowledged: true,
    } as T);
  }
}

describe('Alerts aggregation (e2e, mocked country backends)', () => {
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

  it('GET /api/v1/alerts should consolidate available countries (recent first) and report the unavailable one (200, not 500)', async () => {
    const res = await request(server()).get('/api/v1/alerts').expect(200);
    const body = res.body as {
      data: { id: string }[];
      total: number;
      unavailable: string[];
    };

    expect(body.unavailable).toEqual(['EC']);
    expect(body.total).toBe(3);
    // Récentes d'abord : br-new (2026-09) > co-mid (2026-03) > br-old (2025-02).
    expect(body.data.map((a) => a.id)).toEqual(['br-new', 'co-mid', 'br-old']);
    // Le mapper siège filtre les champs internes du pays (découplage).
    expect(body.data.every((a) => !('leaked' in a))).toBe(true);
  });

  it('GET /api/v1/alerts should relay acknowledged and type filters to the countries', async () => {
    const res = await request(server())
      .get('/api/v1/alerts?type=TEMPERATURE_OUT_OF_RANGE&acknowledged=false')
      .expect(200);
    const body = res.body as { data: unknown[]; unavailable: string[] };
    // Les filtres sont relayés tels quels (le FakeGateway renvoie tout) : on
    // vérifie surtout que la query passe la validation et reste consolidée.
    expect(body.unavailable).toEqual(['EC']);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /api/v1/alerts?country=BR should target a single country', async () => {
    const res = await request(server())
      .get('/api/v1/alerts?country=BR')
      .expect(200);
    const body = res.body as {
      data: { country: string }[];
      unavailable: string[];
    };
    expect(body.unavailable).toEqual([]);
    expect(body.data.every((a) => a.country === 'BR')).toBe(true);
  });

  it('GET /api/v1/alerts should reject an invalid type with 400 (RFC 7807)', async () => {
    await request(server())
      .get('/api/v1/alerts?type=NOPE')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/alerts should reject an invalid acknowledged with 400', async () => {
    await request(server())
      .get('/api/v1/alerts?acknowledged=maybe')
      .expect(400);
  });

  it('PATCH /api/v1/alerts/:id/acknowledge?country=BR should acknowledge and return the alert', async () => {
    const res = await request(server())
      .patch('/api/v1/alerts/br-new/acknowledge?country=BR')
      .expect(200);
    const body = res.body as { id: string; acknowledged: boolean };
    expect(body.id).toBe('br-new');
    expect(body.acknowledged).toBe(true);
    expect('leaked' in body).toBe(false);
  });

  it('PATCH /api/v1/alerts/:id/acknowledge without country should return 400', async () => {
    await request(server())
      .patch('/api/v1/alerts/br-new/acknowledge')
      .expect(400);
  });

  it('PATCH /api/v1/alerts/:id/acknowledge for an unreachable country should return 503 (not a fake confirmation)', async () => {
    await request(server())
      .patch('/api/v1/alerts/x/acknowledge?country=EC')
      .expect(503)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('PATCH /api/v1/alerts/:id/acknowledge for an unknown alert should return 404', async () => {
    await request(server())
      .patch('/api/v1/alerts/unknown/acknowledge?country=BR')
      .expect(404)
      .expect('Content-Type', /application\/problem\+json/);
  });
});
