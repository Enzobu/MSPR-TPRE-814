import { LOT_MAX_AGE_DAYS, type CountryCode } from '@futurekawa/contracts';

// Formatage des dates de stockage en français (audience métier siège/terrain).
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatStoredAt(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return DATE_FORMATTER.format(date);
}

// Libellés pays pour l'affichage humain. La donnée n'existe pas dans
// `@futurekawa/contracts` (qui ne porte que le code + les seuils), on mappe donc
// localement les codes connus du référentiel `COUNTRY_CODES`.
const COUNTRY_LABELS: Record<CountryCode, string> = {
  BR: 'Brésil',
  EC: 'Équateur',
  CO: 'Colombie',
};

export function formatCountry(country: CountryCode): string {
  return COUNTRY_LABELS[country];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Au-delà de ce reliquat de jours avant péremption, on considère le lot « loin »
// de l'échéance (couleur neutre). En deçà, on signale la proximité (ambre).
const EXPIRY_WARNING_DAYS = 30;

export interface ExpiryInfo {
  label: string;
  daysLeft: number;
  // 'safe' = loin, 'soon' = proche (< 30 j), 'expired' = dépassé.
  proximity: 'safe' | 'soon' | 'expired';
}

// Péremption dérivée de la seule source de vérité (`LOT_MAX_AGE_DAYS`, ADR-0004) :
// date de stockage + durée max. Pas de seuil métier recodé en dur ici.
export function computeExpiry(storedAtIso: string): ExpiryInfo | null {
  const storedAt = new Date(storedAtIso);
  if (Number.isNaN(storedAt.getTime())) {
    return null;
  }
  const expiryDate = new Date(storedAt.getTime() + LOT_MAX_AGE_DAYS * MS_PER_DAY);
  const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / MS_PER_DAY);

  let proximity: ExpiryInfo['proximity'] = 'safe';
  if (daysLeft <= 0) {
    proximity = 'expired';
  } else if (daysLeft <= EXPIRY_WARNING_DAYS) {
    proximity = 'soon';
  }

  return {
    label: DATE_FORMATTER.format(expiryDate),
    daysLeft,
    proximity,
  };
}

// Classe de couleur (token-only) selon la proximité de la péremption.
export function expiryColorClass(proximity: ExpiryInfo['proximity']): string {
  if (proximity === 'expired') {
    return 'text-status-perime-foreground';
  }
  if (proximity === 'soon') {
    return 'text-status-alerte-foreground';
  }
  return 'text-foreground';
}
