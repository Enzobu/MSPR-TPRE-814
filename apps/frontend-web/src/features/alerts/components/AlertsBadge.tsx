import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useUnacknowledgedCount } from '@/features/alerts/hooks/useUnacknowledgedCount';

// Pastille compteur d'alertes non acquittées dans le header. Polling via le hook.
// Quand le compteur augmente entre deux refetchs, une nouvelle alerte est arrivée
// → toast d'information (comparaison avec la valeur précédente via une ref).
export function AlertsBadge() {
  const { data: count } = useUnacknowledgedCount();
  const previousCount = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (count === undefined) {
      return;
    }
    if (previousCount.current !== undefined && count > previousCount.current) {
      toast.warning('Nouvelle alerte non acquittée.');
    }
    previousCount.current = count;
  }, [count]);

  const hasAlerts = count !== undefined && count > 0;

  return (
    <Link
      to="/alerts"
      className="relative inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      aria-label={
        hasAlerts ? `Alertes, ${count} non acquittées` : 'Alertes'
      }
    >
      Alertes
      <Bell className="ml-1 size-4" aria-hidden />
      {hasAlerts ? (
        <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-status-perime px-1.5 py-0.5 text-xs font-medium text-status-perime-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
