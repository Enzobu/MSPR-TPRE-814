import type { Alert as DomainAlert } from '../domain/alert';
import { AlertResponseDto } from './dto/alert-response.dto';

// Mapper explicite entité domaine → DTO de sortie (rules backend-pays).
// Sérialise `triggeredAt` (Date) en ISO 8601 pour le contrat public.
export function toAlertResponse(alert: DomainAlert): AlertResponseDto {
  return {
    id: alert.id,
    country: alert.country,
    type: alert.type,
    message: alert.message,
    lotId: alert.lotId,
    warehouse: alert.warehouse,
    triggeredAt: alert.triggeredAt.toISOString(),
    acknowledged: alert.acknowledged,
  };
}
