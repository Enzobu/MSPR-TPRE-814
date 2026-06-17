# iot — firmware ESP8266

Firmware **embarqué** pour le module IoT : lit un capteur T°/humidité et publie les relevés via MQTT.

Contexte global : voir le `AGENTS.md` racine.

## Important — ne pas confondre avec le reste du monorepo

Ce sous-projet **n'est PAS du Node.js / TypeScript**. C'est du **C++ Arduino** géré par **PlatformIO**.

- ❌ **Ne jamais** lancer `pnpm`, `npm`, `tsc`, `eslint` ici.
- ❌ **Ne jamais** créer de `package.json`.
- ❌ **Ne pas** importer `@futurekawa/contracts` (pas consommable en C++).
- ✅ **Utiliser uniquement** : `pio` (CLI PlatformIO), `make`, scripts shell.

## Responsabilités (extrait CDC §III.2)

1. Mesurer périodiquement **T° (°C)** et **humidité (%)** via un capteur DHT.
2. **Publier** les relevés vers le broker MQTT local du pays.
3. Gérer la **reconnexion WiFi + MQTT** (contrainte "terrain" : réseau variable).

## Stack

- **Hardware** : ESP8266 + breadboard + capteur DHT22 (ou DHT11 selon stock campus).
- **Framework** : Arduino sur ESP8266 (via `framework = arduino` dans `platformio.ini`).
- **Lib MQTT** : `PubSubClient` (knolleary).
- **Lib capteur** : `DHT sensor library` (Adafruit) + `Adafruit Unified Sensor`.

## Commandes

```bash
pio run                          # compile
pio run -t upload                # flash l'ESP8266
pio device monitor               # moniteur série
pio run -t clean                 # clean build
```

## Convention MQTT (à formaliser)

Publier sur `futurekawa/{country}/warehouse/{warehouseId}/measurement` avec payload JSON :

```json
{
  "temperatureCelsius": 28.5,
  "humidityPercent": 56.2,
  "recordedAt": "2026-04-17T14:32:00Z"
}
```

Cette convention **doit rester synchrone** avec le subscriber MQTT de `backend-pays`.

## Règles spécifiques

> Les règles transverses du monorepo (architecture, tests, git, sécurité) sont dans `.codex/commands/rules.md` (`/rules`), mais **la plupart ne s'appliquent pas ici** (C++ / embarqué). Retiens uniquement : pas de secret en git, conventional commits, review obligatoire, et tests là où c'est possible (`pio test` sur la logique pure).

### Règles firmware

- **Secrets WiFi/MQTT** : ne **jamais** commit. Utiliser un `secrets.h` local listé dans `.gitignore`, avec un `secrets.h.example` commité.
- **Fréquence d'émission** : configurable via `#define`. Par défaut 1 relevé / 30 s (à valider avec l'architecture).
- **Retries** : reconnexion WiFi exponentielle, reconnexion MQTT à chaque loop si déconnecté.
- **Ne pas publier sans WiFi+MQTT connectés** — buffer en RAM ou silencieux (à trancher).
- **Séparation des responsabilités** : un module/fichier par préoccupation (`wifi.cpp`, `mqtt.cpp`, `sensor.cpp`, `main.cpp`). `main.cpp` = orchestration uniquement.
- **Tests unitaires** sur la logique pure (formatage JSON, décision d'émission) via `pio test` — pas de test sur le hardware réel dans la CI.
- **Pas de `delay()` bloquants longs** — `millis()` + machine à états.
