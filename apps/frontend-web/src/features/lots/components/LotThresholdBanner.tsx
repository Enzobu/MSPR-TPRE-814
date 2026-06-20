import { Info } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';
import { formatCountry } from '@/features/lots/lib/format';
import {
  humidityBounds,
  temperatureBounds,
} from '@/features/measurements/lib/tolerance';

type LotThresholdBannerProps = Readonly<{
  country: CountryCode;
}>;

function formatBand(lower: number, upper: number, unit: string): string {
  return `${lower}–${upper} ${unit}`;
}

// Bandeau de contexte : seuils pays lus depuis COUNTRY_CONDITIONS via
// `tolerance.ts` (bornes idéal±tolérance). Aucune valeur métier en dur.
export function LotThresholdBanner({ country }: LotThresholdBannerProps) {
  const temp = temperatureBounds(country);
  const humidity = humidityBounds(country);

  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-muted px-4 py-2.5 text-xs text-muted-foreground">
      <Info className="size-4 shrink-0 text-primary" aria-hidden />
      <p>
        Seuils{' '}
        <strong className="font-semibold text-foreground">
          {formatCountry(country)}
        </strong>{' '}
        — Température {formatBand(temp.lower, temp.upper, '°C')} · Humidité{' '}
        {formatBand(humidity.lower, humidity.upper, '%')}. Mesure régulière depuis
        l'entrée en stock.
      </p>
    </div>
  );
}
