import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import type { Env } from '../../config/env.validation';
import { PrismaClient } from '../../generated/prisma/client';

// PrismaService unique (rules backend-pays). Le client est généré pour MariaDB
// via driver adapter (pas de binaire query-engine à embarquer).
// Connexion paresseuse (pas de $connect eager) : le boot ne bloque pas si la DB
// est down — la liveness reste verte, /ready reporte l'indisponibilité au premier
// query (rules/08-observability.md). $disconnect au shutdown pour fermer le pool.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    super({ adapter: new PrismaMariaDb(config.get('DATABASE_URL')) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
