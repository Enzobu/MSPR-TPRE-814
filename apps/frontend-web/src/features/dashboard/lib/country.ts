import type { CountryCode } from '@futurekawa/contracts';

// Libellés FR des pays : concern d'affichage purement front (les codes ISO
// restent la source de vérité dans @futurekawa/contracts).
export const COUNTRY_LABELS: Record<CountryCode, string> = {
  BR: 'Brésil',
  EC: 'Équateur',
  CO: 'Colombie',
};
