/// <reference types="vite/client" />

// Typage strict des variables VITE_* du projet (rules/02-code.md : pas de `any`).
// ⚠ Toute variable VITE_* est PUBLIQUE (inlinée dans le bundle) — jamais de secret.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // Suivi des erreurs front (Sentry, ADR-0011). DSN public par nature.
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  readonly VITE_SENTRY_RELEASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
