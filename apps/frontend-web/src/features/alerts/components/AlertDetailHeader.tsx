import type { Alert } from '@futurekawa/contracts';
import { cn } from '@/lib/utils';
import {
  humidityBounds,
  temperatureBounds,
} from '@/features/measurements/lib/tolerance';
import { SeverityPill } from '@/features/alerts/components/SeverityPill';
import { alertSeverity } from '@/features/alerts/lib/severity';
import { formatAgo, formatTriggeredAt } from '@/features/alerts/lib/format';

type AlertDetailHeaderProps = Readonly<{
  alert: Alert;
}>;

// Plage de conformité dérivée des seuils pays (COUNTRY_CONDITIONS). Seule valeur
// numérique réellement disponible : le type `Alert` ne porte ni mesure
// déclenchante ni écart, donc ces cellules-là ne sont volontairement PAS rendues
// (pas de nombre fabriqué).
function thresholdLabel(alert: Alert): string | null {
  if (alert.type === 'TEMPERATURE_OUT_OF_RANGE') {
    const { lower, upper } = temperatureBounds(alert.country);
    return `${lower} – ${upper} °C`;
  }
  if (alert.type === 'HUMIDITY_OUT_OF_RANGE') {
    const { lower, upper } = humidityBounds(alert.country);
    return `${lower} – ${upper} %`;
  }
  return null;
}

export function AlertDetailHeader({ alert }: AlertDetailHeaderProps) {
  const { label, chipClassName, Icon } = alertSeverity(alert.type);
  const threshold = thresholdLabel(alert);

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex size-[42px] shrink-0 items-center justify-center rounded-xl',
            chipClassName,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-lg font-semibold tracking-tight">
              {label}
            </span>
            <SeverityPill type={alert.type} />
          </div>
          <p className="text-sm text-muted-foreground">
            Détectée {formatAgo(alert.triggeredAt)} ·{' '}
            <span className="font-mono">
              {formatTriggeredAt(alert.triggeredAt)}
            </span>
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm">{alert.message}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-[13px]">
          <p className="mb-1.5 text-xs text-muted-foreground">Entrepôt</p>
          <p className="font-mono text-sm font-semibold">
            {alert.warehouse ?? '—'}
          </p>
        </div>
        {threshold ? (
          <div className="rounded-lg border bg-card p-[13px]">
            <p className="mb-1.5 text-xs text-muted-foreground">
              Seuil conforme {alert.country}
            </p>
            <p className="font-mono text-sm font-semibold tabular-nums">
              {threshold}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
