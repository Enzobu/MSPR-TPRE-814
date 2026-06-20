import { createContext } from 'react';
import type { AuthenticatedUser } from '@futurekawa/contracts';

// 'loading' tant que la restauration de session (refresh au boot) n'a pas
// répondu : la garde de routes attend cet état avant de rediriger.
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthenticatedUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
