import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { LOT_STATUSES } from '@futurekawa/contracts';
import type {
  LotStatus,
  UpdateLotStatusDto as UpdateLotStatusContract,
} from '@futurekawa/contracts';

// DTO d'entrée de PATCH /api/v1/lots/:id/status.
export class UpdateLotStatusDto implements UpdateLotStatusContract {
  @ApiProperty({
    description: 'Nouveau statut du lot.',
    enum: LOT_STATUSES,
    example: 'EN_ALERTE',
  })
  @IsIn(LOT_STATUSES)
  status!: LotStatus;
}
