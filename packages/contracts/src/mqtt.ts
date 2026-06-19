import type { CountryCode } from './country';

// Convention MQTT figée par ADR-0003. Source unique de vérité du pattern de
// topic, partagée par le subscriber backend-pays et la doc. Le firmware C++ ne
// consomme pas ce package (ADR-0001) : il duplique le topic via `#define`.

// Racine commune à tous les topics FutureKawa.
export const MQTT_TOPIC_ROOT = 'futurekawa';

// Suffixe du topic de mesure.
export const MEASUREMENT_TOPIC_SUFFIX = 'measurement';

// Bornes de validation du payload de mesure (ADR-0003). Partagées par le DTO
// REST et le parsing MQTT pour garantir des contraintes identiques aux deux bords.
export const TEMPERATURE_CELSIUS_MIN = -50;
export const TEMPERATURE_CELSIUS_MAX = 80;
export const HUMIDITY_PERCENT_MIN = 0;
export const HUMIDITY_PERCENT_MAX = 100;

// Topic de publication d'une mesure d'un entrepôt donné :
// `futurekawa/{country}/warehouse/{warehouseId}/measurement`.
export function measurementTopic(
  country: CountryCode,
  warehouseId: string,
): string {
  return `${MQTT_TOPIC_ROOT}/${country}/warehouse/${warehouseId}/${MEASUREMENT_TOPIC_SUFFIX}`;
}

// Topic d'abonnement du backend pays : wildcard `+` sur l'entrepôt, scopé à son
// propre pays — `futurekawa/{country}/warehouse/+/measurement`.
export function measurementSubscriptionTopic(country: CountryCode): string {
  return `${MQTT_TOPIC_ROOT}/${country}/warehouse/+/${MEASUREMENT_TOPIC_SUFFIX}`;
}
