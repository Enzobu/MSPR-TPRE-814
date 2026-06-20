import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

// Bouton thème pleine largeur de la sidebar (logique partagée avec
// theme-toggle.tsx via useTheme ; forme adaptée au layout vertical).
export function SidebarThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Basculer le thème"
      className="flex h-[38px] items-center gap-2.5 rounded-lg border border-border px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isDark ? (
        <Sun className="size-4 shrink-0" aria-hidden />
      ) : (
        <Moon className="size-4 shrink-0" aria-hidden />
      )}
      <span className="flex-1 text-left">
        {isDark ? 'Thème clair' : 'Thème sombre'}
      </span>
    </button>
  );
}
