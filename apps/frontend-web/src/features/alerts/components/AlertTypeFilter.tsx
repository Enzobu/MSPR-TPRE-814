import { ALERT_TYPES, type AlertType } from '@futurekawa/contracts';
import {
  SegmentedChips,
  type SegmentedOption,
} from '@/features/alerts/components/SegmentedChips';

type AlertTypeFilterProps = Readonly<{
  value?: AlertType;
  onChange: (type?: AlertType) => void;
}>;

// Sentinelle pour l'option « Tous » (le filtre type est porté par l'URL via
// useAlertFilters → param API `type`).
const ALL = 'ALL' as const;
type TypeChoice = typeof ALL | AlertType;

const SHORT_LABELS: Record<AlertType, string> = {
  TEMPERATURE_OUT_OF_RANGE: 'Température',
  HUMIDITY_OUT_OF_RANGE: 'Humidité',
  LOT_EXPIRED: 'Péremption',
};

const OPTIONS: SegmentedOption<TypeChoice>[] = [
  { value: ALL, label: 'Tous' },
  ...ALERT_TYPES.map((type) => ({ value: type, label: SHORT_LABELS[type] })),
];

export function AlertTypeFilter({ value, onChange }: AlertTypeFilterProps) {
  return (
    <SegmentedChips
      legend="Filtrer par type"
      options={OPTIONS}
      value={value ?? ALL}
      isSelected={(option, current) => option === current}
      onChange={(choice) => onChange(choice === ALL ? undefined : choice)}
    />
  );
}
