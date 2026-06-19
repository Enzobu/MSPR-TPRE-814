import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import type { MeasurementBucketLabel } from '../../application/aggregate-country-measurements.use-case';

const BUCKET_LABELS = ['1h', '1d'] as const;

// Query de GET /api/v1/measurements/aggregate. `bucket` impose la fenêtre
// d'agrégation (1h ou 1d). `country` et `warehouse` requis (proxy mono-pays).
export class MeasurementsAggregateQueryDto {
  @ApiProperty({
    description: 'Pays propriétaire des mesures (requis).',
    enum: COUNTRY_CODES,
    example: 'BR',
  })
  @IsIn(COUNTRY_CODES)
  country!: CountryCode;

  @ApiProperty({
    description: 'Entrepôt dont on agrège les relevés (requis).',
    example: 'W1',
  })
  @IsString()
  @IsNotEmpty()
  warehouse!: string;

  @ApiProperty({
    description: "Fenêtre d'agrégation (requis).",
    enum: BUCKET_LABELS,
    example: '1h',
  })
  @IsIn(BUCKET_LABELS)
  bucket!: MeasurementBucketLabel;

  @ApiPropertyOptional({
    description: 'Borne basse incluse (ISO 8601).',
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'Borne haute incluse (ISO 8601).',
    example: '2026-06-19T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
