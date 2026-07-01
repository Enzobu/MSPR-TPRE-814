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
#include <ESP8266WiFi.h>

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
  delay(1000);

  Serial.println();
  Serial.println("[boot] ESP started");
  Serial.print("[serial] baud=");
  Serial.println(SERIAL_BAUD);

  sensor.begin();
  Serial.println("[sensor] init OK");

  isoClock.begin();
  Serial.println("[clock] init OK");

  wifi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.println("[wifi] init OK");

  mqtt.begin(MQTT_HOST, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD, COUNTRY,
             WAREHOUSE_ID);
  Serial.println("[mqtt] init OK");
}

void loop() {
  wifi.loop();

  if (!wifi.isConnected()) {
    static uint32_t lastWifiLog = 0;
    if (millis() - lastWifiLog > 2000) {
      lastWifiLog = millis();
      Serial.println("[wifi] not connected");
    }
    return;
  }

  static bool wifiLogged = false;
  if (!wifiLogged) {
    wifiLogged = true;
    Serial.print("[wifi] connected, ip=");
    Serial.println(WiFi.localIP());
  }

  mqtt.loop();

  if (!mqtt.isConnected()) {
    static uint32_t lastMqttLog = 0;
    if (millis() - lastMqttLog > 2000) {
      lastMqttLog = millis();
      Serial.println("[mqtt] not connected");
    }
    return;
  }

  uint32_t now = millis();
  if (now - lastPublishAt >= PUBLISH_INTERVAL_MS) {
    lastPublishAt = now;
    publishMeasurement();
  }
}
