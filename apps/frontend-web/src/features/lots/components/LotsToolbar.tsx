import { ArrowDownNarrowWide, ArrowUpNarrowWide } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';
import { Button } from '@/components/ui/button';
import { CountryFilter } from '@/features/lots/components/CountryFilter';
import { FacetCombobox } from '@/features/lots/components/FacetCombobox';
import { LotsSearch } from '@/features/lots/components/LotsSearch';
import {
  LotStatusFilter,
  type LotStatusFilterValue,
} from '@/features/lots/components/LotStatusFilter';

type LotsToolbarProps = Readonly<{
  search: string;
  onSearchChange: (value: string) => void;
  country?: CountryCode;
  onCountryChange: (country?: CountryCode) => void;
  farm?: string;
  onFarmChange: (farm?: string) => void;
  farmOptions: string[];
  warehouse?: string;
  onWarehouseChange: (warehouse?: string) => void;
  warehouseOptions: string[];
  status: LotStatusFilterValue;
  onStatusChange: (status: LotStatusFilterValue) => void;
  isAscending: boolean;
  onToggleSort: () => void;
}>;

export function LotsToolbar({
  search,
  onSearchChange,
  country,
  onCountryChange,
  farm,
  onFarmChange,
  farmOptions,
  warehouse,
  onWarehouseChange,
  warehouseOptions,
  status,
  onStatusChange,
  isAscending,
  onToggleSort,
}: LotsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <LotsSearch value={search} onChange={onSearchChange} />
      <CountryFilter value={country} onChange={onCountryChange} />
      <FacetCombobox
        label="Exploitation"
        allLabel="Toutes les exploitations"
        value={farm}
        options={farmOptions}
        onChange={onFarmChange}
      />
      <FacetCombobox
        label="Entrepôt"
        allLabel="Tous les entrepôts"
        value={warehouse}
        options={warehouseOptions}
        onChange={onWarehouseChange}
      />
      <div className="hidden flex-1 lg:block" />
      <LotStatusFilter value={status} onChange={onStatusChange} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label={
          isAscending
            ? 'Trier du plus récent au plus ancien'
            : 'Trier du plus ancien au plus récent'
        }
        onClick={onToggleSort}
      >
        {isAscending ? (
          <ArrowUpNarrowWide aria-hidden />
        ) : (
          <ArrowDownNarrowWide aria-hidden />
        )}
        {isAscending ? 'Plus anciens' : 'Plus récents'}
      </Button>
    </div>
  );
}
