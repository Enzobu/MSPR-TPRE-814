import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTypeBadge } from '@/features/alerts/components/AlertTypeBadge';
import { useRecentAlerts } from '@/features/alerts/hooks/useRecentAlerts';
import { formatTriggeredAt } from '@/features/alerts/lib/format';

type RecentAlertsProps = Readonly<{
  country?: CountryCode;
}>;

// Mini-liste des dernières alertes sur le dashboard, scopable par pays. États :
// chargement (skeletons), erreur (message métier role=alert), vide (texte neutre).
export function RecentAlerts({ country }: RecentAlertsProps) {
  const { data, isPending, isError } = useRecentAlerts(country);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Dernières alertes</CardTitle>
        <Link
          to="/alerts"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Tout voir
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <ul className="space-y-3">
            {[0, 1, 2].map((row) => (
              <li key={row}>
                <Skeleton className="h-12 w-full" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <p role="alert" className="text-sm text-muted-foreground">
            Impossible de charger les alertes pour le moment.
          </p>
        ) : data.data.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aucune alerte.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.data.map((alert) => (
              <li
                key={alert.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 space-y-1">
                  <AlertTypeBadge type={alert.type} />
                  <p className="truncate text-sm text-foreground">
                    {alert.message}
                  </p>
                </div>
                <time
                  dateTime={alert.triggeredAt}
                  className="shrink-0 text-xs text-muted-foreground tabular-nums"
                >
                  {formatTriggeredAt(alert.triggeredAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
