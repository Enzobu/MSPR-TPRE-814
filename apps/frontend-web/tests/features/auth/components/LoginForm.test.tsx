import { AxiosError } from 'axios';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from '@/features/auth/components/LoginForm';
import {
  AuthContext,
  type AuthContextValue,
} from '@/features/auth/context/auth-context';

const VALID_EMAIL = 'admin@futurekawa.test';
const VALID_PASSWORD = 'Abcdefgh1234';

function renderForm(overrides: Partial<AuthContextValue> = {}) {
  const onSuccess = vi.fn();
  const value: AuthContextValue = {
    status: 'unauthenticated',
    user: null,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  render(
    <AuthContext.Provider value={value}>
      <LoginForm onSuccess={onSuccess} />
    </AuthContext.Provider>,
  );
  return { onSuccess, value };
}

describe('LoginForm', () => {
  it('should show validation errors and not call login on empty submit', async () => {
    // Arrange
    const { value } = renderForm();

    // Act
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    // Assert
    expect(await screen.findByText(/email requis/i)).toBeInTheDocument();
    expect(screen.getByText(/au moins 12 caractères/i)).toBeInTheDocument();
    expect(value.login).not.toHaveBeenCalled();
  });

  it('should display a generic message when the server rejects the credentials (401)', async () => {
    // Arrange
    const login = vi
      .fn()
      .mockRejectedValue(
        new AxiosError('Unauthorized', 'ERR', undefined, undefined, {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          config: {} as any,
        }),
      );
    const { onSuccess } = renderForm({ login });

    // Act
    await userEvent.type(screen.getByLabelText(/email/i), VALID_EMAIL);
    await userEvent.type(screen.getByLabelText(/mot de passe/i), VALID_PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /email ou mot de passe incorrect/i,
    );
    expect(login).toHaveBeenCalledWith(VALID_EMAIL, VALID_PASSWORD);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should display a generic message on a non-401 server error', async () => {
    // Arrange
    const login = vi.fn().mockRejectedValue(new Error('network down'));
    const { onSuccess } = renderForm({ login });

    // Act
    await userEvent.type(screen.getByLabelText(/email/i), VALID_EMAIL);
    await userEvent.type(screen.getByLabelText(/mot de passe/i), VALID_PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /connexion impossible/i,
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should call onSuccess after a successful login', async () => {
    // Arrange
    const { onSuccess } = renderForm();

    // Act
    await userEvent.type(screen.getByLabelText(/email/i), VALID_EMAIL);
    await userEvent.type(screen.getByLabelText(/mot de passe/i), VALID_PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    // Assert
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
