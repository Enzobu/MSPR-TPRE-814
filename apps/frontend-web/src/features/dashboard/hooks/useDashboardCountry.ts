import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { COUNTRY_CODES, type CountryCode } from '@futurekawa/contracts';

function parseCountry(raw: string | null): CountryCode | undefined {
  return COUNTRY_CODES.find((code) => code === raw);
}

export interface UseDashboardCountryResult {
  country?: CountryCode;
  setCountry: (country?: CountryCode) => void;
}

// Sélecteur pays global du dashboard porté par l'URL (rules front :
// bookmarkable, rechargeable). Source de vérité = query string `country`.
export function useDashboardCountry(): UseDashboardCountryResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const country = useMemo(
    () => parseCountry(searchParams.get('country')),
    [searchParams],
  );

  const setCountry = useCallback(
    (next?: CountryCode) => {
      setSearchParams((previous) => {
        const params = new URLSearchParams(previous);
        if (next) {
          params.set('country', next);
        } else {
          params.delete('country');
        }
        return params;
      });
    },
    [setSearchParams],
  );

  return { country, setCountry };
}
