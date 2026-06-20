---
title: Suivi des erreurs (Sentry)
owner: Yanis
status: implemented
cdc-ref: "§V.2"
adr-refs: [0011]
updated: 2026-06-20
---

# Suivi des erreurs (Sentry)

## Objectif métier

Capturer automatiquement les erreurs de **production** (backend + frontend) avec
stacktrace, contexte et fréquence, pour diagnostiquer vite **sans accès direct aux
conteneurs**. Déclencheur : un 500 au login en prod impossible à comprendre sans lire
les logs à la main. Cadré par le ticket #127 et la règle `08-observability`.

## Scope

**Inclus :**
- SDK Sentry sur `backend-central` et `backend-pays` (capture des 5xx + correlation-id).
- SDK Sentry sur `frontend-web` (erreurs JS globales + Error Boundary React).
- DSN via variables d'env, environnement + release taggés.
- Upload optionnel des sourcemaps front (stacktraces lisibles).

**Hors scope :**
- Alerting avancé / dashboards custom Sentry.
- Tracing de performance (`tracesSampleRate: 0`).

## Parcours utilisateur

- En tant qu'équipe, je veux voir les erreurs de prod dans une interface afin de
  diagnostiquer sans me connecter aux conteneurs.

## Règles métier

- **5xx → Sentry, 4xx → ignorées** : les erreurs client (validation, not found…) sont
  du bruit métier attendu, jamais remontées (économie du free tier 5k/mois).
- **Sans DSN, SDK no-op** : aucun envoi en dev/test.
- **Pas de PII** (`sendDefaultPii: false`) ; secrets déjà rédigés par pino côté logs.

## Architecture technique

```mermaid
flowchart LR
  FE[frontend-web<br/>@sentry/react] -->|VITE_SENTRY_DSN| S[(Sentry SaaS EU<br/>de.sentry.io · org mspr-sd)]
  BC[backend-central<br/>@sentry/nestjs] -->|SENTRY_DSN| S
  BP[backend-pays<br/>@sentry/nestjs] -->|SENTRY_DSN| S
```

- Backends : `src/instrument.ts` (init **avant** tout autre import dans `main.ts`),
  `SentryModule.forRoot()` (`@sentry/nestjs/setup`), capture des 5xx dans le
  `ProblemDetailsFilter` partagé (`@futurekawa/nest-common`) avec le `correlation_id`.
- Front : init dans `main.tsx`, capture dans l'`ErrorBoundary` racine.
- Décision et alternative (GlitchTip self-hosted) : voir [ADR-0011](../adr/0011-error-monitoring-sentry.md).

## Contrats / Variables d'env

| App | Variable | Nature |
|---|---|---|
| backend-central | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` | config (DSN sensible) |
| backend-pays | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` | config (DSN sensible) |
| frontend-web | `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, `VITE_SENTRY_RELEASE` | **public** (bundle) |
| build front | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_URL` | secret (sourcemaps) |

Compose : `BACKEND_CENTRAL_SENTRY_DSN`, `BACKEND_PAYS_SENTRY_DSN`, `FRONTEND_SENTRY_DSN`,
`SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `SENTRY_AUTH_TOKEN` (voir `.env.compose.example`).

## Implémentation

- **Backend init** : [`apps/backend-central/src/instrument.ts`](../../apps/backend-central/src/instrument.ts),
  [`apps/backend-pays/src/instrument.ts`](../../apps/backend-pays/src/instrument.ts)
- **Capture 5xx (partagé)** : [`packages/nest-common/src/filters/problem-details.filter.ts`](../../packages/nest-common/src/filters/problem-details.filter.ts)
- **Front init** : [`apps/frontend-web/src/main.tsx`](../../apps/frontend-web/src/main.tsx)
- **Front Error Boundary** : [`apps/frontend-web/src/components/error-boundary.tsx`](../../apps/frontend-web/src/components/error-boundary.tsx)
- **Sourcemaps** : [`apps/frontend-web/vite.config.ts`](../../apps/frontend-web/vite.config.ts)

## Tests

| Niveau | Fichier | Couvre |
|---|---|---|
| Unit | `packages/nest-common/src/filters/problem-details.filter.spec.ts` | 5xx → Sentry (+ correlation-id), 4xx ignorées |
| UI | `apps/frontend-web/tests/components/error-boundary.test.tsx` | l'Error Boundary remonte l'erreur à Sentry |

## Déploiement (Dokploy)

1. Renseigner les DSN dans l'env du service Dokploy de chaque app
   (`SENTRY_DSN` backend, `VITE_SENTRY_DSN` front — rebuild front requis car inliné).
2. `SENTRY_ENVIRONMENT=production`, `SENTRY_RELEASE=<git sha>`.
3. (Optionnel) `SENTRY_AUTH_TOKEN` en secret de build pour uploader les sourcemaps.

## Évolutions / TODO

- [ ] Tagger `SENTRY_RELEASE` automatiquement avec le SHA git en CI.
- [ ] Restreindre l'inscription sur l'org Sentry (déjà privée).
- [ ] Évaluer le passage à GlitchTip self-hosted si la souveraineté devient un critère.
