import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AcknowledgeButton } from '@/features/alerts/components/AcknowledgeButton';
import { AlertTypeBadge } from '@/features/alerts/components/AlertTypeBadge';
import { useAlert } from '@/features/alerts/hooks/useAlert';
import { formatTriggeredAt } from '@/features/alerts/lib/format';

export default function AlertDetailPage() {
  const { id = '' } = useParams();
  const { data: alert, isPending, isError } = useAlert(id);

  let detail: React.ReactNode;
  if (isPending) {
    detail = <Skeleton className="h-48 w-full" />;
  } else if (isError) {
    detail = (
      <p
        role="alert"
        className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
      >
        Impossible de charger cette alerte pour le moment. Réessayez plus
        tard.
      </p>
    );
  } else if (alert === null) {
    detail = (
      <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Alerte introuvable.
      </p>
    );
  } else {
    detail = (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Alerte {alert.id}</CardTitle>
          <AlertTypeBadge type={alert.type} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{alert.message}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Pays</dt>
            <dd>{alert.country}</dd>
            <dt className="text-muted-foreground">Entrepôt</dt>
            <dd>{alert.warehouse ?? '—'}</dd>
            <dt className="text-muted-foreground">Lot</dt>
            <dd>
              {alert.lotId ? (
                <Link
                  to={`/lots/${alert.lotId}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {alert.lotId}
                </Link>
              ) : (
                '—'
              )}
            </dd>
            <dt className="text-muted-foreground">Déclenchée le</dt>
            <dd className="tabular-nums">
              {formatTriggeredAt(alert.triggeredAt)}
            </dd>
            <dt className="text-muted-foreground">Acquittée</dt>
            <dd>{alert.acknowledged ? 'Oui' : 'Non'}</dd>
          </dl>
          <AcknowledgeButton
            id={alert.id}
            country={alert.country}
            acknowledged={alert.acknowledged}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <Button asChild size="sm" variant="ghost">
        <Link to="/alerts">
          <ArrowLeft aria-hidden />
          Retour aux alertes
        </Link>
      </Button>

      {detail}
    </section>
  );
}
