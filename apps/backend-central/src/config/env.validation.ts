import { z } from 'zod';

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

  // Auth (branchée par une feature ultérieure — ADR-0006). Optionnel au backbone.
  JWT_SECRET: z.string().optional(),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .default('info'),

  // Jamais '*' en prod : liste blanche séparée par des virgules (rules/07-security.md).
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return result.data;
}
