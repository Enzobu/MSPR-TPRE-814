import { ApiProperty } from '@nestjs/swagger';
import type { LotFacets } from '@futurekawa/contracts';

// DTO de sortie de GET /api/v1/lots/facets : valeurs distinctes pour les
// sélecteurs exploitation/entrepôt (CDC §III.3).
export class LotFacetsResponseDto implements LotFacets {
  @ApiProperty({
    description: 'Exploitations distinctes, triées.',
    example: ['Fazenda Aurora', 'Hacienda El Roble'],
    type: [String],
  })
  farms!: string[];

  @ApiProperty({
    description: 'Entrepôts distincts, triés.',
    example: ['Entrepôt Santos', 'Entrepôt Guayaquil'],
    type: [String],
  })
  warehouses!: string[];
}
