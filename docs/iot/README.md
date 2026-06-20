---
title: Documentation IoT — index
owner: Yanis
status: in-progress
updated: 2026-06-20
cdc-ref: "§IV.4.2"
---

# Documentation IoT (CDC §IV.4.2)

Documentation du module de surveillance T°/humidité embarqué (ESP8266 + capteur
DHT), qui publie ses relevés en MQTT vers le `backend-pays` (ADR-0003).

| Document | Contenu | Statut |
|---|---|---|
| [`hardware.md`](hardware.md) | Câblage ESP8266 ↔ DHT, choix matériel (DHT22/DHT11), limites | implemented |
| [`protocol.md`](protocol.md) | Topics, payloads JSON, QoS, fréquences MQTT (ADR-0003) | implemented |
| [`firmware.md`](firmware.md) | Architecture du firmware, boucle non bloquante, reconnexion | implemented |

## Voir aussi

- Convention MQTT figée : [ADR-0003](../adr/0003-mqtt-convention.md)
- Feature cross-app (firmware ↔ broker ↔ backend) : [`../features/firmware-iot.md`](../features/firmware-iot.md)
- Code firmware : `apps/iot/` (PlatformIO, hors workspace pnpm)
