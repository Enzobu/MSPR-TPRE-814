import { ApiProperty } from '@nestjs/swagger';
import type { CountryCode } from '@futurekawa/contracts';

// Réponse de la sonde de debug : le pays est-il joignable via le gateway ?
export class CountryPingResponseDto {
  @ApiProperty({ description: 'Code pays interrogé.', example: 'BR' })
  country!: CountryCode;

  @ApiProperty({
    description:
      'true si le backend pays a répondu, false sinon (timeout / breaker / down).',
    example: true,
  })
  reachable!: boolean;

  @ApiProperty({
    description:
      'Statut renvoyé par le /health du pays, ou null si injoignable.',
    example: 'ok',
    nullable: true,
  })
  status!: string | null;
}
