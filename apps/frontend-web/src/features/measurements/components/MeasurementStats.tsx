import type { CountryCode, Measurement } from '@futurekawa/contracts';
import {
  isHumidityOutOfTolerance,
  isTemperatureOutOfTolerance,
} from '@/features/measurements/lib/tolerance';
import { cn } from '@/lib/utils';

type MeasurementStatsProps = Readonly<{
  measurements: Measurement[];
  country: CountryCode;
}>;

interface MetricSummary {
  min: number;
  max: number;
  avg: number;
  last: number;
  lastOut: boolean;
}

function summarize(
  values: number[],
  isOut: (value: number) => boolean,
): MetricSummary {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const last = values[values.length - 1];
  return { min, max, avg, last, lastOut: isOut(last) };
}

function formatNumber(value: number, unit: string): string {
  return `${value.toFixed(1)} ${unit}`;
}

interface StatCell {
  key: string;
  value: string;
  colorClass?: string;
}

type StatCardProps = Readonly<{
  title: string;
  dotClassName: string;
  cells: StatCell[];
}>;

function StatCard({
  title,
  dotClassName,
  cells,
}: StatCardProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3.5 flex items-center gap-2 text-sm font-semibold">
        <span className={cn('size-2.5 rounded-sm', dotClassName)} aria-hidden />
        {title}
      </div>
      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.key} className="rounded-lg bg-muted p-2.5">
            <dt className="mb-1 text-[11px] text-muted-foreground">
              {cell.key}
            </dt>
            <dd
              className={cn(
                'font-mono text-base font-semibold tabular-nums',
                cell.colorClass,
              )}
            >
              {cell.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function buildCells(summary: MetricSummary, unit: string): StatCell[] {
  return [
    { key: 'Min', value: formatNumber(summary.min, unit) },
    { key: 'Moy.', value: formatNumber(summary.avg, unit) },
    { key: 'Max', value: formatNumber(summary.max, unit) },
    {
      key: 'Dernière',
      value: formatNumber(summary.last, unit),
      colorClass: summary.lastOut
        ? 'text-status-perime-foreground'
        : 'text-status-conforme-foreground',
    },
  ];
}

export function MeasurementStats({
  measurements,
  country,
}: MeasurementStatsProps): React.ReactElement | null {
  if (measurements.length === 0) {
    return null;
  }

  const temperature = summarize(
    measurements.map((m) => m.temperatureCelsius),
    (value) => isTemperatureOutOfTolerance(value, country),
  );
  const humidity = summarize(
    measurements.map((m) => m.humidityPercent),
    (value) => isHumidityOutOfTolerance(value, country),
  );

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <StatCard
        title="Température"
        dotClassName="bg-chart-2"
        cells={buildCells(temperature, '°C')}
      />
      <StatCard
        title="Humidité"
        dotClassName="bg-chart-3"
        cells={buildCells(humidity, '%')}
      />
    </div>
  );
}
