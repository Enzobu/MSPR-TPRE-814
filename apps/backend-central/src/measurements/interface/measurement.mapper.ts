import type { Measurement, MeasurementBucket } from '@futurekawa/contracts';
import { MeasurementBucketDto } from './dto/measurements-aggregate-response.dto';
import { MeasurementDto } from './dto/measurements-response.dto';

// Mappers explicites (rules backend-central) : ne jamais renvoyer tel quel la
// réponse d'un backend pays. Recopie les seuls champs du contrat → tout champ
// inattendu ajouté côté pays est filtré, le siège reste découplé.
export function toMeasurement(measurement: Measurement): MeasurementDto {
  return {
    id: measurement.id,
    country: measurement.country,
    warehouse: measurement.warehouse,
    temperatureCelsius: measurement.temperatureCelsius,
    humidityPercent: measurement.humidityPercent,
    recordedAt: measurement.recordedAt,
  };
}

export function toBucket(bucket: MeasurementBucket): MeasurementBucketDto {
  return {
    bucketStart: bucket.bucketStart,
    avgTemperatureCelsius: bucket.avgTemperatureCelsius,
    avgHumidityPercent: bucket.avgHumidityPercent,
    count: bucket.count,
  };
}
