import { LOT_STATUSES, type LotStatus } from '@futurekawa/contracts';
import { LOT_STATUS_CONFIG } from '@/features/lots/lib/lotStatus';
import {
  SegmentedChips,
  type SegmentedChipOption,
} from '@/features/lots/components/SegmentedChips';

export const STATUS_ALL = 'ALL';
export type LotStatusFilterValue = LotStatus | typeof STATUS_ALL;

type LotStatusFilterProps = Readonly<{
  value: LotStatusFilterValue;
  onChange: (value: LotStatusFilterValue) => void;
}>;

const OPTIONS: SegmentedChipOption<LotStatusFilterValue>[] = [
  { value: STATUS_ALL, label: 'Tous' },
  ...LOT_STATUSES.map((status) => ({
    value: status,
    label: LOT_STATUS_CONFIG[status].label,
    dotClassName: LOT_STATUS_CONFIG[status].dotClassName,
  })),
];

// FILTRE CLIENT LOCAL : le backend-central n'expose pas de paramètre `status`.
// Le filtrage se fait sur la page courante (état local de la page), il n'est
// donc PAS porté par l'URL et ne déclenche aucun appel API.
export function LotStatusFilter({ value, onChange }: LotStatusFilterProps) {
  return (
    <SegmentedChips
      legend="Filtrer par statut"
      options={OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
