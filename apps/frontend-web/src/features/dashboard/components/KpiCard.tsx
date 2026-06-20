import { type ComponentType, type ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type KpiCardProps = Readonly<{
  label: string;
  icon: ComponentType<LucideProps>;
  isLoading: boolean;
  isError?: boolean;
  value?: ReactNode;
  unit?: string;
  note?: ReactNode;
  emphasis?: boolean;
}>;

// Carte KPI du dashboard (design L599-617) : libellé + chip icône en haut, grande
// valeur tabular-nums, ligne de note dessous. `emphasis` teinte la valeur et le
// chip en statut périmé (ex. alertes non acquittées > 0).
export function KpiCard({
  label,
  icon: Icon,
  isLoading,
  isError = false,
  value,
  unit,
  note,
  emphasis = false,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <Card className="gap-0 p-[18px] [--card-spacing:0]">
        <Skeleton className="mb-4 h-[11px] w-[46%]" />
        <Skeleton className="mb-3 h-[26px] w-[62%]" />
        <Skeleton className="h-2.5 w-[38%]" />
      </Card>
    );
  }

  return (
    <Card className="gap-0 px-[18px] py-[17px] shadow-sm [--card-spacing:0]">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-lg',
            emphasis
              ? 'bg-status-perime/12 text-status-perime'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'text-[27px] font-semibold tracking-tight tabular-nums',
            isError && 'text-muted-foreground',
            emphasis && 'text-status-perime',
          )}
        >
          {isError ? '—' : value}
        </span>
        {unit && !isError ? (
          <span className="text-[13px] text-muted-foreground">{unit}</span>
        ) : null}
      </div>
      {note && !isError ? (
        <div className="mt-2 text-xs text-muted-foreground">{note}</div>
      ) : null}
    </Card>
  );
}
