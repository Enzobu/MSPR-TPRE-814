import { ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { AuthenticatedUser, Role } from '@futurekawa/contracts';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrateur',
  MANAGER: 'Resp. entrepôt',
  OPERATOR: 'Opérateur',
  VIEWER: 'Lecture seule',
};

// Initiales dérivées de l'email (pas de display name dans le contrat user).
function initialsFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? email;
  const parts = localPart.split(/[._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0] ?? '');
  return (letters.join('') || email.slice(0, 2)).toUpperCase();
}

function displayName(user: AuthenticatedUser): string {
  return user.email.split('@')[0] ?? user.email;
}

// Carte utilisateur en pied de sidebar : identité + menu déconnexion.
// Réutilise useAuth (comme UserMenu) ; rendu uniquement si authentifié.
export function UserCard(): React.ReactNode {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user === null) {
    return null;
  }

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Menu utilisateur"
          className="flex items-center gap-2.5 rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-secondary-foreground">
            {initialsFromEmail(user.email)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[13px] font-semibold">
              {displayName(user)}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {ROLE_LABELS[user.role]}
              {user.country ? ` · ${user.country}` : ''}
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate font-medium">{user.email}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {ROLE_LABELS[user.role]}
            {user.country ? ` · ${user.country}` : ''}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut aria-hidden />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
