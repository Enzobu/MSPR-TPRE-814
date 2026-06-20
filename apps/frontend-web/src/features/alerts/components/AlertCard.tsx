import { Link } from 'react-router';
import type { Alert } from '@futurekawa/contracts';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTypeBadge } from '@/features/alerts/components/AlertTypeBadge';
import { formatTriggeredAt } from '@/features/alerts/lib/format';

type AlertCardProps = Readonly<{
  alert: Alert;
}>;

export function AlertCard({ alert }: AlertCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            to={`/alerts/${alert.id}`}
            className="underline-offset-4 hover:underline"
          >
            <AlertTypeBadge type={alert.type} />
          </Link>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTriggeredAt(alert.triggeredAt)}
          </span>
        </div>
        <p className="text-sm">{alert.message}</p>
        <p className="text-xs text-muted-foreground">
          {alert.warehouse ?? '—'}
          {alert.lotId ? ` · ${alert.lotId}` : ''}
          {' · '}
          {alert.acknowledged ? 'Acquittée' : 'Non acquittée'}
        </p>
      </CardContent>
    </Card>
  );
}
