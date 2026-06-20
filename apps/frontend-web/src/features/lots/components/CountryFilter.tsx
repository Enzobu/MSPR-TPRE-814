import { COUNTRY_CODES, type CountryCode } from '@futurekawa/contracts';
import {
  SegmentedChips,
  type SegmentedChipOption,
} from '@/features/lots/components/SegmentedChips';

type CountryFilterProps = Readonly<{
  value?: CountryCode;
  onChange: (country?: CountryCode) => void;
}>;

const ALL_VALUE = 'ALL';
type CountryChipValue = CountryCode | typeof ALL_VALUE;

const OPTIONS: SegmentedChipOption<CountryChipValue>[] = [
  { value: ALL_VALUE, label: 'Tous' },
  ...COUNTRY_CODES.map((code) => ({ value: code, label: code })),
];

// Branché sur l'état URL via `useLotFilters` (la page passe value/onChange).
export function CountryFilter({ value, onChange }: CountryFilterProps) {
  return (
    <SegmentedChips
      legend="Filtrer par pays"
      options={OPTIONS}
      value={value ?? ALL_VALUE}
      onChange={(next) => onChange(next === ALL_VALUE ? undefined : next)}
    />
  );
}
