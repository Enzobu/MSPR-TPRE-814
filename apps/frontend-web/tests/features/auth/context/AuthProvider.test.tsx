import type { AuthResponse } from '@futurekawa/contracts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth/context/AuthProvider';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { getAccessToken } from '@/lib/auth-token';

vi.mock('@/features/auth/api/auth.api');
import * as authApi from '@/features/auth/api/auth.api';

const mockedApi = vi.mocked(authApi);

const AUTH_RESPONSE: AuthResponse = {
  accessToken: 'access-from-login',
  user: {
    id: 'u1',
    email: 'admin@futurekawa.test',
    role: 'ADMIN',
    country: null,
  },
};

function Consumer() {
  const { status, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
      <button onClick={() => login('admin@futurekawa.test', 'Abcdefgh1234')}>
        do-login
      </button>
      <button onClick={() => logout()}>do-logout</button>
    </div>
  );
}

function renderProvider() {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    // Boot : pas de session restaurable par défaut.
    mockedApi.refresh.mockRejectedValue(new Error('no session'));
    mockedApi.login.mockResolvedValue(AUTH_RESPONSE);
    mockedApi.logout.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should start unauthenticated when no session can be restored', async () => {
    // Arrange / Act
    renderProvider();

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );
    expect(getAccessToken()).toBeNull();
  });

  it('should authenticate and keep the access token in memory after login', async () => {
    // Arrange
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'do-login' }));

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    );
    expect(screen.getByTestId('user')).toHaveTextContent('admin@futurekawa.test');
    expect(getAccessToken()).toBe('access-from-login');
  });

  it('should reset the session and the access token on logout', async () => {
    // Arrange
    renderProvider();
    await userEvent.click(screen.getByRole('button', { name: 'do-login' }));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    );

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'do-logout' }));

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(getAccessToken()).toBeNull();
    expect(mockedApi.logout).toHaveBeenCalledTimes(1);
  });

  it('should restore the session at boot when refresh succeeds', async () => {
    // Arrange
    mockedApi.refresh.mockResolvedValue(AUTH_RESPONSE);

    // Act
    renderProvider();

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    );
    expect(screen.getByTestId('user')).toHaveTextContent('admin@futurekawa.test');
    expect(getAccessToken()).toBe('access-from-login');
  });
});
