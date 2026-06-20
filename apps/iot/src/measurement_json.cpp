#include "measurement_json.h"

#include <ArduinoJson.h>

#include <cmath>

namespace measurement {

bool isValid(float temperatureCelsius, float humidityPercent) {
  if (std::isnan(temperatureCelsius) || std::isnan(humidityPercent)) {
    return false;
  }
  if (std::isinf(temperatureCelsius) || std::isinf(humidityPercent)) {
    return false;
  }
  if (temperatureCelsius < TEMPERATURE_MIN ||
      temperatureCelsius > TEMPERATURE_MAX) {
    return false;
  }
  if (humidityPercent < HUMIDITY_MIN || humidityPercent > HUMIDITY_MAX) {
    return false;
  }
  return true;
}

std::string toJson(float temperatureCelsius, float humidityPercent,
                   const std::string& recordedAtIso) {
  if (!isValid(temperatureCelsius, humidityPercent)) {
    return "";
  }

  JsonDocument doc;
  doc["temperatureCelsius"] = temperatureCelsius;
  doc["humidityPercent"] = humidityPercent;
  // recordedAt best-effort : omis si NTP pas synchronise (ADR-0003).
  if (!recordedAtIso.empty()) {
    doc["recordedAt"] = recordedAtIso;
  }

  std::string out;
  serializeJson(doc, out);
  return out;
}

}  // namespace measurement
