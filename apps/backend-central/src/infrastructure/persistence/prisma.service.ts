import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import type { Env } from '../../config/env.validation';
import { PrismaClient } from '../../generated/prisma/client';

// PrismaService unique (DB siège légère : users/config/audit). Client généré pour
// MariaDB via driver adapter (pas de binaire query-engine à embarquer).
// Connexion paresseuse : le boot ne bloque pas si la DB est down — la liveness
// reste verte, /ready reporte l'indisponibilité au premier query.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    super({ adapter: new PrismaMariaDb(config.get('DATABASE_URL')) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
