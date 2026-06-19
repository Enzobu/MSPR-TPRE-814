import { type ReactNode, useCallback, useEffect, useState } from 'react';
import type { AuthenticatedUser } from '@futurekawa/contracts';
import {
  registerForcedLogoutHandler,
  setAccessToken,
} from '@/lib/auth-token';
import * as authApi from '@/features/auth/api/auth.api';
import {
  AuthContext,
  type AuthStatus,
} from '@/features/auth/context/auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

// Source de vérité de l'état d'auth côté React. L'access token vit en mémoire
// (auth-token.ts) ; au reload il est perdu → un /auth/refresh au boot le
// restaure via le cookie httpOnly persistant (ADR-0006).
export function AuthProvider({ children }: AuthProviderProps): ReactNode {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await authApi.login({ email, password });
    setAccessToken(auth.accessToken);
    setUser(auth.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Déconnexion forcée déclenchée par l'intercepteur quand le refresh échoue.
  useEffect(() => {
    registerForcedLogoutHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
    });
    return () => registerForcedLogoutHandler(null);
  }, []);

  // Restauration de session au démarrage.
  useEffect(() => {
    let active = true;
    authApi
      .refresh()
      .then((auth) => {
        if (!active) return;
        setAccessToken(auth.accessToken);
        setUser(auth.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (active) clearSession();
      });
    return () => {
      active = false;
    };
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
