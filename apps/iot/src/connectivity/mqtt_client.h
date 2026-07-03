// ──────────────────────────────────────────────
// mqtt_client.h — wrapper PubSubClient (ADR-0003).
//   - connect avec LWT (status="offline", retain, QoS 1)
//   - a la connexion : publish status="online" (retain)
//   - reconnexion NON bloquante (tentative espacee via millis())
//   - publish mesure QoS 1, retain=false
// ──────────────────────────────────────────────
#pragma once

#include <cstdint>
#include <string>

class MqttClient {
 public:
  // country / warehouseId servent a deriver topics + clientId (topic.h).
  void begin(const char* host, uint16_t port, const char* username,
             const char* password, const std::string& country,
             const std::string& warehouseId);

  // A appeler a chaque loop(). Reconnecte si besoin (non bloquant) puis
  // pompe la pile MQTT.
  void loop();

  bool isConnected() const;

  // Publie un payload deja serialise sur le topic mesure (QoS 1).
  bool publishMeasurement(const std::string& payload);

 private:
  std::string measurementTopic_;
  std::string statusTopic_;
  std::string clientId_;
  const char* username_ = nullptr;
  const char* password_ = nullptr;
  uint32_t nextRetryAt_ = 0;

  bool reconnect();
};
