import { Thermometer, Droplets, WifiOff } from 'lucide-react';
import type { CountryCode, Measurement } from '@futurekawa/contracts';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';
import { formatRecordedAt } from '@/features/measurements/lib/format';
import {
  isHumidityOutOfTolerance,
  isTemperatureOutOfTolerance,
} from '@/features/measurements/lib/tolerance';
import { cn } from '@/lib/utils';

type RegionReadingCardProps = Readonly<{
  country: CountryCode;
  measurement: Measurement | null;
  unavailable: boolean;
  selected: boolean;
  onSelect: (country: CountryCode) => void;
}>;

// Couleur d'une valeur selon la tolérance pays (source unique : contracts).
function toleranceClass(out: boolean): string {
  return out
    ? 'text-status-perime-foreground'
    : 'text-status-conforme-foreground';
}

type MetricProps = Readonly<{
  icon: typeof Thermometer;
  label: string;
  value: string;
  out: boolean;
}>;

function Metric({ icon: Icon, label, value, out }: MetricProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="sr-only">{label}</span>
      <span className={cn('font-mono text-lg font-semibold tabular-nums', toleranceClass(out))}>
        {value}
      </span>
      {out ? (
        <span className="rounded-full bg-status-perime px-1.5 py-0.5 text-[10px] font-medium text-status-perime-foreground">
          Hors seuil
        </span>
      ) : null}
    </div>
  );
}

export function RegionReadingCard({
  country,
  measurement,
  unavailable,
  selected,
  onSelect,
}: RegionReadingCardProps): React.ReactElement {
  const label = COUNTRY_LABELS[country];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(country)}
      className={cn(
        'flex w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'border-primary ring-1 ring-primary' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{label}</span>
        {measurement ? (
          <span className="text-xs text-muted-foreground">
            {formatRecordedAt(measurement.recordedAt)}
          </span>
        ) : null}
      </div>

      {unavailable ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <WifiOff className="size-4 shrink-0 text-status-alerte" aria-hidden />
          Région injoignable
        </div>
      ) : measurement ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Metric
            icon={Thermometer}
            label="Température"
            value={`${measurement.temperatureCelsius.toFixed(1)} °C`}
            out={isTemperatureOutOfTolerance(
              measurement.temperatureCelsius,
              country,
            )}
          />
          <Metric
            icon={Droplets}
            label="Humidité"
            value={`${measurement.humidityPercent.toFixed(1)} %`}
            out={isHumidityOutOfTolerance(measurement.humidityPercent, country)}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun relevé pour le moment.</p>
      )}
    </button>
  );
}
