import { z } from 'zod';
import { createEnvValidator } from '@futurekawa/nest-common';

// Source unique de vérité des variables d'env du backend-central.
// Le boot échoue (ConfigModule.validate) si une variable requise manque
// ou est invalide — voir rules/07-security.md « Validation d'environnement au boot ».
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // DB siège (légère : users / config / audit).
  DATABASE_URL: z.string().url(),

  // Backends pays interrogés par le gateway (ADR-0007).
  BACKEND_PAYS_BR_URL: z.string().url(),
  BACKEND_PAYS_EC_URL: z.string().url(),
  BACKEND_PAYS_CO_URL: z.string().url(),

  // Résilience des appels pays (ADR-0007).
  PAYS_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
  PAYS_REQUEST_RETRIES: z.coerce.number().int().nonnegative().default(2),
  PAYS_RETRY_BASE_MS: z.coerce.number().int().positive().default(200),
  PAYS_BREAKER_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(5),
  PAYS_BREAKER_COOLDOWN_MS: z.coerce.number().int().positive().default(30_000),

  // Cache court de l'agrégation /stocks (ADR-0007) : évite de marteler les
  // backends pays à chaque refresh du front. 0 désactive le cache.
  STOCKS_CACHE_TTL_MS: z.coerce.number().int().nonnegative().default(60_000),

  // Auth (ADR-0006). Le secret est REQUIS au boot : l'app refuse de démarrer
  // sans (signature JWT impossible) — rules/07-security.md.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Seed de l'utilisateur ADMIN initial (prisma/seed.ts). Optionnel au boot du
  // serveur — seul `prisma db seed` les exige (et échoue sinon).
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),

  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .default('info'),

  // Suivi des erreurs (Sentry, ADR-0011). Optionnel : sans DSN, le SDK est no-op
  // (dev/test). Lu directement par src/instrument.ts au boot, AVANT Nest.
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),

  // Jamais '*' en prod : liste blanche séparée par des virgules (rules/07-security.md).
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = createEnvValidator(envSchema);
