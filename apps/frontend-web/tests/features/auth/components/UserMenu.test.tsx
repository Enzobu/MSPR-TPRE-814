import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '@futurekawa/contracts';
import { UserMenu } from '@/features/auth/components/UserMenu';
import {
  AuthContext,
  type AuthContextValue,
} from '@/features/auth/context/auth-context';

const navigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>(
    'react-router',
  );
  return { ...actual, useNavigate: () => navigate };
});

const ADMIN: AuthenticatedUser = {
  id: 'u1',
  email: 'admin@futurekawa.test',
  role: 'ADMIN',
  country: 'BR',
};

function renderMenu(user: AuthenticatedUser | null, logout = vi.fn()) {
  const value: AuthContextValue = {
    status: user ? 'authenticated' : 'unauthenticated',
    user,
    login: vi.fn(),
    logout,
  };
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={value}>
        <MemoryRouter>{children}</MemoryRouter>
      </AuthContext.Provider>
    );
  }
  render(<UserMenu />, { wrapper: Wrapper });
}

describe('UserMenu', () => {
  it('should render nothing when there is no user', () => {
    // Arrange / Act
    renderMenu(null);

    // Assert
    expect(
      screen.queryByRole('button', { name: 'Menu utilisateur' }),
    ).not.toBeInTheDocument();
  });

  it('should display the user identity in the dropdown', async () => {
    // Arrange
    renderMenu(ADMIN);

    // Act
    await userEvent.click(
      screen.getByRole('button', { name: 'Menu utilisateur' }),
    );

    // Assert
    expect(screen.getByText('admin@futurekawa.test')).toBeInTheDocument();
    expect(screen.getByText(/ADMIN/)).toBeInTheDocument();
  });

  it('should logout then navigate to login', async () => {
    // Arrange
    const logout = vi.fn().mockResolvedValue(undefined);
    renderMenu(ADMIN, logout);
    await userEvent.click(
      screen.getByRole('button', { name: 'Menu utilisateur' }),
    );

    // Act
    await userEvent.click(
      screen.getByRole('menuitem', { name: /Se déconnecter/ }),
    );

    // Assert
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
