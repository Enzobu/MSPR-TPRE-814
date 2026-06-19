import type {
  Measurement as DomainMeasurement,
  MeasurementBucket as DomainBucket,
} from '../domain/measurement';
import { MeasurementBucketResponseDto } from './dto/measurement-bucket-response.dto';
import { MeasurementResponseDto } from './dto/measurement-response.dto';

// Mappers explicites entité domaine → DTO de sortie (rules backend-pays).
// Sérialisent les `Date` en ISO 8601 pour le contrat public.
export function toMeasurementResponse(
  measurement: DomainMeasurement,
): MeasurementResponseDto {
  return {
    id: measurement.id,
    country: measurement.country,
    warehouse: measurement.warehouse,
    temperatureCelsius: measurement.temperatureCelsius,
    humidityPercent: measurement.humidityPercent,
    recordedAt: measurement.recordedAt.toISOString(),
  };
}

export function toBucketResponse(
  bucket: DomainBucket,
): MeasurementBucketResponseDto {
  return {
    bucketStart: bucket.bucketStart.toISOString(),
    avgTemperatureCelsius: bucket.avgTemperatureCelsius,
    avgHumidityPercent: bucket.avgHumidityPercent,
    count: bucket.count,
  };
}
