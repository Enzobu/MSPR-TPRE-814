// ──────────────────────────────────────────────
// main.cpp — ORCHESTRATION uniquement (setup + loop machine a etats).
// Aucune logique metier inline : tout est delegue aux modules.
//   wifi_manager  -> connexion WiFi non bloquante
//   mqtt_client   -> connexion MQTT + LWT + publish
//   sensor        -> lecture DHT
//   clock_iso     -> horodatage NTP best-effort
//   measurement   -> validation + serialisation JSON (logique pure)
// ──────────────────────────────────────────────
#include <Arduino.h>

#include "clock_iso.h"
#include "config.h"
#include "measurement_json.h"
#include "mqtt_client.h"
#include "secrets.h"
#include "sensor.h"
#include "wifi_manager.h"

namespace {
WifiManager wifi;
MqttClient mqtt;
Sensor sensor;
ClockIso isoClock;

uint32_t lastPublishAt = 0;

void publishMeasurement() {
  Reading r = sensor.read();
  std::string payload = measurement::toJson(r.temperatureCelsius,
                                            r.humidityPercent,
                                            isoClock.recordedAtIso());
  if (payload.empty()) {
    Serial.println(F("[sensor] lecture invalide, mesure ignoree"));
    return;
  }
  if (mqtt.publishMeasurement(payload)) {
    Serial.print(F("[mqtt] publie: "));
    Serial.println(payload.c_str());
  } else {
    Serial.println(F("[mqtt] echec publication"));
  }
}
}  // namespace

void setup() {
  Serial.begin(SERIAL_BAUD);
  sensor.begin();
  isoClock.begin();
  wifi.begin(WIFI_SSID, WIFI_PASSWORD);
  mqtt.begin(MQTT_HOST, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD, COUNTRY,
             WAREHOUSE_ID);
}

void loop() {
  wifi.loop();

  // On ne touche pas MQTT tant que le WiFi n'est pas la (ADR-0003).
  if (!wifi.isConnected()) {
    return;
  }
  mqtt.loop();

  // Ne publier que si WiFi + MQTT connectes.
  if (!mqtt.isConnected()) {
    return;
  }

  uint32_t now = millis();
  if (now - lastPublishAt >= PUBLISH_INTERVAL_MS) {
    lastPublishAt = now;
    publishMeasurement();
  }
}
