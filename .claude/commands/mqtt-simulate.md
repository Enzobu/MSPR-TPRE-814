---
description: Injecte des relevés de température/humidité factices dans le broker MQTT local pour tester backend-pays sans firmware.
argument-hint: <country: BR|EC|CO> [count=10] [--anomaly]
---

Simule un flux MQTT de relevés T°/humidité pour le pays donné, directement sur le broker local (via `docker compose`).

Arguments : $ARGUMENTS

## Comportement attendu

1. Vérifie que le broker Mosquitto est up (`docker compose ps mosquitto`). Sinon, propose de le démarrer.
2. Récupère les seuils du pays depuis `packages/contracts/src/country.ts` (ou depuis la source de vérité active).
3. Publie `count` messages (défaut 10) sur `futurekawa/{country}/warehouse/W1/measurement` avec payload JSON :
   ```json
   { "temperatureCelsius": <valeur>, "humidityPercent": <valeur>, "recordedAt": "<ISO>" }
   ```
4. Par défaut : valeurs **dans la plage conforme** du pays (ideal ± tolerance).
5. Si `--anomaly` : générer des valeurs **hors plage** pour déclencher l'alerting.
6. Utiliser `mosquitto_pub` depuis le conteneur Mosquitto (`docker compose exec mosquitto mosquitto_pub ...`).
7. Afficher un résumé : topic, nombre de messages, exemple de payload.

## Pré-requis

- `docker compose` opérationnel.
- Broker Mosquitto démarré.
- Topic cohérent avec le subscriber de `backend-pays`.

## Exemples

- `/mqtt-simulate BR` — 10 relevés conformes pour le Brésil.
- `/mqtt-simulate EC 50` — 50 relevés conformes pour l'Équateur.
- `/mqtt-simulate CO 5 --anomaly` — 5 relevés hors plage pour la Colombie (pour tester l'alerting).
