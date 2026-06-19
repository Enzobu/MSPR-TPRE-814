import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// L'env requis est posé par test/setup-e2e.ts (setupFiles), avant tout import :
// ConfigModule.forRoot valide dès l'évaluation de AppModule.
describe('Backbone (e2e)', () => {
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

  it('GET an unknown route should return an RFC 7807 problem', () => {
    return request(app.getHttpServer())
      .get('/api/v1/does-not-exist')
      .expect(404)
      .expect('Content-Type', /application\/problem\+json/)
      .expect((res) => {
        const body = res.body as {
          status: number;
          title: string;
          instance: string;
        };
        expect(body).toMatchObject({ status: 404, title: 'Not Found' });
        expect(body.instance).toBe('/api/v1/does-not-exist');
      });
  });
});
