import { Link, Outlet } from 'react-router';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { AlertsBadge } from '@/features/alerts/components/AlertsBadge';
import { ThemeToggle } from '@/components/theme/theme-toggle';

// Layout racine mobile-first : header + zone de contenu (rules front).
export function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-heading text-lg font-semibold">
            FutureKawa
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/lots"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Lots
            </Link>
            <AlertsBadge />
          </nav>
        </div>
        <div className="flex items-center gap-1">
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
