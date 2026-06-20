import { useState } from 'react';
import { Outlet } from 'react-router';
import { X } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';

// Largeur de la sidebar (248px) imposée par le design.
const SIDEBAR_WIDTH = 'w-62';

// App shell : sidebar gauche 248px + header contextuel + zone de contenu
// scrollable. Sous 400px la sidebar passe en off-canvas (hamburger header).
export function RootLayout() {
  // Le panneau off-canvas (mobile) se referme via onNavigate (liens sidebar),
  // le bouton X et le backdrop — pas besoin d'effet sur la route.
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeMobile = (): void => setIsMobileOpen(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-border min-[400px]:block ${SIDEBAR_WIDTH}`}
      >
        <Sidebar />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-40 min-[400px]:hidden">
          <button
            type="button"
            aria-label="Fermer la navigation"
            onClick={closeMobile}
            className="absolute inset-0 bg-foreground/40"
          />
          <div
            className={`absolute inset-y-0 left-0 ${SIDEBAR_WIDTH} max-w-[85vw] border-r border-border shadow-lg`}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobile}
              aria-label="Fermer la navigation"
              className="absolute right-2 top-2 z-10"
            >
              <X className="size-4" aria-hidden />
            </Button>
            <Sidebar onNavigate={closeMobile} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenSidebar={() => setIsMobileOpen(true)} />
        <main className="fk-scroll flex-1 overflow-auto p-4 min-[400px]:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
