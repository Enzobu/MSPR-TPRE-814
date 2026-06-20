// ──────────────────────────────────────────────
// measurement_json.h — logique PURE : validation + serialisation JSON
// du payload de mesure (ADR-0003). Aucune dependance Arduino hardware :
// les valeurs (temperature, humidite, timestamp) sont injectees en
// parametres => le module compile et se teste en natif (`pio test -e
// native`).
// ──────────────────────────────────────────────
#pragma once

#include <string>

namespace measurement {

// Bornes ADR-0003. Dupliquees ici en constantes pour que le module
// reste autonome cote test natif (config.h tire des macros Arduino).
constexpr float TEMPERATURE_MIN = -50.0f;
constexpr float TEMPERATURE_MAX = 80.0f;
constexpr float HUMIDITY_MIN = 0.0f;
constexpr float HUMIDITY_MAX = 100.0f;

// Une mesure est valide si T et H sont finies et dans les bornes.
bool isValid(float temperatureCelsius, float humidityPercent);

// Serialise le payload JSON conforme ADR-0003.
//   {"temperatureCelsius":28.5,"humidityPercent":56.2,"recordedAt":"...Z"}
// recordedAt est INJECTE (testabilite) :
//   - chaine ISO-8601 UTC non vide => champ inclus
//   - chaine vide => champ omis (le backend horodate, ADR-0003)
// Retourne "" si la mesure est invalide (l'appelant ne publie pas).
std::string toJson(float temperatureCelsius, float humidityPercent,
                   const std::string& recordedAtIso);

}  // namespace measurement
