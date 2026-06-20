---
title: Agrégation siège (consolidation multi-pays)
owner: Yanis
status: in-progress
cdc-ref: "§III.5"
adr-refs: [0007]
updated: 2026-06-19
related: ["alerts.md"]
---

# Agrégation siège (consolidation multi-pays)

## Objectif métier

Le siège (backend-central) consolide les données des backends pays (BR / EC /
CO) pour offrir une vue unique au frontend. La résilience est primordiale : un
pays injoignable ne doit **jamais** faire échouer la réponse globale — il est
signalé dans `unavailable` (ADR-0007, CDC §III.5).

## Scope

**Inclus (ce PR) :**
- `GET /api/v1/alerts` — liste **consolidée multi-pays** des alertes (tri
  `triggeredAt` desc, pagination sur l'ensemble fusionné,
  `ConsolidatedResponse<Alert>`, réponse partielle `unavailable`).
- `PATCH /api/v1/alerts/:id/acknowledge` — **proxy d'acquittement** vers le pays
  propriétaire (écriture ciblée, `country` requis). 404 si alerte inconnue, 503
  si pays injoignable.

**Déjà livré (tickets précédents) :**
- `GET /api/v1/stocks` — lots consolidés multi-pays, tri FIFO, pagination,
  réponse partielle `{ data, total, page, pageSize, unavailable }`, cache court.
- `GET /api/v1/measurements` + `/aggregate` — proxy mono-pays résilient de
  l'historique et des moyennes T°/humidité d'un entrepôt.
- `CountryBackendGateway` résilient (timeout, retry+backoff, circuit breaker,
  propagation du correlation-id) — `apps/backend-central/src/country-backends/`.

**Avec ce PR, l'agrégation siège (#36) est complète : stocks + mesures + alertes.**

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

### Alertes (consolidation + ACK proxy — ce PR)

- **Liste consolidée** : même patron que /stocks. Fan-out `Promise.allSettled`
  sur les pays ciblés (`country` absent → les 3), chaque appel relaie les filtres
  `type`/`acknowledged` + `pageSize=100` (fetch large par pays — les alertes sont
  peu nombreuses après dédup). Fusion, tri **`triggeredAt` desc** (clé secondaire
  `id`), pagination de l'ensemble fusionné. Pays en échec → `unavailable`, statut
  **200** (jamais 500). **Pas de cache** (alertes dynamiques + ACK).
- **ACK proxy** : l'acquittement est une **écriture** → le pays propriétaire doit
  être ciblé. `country` est **requis** (le front le connaît via la liste). Le
  use-case relaie `PATCH /api/v1/alerts/:id/acknowledge` (sans body) au pays via
  `gateway.patch`.
- **Distinction 404 / 503** : le gateway transforme par défaut tout échec d'un
  `get` en `CountryUnavailableError` (résilience). Or pour une **écriture**, un
  404 pays (alerte inconnue) n'est pas une indisponibilité : on doit le remonter
  en 404 central, pas en 503. Le port a donc été étendu avec `patch`, qui
  distingue :
  - **4xx pays** (non transitoire) → `CountryRequestError` portant le status HTTP
    d'origine, **sans** retry ni comptage d'échec sur le breaker → le controller
    le relaie tel quel (404 → **404**).
  - **5xx / réseau / breaker ouvert** → retry+backoff puis `CountryUnavailableError`
    → le controller renvoie **503**.

  `get` conserve son comportement historique (un 4xx → `CountryUnavailableError`) :
  seul `patch` surface le 4xx typé, pour ne pas casser les consommateurs de `get`
  (stocks/measurements basculent un pays en `unavailable` quelle que soit l'erreur).

## Contrats API

| Type | Contrat | Fichier |
|---|---|---|
| REST | `GET /api/v1/stocks?country&page&pageSize&sort` | `apps/backend-central/src/stocks/interface/stocks.controller.ts` |
| REST | `GET /api/v1/measurements?country&warehouse&from&to&page&pageSize` | `apps/backend-central/src/measurements/interface/measurements.controller.ts` |
| REST | `GET /api/v1/measurements/aggregate?country&warehouse&bucket&from&to` | idem |
| REST | `GET /api/v1/alerts?country&type&acknowledged&page&pageSize` | `apps/backend-central/src/alerts/interface/alerts.controller.ts` |
| REST | `PATCH /api/v1/alerts/:id/acknowledge?country` | idem |
| Types | `ConsolidatedResponse<Lot>`, `ConsolidatedResponse<Measurement>`, `ConsolidatedResponse<Alert>`, `ConsolidatedList<MeasurementBucket>` | `packages/contracts/src/pagination.ts` |

Swagger : `/api-docs` (tags **stocks**, **measurements**, **alerts**). Bruno :
`bruno/central/stocks/`, `bruno/central/measurements/`, `bruno/central/alerts/`.

## Implémentation

- **Application (stocks)** : `apps/backend-central/src/stocks/application/` — `AggregateStocksUseCase` (fan-out `Promise.allSettled`, fusion FIFO, pagination), `StocksCache` (TTL).
- **Application (mesures)** : `apps/backend-central/src/measurements/application/` — `GetCountryMeasurementsUseCase` (historique paginé), `AggregateCountryMeasurementsUseCase` (buckets). Pas de cache.
- **Interface (stocks)** : `apps/backend-central/src/stocks/interface/` — controller + DTOs (`StocksQueryDto`, `StocksResponseDto`/`StockLotDto`).
- **Interface (mesures)** : `apps/backend-central/src/measurements/interface/` — `MeasurementsController` + DTOs (`MeasurementsQueryDto`, `MeasurementsAggregateQueryDto`, `ConsolidatedMeasurementsResponseDto`/`MeasurementDto`, `ConsolidatedBucketsResponseDto`/`MeasurementBucketDto`) + `measurement.mapper.ts`.
- **Application (alertes)** : `apps/backend-central/src/alerts/application/` — `ListAlertsUseCase` (fan-out, filtres relayés, fusion + tri `triggeredAt` desc, pagination), `AcknowledgeAlertUseCase` (proxy d'ACK via `gateway.patch`). Pas de cache.
- **Interface (alertes)** : `apps/backend-central/src/alerts/interface/` — `AlertsController` + DTOs (`AlertsQueryDto`, `AcknowledgeAlertQueryDto`, `ConsolidatedAlertsResponseDto`/`AlertDto`) + `alert.mapper.ts`. Mapping erreurs : `CountryRequestError` → status HTTP d'origine (404 → 404), `CountryUnavailableError` → 503.
- **Gateway** (port) : `country-backends/domain/country-backend.gateway.ts` (`COUNTRY_BACKEND_GATEWAY`, `get`, `patch`, `CountryUnavailableError`, `CountryRequestError`).

## Tests

| Niveau | Fichier | Couvre |
|---|---|---|
| Unit | `src/stocks/application/aggregate-stocks.use-case.spec.ts` | fusion FIFO, réponse partielle (1 pays down), filtre pays, pagination, cache hit/skip |
| Unit | `src/stocks/application/stocks-cache.spec.ts` | TTL (hit avant expiration, expiration, désactivé) |
| Unit | `src/measurements/application/get-country-measurements.use-case.spec.ts` | succès (mapping + unavailable []) ; query/path passés au gateway ; pays down → partiel (data vide + unavailable=[country], pas de throw) ; erreur inattendue rethrow |
| Unit | `src/measurements/application/aggregate-country-measurements.use-case.spec.ts` | succès (buckets + unavailable []) ; query/path ; pays down → partiel ; erreur inattendue rethrow |
| Intégration (e2e, gateway mocké) | `test/stocks.e2e-spec.ts` | 3 pays → consolidé ; 1 pays down → partiel (200, pas 500) ; FIFO asc/desc ; filtre ; pagination ; 400 |
| Intégration (e2e, gateway mocké) | `test/measurements.e2e-spec.ts` | history mappé + unavailable [] (champ interne pays filtré) ; pays down → partiel (200, pas 500) ; aggregate buckets ; 400 (country/warehouse absents, bucket invalide) |
| Unit | `src/alerts/application/list-alerts.use-case.spec.ts` | 1 pays / multi-pays, tri `triggeredAt` desc fusionné, filtres relayés + pageSize=100, pays down → unavailable (pas de throw), pagination |
| Unit | `src/alerts/application/acknowledge-alert.use-case.spec.ts` | ACK succès (patch appelé avec bons args), `CountryUnavailableError` propagé, `CountryRequestError(404)` propagé |
| Unit | `src/country-backends/infrastructure/http-country-backend.gateway.spec.ts` | `patch` succès (body + correlation-id) ; 404 → `CountryRequestError` (status, sans retry) ; 5xx → retry + `CountryUnavailableError` |
| Intégration (e2e, gateway mocké) | `test/alerts.e2e-spec.ts` | liste consolidée (2 up + 1 down → tri desc + `unavailable`, champ interne filtré) ; filtres `type`/`acknowledged` ; 400 query invalide ; ACK 200 ; ACK pays down → 503 ; ACK country manquant → 400 ; ACK alerte inconnue → 404 |

> Le gateway est mocké au niveau du **port** (`COUNTRY_BACKEND_GATEWAY`) : pas de
> vrai pays requis. Le chemin HTTP réel a été validé manuellement (curl) contre
> un backend-pays seedé + pays bogus → `unavailable`.

## Évolutions / TODO

- [x] `GET /api/v1/stocks` (lots consolidés + résilience + cache).
- [x] `GET /api/v1/measurements` + `/aggregate` (proxy mono-pays résilient).
- [x] `GET /api/v1/alerts` (consolidé) + `PATCH /api/v1/alerts/:id/acknowledge`
  (proxy d'ACK) — **#36 complet (stocks + mesures + alertes)**.
- [ ] Front consommateur : `features/lots` (#25) consomme `/stocks`.
