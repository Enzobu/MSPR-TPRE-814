#include "clock_iso.h"

#include <Arduino.h>  // configTime() est declaree par le core ESP8266
#include <time.h>

#include "config.h"

void ClockIso::begin() {
  // UTC (offset 0, pas de DST) : recordedAt est en UTC avec 'Z'.
  configTime(0, 0, NTP_SERVER_PRIMARY, NTP_SERVER_SECONDARY);
}

std::string ClockIso::recordedAtIso() const {
  time_t now = time(nullptr);
  // Avant la 1ere sync NTP, l'epoch est proche de 0 : on considere
  // l'heure non fiable et on omet recordedAt.
  if (now < 1000000000) {  // ~2001-09-09, garde-fou
    return "";
  }
  struct tm tmUtc;
  gmtime_r(&now, &tmUtc);
  char buf[21];  // "YYYY-MM-DDTHH:MM:SSZ" + '\0'
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &tmUtc);
  return std::string(buf);
}
