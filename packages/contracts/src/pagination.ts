import type { CountryCode } from './country';

// Enveloppe de réponse paginée standardisée (rules backend-pays : REST).
// Partagée pour que backend et front lisent la même forme `{ data, total, page, pageSize }`.
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Réponse consolidée du siège (ADR-0007) : données agrégées multi-pays + liste
// explicite des pays injoignables (`unavailable`), pour ne jamais renvoyer 500
// quand un backend pays est down. Paginée sur l'ensemble fusionné.
export interface ConsolidatedResponse<T> extends PaginatedResponse<T> {
  unavailable: CountryCode[];
}
