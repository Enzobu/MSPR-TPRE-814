#include "mqtt_client.h"

#include <ESP8266WiFi.h>
#include <PubSubClient.h>

#include "config.h"
#include "topic.h"

namespace {
WiFiClient wifiClient;
PubSubClient pubsub(wifiClient);

constexpr const char* STATUS_ONLINE = "online";
constexpr const char* STATUS_OFFLINE = "offline";
}  // namespace

void MqttClient::begin(const char* host, uint16_t port, const char* username,
                       const char* password, const std::string& country,
                       const std::string& warehouseId) {
  measurementTopic_ = topic::measurement(country, warehouseId);
  statusTopic_ = topic::status(country, warehouseId);
  clientId_ = topic::clientId(country, warehouseId);
  username_ = username;
  password_ = password;
  pubsub.setServer(host, port);
  nextRetryAt_ = 0;
}

bool MqttClient::isConnected() const {
  // PubSubClient::connected() n'est pas const ; copie locale pour
  // respecter la signature publique.
  return const_cast<PubSubClient&>(pubsub).connected();
}

bool MqttClient::reconnect() {
  const bool hasAuth = username_ != nullptr && username_[0] != '\0';

  // LWT : le broker publiera status="offline" (retain, QoS 1) si la
  // connexion tombe brutalement (ADR-0003).
  bool ok;
  if (hasAuth) {
    ok = pubsub.connect(clientId_.c_str(), username_, password_,
                        statusTopic_.c_str(), 1, true, STATUS_OFFLINE);
  } else {
    ok = pubsub.connect(clientId_.c_str(), nullptr, nullptr,
                        statusTopic_.c_str(), 1, true, STATUS_OFFLINE);
  }

  if (ok) {
    // Etat courant => retain=true (ADR-0003).
    pubsub.publish(statusTopic_.c_str(),
                   reinterpret_cast<const uint8_t*>(STATUS_ONLINE),
                   strlen(STATUS_ONLINE), true);
  }
  return ok;
}

void MqttClient::loop() {
  if (pubsub.connected()) {
    pubsub.loop();
    return;
  }

  // Reconnexion espacee, non bloquante (ADR-0003 : retry a chaque loop
  // si deconnecte, sans delay()).
  uint32_t now = millis();
  if (now < nextRetryAt_) {
    return;
  }
  nextRetryAt_ = now + MQTT_RETRY_INTERVAL_MS;
  reconnect();
}

bool MqttClient::publishMeasurement(const std::string& payload) {
  if (!pubsub.connected()) {
    return false;
  }
  // NOTE : PubSubClient ne publie qu'en QoS 0. L'ADR-0003 demande QoS 1
  // pour la mesure ; cette limitation de la lib est documentee
  // (docs/iot/hardware.md). Mitigation : LWT + publication frequente
  // (30 s). Un upgrade de lib serait necessaire pour un vrai QoS 1.
  // retain=false : une mesure est un evenement, pas un etat.
  return pubsub.publish(measurementTopic_.c_str(), payload.c_str(), false);
}
