import type { CountryCode } from './country';

export interface Measurement {
  id: string;
  country: CountryCode;
  warehouse: string;
  temperatureCelsius: number;
  humidityPercent: number;
  recordedAt: string;
}

export interface IngestMeasurementDto {
  warehouse: string;
  temperatureCelsius: number;
  humidityPercent: number;
  // Optionnel : le module IoT l'omet tant que NTP n'a pas convergé. Absent →
  // le backend horodate à la réception (ADR-0003). Widening non-breaking.
  recordedAt?: string;
}

// Fenêtre temporelle agrégée (moyennes T°/humidité) d'un entrepôt, renvoyée par
// GET /measurements/aggregate. `bucketStart` est l'instant ISO 8601 de début de
// fenêtre ; `count` le nombre de mesures agrégées dans la fenêtre.
export interface MeasurementBucket {
  bucketStart: string;
  avgTemperatureCelsius: number;
  avgHumidityPercent: number;
  count: number;
}
