import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DotProps,
} from 'recharts';
import type { CountryCode, Measurement } from '@futurekawa/contracts';
import { formatRecordedAt } from '@/features/measurements/lib/format';
import {
  humidityBounds,
  isHumidityOutOfTolerance,
  isTemperatureOutOfTolerance,
  temperatureBounds,
  type ToleranceBounds,
} from '@/features/measurements/lib/tolerance';

type Metric = 'temperature' | 'humidity';

interface MeasurementChartProps {
  measurements: Measurement[];
  country: CountryCode;
  metric: Metric;
}

interface ChartPoint {
  recordedAt: string;
  label: string;
  value: number;
  outOfTolerance: boolean;
}

const METRIC_CONFIG: Record<
  Metric,
  {
    title: string;
    unit: string;
    bounds: (country: CountryCode) => ToleranceBounds;
    value: (m: Measurement) => number;
    isOut: (value: number, country: CountryCode) => boolean;
  }
> = {
  temperature: {
    title: 'Température',
    unit: '°C',
    bounds: temperatureBounds,
    value: (m) => m.temperatureCelsius,
    isOut: isTemperatureOutOfTolerance,
  },
  humidity: {
    title: 'Humidité',
    unit: '%',
    bounds: humidityBounds,
    value: (m) => m.humidityPercent,
    isOut: isHumidityOutOfTolerance,
  },
};

// Dot personnalisé : les points hors tolérance sont rendus en `--destructive`,
// les autres en `--chart-1`. Le rayon est augmenté hors tolérance pour l'alerte.
function MeasurementDot(
  props: DotProps & { payload?: ChartPoint },
): React.ReactElement {
  const { cx, cy, payload } = props;
  const out = payload?.outOfTolerance ?? false;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={out ? 4 : 2.5}
      fill={out ? 'var(--destructive)' : 'var(--chart-1)'}
      stroke="var(--background)"
      strokeWidth={1}
    />
  );
}

export function MeasurementChart({
  measurements,
  country,
  metric,
}: MeasurementChartProps): React.ReactElement {
  const config = METRIC_CONFIG[metric];
  const bounds = config.bounds(country);

  const points: ChartPoint[] = measurements.map((m) => {
    const value = config.value(m);
    return {
      recordedAt: m.recordedAt,
      label: formatRecordedAt(m.recordedAt),
      value,
      outOfTolerance: config.isOut(value, country),
    };
  });

  const ariaLabel = `Courbe ${config.title.toLowerCase()} (${config.unit}) pour le pays ${country}, avec bande de tolérance ${bounds.lower} à ${bounds.upper} ${config.unit}`;

  return (
    <figure className="space-y-2" aria-label={ariaLabel}>
      <figcaption className="text-sm font-medium">
        {config.title} ({config.unit})
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              stroke="var(--border)"
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              stroke="var(--border)"
              domain={['auto', 'auto']}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--popover-foreground)',
                fontSize: 12,
              }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
              formatter={(value) => [`${value} ${config.unit}`, config.title]}
            />
            <ReferenceArea
              y1={bounds.lower}
              y2={bounds.upper}
              fill="var(--muted)"
              fillOpacity={0.4}
              stroke="none"
              ifOverflow="extendDomain"
            />
            <ReferenceLine
              y={bounds.ideal}
              stroke="var(--chart-2)"
              strokeDasharray="4 2"
              ifOverflow="extendDomain"
              label={{
                value: 'Idéal',
                position: 'insideTopRight',
                fill: 'var(--muted-foreground)',
                fontSize: 11,
              }}
            />
            <ReferenceLine
              y={bounds.upper}
              stroke="var(--muted-foreground)"
              strokeDasharray="2 2"
              ifOverflow="extendDomain"
            />
            <ReferenceLine
              y={bounds.lower}
              stroke="var(--muted-foreground)"
              strokeDasharray="2 2"
              ifOverflow="extendDomain"
            />
            <Line
              type="monotone"
              dataKey="value"
              name={config.title}
              stroke="var(--chart-1)"
              strokeWidth={2}
              isAnimationActive={false}
              dot={<MeasurementDot />}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
