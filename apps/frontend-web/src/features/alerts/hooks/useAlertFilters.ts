import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { ALERT_TYPES, type AlertType } from '@futurekawa/contracts';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export interface AlertFilters {
  type?: AlertType;
  acknowledged?: boolean;
  page: number;
}

function parseType(raw: string | null): AlertType | undefined {
  return ALERT_TYPES.find((value) => value === raw);
}

function parseAcknowledged(raw: string | null): boolean | undefined {
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  return undefined;
}

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE;
}

export interface UseAlertFiltersResult {
  filters: AlertFilters;
  setType: (type?: AlertType) => void;
  setAcknowledged: (acknowledged?: boolean) => void;
  setPage: (page: number) => void;
}

// Filtres/pagination portés par l'URL (rules front : bookmarkable, rechargeable).
// Source de vérité = query string. Changer un filtre remet la page à 1.
export function useAlertFilters(): UseAlertFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<AlertFilters>(
    () => ({
      type: parseType(searchParams.get('type')),
      acknowledged: parseAcknowledged(searchParams.get('acknowledged')),
      page: parsePage(searchParams.get('page')),
    }),
    [searchParams],
  );

  const setType = useCallback(
    (type?: AlertType) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (type) {
          next.set('type', type);
        } else {
          next.delete('type');
        }
        next.set('page', String(DEFAULT_PAGE));
        return next;
      });
    },
    [setSearchParams],
  );

  const setAcknowledged = useCallback(
    (acknowledged?: boolean) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (acknowledged === undefined) {
          next.delete('acknowledged');
        } else {
          next.set('acknowledged', String(acknowledged));
        }
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

  return { filters, setType, setAcknowledged, setPage };
}
