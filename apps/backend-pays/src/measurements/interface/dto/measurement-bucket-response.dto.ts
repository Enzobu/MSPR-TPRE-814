import { ApiProperty } from '@nestjs/swagger';
import type { MeasurementBucket } from '@futurekawa/contracts';

// DTO de sortie de GET /api/v1/measurements/aggregate : une fenêtre temporelle
// agrégée. Forme figée alignée sur le contrat `MeasurementBucket`.
export class MeasurementBucketResponseDto implements MeasurementBucket {
  @ApiProperty({
    description: 'Début de la fenêtre temporelle (ISO 8601).',
    example: '2026-06-01T08:00:00.000Z',
  })
  bucketStart!: string;

  @ApiProperty({
    description: 'Température moyenne sur la fenêtre (°C).',
    example: 22.4,
  })
  avgTemperatureCelsius!: number;

  @ApiProperty({
    description: 'Humidité moyenne sur la fenêtre (%).',
    example: 54.8,
  })
  avgHumidityPercent!: number;

  @ApiProperty({
    description: 'Nombre de relevés agrégés dans la fenêtre.',
    example: 12,
  })
  count!: number;
}
