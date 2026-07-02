---
title: Mesures IoT (historique T°/humidité, agrégat)
owner: Yanis
status: in-progress
cdc-ref: "§III.2"
adr-refs: [0002, 0003]
updated: 2026-07-02
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

**Inclus (PR #28) :**
- Subscriber MQTT du pays de l'instance (ADR-0003) : abonnement
  `futurekawa/{COUNTRY_CODE}/warehouse/+/measurement` QoS 1, parsing + validation,
  persistance via `IngestMeasurementUseCase` (port `save`).
- Fallback REST `POST /api/v1/measurements` (mêmes bornes que MQTT) quand le
  broker est indisponible.
- Boot non bloquant si le broker est down (auto-reconnexion).

**Hors scope (tickets dédiés) :**
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
  `@futurekawa/contracts`. Le pays est posé par le backend (à l'ingestion),
  jamais fourni par le client (ni en lecture, ni dans le body REST).
- **Ingestion** : voie nominale MQTT (#28), voie de secours `POST /measurements`.
  Les deux partagent les **mêmes bornes** : `temperatureCelsius` ∈
  [`TEMPERATURE_CELSIUS_MIN`, `TEMPERATURE_CELSIUS_MAX`], `humidityPercent` ∈
  [`HUMIDITY_PERCENT_MIN`, `HUMIDITY_PERCENT_MAX`] (`@futurekawa/contracts`).
- **`recordedAt` optionnel** (#150) : le module IoT l'omet tant que NTP n'a pas
  convergé (démarrage à froid). Absent/vide → **le backend horodate à la
  réception** (temps serveur) ; présent → validé ISO 8601, sinon la mesure est
  rejetée. Vaut pour l'ingestion MQTT **et** REST.

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
| REST | `POST /api/v1/measurements` (fallback ingestion) | `apps/backend-pays/src/measurements/interface/measurements.controller.ts` |
| MQTT | `futurekawa/{country}/warehouse/{id}/measurement` (QoS 1) | `apps/backend-pays/src/measurements/infrastructure/mqtt-measurement.subscriber.ts`, `apps/backend-pays/src/mqtt/mqtt.module.ts` |

Status codes : `200` lecture, `201` création (POST), `400` validation. Erreurs RFC 7807.

Swagger : `/api-docs` (tag **measurements**). Bruno : `bruno/pays/measurements/`.

## Architecture technique

Persistance locale au backend-pays (clean archi). Le modèle Prisma vit en
infrastructure et n'est jamais exposé : `PrismaMeasurementRepository` mappe la
ligne DB vers l'entité domaine `Measurement`, puis `measurement.mapper.ts`
projette vers les DTO de sortie. L'agrégat est calculé en SQL via
`prisma.$queryRaw` (MariaDB), en groupant sur
`FLOOR(UNIX_TIMESTAMP(recordedAt) / :bucketSeconds)` — `:bucketSeconds` lié en
paramètre (pas d'interpolation de chaîne brute : sécurité injection).

### Ingestion MQTT (#28, ADR-0003)

Le `MqttMeasurementSubscriber` (infrastructure) se connecte au broker au boot et
s'abonne à `measurementSubscriptionTopic(COUNTRY_CODE)` =
`futurekawa/{COUNTRY_CODE}/warehouse/+/measurement` en **QoS 1**. Le backend ne
lit que son propre pays (wildcard `+` uniquement sur l'entrepôt).

- **Topic** porte le `warehouseId` ; le **payload** JSON ne contient que
  `{ temperatureCelsius, humidityPercent, recordedAt }`. Le `country` est imposé
  par l'instance (env `COUNTRY_CODE`), jamais lu du message.
- **Validation** (parsing pur, `measurement-message.parser.ts`) : format de topic
  (5 segments, pays == `COUNTRY_CODE`, suffixe `measurement`), JSON valide, shape
  attendue, `recordedAt` optionnel (omis → horodaté réception ; présent → ISO 8601
  sinon drop), bornes T°/humidité — **mêmes constantes que le DTO REST**. Tout cas
  invalide → `logger.warn` + **drop** (jamais de crash).
- **Compteurs** `persisted` / `dropped` loggués à chaque message pour la
  supervision.
- **Résilience** : `reconnectPeriod = 2000 ms`. Si le broker est down au boot, le
  backend démarre quand même (pas de `throw`) ; le client `mqtt` se reconnecte
  seul et l'abonnement est rejoué sur l'évènement `connect`. `onModuleDestroy`
  ferme proprement (`client.end(true)`).

**Procédure de reconnexion (manuelle).** Le test automatique se limite à asserter
`reconnectPeriod > 0` (le cycle complet kill/restart n'est pas reproductible de
façon déterministe en CI) :

```bash
# 1. broker + DB de test
docker compose -f docker-compose.test.yml up -d
# 2. backend en dev pointé sur le broker de test
MQTT_URL=mqtt://localhost:1893 pnpm --filter backend-pays start:dev
# 3. publier une mesure (persistée)
mosquitto_pub -h localhost -p 1893 \
  -t 'futurekawa/BR/warehouse/W1/measurement' \
  -m '{"temperatureCelsius":22.5,"humidityPercent":55,"recordedAt":"2026-06-01T08:00:00.000Z"}'
# 4. tuer puis relancer le broker — observer le log "MQTT broker unreachable, reconnecting"
docker compose -f docker-compose.test.yml restart mosquitto-test
# 5. republier : la mesure est de nouveau persistée (abonnement rejoué)
```

Voir aussi la commande `/mqtt-simulate`.

### Fallback REST

`POST /api/v1/measurements` réutilise `IngestMeasurementUseCase`. Le DTO
`IngestMeasurementDto` (`class-validator`) applique les **mêmes bornes** que le
parsing MQTT (constantes `@futurekawa/contracts`) — never trust the client. Le
`country` vient du token `COUNTRY_CODE`, pas du body.

## Implémentation

- **Schéma** : [`../../apps/backend-pays/prisma/schema.prisma`](../../apps/backend-pays/prisma/schema.prisma)
- **Migration** : `apps/backend-pays/prisma/migrations/*_add_measurement/`
- **Domain** : `apps/backend-pays/src/measurements/domain/` (`measurement.ts`, `measurement.repository.ts`)
- **Application** : `apps/backend-pays/src/measurements/application/` (`get-measurement-history.use-case.ts`, `aggregate-measurements.use-case.ts`, `ingest-measurement.use-case.ts`)
- **Infrastructure** : `apps/backend-pays/src/measurements/infrastructure/` (`prisma-measurement.repository.ts`, `mqtt-measurement.subscriber.ts`, `measurement-message.parser.ts`)
- **Interface** : `apps/backend-pays/src/measurements/interface/` (controller + DTOs dont `ingest-measurement.dto.ts` + `measurement.mapper.ts`)
- **MQTT module** : `apps/backend-pays/src/mqtt/mqtt.module.ts` (branche le subscriber, token `COUNTRY_CODE` partagé : `apps/backend-pays/src/config/country-code.token.ts`)
- **Agrégation siège** : `apps/backend-central/src/measurements/` (proxy mono-pays résilient — voir [aggregation-siege.md](aggregation-siege.md))
- **Front** : `apps/frontend-web/src/features/measurements/` (api `fetchMeasurements`, hook `useMeasurements`, `lib/tolerance.ts`, composants `MeasurementChart` recharts / `MeasurementStats` / `MeasurementsPanel`). Intégré sur `LotDetailPage` (période depuis `storedAt`). Lignes de référence + bande de tolérance depuis `COUNTRY_CONDITIONS`, points hors tolérance en `--destructive`.

## Tests

| Niveau | Fichier | Couvre |
|---|---|---|
| Unit | `apps/backend-pays/src/measurements/application/*.spec.ts` | history (skip/take, warehouse/from/to, enveloppe paginée) ; aggregate (1h→3600 s, 1d→86 400 s, passthrough buckets) ; ingest (délègue à `save`) |
| Unit | `apps/backend-pays/src/measurements/infrastructure/mqtt-measurement.subscriber.spec.ts`, `measurement-message.parser.spec.ts` | message valide → `save` appelé (warehouse du topic, country `COUNTRY_CODE`, `recordedAt` Date) ; JSON cassé / T°/humidité hors plage / topic mal formé / mauvais pays → drop + warn ; `reconnectPeriod > 0` |
| Intégration (e2e + DB réelle) | `apps/backend-pays/test/measurements.e2e-spec.ts` | history (tri desc, pagination, filtre from/to, `warehouse` requis → 400, `from` invalide → 400) ; aggregate (buckets 1h, moyenne 1d, bucket non supporté → 400) ; **POST fallback** (201 + relecture, T° hors plage → 400, `warehouse` manquant → 400) ; **perf : 1000 mesures, `GET /measurements` paginé < 200 ms** |
| Intégration MQTT (e2e + broker + DB réels) | `apps/backend-pays/test/mqtt-ingestion.e2e-spec.ts` | publication MQTT → persistance polled (< 5 s) ; payload invalide → rien persisté, pas de crash |
| Intégration MQTT — résilience (e2e + broker + DB réels) | `apps/backend-pays/test/mqtt-resilience.e2e-spec.ts` (#31) | **débit : 100 mesures en rafale (< 10 s de publication) → 100 en DB** ; **reprise après coupure de connexion broker** (socket détruit → auto-reconnexion `reconnectPeriod`, mesure post-reconnexion persistée — perte pendant l'outage acceptée, pas de session persistante, ADR-0003) |
| UI (Vitest + RTL) | `apps/frontend-web/tests/features/measurements/**` | `tolerance` (in/limite/hors plage) ; `MeasurementStats` (min/max/moy + comptage hors tolérance) ; `MeasurementChart` (rend lignes/points) ; `MeasurementsPanel` (données / vide / `unavailable`) |

> Stratégie (rules/04-tests.md, ADR-0008) : unitaires sur l'application (deps
> mockées, exécutés en CI) + suite d'intégration Supertest contre une MariaDB
> jetable (`docker-compose.test.yml`, `tmpfs` + migrations appliquées au boot). Le
test d'ingestion MQTT ajoute un broker `mosquitto-test` (port 1893, anonyme, sans
persistance) au même compose.

## Documentation utilisateur

Lien : [`../user/monitoring.md`](../user/monitoring.md).

## Évolutions / TODO

- [x] #28 — subscriber MQTT qui persiste les relevés via `MeasurementRepository.save` (+ fallback REST `POST`).
- [x] #31 — tests d'intégration mesures (débit 100 msg + reprise reconnexion broker) contre broker + DB réels. Topic/payload alignés sur `/mqtt-simulate`.
- [x] #30 — front courbes T°/humidité (recharts) sur la fiche lot : lignes de référence pays + highlight hors tolérance.
- [x] Proxy siège des mesures (`GET /api/v1/measurements` + `/aggregate`) —
  mono-pays résilient, voir [`aggregation-siege.md`](./aggregation-siege.md).
- [x] #151 — l'ingestion reflète les conditions de l'entrepôt sur le statut de ses lots (`CONFORME` ↔ `EN_ALERTE`, ADR-0013), en best-effort.
