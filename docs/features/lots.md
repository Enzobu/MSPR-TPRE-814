---
title: Lots de café vert (stock, FIFO, traçabilité)
owner: Yanis
status: in-progress
cdc-ref: "§III.1"
adr-refs: [0002]
updated: 2026-06-19
---

# Lots de café vert

## Objectif métier

Suivre les stocks de café vert de FutureKawa par pays (Brésil / Équateur /
Colombie) : tracer chaque lot de son entreposage à sa sortie, exposer un ordre
de déstockage **FIFO** (premier entré, premier sorti) et signaler les lots
hors-norme (en alerte, périmés > 365 j). Couvre le CDC §III.1.

## Scope

**Inclus (ce PR, #23) :**
- Modèle Prisma `Lot` du backend-pays (DB locale au pays).
- Migration `add_lot` + enums `Country` / `LotStatus`.
- Index `storedAt` (FIFO) + unicité `(id, country)`.
- Seed de ~20 lots de test réalistes (pays variés, dates étalées, 3 statuts).

**Hors scope (tickets dédiés) :**
- API REST `lots` (création, listing FIFO, consultation) → **#24**.
- Tests d'intégration repository + API → **#26**.
- Agrégation siège des stocks multi-pays → tickets central.
- Passage automatique de statut (alerting T°/humidité, cron péremption) → tickets
  alerting/IoT.

## Parcours utilisateur

- En tant que responsable d'entrepôt, je veux enregistrer un lot entrant afin
  d'en assurer la traçabilité. *(API #24)*
- En tant que responsable d'exploitation, je veux consulter mes lots triés par
  ancienneté (FIFO) afin de déstocker le plus ancien en premier. *(API #24)*

## Règles métier

- **FIFO** : les lots se déstockent par `storedAt` croissant (CDC §III.1). Index
  dédié `@@index([storedAt])`.
- **Identité** : un identifiant de lot est unique au sein d'un pays
  (`@@unique([id, country])`).
- **Statut** (`LotStatus`) : `CONFORME` (défaut) → `EN_ALERTE` (conditions
  hors-plage) → `PERIME` (stockage > 365 j). Les transitions automatiques sont
  hors scope #23.
- **Pays** (`Country`) : `BR | EC | CO`, aligné sur `CountryCode` de
  `@futurekawa/contracts`. Les seuils T°/humidité associés vivent dans
  `COUNTRY_CONDITIONS` (contracts), pas ici.

## Modèle de données

Table `lots` (backend-pays, MariaDB). Le modèle Prisma est un **sur-ensemble**
du type `Lot` de `@futurekawa/contracts` : `harvestDate`, `qualityGrade` et les
timestamps `createdAt`/`updatedAt` n'existent qu'en base et ne sont pas (encore)
exposés à l'API (décision #24).

| Champ | Type Prisma | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | identifiant de lot (métier ou cuid) |
| `country` | `Country` (enum) | `BR \| EC \| CO` — miroir de `CountryCode` |
| `farm` | `String` | exploitation d'origine |
| `warehouse` | `String` | entrepôt de stockage |
| `storedAt` | `DateTime` | date d'entreposage — clé du tri FIFO |
| `status` | `LotStatus @default(CONFORME)` | `CONFORME \| EN_ALERTE \| PERIME` |
| `harvestDate` | `DateTime?` | date de récolte (hors contracts) |
| `qualityGrade` | `String?` | grade qualité (hors contracts) |
| `createdAt` | `DateTime @default(now())` | audit |
| `updatedAt` | `DateTime @updatedAt` | audit |

Index : `lots_storedAt_idx` (FIFO), `lots_id_country_key` (unicité).

> Les enums Prisma `Country` / `LotStatus` sont des **miroirs de persistance**
> synchronisés à la main avec les unions TS de `@futurekawa/contracts` (qui reste
> type-only). Voir [`../architecture/database.md`](../architecture/database.md)
> pour le schéma global (à compléter).

## Contrats API / MQTT

| Type | Contrat | Fichier |
|---|---|---|
| Types | `Lot`, `LotStatus`, `CreateLotDto`, `UpdateLotStatusDto`, `PaginatedResponse` | `packages/contracts/src/lot.ts`, `pagination.ts` |
| Prisma | modèle `Lot` | `apps/backend-pays/prisma/schema.prisma` |
| REST | `POST /api/v1/lots` | `apps/backend-pays/src/lots/interface/lots.controller.ts` |
| REST | `GET /api/v1/lots?page&pageSize&sort` | idem |
| REST | `GET /api/v1/lots/:id` | idem |
| REST | `PATCH /api/v1/lots/:id/status` | idem |

Status codes : `201` création, `200` lecture/patch, `400` validation, `404`
inconnu, `409` id déjà pris, `422` pays ≠ backend. Erreurs RFC 7807.

Swagger : `/api-docs` (tag **lots**). Bruno : `bruno/pays/lots/`.

## Architecture technique

Persistance locale au backend-pays (clean archi). Le modèle Prisma vit en
infrastructure et n'est jamais exposé : `PrismaLotRepository` mappe la ligne DB
vers l'entité domaine `Lot`, puis `lot.mapper.ts` projette vers `LotResponseDto`
(forme figée alignée sur le contrat `Lot`). Le code pays (`COUNTRY_CODE`) est
injecté dans le use-case de création pour rejeter un lot d'un autre pays.

## Implémentation

- **Schéma** : [`../../apps/backend-pays/prisma/schema.prisma`](../../apps/backend-pays/prisma/schema.prisma)
- **Migration** : `apps/backend-pays/prisma/migrations/*_add_lot/`
- **Seed** : [`../../apps/backend-pays/prisma/seed.ts`](../../apps/backend-pays/prisma/seed.ts)
- **Domain** : `apps/backend-pays/src/lots/domain/` (`lot.ts`, `lot.repository.ts`, `lot.errors.ts`)
- **Application** : `apps/backend-pays/src/lots/application/` (4 use-cases : create / list / get / update-status)
- **Infrastructure** : `apps/backend-pays/src/lots/infrastructure/prisma-lot.repository.ts`
- **Interface** : `apps/backend-pays/src/lots/interface/` (controller + DTOs + `lot.mapper.ts`)

### Migrer / seeder en local

La datasource de `schema.prisma` n'a pas d'`url` (driver adapter MariaDB au
runtime). Pour migrer/seeder en local :

```bash
docker compose --env-file .env.compose up -d mariadb-pays   # MARIADB_PAYS_PORT=3308
# .env backend : DATABASE_URL=mysql://futurekawa:futurekawa@localhost:3308/futurekawa_pays
# ajouter TEMPORAIREMENT `datasource: { url: process.env.DATABASE_URL }` à prisma.config.ts
pnpm --filter backend-pays exec prisma migrate dev
pnpm --filter backend-pays db:seed
# puis RESTAURER prisma.config.ts (ne pas committer la ligne datasource)
```

## Tests

| Niveau | Fichier | Couvre |
|---|---|---|
| Unit | `apps/backend-pays/src/lots/application/*.spec.ts` | règles métier des 4 use-cases (mismatch pays, doublon, not-found, pagination/FIFO) |
| HTTP (e2e, repo en mémoire) | `apps/backend-pays/test/lots.e2e-spec.ts` | contrat des 4 endpoints : status codes, RFC 7807, tri FIFO, pagination, validation |
| Intégration DB réelle | _ticket #26_ | `PrismaLotRepository` + API contre MariaDB |

> Stratégie (rules/04-tests.md) : beaucoup d'unitaires sur l'application, un test
> de contrat HTTP avec repository en mémoire (pas de DB hors
> `docker-compose.test.yml`). L'intégration DB réelle est le ticket **#26**.

## Documentation utilisateur

Lien : [`../user/lots.md`](../user/lots.md) _(à créer avec le front #25)_.

## Évolutions / TODO

- [x] #24 — API REST `lots` (création, liste FIFO paginée, détail, update statut)
      + DTO in/out + mapper + Swagger + Bruno.
- [ ] #25 — front `features/lots` (liste FIFO, détail, badge statut).
- [ ] #26 — tests d'intégration (repository Prisma + API + DB réelle).
- [ ] Transitions de statut automatiques (alerting hors-plage, cron péremption).
- [ ] Exposition éventuelle de `harvestDate` / `qualityGrade` à l'API.
- [ ] Documentation utilisateur métier `docs/user/lots.md`.
