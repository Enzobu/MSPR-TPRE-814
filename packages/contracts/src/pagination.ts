// Enveloppe de réponse paginée standardisée (rules backend-pays : REST).
// Partagée pour que backend et front lisent la même forme `{ data, total, page, pageSize }`.
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
