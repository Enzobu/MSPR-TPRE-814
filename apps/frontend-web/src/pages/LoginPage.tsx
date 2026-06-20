import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-heading text-lg font-semibold">FutureKawa</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Accédez au suivi des stocks de café vert.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm
              onSuccess={() => navigate(redirectTo, { replace: true })}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
