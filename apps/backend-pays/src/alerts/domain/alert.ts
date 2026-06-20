import type { AlertType, CountryCode } from '@futurekawa/contracts';

// Entité domaine d'une alerte. `triggeredAt` est une `Date` (le domaine
// manipule des dates ; la sérialisation ISO est l'affaire de l'interface).
// Le modèle Prisma est un sur-ensemble (createdAt) non porté ici.
export interface Alert {
  id: string;
  country: CountryCode;
  type: AlertType;
  message: string;
  lotId?: string;
  warehouse?: string;
  triggeredAt: Date;
  acknowledged: boolean;
}

// Données d'insertion d'une alerte. L'`id` est posé en base (cuid) et
// `acknowledged` vaut `false` à la création.
export interface NewAlert {
  country: CountryCode;
  type: AlertType;
  message: string;
  lotId?: string;
  warehouse?: string;
  triggeredAt: Date;
}
