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
  Measurement,
  MeasurementBucket,
  PaginatedResponse,
} from '@futurekawa/contracts';
import { AppModule } from './../src/app.module';
import {
  COUNTRY_BACKEND_GATEWAY,
  CountryUnavailableError,
} from './../src/country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from './../src/country-backends/domain/country-backend.gateway';

// Intégration du proxy /measurements (ADR-0007) avec les backends pays MOCKÉS au
// niveau du port CountryBackendGateway : pas de vraie DB ni de vrai pays.
// Couvre : BR up → mappé ; BR down → partiel (200, pas 500) ; agrégat ; 400.
const measurement = (id: string): Measurement => ({
  id,
  country: 'BR',
  warehouse: 'W1',
  temperatureCelsius: 22.5,
  humidityPercent: 55,
  recordedAt: '2026-06-01T08:00:00.000Z',
});

const bucket = (bucketStart: string): MeasurementBucket => ({
  bucketStart,
  avgTemperatureCelsius: 22.4,
  avgHumidityPercent: 54.8,
  count: 12,
});

// Gateway en mémoire : BR répond (avec un champ interne en trop), EC est down.
class FakeGateway implements CountryBackendGateway {
  get<T>(country: CountryCode, path: string): Promise<T> {
    if (country === 'EC') {
      return Promise.reject(
        new CountryUnavailableError('EC', 'connection refused'),
      );
    }
    if (path.startsWith('/api/v1/measurements/aggregate')) {
      return Promise.resolve([bucket('2026-06-01T08:00:00.000Z')] as T);
    }
    const history: PaginatedResponse<Measurement> = {
      // Champ interne en trop : le mapper siège doit le filtrer (découplage).
      data: [{ ...measurement('m-1'), leaked: 'secret' } as Measurement],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    return Promise.resolve(history as T);
  }

  patch<T>(): Promise<T> {
    return Promise.reject(new Error('patch not used by /measurements'));
  }
}

describe('Measurements proxy (e2e, mocked country backends)', () => {
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

  it('GET /api/v1/measurements?country=BR should return mapped data and empty unavailable', async () => {
    const res = await request(server())
      .get('/api/v1/measurements?country=BR&warehouse=W1')
      .expect(200);
    const body = res.body as {
      data: { id: string }[];
      total: number;
      unavailable: string[];
    };

    expect(body.unavailable).toEqual([]);
    expect(body.total).toBe(1);
    expect(body.data.map((m) => m.id)).toEqual(['m-1']);
    // Le mapper siège filtre les champs internes du pays (découplage).
    expect(body.data.every((m) => !('leaked' in m))).toBe(true);
  });

  it('GET /api/v1/measurements when the country is down should return empty data and unavailable (no 500)', async () => {
    const res = await request(server())
      .get('/api/v1/measurements?country=EC&warehouse=W1')
      .expect(200);
    const body = res.body as { data: unknown[]; unavailable: string[] };
    expect(body.data).toEqual([]);
    expect(body.unavailable).toEqual(['EC']);
  });

  it('GET /api/v1/measurements/aggregate should return buckets and empty unavailable', async () => {
    const res = await request(server())
      .get('/api/v1/measurements/aggregate?country=BR&warehouse=W1&bucket=1h')
      .expect(200);
    const body = res.body as {
      data: { bucketStart: string }[];
      unavailable: string[];
    };
    expect(body.unavailable).toEqual([]);
    expect(body.data.map((b) => b.bucketStart)).toEqual([
      '2026-06-01T08:00:00.000Z',
    ]);
  });

  it('GET /api/v1/measurements should reject a missing country with 400 (RFC 7807)', async () => {
    await request(server())
      .get('/api/v1/measurements?warehouse=W1')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/measurements should reject a missing warehouse with 400', async () => {
    await request(server())
      .get('/api/v1/measurements?country=BR')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('GET /api/v1/measurements/aggregate should reject an invalid bucket with 400', async () => {
    await request(server())
      .get('/api/v1/measurements/aggregate?country=BR&warehouse=W1&bucket=2h')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });
});
