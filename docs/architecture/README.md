---
title: Architecture — index
owner: Yanis
status: in-progress
cdc-ref: "§IV.4.1"
updated: 2026-06-20
---

# Architecture FutureKawa (CDC §IV.4.1)

Documentation de l'architecture globale : composants, flux, distribution
pays/siège, modèle de données et conventions d'échange.

| Document | Contenu |
|---|---|
| [`overview.md`](overview.md) | Vision d'ensemble : composants, responsabilités, flux principaux |
| [`distributed.md`](distributed.md) | Architecture distribuée pays ↔ siège, résilience (ADR-0001, ADR-0007) |
| [`database.md`](database.md) | Modèles Prisma + diagrammes ER (pays + siège) |
| [`mqtt.md`](mqtt.md) | Broker Mosquitto : config, auth, ACL (contrat → ADR-0003 / iot/protocol.md) |
| [`api.md`](api.md) | Conventions REST (versioning, RFC 7807, pagination) + Swagger |

## Décisions d'architecture liées

Les choix structurants sont figés dans des [ADR](../adr/) :

| ADR | Sujet |
|---|---|
| [0001](../adr/0001-distributed-architecture.md) | Architecture distribuée pays/siège |
| [0002](../adr/0002-prisma-schema.md) | Schéma Prisma |
| [0003](../adr/0003-mqtt-convention.md) | Convention MQTT |
| [0004](../adr/0004-alerting-strategy.md) | Stratégie d'alerting |
| [0005](../adr/0005-frontend-stack.md) | Stack frontend |
| [0006](../adr/0006-auth-strategy.md) | Stratégie d'authentification |
| [0007](../adr/0007-resilience-strategy.md) | Résilience central ↔ pays |
| [0008](../adr/0008-testing-strategy.md) | Stratégie de tests |
