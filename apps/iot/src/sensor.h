// ──────────────────────────────────────────────
// sensor.h — lecture du capteur DHT (T° + humidite).
// Encapsule la lib Adafruit DHT. Une lecture ratee renvoie NaN ; la
// validation/decision de publication est faite ailleurs (measurement).
// ──────────────────────────────────────────────
#pragma once

struct Reading {
  float temperatureCelsius;
  float humidityPercent;
};

class Sensor {
 public:
  void begin();

  // Lit le DHT. En cas d'echec (NaN renvoye par le capteur), les champs
  // valent NAN ; l'appelant decide via measurement::isValid().
  Reading read();
};
