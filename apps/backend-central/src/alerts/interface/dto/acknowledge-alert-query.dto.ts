import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';

// Query de PATCH /api/v1/alerts/:id/acknowledge. L'ACK est une écriture : le pays
// propriétaire doit être ciblé explicitement → `country` est REQUIS (le front le
// connaît via la liste consolidée, chaque alerte porte son `country`).
export class AcknowledgeAlertQueryDto {
  @ApiProperty({
    description: "Pays propriétaire de l'alerte à acquitter (requis).",
    enum: COUNTRY_CODES,
    example: 'BR',
  })
  @IsIn(COUNTRY_CODES)
  country!: CountryCode;
}
