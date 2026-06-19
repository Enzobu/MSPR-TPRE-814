---
title: Agrégation siège (consolidation multi-pays)
owner: Yanis
status: in-progress
cdc-ref: "§III.5"
adr-refs: [0007]
updated: 2026-06-19
---

# Agrégation siège (consolidation multi-pays)

## Objectif métier

Le siège (backend-central) consolide les données des backends pays (BR / EC /
CO) pour offrir une vue unique au frontend. La résilience est primordiale : un
pays injoignable ne doit **jamais** faire échouer la réponse globale — il est
signalé dans `unavailable` (ADR-0007, CDC §III.5).

## Scope

**Inclus (ce PR) :**
- `GET /api/v1/stocks` — lots consolidés multi-pays, tri FIFO, pagination,
  réponse partielle `{ data, total, page, pageSize, unavailable }`, cache court.

**Déjà livré (tickets précédents) :**
- `CountryBackendGateway` résilient (timeout, retry+backoff, circuit breaker,
  propagation du correlation-id) — `apps/backend-central/src/country-backends/`.

**Hors scope (upstream pays inexistant à ce jour) :**
- `GET /api/v1/measurements` (proxy) — gated sur les mesures pays (#29).
- `GET /api/v1/alerts` (consolidé) — gated sur les alertes pays (#32–#35).

## Règles métier

- **Partial-failure** : pour N pays ciblés, on interroge tout le monde en
  parallèle ; un pays en échec (timeout / 5xx épuisés / breaker ouvert) tombe
  dans `unavailable`, les autres alimentent `data`. Statut HTTP **200**, jamais
  500 (ADR-0007).
- **FIFO global** : fusion des lots de tous les pays disponibles, tri `storedAt`
  croissant (clé secondaire `id`), puis pagination de l'ensemble fusionné.
- **Cache** : une réponse **complète** est mise en cache TTL court
  (`STOCKS_CACHE_TTL_MS`) ; une réponse **partielle** n'est jamais cachée (sinon
  un pays rétabli resterait « absent » pendant tout le TTL).
- **Fetch exhaustif** : chaque pays est paginé (100/page) jusqu'à épuisement
  avant fusion → `total` exact et FIFO complet. Garde-fou de 50 pages/pays
  (5000 lots) contre une réponse incohérente.
- **Mapping explicite** : la donnée pays est recopiée vers `StockLotDto` (jamais
  renvoyée telle quelle) pour découpler le siège du contrat pays.

## Contrats API

| Type | Contrat | Fichier |
|---|---|---|
| REST | `GET /api/v1/stocks?country&page&pageSize&sort` | `apps/backend-central/src/stocks/interface/stocks.controller.ts` |
| Types | `ConsolidatedResponse<Lot>` | `packages/contracts/src/pagination.ts` |

Swagger : `/api-docs` (tag **stocks**). Bruno : `bruno/central/stocks/`.

## Implémentation

- **Application** : `apps/backend-central/src/stocks/application/` — `AggregateStocksUseCase` (fan-out `Promise.allSettled`, fusion FIFO, pagination), `StocksCache` (TTL).
- **Interface** : `apps/backend-central/src/stocks/interface/` — controller + DTOs (`StocksQueryDto`, `StocksResponseDto`/`StockLotDto`).
- **Gateway** (port) : `country-backends/domain/country-backend.gateway.ts` (`COUNTRY_BACKEND_GATEWAY`, `CountryUnavailableError`).

## Tests

| Niveau | Fichier | Couvre |
|---|---|---|
| Unit | `src/stocks/application/aggregate-stocks.use-case.spec.ts` | fusion FIFO, réponse partielle (1 pays down), filtre pays, pagination, cache hit/skip |
| Unit | `src/stocks/application/stocks-cache.spec.ts` | TTL (hit avant expiration, expiration, désactivé) |
| Intégration (e2e, gateway mocké) | `test/stocks.e2e-spec.ts` | 3 pays → consolidé ; 1 pays down → partiel (200, pas 500) ; FIFO asc/desc ; filtre ; pagination ; 400 |

> Le gateway est mocké au niveau du **port** (`COUNTRY_BACKEND_GATEWAY`) : pas de
> vrai pays requis. Le chemin HTTP réel a été validé manuellement (curl) contre
> un backend-pays seedé + pays bogus → `unavailable`.

## Évolutions / TODO

- [x] `GET /api/v1/stocks` (lots consolidés + résilience + cache).
- [ ] `GET /api/v1/measurements` (proxy) quand les mesures pays existent (#29).
- [ ] `GET /api/v1/alerts` (consolidé) quand les alertes pays existent (#32–#35).
- [ ] Front consommateur : `features/lots` (#25) consomme `/stocks`.
