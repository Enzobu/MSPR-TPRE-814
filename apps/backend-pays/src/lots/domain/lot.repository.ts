import type { LotStatus } from '@futurekawa/contracts';
import type { Lot, NewLot } from './lot';

// Port (ADR-0001 dependency rule) : l'application parle à cette interface,
// l'infrastructure (Prisma) l'implémente.
export const LOT_REPOSITORY = Symbol('LOT_REPOSITORY');

export type SortDirection = 'asc' | 'desc';

export interface FindManyParams {
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
  // Péremption (ADR-0004) : lots dont `storedAt < cutoff` ET non encore `PERIME`
  // (ceux déjà périmés n'ont pas besoin d'être retouchés par le cron).
  findExpirable(cutoff: Date): Promise<Lot[]>;
  updateStatus(id: string, status: LotStatus): Promise<Lot | null>;
}
