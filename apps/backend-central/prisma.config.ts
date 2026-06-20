import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// La datasource url est résolue paresseusement (driver adapter au runtime) :
// `prisma generate` n'exige donc pas DATABASE_URL (postinstall CI/Docker OK).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
