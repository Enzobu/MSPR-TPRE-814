import { ApiProperty } from '@nestjs/swagger';
import {
  COUNTRY_CODES,
  type ConsolidatedList,
  type CountryCode,
} from '@futurekawa/contracts';
import { MeasurementDto } from './measurements-response.dto';

// Réponse consolidée de GET /api/v1/measurements/latest : le dernier relevé de
// chaque pays ayant des données (0 à 3 éléments) + `unavailable` pour les pays
// injoignables. Non paginée (volume borné) ; jamais 500 (ADR-0007).
export class ConsolidatedLatestMeasurementsResponseDto implements ConsolidatedList<MeasurementDto> {
  @ApiProperty({
    type: [MeasurementDto],
    description:
      'Dernier relevé par pays (un au plus par pays). Un pays sans relevé est ' +
      'absent de la liste ; un pays injoignable figure dans `unavailable`.',
  })
  data!: MeasurementDto[];

  @ApiProperty({
    description: 'Pays injoignables (vide si tous ont répondu).',
    enum: COUNTRY_CODES,
    isArray: true,
    example: [],
  })
  unavailable!: CountryCode[];
}
