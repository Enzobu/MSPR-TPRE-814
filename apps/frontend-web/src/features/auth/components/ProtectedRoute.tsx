import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/hooks/use-auth';

// Garde de routes : laisse passer si authentifié, redirige vers /login sinon en
// mémorisant la route d'origine (restaurée après login). Attend la fin de la
// restauration de session ('loading') avant de décider — sinon un reload
// rejetterait un utilisateur pourtant connecté (ADR-0006).
export function ProtectedRoute(): React.ReactNode {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <output
        aria-label="Chargement de la session"
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </output>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
