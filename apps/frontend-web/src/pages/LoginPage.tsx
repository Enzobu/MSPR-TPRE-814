import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Coffee, Lock } from 'lucide-react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { LoginBrandPanel } from '@/features/auth/components/LoginBrandPanel';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ThemeToggle } from '@/components/theme/theme-toggle';

interface LocationState {
  from?: { pathname?: string };
}

const DEFAULT_REDIRECT = '/';

export default function LoginPage(): React.ReactNode {
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? DEFAULT_REDIRECT;

  // Déjà connecté (ex. retour sur /login) → renvoyer vers l'app.
  useEffect(() => {
    if (status === 'authenticated') {
      navigate(redirectTo, { replace: true });
    }
  }, [status, navigate, redirectTo]);

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
      <div className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[380px]">
          <div className="mb-9 flex items-center gap-2.5">
            <span className="flex size-[34px] items-center justify-center rounded-[9px] bg-primary text-primary-foreground">
              <Coffee className="size-[19px]" aria-hidden />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">
              FutureKawa
            </span>
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">
            Connexion
          </h1>
          <p className="mb-7 text-sm leading-relaxed text-muted-foreground">
            Accédez au suivi des stocks de café vert et à la surveillance IoT.
          </p>

          <LoginForm
            onSuccess={() => navigate(redirectTo, { replace: true })}
          />

          <div className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            Connexion chiffrée · accès réservé aux équipes siège et entrepôt
          </div>
        </div>
      </div>
      <LoginBrandPanel />
    </div>
  );
}
