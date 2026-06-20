import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResponse } from '@futurekawa/contracts';
import { AlertResponseDto } from './alert-response.dto';

// DTO de sortie de GET /api/v1/alerts. Enveloppe paginée standardisée.
export class PaginatedAlertsResponseDto implements PaginatedResponse<AlertResponseDto> {
  @ApiProperty({
    type: [AlertResponseDto],
    description: 'Alertes de la page courante.',
  })
  data!: AlertResponseDto[];

  @ApiProperty({
    description: "Nombre total d'alertes (toutes pages, filtres appliqués).",
    example: 12,
  })
  total!: number;

  @ApiProperty({ description: 'Page courante (1-based).', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Taille de page appliquée.', example: 20 })
  pageSize!: number;
}
