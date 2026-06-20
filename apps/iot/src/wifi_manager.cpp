#include "wifi_manager.h"

#include <ESP8266WiFi.h>

#include "config.h"

void WifiManager::begin(const char* ssid, const char* password) {
  ssid_ = ssid;
  password_ = password;
  WiFi.mode(WIFI_STA);
  WiFi.persistent(false);
  backoffMs_ = WIFI_BACKOFF_MIN_MS;
  nextAttemptAt_ = 0;  // tentative immediate au premier loop()
  attempting_ = false;
}

bool WifiManager::isConnected() const {
  return WiFi.status() == WL_CONNECTED;
}

void WifiManager::scheduleNextAttempt() {
  nextAttemptAt_ = millis() + backoffMs_;
  // Backoff exponentiel plafonne : double a chaque echec.
  backoffMs_ = backoffMs_ * 2;
  if (backoffMs_ > WIFI_BACKOFF_MAX_MS) {
    backoffMs_ = WIFI_BACKOFF_MAX_MS;
  }
}

void WifiManager::loop() {
  if (isConnected()) {
    // Reset du backoff une fois connecte, pour repartir court a la
    // prochaine coupure.
    backoffMs_ = WIFI_BACKOFF_MIN_MS;
    attempting_ = false;
    return;
  }

  uint32_t now = millis();
  if (now < nextAttemptAt_) {
    return;  // on attend la fin du backoff, sans bloquer
  }

  if (!attempting_) {
    WiFi.begin(ssid_, password_);
    attempting_ = true;
  } else {
    // La tentative precedente n'a pas abouti : on relance et on
    // espace davantage.
    WiFi.disconnect();
    WiFi.begin(ssid_, password_);
  }
  scheduleNextAttempt();
}
