---
title: Plan de test
owner: Yanis
status: in-progress
cdc-ref: "§IV.4.3"
adr-refs: [0003, 0004, 0007, 0008]
updated: 2026-06-20
---

# Plan de test

Cas de test **critiques** par zone métier, avec jeux de données et critères de
réussite. La stratégie et l'outillage sont dans [`strategy.md`](strategy.md). Ce
plan se concentre sur les **règles métier qui font le produit** (ADR-0008), pas
sur l'exhaustivité.

## Légende

- **Niveau** : U = unitaire · I = intégration · UI = composant front · E2E = parcours.
- **Statut** : ✅ couvert · 🚧 partiel · ⬜ à faire.

## 1. Alerting — seuils T°/humidité par pays

Source de vérité des seuils : `COUNTRY_CONDITIONS[country]` de `@futurekawa/contracts`
(ADR-0004). Le domain est **pur** → testable sans infra.

| # | Cas | Niveau | Jeu de données | Attendu | Fichier |
|---|---|---|---|---|---|
| 1.1 | Mesure dans la plage → aucune alerte | U | T°/H au centre de la plage pays | 0 alerte | `alerts/domain/alert-rule.spec.ts` |
| 1.2 | Mesure **sur la borne** → pas d'alerte | U | T° = max toléré exact | 0 alerte (borne incluse) | `alert-rule.spec.ts` |
| 1.3 | T° au-dessus de la plage | U | T° = max + tolérance + ε | alerte `TEMPERATURE_OUT_OF_RANGE` | `alert-rule.spec.ts` |
| 1.4 | Humidité hors plage | U | H hors bornes | alerte `HUMIDITY_OUT_OF_RANGE` | `alert-rule.spec.ts` |
| 1.5 | Seuils **différents par pays** (BR/EC/CO) | U | même mesure, 3 pays | verdict conforme aux seuils de chaque pays | `alert-rule.spec.ts` |
| 1.6 | **Déduplication** : 1 alerte / type+entité+jour | U | 2 mesures hors plage le même jour | 1 seule alerte | `raise-measurement-alerts.use-case.spec.ts` |
| 1.7 | Alerte hors plage → **email** envoyé | I | mesure hors plage, MailDev up | email capté par MailDev | `alerts/infrastructure/email/*.spec.ts`, e2e `alerting-mqtt-email.e2e-spec.ts` |
| 1.8 | Mesure hors plage → lots `CONFORME` de l'entrepôt → `EN_ALERTE` (#151) | U | mesure hors plage | `setWarehouseStatus(CONFORME→EN_ALERTE)` appelé | `lots/application/sync-warehouse-lot-status.use-case.spec.ts`, `measurements/application/ingest-measurement.use-case.spec.ts` |
| 1.9 | Mesure de retour dans la plage → lots `EN_ALERTE` → `CONFORME` (#151) | U | mesure in-range | `setWarehouseStatus(EN_ALERTE→CONFORME)` appelé | idem |
| 1.10 | Les lots `PERIME` ne changent jamais de statut (péremption prime) | U | transitions hors/dans plage | `PERIME` jamais dans `from`/`to` | `sync-warehouse-lot-status.use-case.spec.ts` |

## 2. Péremption des lots (365 j)

| # | Cas | Niveau | Jeu de données | Attendu | Fichier |
|---|---|---|---|---|---|
| 2.1 | Lot ≤ 365 j → pas périmé | U | `storedAt` = J-364 | pas d'alerte | `alerts/domain/lot-expiration.spec.ts` |
| 2.2 | Lot > 365 j → périmé | U | `storedAt` = J-366 | statut `PERIME` + alerte `LOT_EXPIRED` | `lot-expiration.spec.ts`, `expire-lots.use-case.spec.ts` |
| 2.3 | Cron quotidien marque les lots périmés | U/I | lots mixtes | seuls les > 365 j basculent | `lot-expiration.cron.spec.ts`, e2e `expiration.e2e-spec.ts` |

## 3. Tri FIFO des lots

| # | Cas | Niveau | Jeu de données | Attendu | Fichier |
|---|---|---|---|---|---|
| 3.1 | Liste triée par `storedAt` croissant | U | lots dans le désordre | ordre FIFO (plus ancien d'abord) | `list-lots.use-case.spec.ts` |
| 3.2 | Tri stable sur égalité de date | U | dates identiques | ordre déterministe | `list-lots.use-case.spec.ts` |
| 3.3 | FIFO bout-en-bout (front) | E2E | jeu de lots mocké | tableau affiché en FIFO | `frontend-web/tests/e2e/fifo.spec.ts` |

## 4. Persistance des mesures MQTT (ADR-0003)

| # | Cas | Niveau | Jeu de données | Attendu | Fichier |
|---|---|---|---|---|---|
| 4.1 | Payload valide → persisté | U/I | JSON conforme | mesure enregistrée | `measurement-message.parser.spec.ts`, `mqtt-ingestion.e2e-spec.ts` |
| 4.2 | Payload hors bornes → droppé | U | T° = 999 | drop + log warn, pas de persistance | `measurement-message.parser.spec.ts` |
| 4.3 | Payload non-JSON → droppé | U | bytes invalides | drop, pas de crash | `measurement-message.parser.spec.ts` |
| 4.4 | `warehouseId` reconstruit depuis le topic | U | topic `.../W1/...` | mesure rattachée à `W1` | `measurement-message.parser.spec.ts` |
| 4.5 | **Reconnexion** broker (résilience) | I | broker coupé puis relancé | reprise sans crash | `mqtt-resilience.e2e-spec.ts` |
| 4.6 | Débit (≈100 msg) sans perte | I | rafale de mesures | toutes persistées | `mqtt-ingestion.e2e-spec.ts` |
| 4.7 | Format topic/clientId (firmware) | U | (BR, W1) | `futurekawa/BR/warehouse/W1/measurement` | `apps/iot/test/test_topic/` |
| 4.8 | Sérialisation JSON (firmware) | U | T°/H + bornes + NaN | payload conforme / vide si invalide | `apps/iot/test/test_measurement_json/` |

## 5. Contrats HTTP pays ↔ siège + résilience (ADR-0007)

| # | Cas | Niveau | Jeu de données | Attendu | Fichier |
|---|---|---|---|---|---|
| 5.1 | Agrégation : tous pays OK | U | 3 pays répondent | `data` complet, `unavailable: []` | `stocks/application/aggregate-stocks.use-case.spec.ts` |
| 5.2 | **Réponse partielle** : 1 pays down | U | EC en échec | 200, `unavailable: ["EC"]` | `aggregate-stocks.use-case.spec.ts` |
| 5.3 | Timeout pays → considéré indisponible | U | pays > 3 s | bascule `unavailable` | `http-country-backend.gateway.spec.ts` |
| 5.4 | Retry sur erreur transitoire | U | 5xx puis 200 | succès après retry | `http-country-backend.gateway.spec.ts` |
| 5.5 | Pas de retry sur 4xx | U | 400 | pas de réessai | `http-country-backend.gateway.spec.ts` |
| 5.6 | Circuit breaker : ouvre après 5 échecs | U | 5 échecs consécutifs | court-circuit + cooldown | `circuit-breaker.spec.ts` |
| 5.7 | Cache 30 s sur lectures consolidées | U | 2 requêtes < 30 s | 2ᵉ servie par cache | `stocks/application/stocks-cache.spec.ts` |

## 6. Authentification (siège, ADR-0006)

| # | Cas | Niveau | Attendu | Fichier |
|---|---|---|---|---|
| 6.1 | Login valide → JWT | U | token émis | `login.use-case.spec.ts` |
| 6.2 | Mot de passe faux → rejet | U | 401, pas de token | `login.use-case.spec.ts` |
| 6.3 | Hash bcrypt (jamais clair) | U | hash vérifiable | `bcrypt-password-hasher.spec.ts` |
| 6.4 | Refresh token | U | nouveau token | `refresh-token.use-case.spec.ts` |
| 6.5 | Guards rôles / JWT | U | accès refusé sans droit | `guards/*.spec.ts` |
| 6.6 | Parcours login front | E2E | redirection après login | `frontend-web/tests/e2e/auth.spec.ts` |

## 7. Frontend (composants & pages)

Couvert par Vitest + RTL : tables (lots, alertes, mesures), badges de statut,
filtres/tri via URL, sélecteur de pays, bandeau `unavailable`, graphiques, menu
utilisateur, routes protégées. Voir `apps/frontend-web/tests/`.

| Parcours critique | Niveau | Fichier |
|---|---|---|
| Accueil / dashboard | E2E | `tests/e2e/home.spec.ts` |
| FIFO lots | E2E | `tests/e2e/fifo.spec.ts` |
| Auth | E2E | `tests/e2e/auth.spec.ts` |

## Critères de réussite globaux

- Toutes les suites **vertes** (`pnpm -r test`, `pio test`, Playwright).
- Les zones critiques (1–5) **couvertes** avec au moins les cas marqués ci-dessus.
- Aucune régression sur les contrats partagés (`@futurekawa/contracts`).
- Toute anomalie détectée suit le process de [`anomalies.md`](anomalies.md).

## Jeux de données

- **Lots** : seed jetable avec dates échelonnées (FIFO + un lot > 365 j).
- **Mesures** : valeurs in-range / sur-borne / hors-plage pour chaque pays.
- **Alertes** : générées par les mesures hors-plage et le cron de péremption.
- Préfixe `IT-` pour l'isolation, cleanup en fin de suite.
