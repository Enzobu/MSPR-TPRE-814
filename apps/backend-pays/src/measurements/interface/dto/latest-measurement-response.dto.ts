import { ApiProperty } from '@nestjs/swagger';
import { MeasurementResponseDto } from './measurement-response.dto';

// Réponse de GET /api/v1/measurements/latest : le dernier relevé du pays, ou
// `null` s'il n'y en a aucun (statut 200 dans les deux cas → le siège gère la
// consolidation et l'état vide sans traiter un 404).
export class LatestMeasurementResponseDto {
  @ApiProperty({
    type: MeasurementResponseDto,
    nullable: true,
    description: 'Dernier relevé enregistré, ou null si aucun.',
  })
  measurement!: MeasurementResponseDto | null;
}
