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

// Liste consolidée non paginée du siège (ADR-0007) : pour les agrégats dont le
// volume est déjà borné côté pays (ex. buckets de mesures), on renvoie la liste
// telle quelle + les pays injoignables, sans pagination. Même garantie : jamais
// 500 quand un backend pays est down.
export interface ConsolidatedList<T> {
  data: T[];
  unavailable: CountryCode[];
}
