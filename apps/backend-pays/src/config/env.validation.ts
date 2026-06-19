import { z } from 'zod';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import { createEnvValidator } from '@futurekawa/nest-common';

// Source unique de vérité des variables d'env du backend-pays.
// Le boot échoue (ConfigModule.validate) si une variable requise manque
// ou est invalide — voir rules/07-security.md « Validation d'environnement au boot ».
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // BR | EC | CO — pilote les seuils via @futurekawa/contracts.
  COUNTRY_CODE: z.enum(COUNTRY_CODES),

  DATABASE_URL: z.string().url(),
  MQTT_URL: z.string().url(),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  MQTT_CLIENT_ID: z.string().default('backend-pays'),

  // Alerting (mailer) — branché par une feature ultérieure, optionnel au boot du backbone.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  ALERT_RECIPIENT: z.string().optional(),

  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .default('info'),

  // Jamais '*' en prod : liste blanche séparée par des virgules (rules/07-security.md).
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = createEnvValidator(envSchema);
