import type { CountryCode, LotFacets, LotStatus } from '@futurekawa/contracts';
import type { Lot, NewLot } from './lot';

// Port (ADR-0001 dependency rule) : l'application parle à cette interface,
// l'infrastructure (Prisma) l'implémente.
export const LOT_REPOSITORY = Symbol('LOT_REPOSITORY');

export type SortDirection = 'asc' | 'desc';

// Filtres optionnels par exploitation / entrepôt (CDC §III.3). Égalité stricte :
// les valeurs proviennent des facettes réelles, pas d'une saisie libre.
export interface LotFilters {
  // Filtre pays optionnel. En déploiement réel, une instance pays ne détient
  // qu'un pays (filtre sans effet) ; en démo mono-instance (1 DB multi-pays),
  // il évite que le siège agrège le même lot via ses 3 URLs pays.
  country?: CountryCode;
  farm?: string;
  warehouse?: string;
}

export interface FindManyParams extends LotFilters {
  skip: number;
  take: number;
  direction: SortDirection;
}

export interface Page<T> {
  data: T[];
  total: number;
}

export interface LotRepository {
  create(lot: NewLot): Promise<Lot>;
  existsById(id: string): Promise<boolean>;
  findById(id: string): Promise<Lot | null>;
  findManyByStoredAt(params: FindManyParams): Promise<Page<Lot>>;
  // Valeurs distinctes (exploitations, entrepôts) pour alimenter les sélecteurs
  // du frontend (CDC §III.3). Scopé par pays comme la liste (dédup démo mono-instance).
  findFacets(filters: LotFilters): Promise<LotFacets>;
  // Péremption (ADR-0004) : lots dont `storedAt < cutoff` ET non encore `PERIME`
  // (ceux déjà périmés n'ont pas besoin d'être retouchés par le cron).
  findExpirable(cutoff: Date): Promise<Lot[]>;
  updateStatus(id: string, status: LotStatus): Promise<Lot | null>;
}
