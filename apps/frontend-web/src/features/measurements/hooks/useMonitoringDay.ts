import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

// Format `YYYY-MM-DD` consommé par le calendrier (DayFilter) et par dayBounds.
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(raw: string | null): string | undefined {
  return raw && DAY_PATTERN.test(raw) ? raw : undefined;
}

export interface UseMonitoringDayResult {
  day?: string;
  setDay: (day?: string) => void;
}

// Filtre « jour » de la vue monitoring, porté par l'URL (`day=YYYY-MM-DD`) pour
// rester bookmarkable/rechargeable comme les autres filtres. Absent = tout
// l'historique récent.
export function useMonitoringDay(): UseMonitoringDayResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const day = useMemo(
    () => parseDay(searchParams.get('day')),
    [searchParams],
  );

  const setDay = useCallback(
    (next?: string) => {
      setSearchParams((previous) => {
        const params = new URLSearchParams(previous);
        if (next) {
          params.set('day', next);
        } else {
          params.delete('day');
        }
        return params;
      });
    },
    [setSearchParams],
  );

  return { day, setDay };
}
