import { type ComponentType } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { Bean, Boxes, Home, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { HeaderAlertsLink } from '@/features/alerts/components/HeaderAlertsLink';
import { ThemeToggle } from '@/components/theme/theme-toggle';

// Nav segmented control (variante 05) : groupe de pills inset sur fond muted,
// item actif « surélevé ». Le style actif est piloté par NavLink isActive.
const ITEM_BASE =
  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const ITEM_ACTIVE =
  'bg-background font-medium text-foreground shadow-sm ring-1 ring-border';
const ITEM_INACTIVE = 'text-muted-foreground hover:text-foreground';

interface HeaderNavItem {
  to: string;
  label: string;
  icon: ComponentType<LucideProps>;
  end?: boolean;
}

// `/` doit être actif uniquement sur l'index (end), sinon il matcherait toutes
// les routes enfants.
const NAV_ITEMS: readonly HeaderNavItem[] = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/lots', label: 'Lots', icon: Boxes },
];

// Layout racine mobile-first : header segmented + zone de contenu (rules front).
export function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 rounded-lg font-heading text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bean className="size-4 shrink-0" aria-hidden />
          <span className="hidden min-[360px]:inline">FutureKawa</span>
        </Link>

        <nav
          aria-label="Navigation principale"
          className="flex items-center gap-0.5 rounded-xl bg-muted p-1"
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(ITEM_BASE, isActive ? ITEM_ACTIVE : ITEM_INACTIVE)
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
          <HeaderAlertsLink
            itemBaseClassName={ITEM_BASE}
            itemActiveClassName={ITEM_ACTIVE}
            itemInactiveClassName={ITEM_INACTIVE}
          />
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
