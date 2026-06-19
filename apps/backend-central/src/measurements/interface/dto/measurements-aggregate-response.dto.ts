import { ApiProperty } from '@nestjs/swagger';
import {
  COUNTRY_CODES,
  type ConsolidatedList,
  type CountryCode,
  type MeasurementBucket,
} from '@futurekawa/contracts';

// Vue siège d'une fenêtre agrégée (moyennes T°/humidité), alignée sur le contrat
// `MeasurementBucket`. Re-exposée via DTO pour découpler du backend pays.
export class MeasurementBucketDto implements MeasurementBucket {
  @ApiProperty({
    description: 'Début de la fenêtre agrégée (ISO 8601).',
    example: '2026-06-01T08:00:00.000Z',
  })
  bucketStart!: string;

  @ApiProperty({
    description: 'Température moyenne de la fenêtre (°C).',
    example: 22.4,
  })
  avgTemperatureCelsius!: number;

  @ApiProperty({
    description: 'Humidité moyenne de la fenêtre (%).',
    example: 54.8,
  })
  avgHumidityPercent!: number;

  @ApiProperty({
    description: 'Nombre de relevés agrégés dans la fenêtre.',
    example: 12,
  })
  count!: number;
}

// Réponse consolidée non paginée de GET /api/v1/measurements/aggregate : buckets
// d'un entrepôt + `unavailable` si le pays est injoignable. Jamais 500 (ADR-0007).
export class ConsolidatedBucketsResponseDto implements ConsolidatedList<MeasurementBucketDto> {
  @ApiProperty({
    type: [MeasurementBucketDto],
    description: 'Fenêtres agrégées (ordre chronologique côté pays).',
  })
  data!: MeasurementBucketDto[];

  @ApiProperty({
    description: 'Pays injoignable (vide si le pays a répondu).',
    enum: COUNTRY_CODES,
    isArray: true,
    example: [],
  })
  unavailable!: CountryCode[];
}
