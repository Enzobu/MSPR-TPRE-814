import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/hooks/use-theme';

// Wrapper shadcn-style : thème synchronisé avec le ThemeProvider de l'app.
export function Toaster() {
  const { theme } = useTheme();

  return <SonnerToaster theme={theme} richColors position="top-right" />;
}
