import type { Lot } from '@futurekawa/contracts';
import { StockLotDto } from './dto/stocks-response.dto';

// Mapper explicite (rules backend-central) : ne jamais renvoyer tel quel la
// réponse d'un backend pays. Recopie les seuls champs du contrat → tout champ
// inattendu ajouté côté pays est filtré, le siège reste découplé.
export function toStockLot(lot: Lot): StockLotDto {
  return {
    id: lot.id,
    country: lot.country,
    farm: lot.farm,
    warehouse: lot.warehouse,
    storedAt: lot.storedAt,
    status: lot.status,
  };
}
