import { Outlet } from 'react-router';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { ThemeToggle } from '@/components/theme/theme-toggle';

// Layout racine mobile-first : header + zone de contenu (rules front).
export function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-heading text-lg font-semibold">FutureKawa</span>
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
