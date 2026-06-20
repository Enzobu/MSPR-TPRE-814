// Tests Unity du format des topics MQTT et du clientId (ADR-0003).
// Header-only => tournent en natif sans hardware.
#include <unity.h>

#include "../../src/topic.h"

void setUp(void) {}
void tearDown(void) {}

void test_measurement_topic_format(void) {
  TEST_ASSERT_EQUAL_STRING("futurekawa/BR/warehouse/W1/measurement",
                           topic::measurement("BR", "W1").c_str());
}

void test_status_topic_format(void) {
  TEST_ASSERT_EQUAL_STRING("futurekawa/BR/warehouse/W1/status",
                           topic::status("BR", "W1").c_str());
}

void test_client_id_format(void) {
  TEST_ASSERT_EQUAL_STRING("futurekawa-iot-BR-W1",
                           topic::clientId("BR", "W1").c_str());
}

// Autre pays/entrepot pour verifier l'absence de valeur en dur.
void test_topics_for_other_country(void) {
  TEST_ASSERT_EQUAL_STRING("futurekawa/EC/warehouse/QUITO-2/measurement",
                           topic::measurement("EC", "QUITO-2").c_str());
  TEST_ASSERT_EQUAL_STRING("futurekawa-iot-EC-QUITO-2",
                           topic::clientId("EC", "QUITO-2").c_str());
}

int main(int, char**) {
  UNITY_BEGIN();
  RUN_TEST(test_measurement_topic_format);
  RUN_TEST(test_status_topic_format);
  RUN_TEST(test_client_id_format);
  RUN_TEST(test_topics_for_other_country);
  return UNITY_END();
}
