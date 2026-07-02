---
title: Tests lançables manuellement
owner: Yanis
status: in-progress
cdc-ref: "§IV.6"
adr-refs: [0003, 0008]
updated: 2026-07-02
---

# Tests lançables manuellement (CDC §IV.6)

Page de consolidation : **une seule commande à copier** par type de test, avec
pré-requis, jeux de données et où lire les résultats. La stratégie de fond est
dans [`strategy.md`](strategy.md) ; les cas détaillés dans
[`test-plan.md`](test-plan.md).

## Pré-requis

| Outil | Version | Usage |
|---|---|---|
| Node | voir `.nvmrc` | exécution des suites TS |
| pnpm | workspace | `pnpm install` à la racine (installe tout le monorepo) |
| Docker + Compose | 27+ | tests d'intégration/e2e (DB + broker + mailer jetables) |
| PlatformIO (`pio`) | CLI | tests unitaires firmware (natif, sans carte) |

```bash
pnpm install                 # une fois, à la racine
pnpm -r build                # contracts + nest-common d'abord (dist consommé par les apps)
```

## 1. Tests unitaires (rapides, sans Docker)

Pas de dépendance externe : logique métier pure, deps mockées.

```bash
pnpm --filter backend-pays test        # 156 tests (alerting, FIFO, parsing MQTT…)
pnpm --filter backend-central test     # 121 tests (agrégation, résilience)
pnpm --filter frontend-web test        # 159 tests (composants, hooks, filtres URL)
```

Couverture : ajouter `:cov` (ex. `pnpm --filter backend-pays test:cov`) → rapport
dans `apps/<app>/coverage/`.

## 2. Tests d'intégration / e2e backends (Docker requis)

Les suites e2e tapent une **vraie** MariaDB + un **vrai** broker Mosquitto + un
mailer de test, démarrés par `docker-compose.test.yml` (bases jetables, `tmpfs`,
migrations appliquées au boot).

```bash
# 1. démarrer les dépendances de test
docker compose -f docker-compose.test.yml up -d

# 2. lancer les suites e2e
pnpm --filter backend-pays test:e2e      # lots, mesures, alerting, MQTT, résilience
pnpm --filter backend-central test:e2e   # stocks/mesures/alertes consolidés, pays down

# 3. arrêter et nettoyer (volumes inclus)
docker compose -f docker-compose.test.yml down -v
```

## 3. Tests e2e frontend (Playwright)

Les specs **mockent le réseau** (aucun backend requis).

```bash
pnpm --filter frontend-web test:e2e      # dashboard, FIFO, auth
```

Rapport HTML : `apps/frontend-web/playwright-report/` (ouvrir `index.html`).

## 4. Tests firmware IoT (natif, sans carte)

```bash
cd apps/iot
pio test -e native                       # test_topic + test_measurement_json
```

## 5. Injection manuelle de mesures MQTT (démo sans capteur)

Pour alimenter le `backend-pays` sans firmware, publier sur le topic du pays. La
stack locale doit tourner (`make up`) ; le broker écoute sur `MOSQUITTO_PAYS_PORT`.

```bash
mosquitto_pub -h localhost -p 1883 \
  -u "$MQTT_IOT_USERNAME" -P "$MQTT_IOT_PASSWORD" \
  -t 'futurekawa/BR/warehouse/W1/measurement' \
  -m '{"temperatureCelsius":22.5,"humidityPercent":55,"recordedAt":"2026-06-01T08:00:00.000Z"}'
```

- `recordedAt` peut être **omis** : le backend horodate à la réception (#150).
- Une mesure **hors plage** (ex. `temperatureCelsius: 40` en BR) déclenche une
  alerte + email (visible dans le mailer de test).

La commande assistée `/mqtt-simulate` (`.claude/commands/mqtt-simulate.md`)
automatise l'envoi de rafales de relevés factices.

## Jeux de données

- **Lots** : seed jetable avec dates échelonnées (FIFO) + un lot > 365 j (péremption).
- **Mesures** : valeurs *in-range* / *sur-borne* / *hors-plage* pour chaque pays
  (seuils `COUNTRY_CONDITIONS`).
- **Alertes** : produites par les mesures hors-plage et le cron de péremption.
- Préfixe `IT-` pour l'isolation, cleanup en fin de suite.

## Où lire les résultats

| Sortie | Emplacement |
|---|---|
| Résumé test (pass/fail) | stdout de la commande |
| Couverture | `apps/<app>/coverage/index.html` |
| Rapport Playwright | `apps/frontend-web/playwright-report/index.html` |
| Emails d'alerte (e2e) | UI du mailer de test (MailDev) |
| Logs backend (démo) | `make logs` |

## Critères de réussite

Toutes les suites **vertes**, zones critiques 1–5 du [`test-plan.md`](test-plan.md)
couvertes. Toute anomalie suit le process d'[`anomalies.md`](anomalies.md).
