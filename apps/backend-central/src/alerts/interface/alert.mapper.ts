import type { Alert } from '@futurekawa/contracts';
import { AlertDto } from './dto/alerts-response.dto';

// Mapper explicite (rules backend-central) : ne jamais renvoyer tel quel la
// réponse d'un backend pays. Recopie les seuls champs du contrat → tout champ
// inattendu ajouté côté pays est filtré, le siège reste découplé.
export function toAlert(alert: Alert): AlertDto {
  return {
    id: alert.id,
    country: alert.country,
    type: alert.type,
    message: alert.message,
    lotId: alert.lotId,
    warehouse: alert.warehouse,
    triggeredAt: alert.triggeredAt,
    acknowledged: alert.acknowledged,
  };
}
