---
title: Suivi des erreurs (Sentry SaaS, région EU)
owner: Yanis
status: accepted
updated: 2026-06-20
---

# 0011 — Suivi des erreurs (Sentry SaaS, région EU)

## Contexte

Les erreurs en production sont difficiles à diagnostiquer sans outil dédié : lors de
la première mise en ligne, un **500 au login** n'a pu être compris qu'en lisant les
logs des conteneurs à la main (cause réelle : migrations DB non lancées au boot).

On veut **capturer automatiquement** les exceptions **backend** (backend-central,
backend-pays) et **frontend** (SPA React) en prod, avec stacktrace, contexte et
fréquence, consultables dans une interface — sans accès direct aux conteneurs.
Exigence cadrée par le ticket #127 et la règle [`08-observability`](../../.claude/rules/08-observability.md).

Deux options principales :

1. **Sentry SaaS** (sentry.io) — DSN, zéro infra, free tier (5k erreurs/mois,
   rétention 30 j) largement suffisant pour le projet. Données hébergées chez Sentry
   (région **EU** sélectionnable : `de.sentry.io`).
2. **Self-hosted** — Sentry complet (20+ conteneurs : Kafka, ClickHouse, Snuba,
   Relay… ~8-16 Go RAM) inadapté à notre VPS Dokploy ; ou **GlitchTip**,
   compatible API/SDK Sentry, léger (Postgres + Redis + web + worker).

Le **SDK applicatif est identique** dans les deux cas (le DSN pointe vers l'instance
choisie) : la décision est donc **réversible** sans toucher au code.

## Décision

On retient **Sentry SaaS, région EU** (org `mspr-sd`, hébergement `de.sentry.io`).

- Un **projet Sentry par app** : `backend-central`, `backend-pays`, `frontend-web`.
- **DSN via variables d'env** (`SENTRY_DSN` backend, `VITE_SENTRY_DSN` front), jamais
  en dur. Le DSN front est **public par nature** (inliné au bundle) ; les DSN backend
  sont traités comme config sensible (env Dokploy, non commités).
- **Erreurs uniquement** : `tracesSampleRate: 0` (pas de tracing de performance) pour
  rester dans le free tier.
- **Backends** : init dans `src/instrument.ts` (importé en première ligne de
  `main.ts`), `SentryModule.forRoot()` (depuis `@sentry/nestjs/setup`), et capture
  des **5xx uniquement** dans le `ProblemDetailsFilter` partagé (avec le
  `correlation_id`). Les 4xx (validation, not found…) sont du bruit métier attendu et
  ne sont **pas** envoyées.
- **Front** : init dans `main.tsx`, capture dans l'`ErrorBoundary` racine + handlers
  globaux JS du SDK. **Sourcemaps** uploadées au build Vite **uniquement** si
  `SENTRY_AUTH_TOKEN` est fourni (CI/Dokploy) — sinon build normal sans upload.
- Sans DSN, **chaque SDK est no-op** : aucun impact en dev/test.
- **GlitchTip** est conservé comme **alternative documentée** : pour basculer en
  self-hosted souverain, déployer GlitchTip sur Dokploy et remplacer les DSN. Aucun
  changement de code requis.

## Conséquences

**Positives**
- Mise en place immédiate, zéro infra à exploiter/sauvegarder.
- Diagnostic prod (stacktrace + correlation-id + fréquence) sans accès conteneur.
- Réversible : passage à GlitchTip self-hosted = un changement de DSN.
- Free tier suffisant ; données en région EU.

**Négatives / neutres**
- Données d'erreurs hébergées chez un tiers (acceptable : pas de PII,
  `sendDefaultPii: false`).
- Le free tier plafonne à 5k erreurs/mois (suffisant ; au-delà, échantillonner).
- Le DSN front est public (normal pour un DSN navigateur, non sensible).
