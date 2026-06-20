// Tests Unity de la logique PURE de serialisation JSON (measurement).
// Tournent en natif (`pio test -e native`), sans hardware.
#include <unity.h>

#include <ArduinoJson.h>

#include <string>

#include "../../src/measurement_json.h"

void setUp(void) {}
void tearDown(void) {}

// Le payload contient les 3 champs ADR-0003 quand recordedAt est fourni.
void test_json_has_three_fields(void) {
  std::string json = measurement::toJson(28.5f, 56.2f, "2026-04-17T14:32:00Z");

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, json);
  TEST_ASSERT_TRUE(err == DeserializationError::Ok);
  TEST_ASSERT_TRUE(doc["temperatureCelsius"].is<float>());
  TEST_ASSERT_TRUE(doc["humidityPercent"].is<float>());
  TEST_ASSERT_EQUAL_STRING("2026-04-17T14:32:00Z",
                           doc["recordedAt"].as<const char*>());
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 28.5f, doc["temperatureCelsius"].as<float>());
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 56.2f, doc["humidityPercent"].as<float>());
}

// recordedAt vide => champ omis (le backend horodate, ADR-0003).
void test_json_omits_recorded_at_when_empty(void) {
  std::string json = measurement::toJson(20.0f, 50.0f, "");

  JsonDocument doc;
  deserializeJson(doc, json);
  TEST_ASSERT_FALSE(doc["recordedAt"].is<const char*>());
  TEST_ASSERT_TRUE(doc["temperatureCelsius"].is<float>());
}

// Bornes : temperature hors [-50;80] => invalide => payload vide.
void test_temperature_out_of_bounds_is_rejected(void) {
  TEST_ASSERT_TRUE(measurement::toJson(81.0f, 50.0f, "").empty());
  TEST_ASSERT_TRUE(measurement::toJson(-51.0f, 50.0f, "").empty());
}

// Bornes : humidite hors [0;100] => invalide => payload vide.
void test_humidity_out_of_bounds_is_rejected(void) {
  TEST_ASSERT_TRUE(measurement::toJson(20.0f, 101.0f, "").empty());
  TEST_ASSERT_TRUE(measurement::toJson(20.0f, -1.0f, "").empty());
}

// NaN (lecture DHT ratee) => invalide.
void test_nan_reading_is_invalid(void) {
  TEST_ASSERT_FALSE(measurement::isValid(NAN, 50.0f));
  TEST_ASSERT_FALSE(measurement::isValid(20.0f, NAN));
  TEST_ASSERT_TRUE(measurement::isValid(20.0f, 50.0f));
}

// Bornes incluses (valeurs limites acceptees).
void test_bounds_inclusive(void) {
  TEST_ASSERT_TRUE(measurement::isValid(-50.0f, 0.0f));
  TEST_ASSERT_TRUE(measurement::isValid(80.0f, 100.0f));
}

int main(int, char**) {
  UNITY_BEGIN();
  RUN_TEST(test_json_has_three_fields);
  RUN_TEST(test_json_omits_recorded_at_when_empty);
  RUN_TEST(test_temperature_out_of_bounds_is_rejected);
  RUN_TEST(test_humidity_out_of_bounds_is_rejected);
  RUN_TEST(test_nan_reading_is_invalid);
  RUN_TEST(test_bounds_inclusive);
  return UNITY_END();
}
