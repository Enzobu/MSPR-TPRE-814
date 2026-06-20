import { Link } from 'react-router';
import type { Lot } from '@futurekawa/contracts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LotStatusBadge } from '@/features/lots/components/LotStatusBadge';
import { formatStoredAt } from '@/features/lots/lib/format';

type LotCardProps = Readonly<{
  lot: Lot;
}>;

export function LotCard({ lot }: LotCardProps) {
  return (
    <Link
      to={`/lots/${lot.id}`}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{lot.id}</CardTitle>
          <LotStatusBadge status={lot.status} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Pays</span>
          <span>{lot.country}</span>
          <span className="text-muted-foreground">Exploitation</span>
          <span>{lot.farm}</span>
          <span className="text-muted-foreground">Entrepôt</span>
          <span>{lot.warehouse}</span>
          <span className="text-muted-foreground">Stocké le</span>
          <span className="tabular-nums">{formatStoredAt(lot.storedAt)}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
