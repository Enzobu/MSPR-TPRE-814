import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from '@/hooks/use-theme';

const STORAGE_KEY = 'futurekawa-theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  const prefersDark =
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

// Applique le thème via la classe `dark` sur <html> (Tailwind v4 + variants shadcn).
export function ThemeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(() => {
    const toggleTheme = (): void => {
      setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'));
    };
    return { theme, setTheme, toggleTheme };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
