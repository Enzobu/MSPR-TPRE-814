import type { CountryCode, Measurement } from '@futurekawa/contracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  isHumidityOutOfTolerance,
  isTemperatureOutOfTolerance,
} from '@/features/measurements/lib/tolerance';

type MeasurementStatsProps = Readonly<{
  measurements: Measurement[];
  country: CountryCode;
}>;

interface MetricSummary {
  min: number;
  max: number;
  avg: number;
  outOfTolerance: number;
}

function summarize(
  values: number[],
  isOut: (value: number) => boolean,
): MetricSummary {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const outOfTolerance = values.filter(isOut).length;
  return { min, max, avg, outOfTolerance };
}

function formatNumber(value: number): string {
  return value.toFixed(1);
}

type StatCardProps = Readonly<{
  title: string;
  unit: string;
  summary: MetricSummary;
}>;

function StatCard({ title, unit, summary }: StatCardProps): React.ReactElement {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm tabular-nums">
          <dt className="text-muted-foreground">Min</dt>
          <dd>
            {formatNumber(summary.min)} {unit}
          </dd>
          <dt className="text-muted-foreground">Max</dt>
          <dd>
            {formatNumber(summary.max)} {unit}
          </dd>
          <dt className="text-muted-foreground">Moyenne</dt>
          <dd>
            {formatNumber(summary.avg)} {unit}
          </dd>
          <dt className="text-muted-foreground">Hors tolérance</dt>
          <dd
            className={
              summary.outOfTolerance > 0
                ? 'font-medium text-destructive'
                : undefined
            }
          >
            {summary.outOfTolerance}
          </dd>
        </dl>
      </CardContent>
    </Card>
  );
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatCard title="Température" unit="°C" summary={temperature} />
      <StatCard title="Humidité" unit="%" summary={humidity} />
    </div>
  );
}
