// ──────────────────────────────────────────────
// wifi_manager.h — connexion WiFi + reconnexion NON bloquante.
// Backoff exponentiel plafonne (config.h). Aucun delay() long : la
// progression se fait via millis() appelee a chaque loop().
// ──────────────────────────────────────────────
#pragma once

#include <cstdint>

class WifiManager {
 public:
  void begin(const char* ssid, const char* password);

  // A appeler a chaque loop(). Tente (re)connexion selon le backoff si
  // deconnecte. Non bloquant.
  void loop();

  bool isConnected() const;

 private:
  const char* ssid_ = nullptr;
  const char* password_ = nullptr;
  uint32_t nextAttemptAt_ = 0;
  uint32_t backoffMs_ = 0;
  bool attempting_ = false;

  void scheduleNextAttempt();
};
