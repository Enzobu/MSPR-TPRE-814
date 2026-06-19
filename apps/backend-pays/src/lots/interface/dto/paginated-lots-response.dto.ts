import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResponse } from '@futurekawa/contracts';
import { LotResponseDto } from './lot-response.dto';

// DTO de sortie de GET /api/v1/lots. Enveloppe paginée standardisée.
export class PaginatedLotsResponseDto implements PaginatedResponse<LotResponseDto> {
  @ApiProperty({
    type: [LotResponseDto],
    description: 'Lots de la page courante.',
  })
  data!: LotResponseDto[];

  @ApiProperty({
    description: 'Nombre total de lots (toutes pages).',
    example: 20,
  })
  total!: number;

  @ApiProperty({ description: 'Page courante (1-based).', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Taille de page appliquée.', example: 20 })
  pageSize!: number;
}
