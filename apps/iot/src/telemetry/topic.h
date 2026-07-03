// ──────────────────────────────────────────────
// topic.h — construction des topics MQTT et du clientId (ADR-0003).
//
// Le pattern est DUPLIQUE depuis @futurekawa/contracts (ADR-0001 : le
// firmware C++ ne consomme pas le package TS). Un test pio garantit le
// format. Header-only et sans dependance Arduino => testable en natif.
// ──────────────────────────────────────────────
#pragma once

#include <string>

namespace topic {

// futurekawa/{country}/warehouse/{warehouseId}/measurement
inline std::string measurement(const std::string& country,
                               const std::string& warehouseId) {
  return "futurekawa/" + country + "/warehouse/" + warehouseId +
         "/measurement";
}

// futurekawa/{country}/warehouse/{warehouseId}/status
inline std::string status(const std::string& country,
                          const std::string& warehouseId) {
  return "futurekawa/" + country + "/warehouse/" + warehouseId + "/status";
}

// futurekawa-iot-{country}-{warehouseId}
inline std::string clientId(const std::string& country,
                            const std::string& warehouseId) {
  return "futurekawa-iot-" + country + "-" + warehouseId;
}

}  // namespace topic
