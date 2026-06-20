import { Link } from 'react-router';
import type { Lot } from '@futurekawa/contracts';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { LotStatusBadge } from '@/features/lots/components/LotStatusBadge';
import {
  computeExpiry,
  expiryColorClass,
  formatCountry,
  formatStoredAt,
} from '@/features/lots/lib/format';
import { cn } from '@/lib/utils';

type LotWarehouseHoverCardProps = Readonly<{
  lot: Lot;
}>;

// Cellule "Entrepôt" du tableau de lots : libellé cliquable (vers le détail)
// qui révèle au survol une carte détaillée (entrepôt complet + métadonnées).
export function LotWarehouseHoverCard({ lot }: LotWarehouseHoverCardProps) {
  const expiry = computeExpiry(lot.storedAt);

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <Link
          to={`/lots/${lot.id}`}
          onClick={(event) => event.stopPropagation()}
          className="block min-w-0 truncate text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {lot.warehouse}
        </Link>
      </HoverCardTrigger>

      <HoverCardContent align="start" className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <LotStatusBadge status={lot.status} />
          <span className="font-mono text-[11px] font-semibold text-muted-foreground">
            {lot.id}
          </span>
        </div>

        <div className="px-4 py-3">
          <p className="text-sm font-medium leading-snug text-pretty">
            {lot.warehouse}
          </p>
          <dl className="mt-3 flex flex-col gap-1.5">
            <Row label="Pays" value={formatCountry(lot.country)} />
            <Row label="Exploitation" value={lot.farm} />
            <Row label="Stocké le" value={formatStoredAt(lot.storedAt)} mono />
            {expiry ? (
              <Row
                label="Péremption"
                value={expiry.label}
                className={expiryColorClass(expiry.proximity)}
              />
            ) : null}
          </dl>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

type RowProps = Readonly<{
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}>;

function Row({ label, value, mono, className }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'truncate text-[12.5px] font-medium',
          mono && 'font-mono tabular-nums',
          className,
        )}
      >
        {value}
      </dd>
    </div>
  );
}
