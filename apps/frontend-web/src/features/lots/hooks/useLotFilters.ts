import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { COUNTRY_CODES, type CountryCode } from '@futurekawa/contracts';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_SORT = 'storedAt:asc';

export const SORT_VALUES = ['storedAt:asc', 'storedAt:desc'] as const;
export type LotSort = (typeof SORT_VALUES)[number];

export interface LotFilters {
  country?: CountryCode;
  page: number;
  sort: LotSort;
}

function parseCountry(raw: string | null): CountryCode | undefined {
  return COUNTRY_CODES.find((code) => code === raw);
}

function parseSort(raw: string | null): LotSort {
  return SORT_VALUES.find((value) => value === raw) ?? DEFAULT_SORT;
}

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE;
}

export interface UseLotFiltersResult {
  filters: LotFilters;
  setCountry: (country?: CountryCode) => void;
  setSort: (sort: LotSort) => void;
  setPage: (page: number) => void;
}

// Filtres/tri/pagination portés par l'URL (rules front : bookmarkable, rechargeable).
// Source de vérité = query string. Changer pays ou tri remet la page à 1.
export function useLotFilters(): UseLotFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<LotFilters>(
    () => ({
      country: parseCountry(searchParams.get('country')),
      page: parsePage(searchParams.get('page')),
      sort: parseSort(searchParams.get('sort')),
    }),
    [searchParams],
  );

  const setCountry = useCallback(
    (country?: CountryCode) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (country) {
          next.set('country', country);
        } else {
          next.delete('country');
        }
        next.set('page', String(DEFAULT_PAGE));
        return next;
      });
    },
    [setSearchParams],
  );

  const setSort = useCallback(
    (sort: LotSort) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('sort', sort);
        next.set('page', String(DEFAULT_PAGE));
        return next;
      });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('page', String(Math.max(page, DEFAULT_PAGE)));
        return next;
      });
    },
    [setSearchParams],
  );

  return { filters, setCountry, setSort, setPage };
}
