import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ProblemDetailsFilter } from './../src/common/filters/problem-details.filter';
import { BcryptPasswordHasher } from './../src/auth/infrastructure/bcrypt-password-hasher';
import { PrismaService } from './../src/infrastructure/persistence/prisma.service';

// Intégration de bout en bout du flow d'auth (ADR-0006) contre une vraie DB.
// Pré-requis : MariaDB central up + migration appliquée (docker compose up
// mariadb-central puis prisma migrate deploy). Non exécuté par `pnpm -r test`
// (qui ne lance que les .spec.ts) ; lancer via `pnpm --filter backend-central test:e2e`.
const ADMIN_EMAIL = 'e2e-admin@futurekawa.local';
const ADMIN_PASSWORD = 'Adm1n-FutureKawa-2026';
const REFRESH_COOKIE = 'fk_refresh';

const cookieHeader = (res: request.Response): string[] => {
  const raw = res.headers['set-cookie'];
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
};

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
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
    const passwordHash = await new BcryptPasswordHasher().hash(ADMIN_PASSWORD);
    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: { passwordHash, role: 'ADMIN' },
      create: { email: ADMIN_EMAIL, passwordHash, role: 'ADMIN' },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } });
    await app.close();
  });

  it('should reject a malformed login payload with 400', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'x' })
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('should reject invalid credentials with 401 (RFC 7807)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'WrongPassword-123' })
      .expect(401)
      .expect('Content-Type', /application\/problem\+json/);
  });

  it('should log in, return an access token in the body and a refresh cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);

    const body = res.body as { accessToken: string; user: { role: string } };
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user).toMatchObject({ email: ADMIN_EMAIL, role: 'ADMIN' });
    expect(body).not.toHaveProperty('refreshToken');

    const cookies = cookieHeader(res);
    const refresh = cookies.find((c) => c.startsWith(`${REFRESH_COOKIE}=`));
    expect(refresh).toBeDefined();
    expect(refresh).toMatch(/HttpOnly/i);
    expect(refresh).toMatch(/SameSite=Strict/i);
  });

  it('should return the current user on GET /me with a bearer token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);
    const { accessToken } = login.body as { accessToken: string };

    return request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({ email: ADMIN_EMAIL, role: 'ADMIN' });
      });
  });

  it('should reject GET /me without a token with 401', () => {
    return request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('should rotate tokens on refresh using the cookie', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);
    const refreshCookie = cookieHeader(login).find((c) =>
      c.startsWith(`${REFRESH_COOKIE}=`),
    ) as string;

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);

    const body = res.body as { accessToken: string };
    expect(body.accessToken).toEqual(expect.any(String));
    expect(
      cookieHeader(res).some((c) => c.startsWith(`${REFRESH_COOKIE}=`)),
    ).toBe(true);
  });

  it('should reject refresh without a cookie with 401', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .expect(401);
  });

  it('should clear the refresh cookie on logout with 204', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .expect(204);

    const cleared = cookieHeader(res).find((c) =>
      c.startsWith(`${REFRESH_COOKIE}=`),
    );
    expect(cleared).toBeDefined();
  });
});
