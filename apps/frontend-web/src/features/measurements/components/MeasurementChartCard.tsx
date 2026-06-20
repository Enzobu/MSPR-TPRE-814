import type { CountryCode, Measurement } from '@futurekawa/contracts';
import { MeasurementChart } from '@/features/measurements/components/MeasurementChart';
import { cn } from '@/lib/utils';

type Metric = 'temperature' | 'humidity';

type MeasurementChartCardProps = Readonly<{
  measurements: Measurement[];
  country: CountryCode;
  metric: Metric;
}>;

const CARD_CONFIG: Record<
  Metric,
  { title: string; subtitle: string; dotClassName: string }
> = {
  temperature: {
    title: 'Température',
    subtitle: '°C',
    dotClassName: 'bg-chart-2',
  },
  humidity: {
    title: 'Humidité relative',
    subtitle: '%',
    dotClassName: 'bg-chart-3',
  },
};

export function MeasurementChartCard({
  measurements,
  country,
  metric,
}: MeasurementChartCardProps): React.ReactElement {
  const config = CARD_CONFIG[metric];
  return (
    <div className="rounded-xl border border-border bg-card px-4 pt-4 pb-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={cn('size-2.5 rounded-sm', config.dotClassName)}
            aria-hidden
          />
          <span className="text-sm font-semibold">{config.title}</span>
          <span className="text-xs text-muted-foreground">
            {config.subtitle}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-4 rounded-sm bg-status-conforme/20"
            aria-hidden
          />
          <span className="text-[11px] text-muted-foreground">
            zone conforme
          </span>
        </div>
      </div>
      <MeasurementChart
        measurements={measurements}
        country={country}
        metric={metric}
      />
    </div>
  );
}
