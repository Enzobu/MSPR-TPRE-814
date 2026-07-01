import { COUNTRY_CODES, type CountryCode } from '@futurekawa/contracts';
import {
  SegmentedChips,
  type SegmentedOption,
} from '@/features/alerts/components/SegmentedChips';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';

type CountryFilterProps = Readonly<{
  value?: CountryCode;
  onChange: (country?: CountryCode) => void;
}>;

// Sentinelle pour l'option « Toutes » (le filtre pays est porté par l'URL via
// useAlertFilters → param API `country`, qui scope l'agrégation au pays source).
const ALL = 'ALL' as const;
type CountryChoice = typeof ALL | CountryCode;

const OPTIONS: SegmentedOption<CountryChoice>[] = [
  { value: ALL, label: 'Toutes' },
  ...COUNTRY_CODES.map((code) => ({ value: code, label: COUNTRY_LABELS[code] })),
];

export function CountryFilter({ value, onChange }: CountryFilterProps) {
  return (
    <SegmentedChips
      legend="Filtrer par région"
      options={OPTIONS}
      value={value ?? ALL}
      isSelected={(option, current) => option === current}
      onChange={(choice) => onChange(choice === ALL ? undefined : choice)}
    />
  );
}
