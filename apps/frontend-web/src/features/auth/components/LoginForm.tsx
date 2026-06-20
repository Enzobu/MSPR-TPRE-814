import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  type LoginFormValues,
  loginSchema,
} from '@/features/auth/schemas/login.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const HTTP_UNAUTHORIZED = 401;
const INVALID_CREDENTIALS = 'Email ou mot de passe incorrect.';
const GENERIC_ERROR = 'Connexion impossible pour le moment. Réessayez.';

type LoginFormProps = Readonly<{
  onSuccess: () => void;
}>;

function toErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === HTTP_UNAUTHORIZED) {
    return INVALID_CREDENTIALS;
  }
  return GENERIC_ERROR;
}

export function LoginForm({ onSuccess }: LoginFormProps): React.ReactNode {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      onSuccess();
    } catch (error) {
      setServerError(toErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email !== undefined}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password !== undefined}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        Se connecter
      </Button>
    </form>
  );
}
