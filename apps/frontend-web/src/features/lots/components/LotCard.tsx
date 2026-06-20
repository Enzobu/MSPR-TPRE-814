import { Link } from 'react-router';
import type { Lot } from '@futurekawa/contracts';
import { Card, CardContent } from '@/components/ui/card';
import { LotStatusBadge } from '@/features/lots/components/LotStatusBadge';
import {
  computeExpiry,
  expiryColorClass,
  formatStoredAt,
} from '@/features/lots/lib/format';
import { cn } from '@/lib/utils';

type LotCardProps = Readonly<{
  lot: Lot;
}>;

export function LotCard({ lot }: LotCardProps) {
  const expiry = computeExpiry(lot.storedAt);
  return (
    <Link
      to={`/lots/${lot.id}`}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="transition-colors hover:bg-accent">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold">{lot.id}</span>
            <LotStatusBadge status={lot.status} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Pays</dt>
            <dd className="text-right font-mono text-xs font-semibold">
              {lot.country}
            </dd>
            <dt className="text-muted-foreground">Entrepôt</dt>
            <dd className="text-right">{lot.warehouse}</dd>
            <dt className="text-muted-foreground">Stocké le</dt>
            <dd className="text-right font-mono text-xs tabular-nums">
              {formatStoredAt(lot.storedAt)}
            </dd>
            <dt className="text-muted-foreground">Péremption</dt>
            <dd
              className={cn(
                'text-right text-xs tabular-nums',
                expiry ? expiryColorClass(expiry.proximity) : undefined,
              )}
            >
              {expiry ? expiry.label : '—'}
            </dd>
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}
