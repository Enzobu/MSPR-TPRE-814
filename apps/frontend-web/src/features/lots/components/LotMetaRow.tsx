import {
  CalendarDays,
  Globe,
  Sprout,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import type { Lot } from '@futurekawa/contracts';
import { formatCountry, formatStoredAt } from '@/features/lots/lib/format';

type LotMetaRowProps = Readonly<{
  lot: Lot;
}>;

interface MetaItem {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
}

export function LotMetaRow({ lot }: LotMetaRowProps) {
  const items: MetaItem[] = [
    { icon: Globe, label: 'Pays', value: formatCountry(lot.country) },
    { icon: Warehouse, label: 'Entrepôt', value: lot.warehouse },
    { icon: Sprout, label: 'Exploitation', value: lot.farm },
    {
      icon: CalendarDays,
      label: 'Stocké le',
      value: formatStoredAt(lot.storedAt),
      mono: true,
    },
  ];

  return (
    <dl className="flex flex-wrap items-center gap-x-5 gap-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="leading-tight">
              <dt className="text-[11px] text-muted-foreground">
                {item.label}
              </dt>
              <dd
                className={
                  item.mono
                    ? 'font-mono text-[13px] font-medium tabular-nums'
                    : 'text-[13px] font-medium'
                }
              >
                {item.value}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
