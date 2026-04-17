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
  recordedAt: string;
}
