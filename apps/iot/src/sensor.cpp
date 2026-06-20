#include "sensor.h"

#include <DHT.h>

#include "config.h"

namespace {
DHT dht(DHT_PIN, DHT_TYPE);
}

void Sensor::begin() { dht.begin(); }

Reading Sensor::read() {
  // readHumidity()/readTemperature() renvoient NAN si le capteur ne
  // repond pas : on propage tel quel, le filtrage est fait en amont
  // de la publication.
  Reading r;
  r.humidityPercent = dht.readHumidity();
  r.temperatureCelsius = dht.readTemperature();
  return r;
}
