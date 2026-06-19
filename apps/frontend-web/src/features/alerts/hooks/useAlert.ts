import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Alert } from '@futurekawa/contracts';
import { fetchAlerts } from '@/features/alerts/api/alerts.api';

// Taille de page maximale acceptée par le siège : on récupère la première page
// la plus large possible pour y retrouver l'alerte.
const MAX_PAGE_SIZE = 100;

// LIMITE CONNUE : backend-central n'expose PAS de route single-alert
// (`/alerts/:id`). On récupère donc la première page consolidée (jusqu'à 100
// alertes) et on retrouve l'alerte par id côté client. Si l'id n'est pas dans
// cette page, on renvoie null (faux négatif possible au-delà de 100 alertes).
// Amélioration future : un endpoint central `GET /api/v1/alerts/:id` dédié.
export function useAlert(id: string): UseQueryResult<Alert | null> {
  return useQuery({
    queryKey: ['alerts', 'detail', id],
    queryFn: async (): Promise<Alert | null> => {
      const response = await fetchAlerts({ page: 1, pageSize: MAX_PAGE_SIZE });
      return response.data.find((alert) => alert.id === id) ?? null;
    },
  });
}
