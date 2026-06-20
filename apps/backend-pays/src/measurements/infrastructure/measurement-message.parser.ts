import {
  HUMIDITY_PERCENT_MAX,
  HUMIDITY_PERCENT_MIN,
  MEASUREMENT_TOPIC_SUFFIX,
  MQTT_TOPIC_ROOT,
  TEMPERATURE_CELSIUS_MAX,
  TEMPERATURE_CELSIUS_MIN,
} from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import type { NewMeasurement } from '../domain/measurement';

// Parsing + validation PURS d'un message MQTT (topic + payload) vers un
// NewMeasurement. Aucune dépendance Nest/IO : testable directement et réutilise
// les MÊMES bornes que le DTO REST (constantes @futurekawa/contracts, ADR-0003).
// `null` = message à dropper (topic mal formé, JSON cassé, plages hors bornes) ;
// le caller log un warn et ignore. Le `country` est imposé par l'instance, le
// `warehouseId` est porté par le topic, jamais par le payload.

export type ParseFailureReason =
  | 'malformed-topic'
  | 'invalid-json'
  | 'invalid-payload-shape'
  | 'out-of-range';

export type ParseResult =
  | { ok: true; measurement: NewMeasurement }
  | { ok: false; reason: ParseFailureReason };

interface RawPayload {
  temperatureCelsius: unknown;
  humidityPercent: unknown;
  recordedAt: unknown;
}

// `futurekawa/{country}/warehouse/{warehouseId}/measurement`.
const TOPIC_SEGMENTS = 5;

function extractWarehouse(topic: string, country: CountryCode): string | null {
  const parts = topic.split('/');
  if (parts.length !== TOPIC_SEGMENTS) {
    return null;
  }
  const [root, topicCountry, warehouseKeyword, warehouseId, suffix] = parts;
  const matchesPattern =
    root === MQTT_TOPIC_ROOT &&
    topicCountry === country &&
    warehouseKeyword === 'warehouse' &&
    suffix === MEASUREMENT_TOPIC_SUFFIX;
  if (!matchesPattern || warehouseId.length === 0) {
    return null;
  }
  return warehouseId;
}

function isInRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

export function parseMeasurementMessage(
  topic: string,
  payload: Buffer,
  country: CountryCode,
): ParseResult {
  const warehouse = extractWarehouse(topic, country);
  if (warehouse === null) {
    return { ok: false, reason: 'malformed-topic' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.toString('utf8'));
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, reason: 'invalid-payload-shape' };
  }
  const { temperatureCelsius, humidityPercent, recordedAt } =
    parsed as RawPayload;

  if (
    typeof temperatureCelsius !== 'number' ||
    typeof humidityPercent !== 'number' ||
    typeof recordedAt !== 'string'
  ) {
    return { ok: false, reason: 'invalid-payload-shape' };
  }

  const recordedAtDate = new Date(recordedAt);
  if (Number.isNaN(recordedAtDate.getTime())) {
    return { ok: false, reason: 'invalid-payload-shape' };
  }

  if (
    !isInRange(
      temperatureCelsius,
      TEMPERATURE_CELSIUS_MIN,
      TEMPERATURE_CELSIUS_MAX,
    ) ||
    !isInRange(humidityPercent, HUMIDITY_PERCENT_MIN, HUMIDITY_PERCENT_MAX)
  ) {
    return { ok: false, reason: 'out-of-range' };
  }

  return {
    ok: true,
    measurement: {
      country,
      warehouse,
      temperatureCelsius,
      humidityPercent,
      recordedAt: recordedAtDate,
    },
  };
}
