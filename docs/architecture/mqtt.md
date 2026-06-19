---
title: MQTT — broker, auth, ACL
owner: Yanis
status: implemented
updated: 2026-06-19
cdc-ref: "§III.2"
adr-refs: [0003]
---

# MQTT — broker Mosquitto

La **convention de topics, payload, QoS, retain et LWT** est figée par
[ADR-0003](../adr/0003-mqtt-convention.md) — non répétée ici. Ce document couvre la
**configuration du broker** : auth, ACL, persistance.

## Topologie

**Un broker Mosquitto par pays** (ADR-0001). Le firmware ESP8266 **publie** les
mesures, le `backend-pays` **s'abonne**. Image : `eclipse-mosquitto:2.0`, port
`1883`. Service Docker : `mosquitto-pays`.

```
futurekawa/{country}/warehouse/{warehouseId}/measurement   # mesures (QoS 1, retain false)
futurekawa/{country}/warehouse/{warehouseId}/status        # online/offline (LWT, retain true)
```

## Fichiers

| Fichier | Rôle |
|---|---|
| [`infra/mosquitto/mosquitto.conf`](../../infra/mosquitto/mosquitto.conf) | Config broker (listener, auth, ACL, persistance, logs) |
| [`infra/mosquitto/entrypoint.sh`](../../infra/mosquitto/entrypoint.sh) | Génère `passwordfile` + `aclfile` au démarrage, puis lance Mosquitto |

## Authentification

- **`allow_anonymous false`** : aucune connexion anonyme (rules/07-security).
- **`password_file`** (hashé) généré au démarrage par `entrypoint.sh` à partir des
  variables d'environnement (users de **dev**, régénérés à chaque `compose up`) :

  | User | Variable | Usage |
  |---|---|---|
  | IoT | `MQTT_IOT_USERNAME` / `MQTT_IOT_PASSWORD` | capteur ESP8266 (publie) |
  | backend | `MQTT_BACKEND_USERNAME` / `MQTT_BACKEND_PASSWORD` | `backend-pays` (consomme) |

- `backend-pays` reçoit `MQTT_USERNAME` / `MQTT_PASSWORD` (= user backend) via le
  `docker-compose.yml`. Le firmware reçoit ses credentials via `secrets.h`.

## ACL (scoping par topic pays)

`aclfile` généré au démarrage, scopé sur `COUNTRY_CODE` :

- **IoT** : `write` sur `futurekawa/{COUNTRY}/warehouse/+/measurement` et `.../status`.
- **backend** : `read` sur les mêmes topics.

Un user ne peut donc agir que sur les topics de **son** pays, dans le **sens** attendu
(le capteur publie, le backend lit).

## Persistance

`persistence true` + volume Docker `mosquitto-pays-data` (`/mosquitto/data/`) →
conserve les messages **retained**, dont le statut online/offline des capteurs.

## Démarrage local

Renseigner dans le `.env.compose` (cf. `.env.compose.example`) :

```
COUNTRY_CODE=BR
MQTT_IOT_USERNAME=iot
MQTT_IOT_PASSWORD=<dev>
MQTT_BACKEND_USERNAME=backend-pays
MQTT_BACKEND_PASSWORD=<dev>
```

```bash
docker compose --env-file .env.compose up -d mosquitto-pays
```

Vérifier le scoping (depuis un conteneur outillé / mosquitto-clients) :

```bash
# refus anonyme (attendu : connexion rejetée)
mosquitto_sub -h localhost -p 1883 -t 'futurekawa/BR/warehouse/+/measurement'

# OK avec le user backend
mosquitto_sub -h localhost -p 1883 -u backend-pays -P <dev> \
  -t 'futurekawa/BR/warehouse/+/measurement'
```

## Hors scope (prod, #50)

- **TLS** (port 8883) + certificats.
- Secrets gérés hors-image (vault / secrets CI), rotation.
- Clustering / haute dispo du broker.
