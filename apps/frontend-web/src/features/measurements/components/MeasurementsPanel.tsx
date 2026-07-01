import { AlertTriangle } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import { MeasurementChartCard } from '@/features/measurements/components/MeasurementChartCard';
import { MeasurementStats } from '@/features/measurements/components/MeasurementStats';
import { useMeasurements } from '@/features/measurements/hooks/useMeasurements';

type MeasurementsPanelProps = Readonly<{
  country: CountryCode;
  warehouse: string;
  from?: string;
  to?: string;
}>;

export function MeasurementsPanel({
  country,
  warehouse,
  from,
  to,
}: MeasurementsPanelProps): React.ReactElement {
  const { data, isPending, isError } = useMeasurements({
    country,
    warehouse,
    from,
    to,
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
      >
        Impossible de charger les mesures pour le moment. Réessayez plus tard.
      </p>
    );
  }

  const measurements = data.data;

  return (
    <div className="space-y-4">
      {data.unavailable.length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-status-alerte"
            aria-hidden
          />
          <p>
            Données partielles : {data.unavailable.join(', ')}{' '}
            {data.unavailable.length > 1 ? 'sont injoignables' : 'est injoignable'}
            . Certaines mesures peuvent manquer.
          </p>
        </div>
      ) : null}

      {measurements.length === 0 ? (
        <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune mesure sur la période.
        </p>
      ) : (
        <>
          <MeasurementChartCard
            measurements={measurements}
            country={country}
            metric="temperature"
          />
          <MeasurementChartCard
            measurements={measurements}
            country={country}
            metric="humidity"
          />
          <MeasurementStats measurements={measurements} country={country} />
        </>
      )}
    </div>
  );
}
