import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
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

type MeasurementChartProps = Readonly<{
  measurements: Measurement[];
  country: CountryCode;
  metric: Metric;
}>;

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
    // Token de couleur de la métrique : temp = chart-2, humidité = chart-3.
    colorVar: string;
    bounds: (country: CountryCode) => ToleranceBounds;
    value: (m: Measurement) => number;
    isOut: (value: number, country: CountryCode) => boolean;
  }
> = {
  temperature: {
    title: 'Température',
    unit: '°C',
    colorVar: 'var(--chart-2)',
    bounds: temperatureBounds,
    value: (m) => m.temperatureCelsius,
    isOut: isTemperatureOutOfTolerance,
  },
  humidity: {
    title: 'Humidité',
    unit: '%',
    colorVar: 'var(--chart-3)',
    bounds: humidityBounds,
    value: (m) => m.humidityPercent,
    isOut: isHumidityOutOfTolerance,
  },
};

type DotRenderProps = DotProps & {
  index?: number;
  payload?: ChartPoint;
  lastIndex?: number;
  colorVar?: string;
};

// Dot rendu via clonage recharts : seul le dernier point est marqué en
// permanence (dot final), les autres n'apparaissent qu'hors tolérance.
function MeasurementDot(props: DotRenderProps): React.ReactElement {
  const { cx, cy, index, payload, lastIndex, colorVar } = props;
  const isLast = index === lastIndex;
  const out = payload?.outOfTolerance ?? false;
  if (!isLast && !out) {
    return <g />;
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isLast ? 4.5 : 3.5}
      fill={out ? 'var(--status-perime)' : (colorVar ?? 'var(--chart-1)')}
      stroke="var(--background)"
      strokeWidth={1.5}
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
  const gradientId = `meas-gradient-${metric}`;

  const points: ChartPoint[] = measurements.map((m) => {
    const value = config.value(m);
    return {
      recordedAt: m.recordedAt,
      label: formatRecordedAt(m.recordedAt),
      value,
      outOfTolerance: config.isOut(value, country),
    };
  });

  const lastIndex = points.length - 1;
  const ariaLabel = `Courbe ${config.title.toLowerCase()} (${config.unit}) pour le pays ${country}, zone conforme de ${bounds.lower} à ${bounds.upper} ${config.unit}`;

  return (
    <figure className="space-y-2" aria-label={ariaLabel}>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.colorVar} stopOpacity={0.22} />
                <stop offset="100%" stopColor={config.colorVar} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              fill="var(--status-conforme)"
              fillOpacity={0.1}
              stroke="none"
              ifOverflow="extendDomain"
            />
            <ReferenceLine
              y={bounds.upper}
              stroke="var(--status-conforme)"
              strokeOpacity={0.42}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
            <ReferenceLine
              y={bounds.lower}
              stroke="var(--status-conforme)"
              strokeOpacity={0.42}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={config.title}
              stroke={config.colorVar}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive={false}
              dot={<MeasurementDot lastIndex={lastIndex} colorVar={config.colorVar} />}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
