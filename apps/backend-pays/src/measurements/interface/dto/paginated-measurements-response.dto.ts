import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResponse } from '@futurekawa/contracts';
import { MeasurementResponseDto } from './measurement-response.dto';

// DTO de sortie de GET /api/v1/measurements. Enveloppe paginée standardisée.
export class PaginatedMeasurementsResponseDto implements PaginatedResponse<MeasurementResponseDto> {
  @ApiProperty({
    type: [MeasurementResponseDto],
    description: 'Relevés de la page courante (plus récent d’abord).',
  })
  data!: MeasurementResponseDto[];

  @ApiProperty({
    description: 'Nombre total de relevés (toutes pages) pour le filtre.',
    example: 144,
  })
  total!: number;

  @ApiProperty({ description: 'Page courante (1-based).', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Taille de page appliquée.', example: 20 })
  pageSize!: number;
}
