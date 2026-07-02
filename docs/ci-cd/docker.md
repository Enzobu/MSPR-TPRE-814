---
title: Environnement Docker
owner: équipe
status: implemented
updated: 2026-07-02
---

# Environnement Docker

L'environnement local conteneurise les backends NestJS, le frontend React, MariaDB, Mosquitto et phpMyAdmin. Pour la démo actuelle, une seule instance pays est lancée ; le pays cible est configuré via `COUNTRY_CODE`.

## URLs, ports et credentials

Les URLs locales, ports exposés, URLs internes et credentials MariaDB sont définis dans `.env.compose`, à créer depuis [`../../.env.compose.example`](../../.env.compose.example). Les commandes du [`../../Makefile`](../../Makefile) passent ce fichier à Docker Compose via `--env-file`.

## Services

| Service | Rôle |
|---|---|
| `frontend-web` | SPA React servie par Nginx |
| `docs` | Site de documentation utilisateur (VitePress) servi par Nginx (ADR-0009/0010) |
| `backend-central` | API siège et agrégation pays |
| `backend-pays` | API pays configurée par `COUNTRY_CODE` |
| `mariadb-central` | Base siège |
| `mariadb-pays` | Base pays |
| `mosquitto-pays` | Broker MQTT pays |
| `phpmyadmin` | Interface dev-only d'accès aux bases MariaDB |

## Healthchecks et ordre de démarrage

Chaque service porte un `healthcheck` et les dépendances utilisent `condition: service_healthy` pour éviter les courses au démarrage (règle `08-observability.md`) :

| Service | Sonde | Dépend de (healthy) |
|---|---|---|
| `mariadb-central` / `mariadb-pays` | `mariadb-admin ping` | — |
| `mosquitto-pays` | `mosquitto_sub -E` (auth backend + ACL pays) | — |
| `backend-pays` | `GET /ready` (DB + MQTT) | `mariadb-pays`, `mosquitto-pays` |
| `backend-central` | `GET /ready` (DB centrale uniquement) | `mariadb-central` |
| `frontend-web` | `wget /` (Nginx) | `backend-central` |

`backend-central` dépend de `backend-pays` en `service_started` (pas `healthy`) : son `/ready` ne vérifie **pas** les pays, car l'agrégation est résiliente à un pays isolé (ADR-0007). Les endpoints `/health` (liveness) et `/ready` (readiness) sont exposés par les deux backends hors préfixe `/api`.

## Commandes

```bash
make docker-build
make docker-up
make docker-logs
make docker-ps
make docker-down
make docker-clean
```

## Tests d'intégration

Un compose dédié démarre les dépendances jetables nécessaires aux tests d'intégration :

```bash
make docker-test-up
make docker-test-down
```
