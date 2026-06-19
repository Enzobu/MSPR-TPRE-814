import { LogOut, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Menu utilisateur dans le header : identité + déconnexion. Rendu uniquement
// quand un utilisateur est présent (zone authentifiée).
export function UserMenu(): React.ReactNode {
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
        <Button variant="ghost" size="icon" aria-label="Menu utilisateur">
          <UserRound aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate font-medium">{user.email}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {user.role}
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
