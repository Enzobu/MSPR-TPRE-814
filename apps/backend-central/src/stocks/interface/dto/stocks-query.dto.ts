import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_FACET_LENGTH = 120;
const SORT_PATTERN = /^storedAt:(asc|desc)$/;

// Query de GET /api/v1/stocks. `country` optionnel : absent → consolidation des
// trois pays. Pagination + tri FIFO appliqués sur l'ensemble fusionné.
export class StocksQueryDto {
  @ApiPropertyOptional({
    description: 'Filtre par pays. Absent → consolidation BR + EC + CO.',
    enum: COUNTRY_CODES,
    example: 'BR',
  })
  @IsOptional()
  @IsIn(COUNTRY_CODES)
  country?: CountryCode;

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

  @ApiPropertyOptional({
    description: 'Tri FIFO sur la date de stockage.',
    example: 'storedAt:asc',
    default: 'storedAt:asc',
    pattern: 'storedAt:(asc|desc)',
  })
  @IsOptional()
  @Matches(SORT_PATTERN, {
    message: 'sort must be storedAt:asc or storedAt:desc',
  })
  sort: string = 'storedAt:asc';

  @ApiPropertyOptional({
    description: 'Filtre par exploitation (égalité stricte). CDC §III.3.',
    example: 'Fazenda Aurora',
    maxLength: MAX_FACET_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_FACET_LENGTH)
  farm?: string;

  @ApiPropertyOptional({
    description: 'Filtre par entrepôt (égalité stricte). CDC §III.3.',
    example: 'Entrepôt Santos',
    maxLength: MAX_FACET_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_FACET_LENGTH)
  warehouse?: string;
}
