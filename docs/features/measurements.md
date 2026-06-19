---
title: Mesures IoT (historique T°/humidité, agrégat)
owner: Yanis
status: in-progress
cdc-ref: "§III.2"
adr-refs: [0002]
updated: 2026-06-19
---

# Mesures IoT (T°/humidité)

## Objectif métier

Conserver et exposer les relevés de température et d'humidité remontés par les
modules IoT de chaque entrepôt (CDC §III.2). Les responsables d'exploitation
consultent l'historique d'un entrepôt et des moyennes lissées (par heure ou par
jour) pour suivre les conditions de stockage du café vert et détecter les
dérives avant qu'un lot ne bascule en alerte.

## Scope

**Inclus (ce PR, #29) :**
- Modèle Prisma `Measurement` du backend-pays (DB locale au pays).
- Migration `add_measurement` (réutilise l'enum `Country`).
- Index `@@index([warehouse, recordedAt])` (requête historique principale).
- API REST `GET /api/v1/measurements` (historique paginé, tri recordedAt desc).
- API REST `GET /api/v1/measurements/aggregate` (moyennes par fenêtre 1h / 1d).
- Repository exposant aussi `save(NewMeasurement)` pour le subscriber MQTT (#28).

**Hors scope (tickets dédiés) :**
- Ingestion MQTT des mesures → **#28** (utilise `save`).
- Front courbes T°/humidité → **#30**.
- Agrégation siège multi-pays des mesures → tickets central.
- Évaluation des seuils / alerting hors-plage → tickets alerting.

## Parcours utilisateur

- En tant que responsable d'exploitation, je veux consulter l'historique des
  relevés d'un entrepôt afin de surveiller les conditions de stockage. *(#30)*
- En tant que responsable d'exploitation, je veux lire des moyennes par heure ou
  par jour afin de lisser le bruit des capteurs et repérer une tendance. *(#30)*

## Règles métier

- **Tri** : l'historique est rendu par `recordedAt` décroissant (plus récent
  d'abord), `id` en clé secondaire pour un ordre stable entre pages.
- **Fenêtres d'agrégation** : `bucket` ∈ {`1h`, `1d`} (3600 s / 86 400 s). Le
  label métier est traduit en secondes par l'application ; l'infra ne connaît que
  les secondes.
- **Bornes** : `from`/`to` ISO 8601 optionnelles, incluses (`>=` / `<=`).
- **Pays** (`Country`) : `BR | EC | CO`, miroir de `CountryCode` de
  `@futurekawa/contracts`. Le pays est posé par le backend (à l'ingestion #28),
  jamais fourni par le client de lecture.
- **Pas d'ingestion REST** : les mesures arrivent par MQTT (#28).

## Modèle de données

Table `measurements` (backend-pays, MariaDB). Sur-ensemble du type `Measurement`
de `@futurekawa/contracts` : `createdAt` n'existe qu'en base (audit) et n'est pas
exposé.

| Champ | Type Prisma | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | identifiant du relevé |
| `country` | `Country` (enum) | `BR \| EC \| CO` — miroir de `CountryCode` |
| `warehouse` | `String` | entrepôt à l'origine du relevé |
| `temperatureCelsius` | `Float` | température (°C) |
| `humidityPercent` | `Float` | humidité relative (%) |
| `recordedAt` | `DateTime` | instant du relevé (capteur) |
| `createdAt` | `DateTime @default(now())` | audit (non exposé) |

Index : `measurements_warehouse_recordedAt_idx` (historique d'un entrepôt).

> L'enum Prisma `Country` est un **miroir de persistance** synchronisé à la main
> avec l'union TS de `@futurekawa/contracts` (qui reste type-only). Voir
> [`../architecture/database.md`](../architecture/database.md).

## Contrats API / MQTT

| Type | Contrat | Fichier |
|---|---|---|
| Types | `Measurement`, `MeasurementBucket`, `PaginatedResponse` | `packages/contracts/src/measurement.ts`, `pagination.ts` |
| Prisma | modèle `Measurement` | `apps/backend-pays/prisma/schema.prisma` |
| REST | `GET /api/v1/measurements?warehouse&from&to&page&pageSize` | `apps/backend-pays/src/measurements/interface/measurements.controller.ts` |
| REST | `GET /api/v1/measurements/aggregate?warehouse&bucket&from&to` | idem |
| MQTT | `futurekawa/{country}/warehouse/{id}/measurement` (#28) | `apps/backend-pays/src/mqtt/` *(à venir)* |

Status codes : `200` lecture, `400` validation. Erreurs RFC 7807.

Swagger : `/api-docs` (tag **measurements**). Bruno : `bruno/pays/measurements/`.

## Architecture technique

Persistance locale au backend-pays (clean archi). Le modèle Prisma vit en
infrastructure et n'est jamais exposé : `PrismaMeasurementRepository` mappe la
ligne DB vers l'entité domaine `Measurement`, puis `measurement.mapper.ts`
projette vers les DTO de sortie. L'agrégat est calculé en SQL via
`prisma.$queryRaw` (MariaDB), en groupant sur
`FLOOR(UNIX_TIMESTAMP(recordedAt) / :bucketSeconds)` — `:bucketSeconds` lié en
paramètre (pas d'interpolation de chaîne brute : sécurité injection).

## Implémentation

- **Schéma** : [`../../apps/backend-pays/prisma/schema.prisma`](../../apps/backend-pays/prisma/schema.prisma)
- **Migration** : `apps/backend-pays/prisma/migrations/*_add_measurement/`
- **Domain** : `apps/backend-pays/src/measurements/domain/` (`measurement.ts`, `measurement.repository.ts`)
- **Application** : `apps/backend-pays/src/measurements/application/` (`get-measurement-history.use-case.ts`, `aggregate-measurements.use-case.ts`)
- **Infrastructure** : `apps/backend-pays/src/measurements/infrastructure/prisma-measurement.repository.ts`
- **Interface** : `apps/backend-pays/src/measurements/interface/` (controller + DTOs + `measurement.mapper.ts`)

## Tests

| Niveau | Fichier | Couvre |
|---|---|---|
| Unit | `apps/backend-pays/src/measurements/application/*.spec.ts` | history (skip/take, warehouse/from/to, enveloppe paginée) ; aggregate (1h→3600 s, 1d→86 400 s, passthrough buckets) |
| Intégration (e2e + DB réelle) | `apps/backend-pays/test/measurements.e2e-spec.ts` | history (tri desc, pagination, filtre from/to, `warehouse` requis → 400, `from` invalide → 400) ; aggregate (buckets 1h, moyenne 1d, bucket non supporté → 400) ; **perf : 1000 mesures, `GET /measurements` paginé < 200 ms** |

> Stratégie (rules/04-tests.md, ADR-0008) : unitaires sur l'application (deps
> mockées, exécutés en CI) + suite d'intégration Supertest contre une MariaDB
> jetable (`docker-compose.test.yml`, `tmpfs` + migrations appliquées au boot).

## Documentation utilisateur

Lien : [`../user/monitoring.md`](../user/monitoring.md) *(à compléter avec le front #30).*

## Évolutions / TODO

- [ ] #28 — subscriber MQTT qui persiste les relevés via `MeasurementRepository.save`.
- [ ] #30 — front courbes T°/humidité (consomme l'historique + l'agrégat).
- [ ] Agrégation siège multi-pays des mesures (tickets central).
- [ ] Évaluation des seuils `COUNTRY_CONDITIONS` → transition de statut des lots (alerting).
