import type { Alert } from '@futurekawa/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import { MeasurementChart } from '@/features/measurements/components/MeasurementChart';
import { useMeasurements } from '@/features/measurements/hooks/useMeasurements';
import { alertSeverity } from '@/features/alerts/lib/severity';

type AlertChartCardProps = Readonly<{
  alert: Alert;
}>;

const CHART_TITLE = {
  temperature: 'Température',
  humidity: 'Humidité',
} as const;

// Courbe « autour du déclenchement ». Réutilise MeasurementChart (non modifié)
// via le hook mesures existant. N'est rendue que si l'alerte cible un entrepôt
// ET porte une métrique mesurable (température/humidité, pas péremption).
export function AlertChartCard({ alert }: AlertChartCardProps) {
  const { metric } = alertSeverity(alert.type);
  const warehouse = alert.warehouse;

  const { data, isPending, isError } = useMeasurements({
    country: alert.country,
    warehouse: warehouse ?? '',
  });

  if (!warehouse || metric === null) {
    return null;
  }

  return (
    <div className="rounded-xl border bg-card p-[18px]">
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="text-sm font-semibold">{CHART_TITLE[metric]}</span>
        <span className="text-xs text-muted-foreground">
          autour du déclenchement
        </span>
      </div>
      {isPending ? <Skeleton className="h-64 w-full" /> : null}
      {isError ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Mesures indisponibles pour cet entrepôt.
        </p>
      ) : null}
      {data && data.data.length > 0 ? (
        <MeasurementChart
          measurements={data.data}
          country={alert.country}
          metric={metric}
        />
      ) : null}
      {data && data.data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune mesure enregistrée pour cet entrepôt.
        </p>
      ) : null}
    </div>
  );
}
