import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Pas d'url dans schema.prisma (driver adapter au runtime) → `prisma generate`
// n'exige pas DATABASE_URL (postinstall CI/Docker OK, la var n'existe qu'au
// runtime). MAIS `prisma migrate deploy` (lancé au boot par entrypoint.sh) en a
// besoin : on l'injecte ICI, **uniquement quand DATABASE_URL est définie**
// (runtime), jamais au build → generate ne casse pas.
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
