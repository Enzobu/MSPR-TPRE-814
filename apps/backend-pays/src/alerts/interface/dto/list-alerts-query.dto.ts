import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ALERT_TYPES } from '@futurekawa/contracts';
import type { AlertType } from '@futurekawa/contracts';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Query string : tout arrive en string. On coerce 'true'/'false' en booléen
// (les autres valeurs restent telles quelles → @IsBoolean rejette → 400).
const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

// DTO de query de GET /api/v1/alerts. Filtres type/acknowledged + pagination.
// `transform: true` (ValidationPipe global) applique les défauts et coerce.
export class ListAlertsQueryDto {
  @ApiPropertyOptional({
    description: "Filtre sur le type d'alerte.",
    enum: ALERT_TYPES,
    example: 'TEMPERATURE_OUT_OF_RANGE',
  })
  @IsOptional()
  @IsIn(ALERT_TYPES)
  type?: AlertType;

  @ApiPropertyOptional({
    description: "Filtre sur l'état d'acquittement.",
    example: false,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  acknowledged?: boolean;

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
