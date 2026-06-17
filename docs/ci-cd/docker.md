---
title: Environnement Docker
owner: équipe
status: implemented
updated: 2026-06-17
---

# Environnement Docker

L'environnement local conteneurise les backends NestJS, le frontend React, MariaDB, Mosquitto et Maildev.

## URLs, ports et credentials

Les URLs locales, ports exposés, URLs internes et credentials MariaDB sont définis dans `.env.compose`, à créer depuis [`../../.env.compose.example`](../../.env.compose.example). Les commandes du [`../../Makefile`](../../Makefile) passent ce fichier à Docker Compose via `--env-file`.

## Services

| Service | Rôle |
|---|---|
| `frontend-web` | SPA React servie par Nginx |
| `backend-central` | API siège et agrégation pays |
| `backend-pays-br` | API pays Brésil |
| `backend-pays-ec` | API pays Équateur |
| `backend-pays-co` | API pays Colombie |
| `mariadb-central` | Base siège |
| `mariadb-br` | Base pays Brésil |
| `mariadb-ec` | Base pays Équateur |
| `mariadb-co` | Base pays Colombie |
| `mosquitto-br` | Broker MQTT Brésil |
| `mosquitto-ec` | Broker MQTT Équateur |
| `mosquitto-co` | Broker MQTT Colombie |
| `maildev` | SMTP local et interface de consultation des emails |

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
