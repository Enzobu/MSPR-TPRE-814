---
title: Conventions API REST
owner: Yanis
status: in-progress
cdc-ref: "§IV.4.1"
adr-refs: [0001, 0007]
updated: 2026-06-20
---

# Conventions API REST

Les deux backends (pays et central) exposent une API REST suivant les mêmes
conventions. Cette page les fige ; la **référence exhaustive** (chaque endpoint,
DTO, exemple) est dans le **Swagger** de chaque backend.

## Swagger / OpenAPI

| Backend | Swagger UI | Titre |
|---|---|---|
| backend-pays | `/api-docs` | FutureKawa — backend-pays |
| backend-central | `/api-docs` | FutureKawa — backend-central |

Chaque endpoint, DTO d'entrée et DTO de sortie est décoré (`@ApiTags`,
`@ApiOperation`, `@ApiProperty` avec exemples réalistes, `@ApiResponse`). La
collection **Bruno** (`bruno/`) est maintenue en parallèle (un `.bru` par route,
avec blocs `docs` et `tests`).

## Versioning

- Préfixe global **`/api`** + versioning par URI : **`/api/v1/...`**.
- `/health` et `/ready` restent **à la racine** (hors préfixe), pour les
  healthchecks Docker.

```
GET /api/v1/lots
GET /api/v1/measurements
GET /api/v1/alerts
GET /health     # liveness
GET /ready      # readiness (DB, MQTT, SMTP…)
```

## Ressources & verbes

- **Ressources au pluriel** : `/lots`, `/measurements`, `/alerts`, `/stocks`.
- **Verbes sémantiques** : `GET` (idempotent), `POST` (crée), `PATCH` (partiel),
  `PUT` (remplace), `DELETE` (supprime).

| Code | Sens |
|---|---|
| 200 | OK |
| 201 | Création |
| 204 | Suppression sans contenu |
| 400 | Validation (DTO invalide) |
| 404 | Ressource absente |
| 409 | Conflit |
| 422 | Règle métier violée |
| 500 | Erreur serveur (bug, dépendance critique down) |

## Erreurs — RFC 7807

Toutes les erreurs sont normalisées en **`application/problem+json`** via un
`ExceptionFilter` global (`packages/nest-common`), jamais de stacktrace ni de
détail interne renvoyé au client (règle 07).

```jsonc
{
  "type": "https://futurekawa/errors/validation",
  "title": "Validation failed",
  "status": 400,
  "detail": "humidityPercent must not be greater than 100",
  "instance": "/api/v1/measurements"
}
```

## Pagination, tri, filtrage

- **Pagination** : `?page=1&pageSize=20` → `{ data, total, page, pageSize }`.
- **Tri** : `?sort=storedAt:desc` (essentiel pour le FIFO des lots).
- **Filtrage** : query params dédiés (ex. `?warehouse=W1&from=...&to=...`).

## Réponses consolidées (siège)

Les endpoints d'agrégation du central renvoient une **réponse partielle** plutôt
qu'une erreur quand un pays est injoignable (ADR-0007) :

```jsonc
// GET /api/v1/stocks/global
{ "data": [ /* ... */ ], "unavailable": ["EC"] }
```

DTO : `ConsolidatedResponseDto<T>`. Voir [distributed.md](distributed.md).

## Sécurité transverse (entrée HTTP)

Configuré dans le `main.ts` de chaque backend :

- **`helmet()`** (en-têtes de sécurité).
- **CORS explicite** via `CORS_ORIGIN` (liste blanche), **jamais `*`** ; `credentials: true`.
- **`ValidationPipe` global** : `whitelist`, `forbidNonWhitelisted`, `transform`.
- **Auth** : `Bearer` (JWT) déclaré dans Swagger — stratégie figée par [ADR-0006](../adr/0006-auth-strategy.md).
- **Correlation-id** : `x-correlation-id` propagé et journalisé (règle 08).

## Références

- [ADR-0007 — Résilience / réponses partielles](../adr/0007-resilience-strategy.md)
- [ADR-0006 — Auth](../adr/0006-auth-strategy.md)
- `main.ts` de chaque backend · `packages/nest-common` (filtre RFC 7807)
- Collection Bruno : [`../../bruno/README.md`](../../bruno/README.md)
- Distribution : [distributed.md](distributed.md)
