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
- `GET /api/v1/measurements` — proxy mono-pays résilient de l'historique des
  mesures d'un entrepôt (`ConsolidatedResponse<Measurement>`).
- `GET /api/v1/measurements/aggregate` — proxy des moyennes T°/humidité par
  fenêtre (1h / 1d) d'un entrepôt (`ConsolidatedList<MeasurementBucket>`).

**Déjà livré (tickets précédents) :**
- `GET /api/v1/stocks` — lots consolidés multi-pays, tri FIFO, pagination,
  réponse partielle `{ data, total, page, pageSize, unavailable }`, cache court.
- `CountryBackendGateway` résilient (timeout, retry+backoff, circuit breaker,
  propagation du correlation-id) — `apps/backend-central/src/country-backends/`.

**Hors scope (upstream pays inexistant à ce jour) :**
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
- **Mapping explicite** : la donnée pays est recopiée vers `StockLotDto` /
  `MeasurementDto` / `MeasurementBucketDto` (jamais renvoyée telle quelle) pour
  découpler le siège du contrat pays.

### Mesures (proxy mono-pays résilient — ce PR)

- **Mono-pays** : une mesure / un entrepôt appartient à UN pays → `country` et
  `warehouse` sont **requis** ; ce ne sont pas des consolidations multi-pays mais
  des proxies. La résilience ADR-0007 reste appliquée : pays injoignable →
  `data: []` + `unavailable: [country]`, statut **200** (jamais 500).
- **Pas de cache** : les mesures sont dynamiques (à la différence de /stocks).
- L'historique réutilise `ConsolidatedResponse<Measurement>` ; l'agrégat (volume
  déjà borné côté pays) utilise le type non paginé `ConsolidatedList<MeasurementBucket>`.

## Contrats API

| Type | Contrat | Fichier |
|---|---|---|
| REST | `GET /api/v1/stocks?country&page&pageSize&sort` | `apps/backend-central/src/stocks/interface/stocks.controller.ts` |
| REST | `GET /api/v1/measurements?country&warehouse&from&to&page&pageSize` | `apps/backend-central/src/measurements/interface/measurements.controller.ts` |
| REST | `GET /api/v1/measurements/aggregate?country&warehouse&bucket&from&to` | idem |
| Types | `ConsolidatedResponse<Lot>`, `ConsolidatedResponse<Measurement>`, `ConsolidatedList<MeasurementBucket>` | `packages/contracts/src/pagination.ts` |

Swagger : `/api-docs` (tags **stocks**, **measurements**). Bruno :
`bruno/central/stocks/`, `bruno/central/measurements/`.

## Implémentation

- **Application (stocks)** : `apps/backend-central/src/stocks/application/` — `AggregateStocksUseCase` (fan-out `Promise.allSettled`, fusion FIFO, pagination), `StocksCache` (TTL).
- **Application (mesures)** : `apps/backend-central/src/measurements/application/` — `GetCountryMeasurementsUseCase` (historique paginé), `AggregateCountryMeasurementsUseCase` (buckets). Pas de cache.
- **Interface (stocks)** : `apps/backend-central/src/stocks/interface/` — controller + DTOs (`StocksQueryDto`, `StocksResponseDto`/`StockLotDto`).
- **Interface (mesures)** : `apps/backend-central/src/measurements/interface/` — `MeasurementsController` + DTOs (`MeasurementsQueryDto`, `MeasurementsAggregateQueryDto`, `ConsolidatedMeasurementsResponseDto`/`MeasurementDto`, `ConsolidatedBucketsResponseDto`/`MeasurementBucketDto`) + `measurement.mapper.ts`.
- **Gateway** (port) : `country-backends/domain/country-backend.gateway.ts` (`COUNTRY_BACKEND_GATEWAY`, `CountryUnavailableError`).

## Tests

| Niveau | Fichier | Couvre |
|---|---|---|
| Unit | `src/stocks/application/aggregate-stocks.use-case.spec.ts` | fusion FIFO, réponse partielle (1 pays down), filtre pays, pagination, cache hit/skip |
| Unit | `src/stocks/application/stocks-cache.spec.ts` | TTL (hit avant expiration, expiration, désactivé) |
| Unit | `src/measurements/application/get-country-measurements.use-case.spec.ts` | succès (mapping + unavailable []) ; query/path passés au gateway ; pays down → partiel (data vide + unavailable=[country], pas de throw) ; erreur inattendue rethrow |
| Unit | `src/measurements/application/aggregate-country-measurements.use-case.spec.ts` | succès (buckets + unavailable []) ; query/path ; pays down → partiel ; erreur inattendue rethrow |
| Intégration (e2e, gateway mocké) | `test/stocks.e2e-spec.ts` | 3 pays → consolidé ; 1 pays down → partiel (200, pas 500) ; FIFO asc/desc ; filtre ; pagination ; 400 |
| Intégration (e2e, gateway mocké) | `test/measurements.e2e-spec.ts` | history mappé + unavailable [] (champ interne pays filtré) ; pays down → partiel (200, pas 500) ; aggregate buckets ; 400 (country/warehouse absents, bucket invalide) |

> Le gateway est mocké au niveau du **port** (`COUNTRY_BACKEND_GATEWAY`) : pas de
> vrai pays requis. Le chemin HTTP réel a été validé manuellement (curl) contre
> un backend-pays seedé + pays bogus → `unavailable`.

## Évolutions / TODO

- [x] `GET /api/v1/stocks` (lots consolidés + résilience + cache).
- [x] `GET /api/v1/measurements` + `/aggregate` (proxy mono-pays résilient).
- [ ] `GET /api/v1/alerts` (consolidé) quand les alertes pays existent (#32–#35).
- [ ] Front consommateur : `features/lots` (#25) consomme `/stocks`.
