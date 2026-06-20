import { Link, useNavigate } from 'react-router';
import {
  Check,
  ChevronRight,
  OctagonAlert,
  TriangleAlert,
} from 'lucide-react';
import type { Alert, CountryCode } from '@futurekawa/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRecentAlerts } from '@/features/alerts/hooks/useRecentAlerts';
import { useUnacknowledgedCount } from '@/features/alerts/hooks/useUnacknowledgedCount';
import {
  alertSeverityStyle,
  formatAgo,
} from '@/features/dashboard/lib/format';
import { cn } from '@/lib/utils';

type RecentAlertsProps = Readonly<{
  country?: CountryCode;
}>;

function severityIcon(type: Alert['type']) {
  return type === 'LOT_EXPIRED' ? OctagonAlert : TriangleAlert;
}

// Carte « Alertes récentes » du dashboard (design L621-667) : en-tête avec
// compteur non acquitté + « Tout voir », puis lignes cliquables (chip sévérité,
// lot mono, type, ago) ou états skeleton / vide (check vert).
export function RecentAlerts({ country }: RecentAlertsProps) {
  const navigate = useNavigate();
  const { data, isPending, isError } = useRecentAlerts(country);
  const { data: unackCount } = useUnacknowledgedCount(country);

  const hasUnack = (unackCount ?? 0) > 0;
  const alerts = data?.data ?? [];

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-[18px] py-[15px]">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold">Alertes récentes</span>
          {hasUnack ? (
            <span className="rounded-full bg-status-alerte/16 px-[7px] py-0.5 font-mono text-[11px] font-semibold text-status-alerte">
              {unackCount} non acquittées
            </span>
          ) : null}
        </div>
        <Link
          to="/alerts"
          className="inline-flex items-center gap-1.5 rounded-md text-[12.5px] font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Tout voir
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {isPending ? (
        <ul className="py-2">
          {[0, 1, 2].map((row) => (
            <li
              key={row}
              className="flex items-center gap-3 px-[18px] py-[11px]"
            >
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-4 w-14" />
            </li>
          ))}
        </ul>
      ) : null}

      {isError ? (
        <p role="alert" className="px-[18px] py-8 text-center text-sm text-muted-foreground">
          Impossible de charger les alertes pour le moment.
        </p>
      ) : null}

      {!isPending && !isError && alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-status-conforme/14 text-status-conforme">
            <Check className="size-6" aria-hidden />
          </span>
          <div>
            <p className="mb-1 text-[14.5px] font-semibold">
              Aucune alerte active
            </p>
            <p className="mx-auto max-w-[300px] text-[13px] leading-relaxed text-muted-foreground">
              Tous les lots surveillés sont dans leurs seuils. Les nouvelles
              alertes apparaîtront ici en temps réel.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={() => navigate('/lots')}
          >
            Voir les lots
          </Button>
        </div>
      ) : null}

      {!isPending && !isError && alerts.length > 0 ? (
        <ul>
          {alerts.map((alert) => {
            const severity = alertSeverityStyle(alert.type);
            const Icon = severityIcon(alert.type);
            return (
              <li key={alert.id} className="border-b last:border-b-0">
                <Link
                  to={`/alerts/${alert.id}`}
                  className="flex items-center gap-3 px-[18px] py-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      'flex size-[30px] shrink-0 items-center justify-center rounded-lg',
                      severity.chip,
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12.5px] font-semibold">
                        {alert.lotId ?? alert.country}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {severity.label}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {alert.message}
                    </p>
                  </div>
                  <time
                    dateTime={alert.triggeredAt}
                    className="shrink-0 text-[11px] text-muted-foreground tabular-nums"
                  >
                    {formatAgo(alert.triggeredAt)}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
