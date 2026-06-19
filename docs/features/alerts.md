---
title: Alertes T°/humidité
owner: Yanis
status: in-progress
cdc-ref: "§III.4"
adr-refs: [0002, 0004]
updated: 2026-06-19
---

# Alertes T°/humidité

## Objectif métier

Détecter automatiquement, à chaque relevé ingéré, qu'un entrepôt sort des
conditions de conservation idéales du café vert (T° ou humidité hors plage selon
le pays) et matérialiser une **alerte** persistée, consultable et actionnable
(ACK). Couvre le premier cas d'alerte du CDC §III.4 (conditions hors plage).

## Scope

**Inclus (#32) :**
- Évaluateur **pur** des seuils T°/humidité.
- Persistance des alertes `TEMPERATURE_OUT_OF_RANGE` / `HUMIDITY_OUT_OF_RANGE`.
- **Déduplication** : 1 alerte max par `(type, entrepôt, jour UTC)`.
- Branchement sur l'ingestion des mesures (MQTT #28 + fallback REST).

**Hors scope (autres tickets) :**
- Envoi d'email au responsable (#34).
- Cron péremption / `LOT_EXPIRED` (#33) — le type existe en base mais n'est pas
  produit par #32.
- API / UI de consultation et d'ACK des alertes (#35).

## Règles métier

- Seuils **exclusivement** depuis `COUNTRY_CONDITIONS[country]` de
  `@futurekawa/contracts` — jamais codés en dur (ADR-0004).
- Plage acceptable = `[ideal − tol, ideal + tol]`, **bornes incluses = OK**.
  Strictement hors → alerte.
- Une mesure peut lever **0, 1 ou 2** alertes (T° et/ou humidité).
- **Déduplication** : garde applicative (vérifier l'absence avant insert),
  fenêtre = journée calendaire **UTC** du moment courant. Pas de contrainte SQL,
  s'appuie sur l'index `@@index([type, triggeredAt])`.
- Entité de référence pour les alertes mesure = `warehouse`.
- Messages FR clairs incluant la valeur et la plage (ex.
  « Température 35°C hors plage [26;32] »).

## Modèle de données

Modèle Prisma `Alert` (`alerts`) — voir
[`../architecture/database.md`](../architecture/database.md) et
[ADR-0002](../adr/0002-prisma-schema.md) :

| Champ | Type | Note |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `country` | `Country` | enum réutilisé |
| `type` | `AlertType` | nouvel enum miroir de contracts |
| `message` | `String` | FR, valeur + plage |
| `lotId` | `String?` | renseigné par #33 |
| `warehouse` | `String?` | renseigné pour les alertes mesure |
| `triggeredAt` | `DateTime` | |
| `acknowledged` | `Boolean @default(false)` | |
| `createdAt` | `DateTime @default(now())` | audit |

Index `@@index([type, triggeredAt])` (support de la dédup).

## Contrats API / MQTT

Pas de nouvelle route : l'alerting est déclenché par l'ingestion existante
(MQTT `futurekawa/{country}/warehouse/{id}/measurement` + `POST /api/v1/measurements`).
L'API de consultation des alertes est traitée en #35.

| Type | Contrat | Fichier |
|---|---|---|
| Types | `Alert`, `AlertType`, `CountryConditions` | `packages/contracts/src/alert.ts`, `country.ts` |

## Architecture technique

L'évaluation tourne **synchrone** après chaque persistance de mesure, en
**best-effort** : un échec d'alerting ne fait jamais échouer l'ingestion.

```mermaid
flowchart TD
    M["Mesure ingérée (MQTT ou REST)"] --> S["measurements.save"]
    S --> R["RaiseMeasurementAlertsUseCase.execute"]
    R --> E{"evaluateMeasurement hors plage ?"}
    E -- non --> OK["fin"]
    E -- oui --> D{"alerte same type+warehouse+jour UTC ?"}
    D -- oui --> OK
    D -- non --> P["save Alert (acknowledged=false)"]
```

## Implémentation

- **Domain** :
  - `apps/backend-pays/src/alerts/domain/alert.ts` (`Alert`, `NewAlert`)
  - `apps/backend-pays/src/alerts/domain/alert-rule.ts` (évaluateur pur)
  - `apps/backend-pays/src/alerts/domain/alert.repository.ts` (port)
- **Application** :
  - `apps/backend-pays/src/alerts/application/raise-measurement-alerts.use-case.ts`
- **Infrastructure** :
  - `apps/backend-pays/src/alerts/infrastructure/prisma-alert.repository.ts`
- **Wiring ingestion** : `AlertsModule` exporte `RaiseMeasurementAlertsUseCase`,
  importé par `MeasurementsModule` ; `IngestMeasurementUseCase` l'appelle après
  `save` (try/catch + log `warn`).

## Tests

| Niveau | Fichier | Couvre |
|---|---|---|
| Unit | `apps/backend-pays/src/alerts/domain/alert-rule.spec.ts` | seuils BR/EC/CO, bornes, messages |
| Unit | `apps/backend-pays/src/alerts/application/raise-measurement-alerts.use-case.spec.ts` | dédup + in-range |
| Unit | `apps/backend-pays/src/measurements/application/ingest-measurement.use-case.spec.ts` | best-effort alerting |
| Intégration | `apps/backend-pays/test/alerting.e2e-spec.ts` | persistance + dédup via REST, DB réelle |

## Évolutions / TODO

- [ ] #33 — cron péremption (lots > 365j → `LOT_EXPIRED`).
- [ ] #34 — envoi d'email best-effort au responsable.
- [ ] #35 — API/UI de consultation et d'ACK des alertes.
