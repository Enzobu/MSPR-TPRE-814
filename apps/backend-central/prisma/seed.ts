import 'dotenv/config';
import { hash } from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';

// Seed idempotent : crée (ou met à jour) l'utilisateur ADMIN initial à partir
// de l'env (ADR-0006). Identifiants jetables en dev — à changer en prod (#50).
const BCRYPT_COST = 12;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var for seed: ${key}`);
  }
  return value;
}

async function main(): Promise<void> {
  const databaseUrl = requireEnv('DATABASE_URL');
  const email = requireEnv('SEED_ADMIN_EMAIL');
  const password = requireEnv('SEED_ADMIN_PASSWORD');

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
  });

  try {
    const passwordHash = await hash(password, BCRYPT_COST);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: 'ADMIN' },
      create: { email, passwordHash, role: 'ADMIN' },
    });
    // Jamais le mot de passe dans les logs (règle 08).
    console.log(`Seeded ADMIN user ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
