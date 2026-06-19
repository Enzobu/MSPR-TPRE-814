import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { BucketSize } from '../../application/aggregate-measurements.use-case';

const BUCKET_SIZES: readonly BucketSize[] = ['1h', '1d'];

// DTO de query de GET /api/v1/measurements/aggregate. Moyennes T°/humidité par
// fenêtre temporelle d'un entrepôt.
export class AggregateMeasurementsQueryDto {
  @ApiProperty({
    description: 'Entrepôt à agréger.',
    example: 'W1',
  })
  @IsString()
  @IsNotEmpty()
  warehouse!: string;

  @ApiProperty({
    description: "Taille de la fenêtre d'agrégation.",
    enum: BUCKET_SIZES,
    example: '1h',
  })
  @IsIn(BUCKET_SIZES)
  bucket!: BucketSize;

  @ApiPropertyOptional({
    description: 'Borne inférieure de la plage (ISO 8601, incluse).',
    example: '2026-06-01T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'Borne supérieure de la plage (ISO 8601, incluse).',
    example: '2026-06-02T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
