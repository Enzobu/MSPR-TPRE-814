import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ExpireLotsUseCase } from './../src/alerts/application/expire-lots.use-case';
import { PrismaService } from './../src/infrastructure/persistence/prisma.service';

// Intégration de bout en bout du cron péremption (CDC §III.4, ADR-0004, #33)
// contre une VRAIE MariaDB. On instancie le use-case depuis le contexte Nest
// (pas le cron ni l'horloge) et on appelle .execute(now) pour rester
// déterministe. Pré-requis : `docker compose -f docker-compose.test.yml up -d`.
// Pays de test : BR (setup-e2e.ts). Fixtures préfixées `IT-`, nettoyées avant/après.
const PREFIX = 'IT-';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('Lot expiration cron (e2e, real DB)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let expireLots: ExpireLotsUseCase;

  const expiredId = `${PREFIX}exp-400`;
  const freshId = `${PREFIX}fresh-300`;

  const cleanup = async (): Promise<void> => {
    await prisma.alert.deleteMany({ where: { lotId: { startsWith: PREFIX } } });
    await prisma.lot.deleteMany({ where: { id: { startsWith: PREFIX } } });
  };

  const seedLots = async (now: Date): Promise<void> => {
    await prisma.lot.createMany({
      data: [
        {
          id: expiredId,
          country: 'BR',
          farm: 'Fazenda',
          warehouse: `${PREFIX}W1`,
          storedAt: new Date(now.getTime() - 400 * MS_PER_DAY),
          status: 'CONFORME',
        },
        {
          id: freshId,
          country: 'BR',
          farm: 'Fazenda',
          warehouse: `${PREFIX}W1`,
          storedAt: new Date(now.getTime() - 300 * MS_PER_DAY),
          status: 'CONFORME',
        },
      ],
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    expireLots = app.get(ExpireLotsUseCase);
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const lotStatus = async (id: string): Promise<string> => {
    const lot = await prisma.lot.findUnique({ where: { id } });
    return lot?.status ?? 'NOT_FOUND';
  };

  const expiredAlerts = (lotId: string) =>
    prisma.alert.findMany({ where: { lotId, type: 'LOT_EXPIRED' } });

  it('should expire the 400d lot and raise one alert, leaving the 300d lot untouched', async () => {
    // Arrange
    const now = new Date();
    await seedLots(now);

    // Act
    await expireLots.execute(now);

    // Assert
    expect(await lotStatus(expiredId)).toBe('PERIME');
    expect(await lotStatus(freshId)).toBe('CONFORME');
    expect(await expiredAlerts(expiredId)).toHaveLength(1);
    expect(await expiredAlerts(freshId)).toHaveLength(0);
  });

  it('should stay idempotent on a second run the same day', async () => {
    // Act : second passage, même jour.
    await expireLots.execute(new Date());

    // Assert : toujours une seule alerte, lot toujours PERIME.
    expect(await expiredAlerts(expiredId)).toHaveLength(1);
    expect(await lotStatus(expiredId)).toBe('PERIME');
  });
});
