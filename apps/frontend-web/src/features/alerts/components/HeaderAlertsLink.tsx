import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUnacknowledgedCount } from '@/features/alerts/hooks/useUnacknowledgedCount';

type HeaderAlertsLinkProps = Readonly<{
  itemBaseClassName: string;
  itemActiveClassName: string;
  itemInactiveClassName: string;
}>;

// Item « Alertes » de la nav segmented. Porte le compteur d'alertes non
// acquittées et le toast d'arrivée d'une nouvelle alerte : quand le compteur
// augmente entre deux refetchs (polling du hook), on prévient l'utilisateur.
// Comparaison via une ref → pas de toast au premier chargement.
export function HeaderAlertsLink({
  itemBaseClassName,
  itemActiveClassName,
  itemInactiveClassName,
}: HeaderAlertsLinkProps) {
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
  const label = hasAlerts ? `Alertes, ${count} non acquittées` : 'Alertes';

  return (
    <NavLink
      to="/alerts"
      aria-label={label}
      className={({ isActive }) =>
        cn(
          itemBaseClassName,
          isActive ? itemActiveClassName : itemInactiveClassName,
        )
      }
    >
      <TriangleAlert className="size-4 shrink-0" aria-hidden />
      <span className="hidden sm:inline">Alertes</span>
      {hasAlerts ? (
        <span
          aria-label={`${count} non acquittées`}
          className="inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-background tabular-nums"
        >
          {count}
        </span>
      ) : null}
    </NavLink>
  );
}
