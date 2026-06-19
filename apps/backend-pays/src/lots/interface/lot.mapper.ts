import type { Lot as DomainLot } from '../domain/lot';
import { LotResponseDto } from './dto/lot-response.dto';

// Mapper explicite entité domaine → DTO de sortie (rules backend-pays).
// Sérialise `storedAt` (Date) en ISO 8601 pour le contrat public.
export function toLotResponse(lot: DomainLot): LotResponseDto {
  return {
    id: lot.id,
    country: lot.country,
    farm: lot.farm,
    warehouse: lot.warehouse,
    storedAt: lot.storedAt.toISOString(),
    status: lot.status,
  };
}
