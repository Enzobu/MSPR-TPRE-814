---
title: Runbook
owner: Yanis
status: in-progress
cdc-ref: "§IV.4.1"
updated: 2026-06-20
---

# Runbook

Opérations courantes pour faire tourner et surveiller la stack FutureKawa. Pour
le déploiement, voir [`deployment.md`](deployment.md) ; pour les incidents,
[`troubleshooting.md`](troubleshooting.md).

## Composants de la stack

| Service | Image / build | Port (hôte) | Dépend de |
|---|---|---|---|
| `mariadb-central` | mariadb:11.4 | `MARIADB_CENTRAL_PORT` | — |
| `mariadb-pays` | mariadb:11.4 | `MARIADB_PAYS_PORT` | — |
| `mosquitto-pays` | eclipse-mosquitto:2.0 | `MOSQUITTO_PAYS_PORT` | — |
| `phpmyadmin` | phpmyadmin:5.2 | `PHPMYADMIN_WEB_PORT` | mariadb (healthy) |
| `backend-pays` | `apps/backend-pays/Dockerfile` | `BACKEND_PAYS_PORT` → 3000 | mariadb-pays, mosquitto-pays |
| `backend-central` | `apps/backend-central/Dockerfile` | `BACKEND_CENTRAL_PORT` → 3000 | mariadb-central, backend-pays |
| `frontend-web` | `apps/frontend-web/Dockerfile` | `FRONTEND_WEB_PORT` → 8080 | backend-central |
| `docs` | `docs/Dockerfile` (VitePress) | `DOCS_WEB_PORT` → 8080 | — |

## Démarrer / arrêter

```bash
# Préparer l'environnement (copier puis renseigner les valeurs)
cp .env.compose.example .env.compose

# Démarrer toute la stack
docker compose --env-file .env.compose up -d

# Démarrer un service précis (+ ses dépendances)
docker compose --env-file .env.compose up -d backend-pays

# Arrêter (conserve les volumes / données)
docker compose down

# Arrêter et SUPPRIMER les données (reset complet)
docker compose down -v
```

## Vérifier la santé

Chaque backend expose deux endpoints (hors préfixe `/api`) :

| Endpoint | Sens | Vérifie |
|---|---|---|
| `/health` | liveness | le process répond |
| `/ready` | readiness | dépendances critiques (DB, MQTT, SMTP) accessibles |

```bash
curl -fsS http://localhost:${BACKEND_PAYS_PORT}/health   && echo OK
curl -fsS http://localhost:${BACKEND_PAYS_PORT}/ready     && echo READY
curl -fsS http://localhost:${BACKEND_CENTRAL_PORT}/health && echo OK
```

```bash
# État et santé des conteneurs (les MariaDB ont un healthcheck Docker)
docker compose ps
```

## Consulter les logs

Logs **JSON structurés** (pino) — filtrables par `correlation_id` pour suivre une
requête de bout en bout (front → central → pays).

```bash
docker compose logs -f backend-pays
docker compose logs -f backend-central
docker compose logs --since=15m backend-pays

# Suivre une requête précise via son correlation id
docker compose logs backend-central | grep <correlation-id>
```

## Redémarrer un service

```bash
docker compose restart backend-pays         # redémarrage simple
docker compose up -d --build backend-pays   # après changement de code/image
```

> Un `backend-pays` qui redémarre **se reconnecte seul** au broker MQTT
> (`reconnectPeriod`), et le `backend-central` traite son indisponibilité
> temporaire en **réponse partielle** (pas de 500).

## Base de données

```bash
# Migrations (par backend)
pnpm --filter backend-pays exec prisma migrate deploy
pnpm --filter backend-central exec prisma migrate deploy

# Exploration : phpMyAdmin sur http://localhost:${PHPMYADMIN_WEB_PORT}
# ou Prisma Studio en dev :
pnpm --filter backend-pays exec prisma studio
```

```bash
# Sauvegarde / restauration logique d'une base
docker compose exec mariadb-pays \
  mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_PAYS_DATABASE" > backup-pays.sql

docker compose exec -T mariadb-pays \
  mariadb -u root -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_PAYS_DATABASE" < backup-pays.sql
```

## Vérifier le flux MQTT

```bash
# Observer les mesures publiées (avec le user backend, cf. mqtt.md)
mosquitto_sub -h localhost -p ${MOSQUITTO_PAYS_PORT} \
  -u "$MQTT_BACKEND_USERNAME" -P "$MQTT_BACKEND_PASSWORD" \
  -t 'futurekawa/#' -v

# Injecter une mesure de test sans matériel
/mqtt-simulate           # commande projet (mosquitto_pub)
/mqtt-simulate --anomaly # valeur hors plage → déclenche une alerte
```

## Références

- Déploiement & rollback : [`deployment.md`](deployment.md)
- Incidents : [`troubleshooting.md`](troubleshooting.md)
- Broker MQTT : [`../architecture/mqtt.md`](../architecture/mqtt.md)
- Variables d'env : `.env.compose.example`
