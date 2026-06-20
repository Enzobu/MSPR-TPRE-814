import * as Sentry from '@sentry/nestjs';

// Sentry doit être initialisé AVANT tout autre import applicatif : main.ts importe
// ce fichier en toute première ligne (rules/08-observability.md, ADR-0011).
// Sans SENTRY_DSN, l'init est sautée → le SDK devient no-op (dev/test).
// Erreurs uniquement : pas de tracing de perf (tracesSampleRate 0) pour rester
// dans le free tier Sentry (ticket #127). Les variables sont validées par zod
// (config/env.validation.ts) mais lues ici directement, avant le boot de Nest.
const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}
