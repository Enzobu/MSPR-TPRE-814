// ──────────────────────────────────────────────
// clock_iso.h — horodatage ISO-8601 UTC via NTP (best-effort).
// L'ESP8266 n'a pas de RTC fiable : on synchronise via configTime/NTP.
// Tant que l'heure n'est pas synchronisee, recordedAtIso() renvoie ""
// => le champ recordedAt est omis et le backend horodate (ADR-0003).
// ──────────────────────────────────────────────
#pragma once

#include <string>

class ClockIso {
 public:
  void begin();

  // "2026-04-17T14:32:00Z" si l'heure est synchronisee, sinon "".
  std::string recordedAtIso() const;
};
