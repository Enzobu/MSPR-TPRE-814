import { render, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/pages/LoginPage';
import { ThemeProvider } from '@/components/theme/theme-provider';
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from '@/features/auth/context/auth-context';

const navigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>(
    'react-router',
  );
  return { ...actual, useNavigate: () => navigate };
});

function renderPage(status: AuthStatus) {
  const value: AuthContextValue = {
    status,
    user: null,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  };
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider>
        <AuthContext.Provider value={value}>
          <MemoryRouter initialEntries={['/login']}>{children}</MemoryRouter>
        </AuthContext.Provider>
      </ThemeProvider>
    );
  }
  render(<LoginPage />, { wrapper: Wrapper });
}

describe('LoginPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login card when unauthenticated', () => {
    // Arrange / Act
    renderPage('unauthenticated');

    // Assert
    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /se connecter/i }),
    ).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should redirect to home when already authenticated', async () => {
    // Arrange / Act
    renderPage('authenticated');

    // Assert
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/', { replace: true }),
    );
  });
});
