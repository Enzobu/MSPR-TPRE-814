import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// L'env requis est posé par test/setup-e2e.ts (setupFiles), avant tout import.
describe('Backbone central (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health', 'ready'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health should return 200 (liveness)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as { status: string };
        expect(body.status).toBe('ok');
      });
  });

  it('GET /api/v1/countries/FR/ping should reject an unknown country (RFC 7807)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/countries/FR/ping')
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/)
      .expect((res) => {
        const body = res.body as { status: number; title: string };
        expect(body).toMatchObject({ status: 400, title: 'Bad Request' });
      });
  });

  it('GET /api/v1/countries/BR/ping should return reachable:false when the pays is down', () => {
    return request(app.getHttpServer())
      .get('/api/v1/countries/BR/ping')
      .expect(200)
      .expect((res) => {
        const body = res.body as { country: string; reachable: boolean };
        expect(body).toMatchObject({ country: 'BR', reachable: false });
      });
  });
});
