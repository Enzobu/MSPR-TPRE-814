import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// La datasource url est résolue paresseusement via env("DATABASE_URL") dans
// schema.prisma : `prisma generate` ne doit donc PAS exiger DATABASE_URL
// (sinon postinstall casse en CI/Docker où la var n'existe qu'au runtime).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
});
