import { Fragment } from 'react';
import { Bell, ChevronRight, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';
import { useDashboardCountry } from '@/features/dashboard/hooks/useDashboardCountry';
import { useUnacknowledgedCount } from '@/features/alerts/hooks/useUnacknowledgedCount';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { deriveCrumbs } from '@/components/layout/breadcrumbs';

type AppHeaderProps = Readonly<{
  // Ouvre la sidebar off-canvas (mobile).
  onOpenSidebar: () => void;
}>;

// Header contextuel sticky : breadcrumbs + chip scope (pays), palette de
// recherche globale et cloche d'alertes. Hamburger visible < sidebar breakpoint.
export function AppHeader({ onOpenSidebar }: AppHeaderProps) {
  const location = useLocation();
  const { country } = useDashboardCountry();
  const { data: unackCount } = useUnacknowledgedCount();

  const crumbs = deriveCrumbs(location.pathname);
  const scopeLabel = country ? COUNTRY_LABELS[country] : 'Tous';
  const hasAlerts = unackCount !== undefined && unackCount > 0;

  return (
    <header className="sticky top-0 z-10 flex h-15 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:px-7">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenSidebar}
          aria-label="Ouvrir la navigation"
          className="lg:hidden"
        >
          <Menu className="size-4" aria-hidden />
        </Button>

        <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-2">
          {crumbs.map((crumb, index) => (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
              {crumb.current ? (
                <span
                  aria-current="page"
                  className="truncate text-sm font-semibold text-foreground"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </Fragment>
          ))}
          <span className="hidden shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground sm:inline">
            {scopeLabel}
          </span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <GlobalSearch />
        <Button
          variant="outline"
          size="icon"
          aria-label={
            hasAlerts ? 'Alertes non acquittées' : 'Notifications'
          }
          className="relative"
        >
          <Bell className="size-4" aria-hidden />
          {hasAlerts ? (
            <span
              aria-hidden
              className="absolute right-2 top-2 size-[7px] rounded-full border-[1.5px] border-background bg-status-alerte"
            />
          ) : null}
        </Button>
      </div>
    </header>
  );
}
