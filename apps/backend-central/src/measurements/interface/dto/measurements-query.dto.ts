import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Query de GET /api/v1/measurements. À la différence de /stocks, une mesure
// appartient à UN pays et UN entrepôt : `country` et `warehouse` sont requis.
export class MeasurementsQueryDto {
  @ApiProperty({
    description: 'Pays propriétaire des mesures (requis).',
    enum: COUNTRY_CODES,
    example: 'BR',
  })
  @IsIn(COUNTRY_CODES)
  country!: CountryCode;

  @ApiProperty({
    description: "Entrepôt dont on consulte l'historique (requis).",
    example: 'W1',
  })
  @IsString()
  @IsNotEmpty()
  warehouse!: string;

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

  @ApiPropertyOptional({
    description: 'Numéro de page (1-based).',
    example: 1,
    minimum: 1,
    default: DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Taille de page.',
    example: 20,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;
}
