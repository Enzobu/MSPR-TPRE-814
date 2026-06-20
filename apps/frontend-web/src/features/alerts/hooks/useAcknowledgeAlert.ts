import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Alert, CountryCode } from '@futurekawa/contracts';
import { acknowledgeAlert } from '@/features/alerts/api/alerts.api';

interface AcknowledgeVariables {
  id: string;
  country: CountryCode;
}

// Acquittement d'une alerte. Au succès on invalide toutes les requêtes `['alerts',
// ...]` (liste + compteur du badge) pour rafraîchir l'UI sans rechargement. En
// erreur on affiche un message métier (jamais l'erreur axios brute, rules front).
export function useAcknowledgeAlert(): UseMutationResult<
  Alert,
  Error,
  AcknowledgeVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, country }: AcknowledgeVariables) =>
      acknowledgeAlert(id, country),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alerte acquittée.');
    },
    onError: () => {
      toast.error("Échec de l'acquittement, réessayez.");
    },
  });
}
