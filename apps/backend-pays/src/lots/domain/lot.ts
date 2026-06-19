import type { CountryCode, LotStatus } from '@futurekawa/contracts';

// Entité domaine du lot. `storedAt` est une `Date` (le domaine manipule des
// dates ; la sérialisation ISO est l'affaire de la couche interface). Le modèle
// Prisma est un sur-ensemble (harvestDate/qualityGrade/timestamps) non porté ici
// car non exposé par l'API à ce stade.
export interface Lot {
  id: string;
  country: CountryCode;
  farm: string;
  warehouse: string;
  storedAt: Date;
  status: LotStatus;
}

// Données de création d'un lot. Le statut initial (`CONFORME`) est posé par
// défaut en base, pas fourni par le client.
export interface NewLot {
  id: string;
  country: CountryCode;
  farm: string;
  warehouse: string;
  storedAt: Date;
}
