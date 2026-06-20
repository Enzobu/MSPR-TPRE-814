import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import { SIDEBAR_NAV_ITEMS } from '@/components/layout/nav-items';
import { useUnacknowledgedCount } from '@/features/alerts/hooks/useUnacknowledgedCount';

const ITEM_BASE =
  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const ITEM_ACTIVE = 'bg-accent font-semibold text-foreground';
const ITEM_INACTIVE = 'text-muted-foreground';

type SidebarNavProps = Readonly<{
  onNavigate?: () => void;
}>;

// Section "Navigation" de la sidebar. L'item Alertes porte le compteur
// d'alertes non acquittées (agrégation tous pays, comme l'ancien header).
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const { data: unackCount } = useUnacknowledgedCount();
  const hasAlerts = unackCount !== undefined && unackCount > 0;

  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-0.5">
      {SIDEBAR_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
        const isAlerts = to === '/alerts';
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(ITEM_BASE, isActive ? ITEM_ACTIVE : ITEM_INACTIVE)
            }
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            <span className="flex-1 text-left">{label}</span>
            {isAlerts && hasAlerts ? (
              <span
                aria-label={`${unackCount} non acquittées`}
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-background"
              >
                {unackCount}
              </span>
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );
}
