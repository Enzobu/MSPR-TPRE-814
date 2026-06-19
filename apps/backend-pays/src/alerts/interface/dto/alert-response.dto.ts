import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ALERT_TYPES, COUNTRY_CODES } from '@futurekawa/contracts';
import type { Alert, AlertType, CountryCode } from '@futurekawa/contracts';

// DTO de sortie : forme figée alignée sur le contrat `Alert`, indépendante de
// la table Prisma (createdAt non exposé). `triggeredAt` sérialisé en ISO 8601.
export class AlertResponseDto implements Alert {
  @ApiProperty({
    description: "Identifiant de l'alerte (cuid).",
    example: 'clz9x2k4p0000abcd1234efgh',
  })
  id!: string;

  @ApiProperty({
    description: "Pays de l'alerte.",
    enum: COUNTRY_CODES,
    example: 'BR',
  })
  country!: CountryCode;

  @ApiProperty({
    description: "Type d'alerte.",
    enum: ALERT_TYPES,
    example: 'TEMPERATURE_OUT_OF_RANGE',
  })
  type!: AlertType;

  @ApiProperty({
    description: 'Message lisible décrivant la cause.',
    example: 'Température 34.2°C hors plage [26;32] pour Entrepôt Sul-1',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Lot concerné (péremption uniquement).',
    example: 'BR-2026-008',
  })
  lotId?: string;

  @ApiPropertyOptional({
    description: 'Entrepôt concerné (alertes T°/humidité).',
    example: 'Entrepôt Sul-1',
  })
  warehouse?: string;

  @ApiProperty({
    description: "Date de déclenchement de l'alerte (ISO 8601).",
    example: '2026-06-01T08:00:00.000Z',
  })
  triggeredAt!: string;

  @ApiProperty({
    description: "Indique si l'alerte a été acquittée.",
    example: false,
  })
  acknowledged!: boolean;
}
