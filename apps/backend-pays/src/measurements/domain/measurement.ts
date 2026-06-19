import type { CountryCode } from '@futurekawa/contracts';

// Entité domaine d'un relevé. `recordedAt` est une `Date` (le domaine manipule
// des dates ; la sérialisation ISO est l'affaire de la couche interface). Le
// modèle Prisma est un sur-ensemble (createdAt) non porté ici car non exposé.
export interface Measurement {
  id: string;
  country: CountryCode;
  warehouse: string;
  temperatureCelsius: number;
  humidityPercent: number;
  recordedAt: Date;
}

// Données d'insertion d'un relevé (utilisé par le subscriber MQTT #28). L'`id`
// est posé en base (cuid) ; le pays vient du backend, pas du payload IoT.
export interface NewMeasurement {
  country: CountryCode;
  warehouse: string;
  temperatureCelsius: number;
  humidityPercent: number;
  recordedAt: Date;
}

// Fenêtre temporelle agrégée (moyennes T°/humidité). `bucketStart` est une
// `Date` côté domaine ; la couche interface la sérialise en ISO 8601.
export interface MeasurementBucket {
  bucketStart: Date;
  avgTemperatureCelsius: number;
  avgHumidityPercent: number;
  count: number;
}
