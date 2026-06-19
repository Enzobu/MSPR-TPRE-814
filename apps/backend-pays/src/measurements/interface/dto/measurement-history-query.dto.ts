import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// DTO de query de GET /api/v1/measurements. Historique paginé d'un entrepôt.
// `transform: true` (ValidationPipe global) coerce les nombres et applique les
// valeurs par défaut.
export class MeasurementHistoryQueryDto {
  @ApiProperty({
    description: "Entrepôt dont on lit l'historique.",
    example: 'W1',
  })
  @IsString()
  @IsNotEmpty()
  warehouse!: string;

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
