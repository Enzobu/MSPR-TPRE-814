import { type ComponentType, type ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type KpiCardProps = Readonly<{
  label: string;
  icon: ComponentType<LucideProps>;
  isLoading: boolean;
  isError?: boolean;
  value?: ReactNode;
  hint?: ReactNode;
  emphasis?: boolean;
}>;

// Carte KPI du dashboard : libellé + icône, grande valeur en tabular-nums.
// `emphasis` colore la valeur en statut périmé/destructif (ex. alertes > 0).
export function KpiCard({
  label,
  icon: Icon,
  isLoading,
  isError = false,
  value,
  hint,
  emphasis = false,
}: KpiCardProps) {
  function renderValue() {
    if (isLoading) {
      return <Skeleton className="h-8 w-20" />;
    }
    if (isError) {
      return (
        <p className="text-2xl font-semibold tabular-nums text-muted-foreground">
          —
        </p>
      );
    }
    return (
      <p
        className={cn(
          'text-3xl font-semibold tabular-nums',
          emphasis ? 'text-status-perime' : 'text-foreground',
        )}
      >
        {value}
      </p>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {renderValue()}
          {hint && !isLoading ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            emphasis
              ? 'bg-destructive/10 text-status-perime'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
