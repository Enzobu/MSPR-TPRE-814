// ──────────────────────────────────────────────
// config.h — parametres materiels et de cadence centralises.
// Aucun secret ici (voir secrets.h). Aucune logique : que des #define.
// ──────────────────────────────────────────────
#pragma once

// ── Capteur DHT ─────────────────────────────────────────────────
// DHT22 par defaut (precision/plage superieures). Basculer sur DHT11
// si c'est le modele disponible sur le stock campus (fallback).
#ifndef DHT_TYPE
#define DHT_TYPE DHT11
#endif

// GPIO de la broche DATA du DHT. GPIO4 = D2 sur la plupart des
// cartes ESP-12E / NodeMCU. Pull-up 10k entre DATA et VCC (voir
// docs/iot/hardware.md).
#ifndef DHT_PIN
#define DHT_PIN 2
#endif

// ── Cadence de publication ──────────────────────────────────────
// 30 s par defaut (ADR-0003). Configurable a la compilation.
#ifndef PUBLISH_INTERVAL_MS
#define PUBLISH_INTERVAL_MS 30000UL
#endif

// ── Bornes de validation (ADR-0003) ─────────────────────────────
// Une mesure hors bornes est consideree invalide et n'est pas publiee.
#define TEMPERATURE_MIN_CELSIUS (-50.0f)
#define TEMPERATURE_MAX_CELSIUS (80.0f)
#define HUMIDITY_MIN_PERCENT    (0.0f)
#define HUMIDITY_MAX_PERCENT    (100.0f)

// ── Vitesse du moniteur serie ───────────────────────────────────
#define SERIAL_BAUD 115200

// ── Reconnexion WiFi : backoff exponentiel plafonne ─────────────
#define WIFI_BACKOFF_MIN_MS 500UL
#define WIFI_BACKOFF_MAX_MS 30000UL

// ── Reconnexion MQTT : intervalle mini entre deux tentatives ────
#define MQTT_RETRY_INTERVAL_MS 5000UL

// ── NTP (horodatage recordedAt) ─────────────────────────────────
// L'ESP8266 n'a pas de RTC fiable : on synchronise l'heure via NTP.
// Si NTP n'a pas encore converge, recordedAt est omis (best-effort)
// et le backend horodate a la reception (ADR-0003).
#define NTP_SERVER_PRIMARY   "pool.ntp.org"
#define NTP_SERVER_SECONDARY "time.nist.gov"
