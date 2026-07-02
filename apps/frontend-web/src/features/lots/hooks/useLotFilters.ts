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
  farm?: string;
  warehouse?: string;
  page: number;
  sort: LotSort;
}

function parseCountry(raw: string | null): CountryCode | undefined {
  return COUNTRY_CODES.find((code) => code === raw);
}

function parseFacet(raw: string | null): string | undefined {
  const value = raw?.trim();
  return value ? value : undefined;
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
  setFarm: (farm?: string) => void;
  setWarehouse: (warehouse?: string) => void;
  setSort: (sort: LotSort) => void;
  setPage: (page: number) => void;
}

// Filtres/tri/pagination portés par l'URL (rules front : bookmarkable, rechargeable).
// Source de vérité = query string. Changer un filtre ou le tri remet la page à 1.
export function useLotFilters(): UseLotFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<LotFilters>(
    () => ({
      country: parseCountry(searchParams.get('country')),
      farm: parseFacet(searchParams.get('farm')),
      warehouse: parseFacet(searchParams.get('warehouse')),
      page: parsePage(searchParams.get('page')),
      sort: parseSort(searchParams.get('sort')),
    }),
    [searchParams],
  );

  // Fabrique un setter de filtre string porté par l'URL (reset page à 1).
  const makeFacetSetter = useCallback(
    (key: 'country' | 'farm' | 'warehouse') => (value?: string) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.set('page', String(DEFAULT_PAGE));
        return next;
      });
    },
    [setSearchParams],
  );

  const setCountry = useCallback(
    (country?: CountryCode) => makeFacetSetter('country')(country),
    [makeFacetSetter],
  );

  const setFarm = useCallback(
    (farm?: string) => makeFacetSetter('farm')(farm),
    [makeFacetSetter],
  );

  const setWarehouse = useCallback(
    (warehouse?: string) => makeFacetSetter('warehouse')(warehouse),
    [makeFacetSetter],
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

  return { filters, setCountry, setFarm, setWarehouse, setSort, setPage };
}
