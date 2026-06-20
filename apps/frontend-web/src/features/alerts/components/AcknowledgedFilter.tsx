import {
  SegmentedChips,
  type SegmentedOption,
} from '@/features/alerts/components/SegmentedChips';

type AcknowledgedFilterProps = Readonly<{
  value?: boolean;
  onChange: (acknowledged?: boolean) => void;
}>;

// Statut porté par l'URL via useAlertFilters → param API `acknowledged`.
// 'ALL' = pas de filtre (undefined), sinon true/false.
const ALL = 'ALL' as const;
type StatusChoice = typeof ALL | boolean;

const OPTIONS: SegmentedOption<StatusChoice>[] = [
  { value: ALL, label: 'Tous' },
  { value: false, label: 'Non acquittées' },
  { value: true, label: 'Acquittées' },
];

export function AcknowledgedFilter({ value, onChange }: AcknowledgedFilterProps) {
  return (
    <SegmentedChips
      legend="Filtrer par acquittement"
      options={OPTIONS}
      value={value ?? ALL}
      isSelected={(option, current) => option === current}
      onChange={(choice) => onChange(choice === ALL ? undefined : choice)}
    />
  );
}
