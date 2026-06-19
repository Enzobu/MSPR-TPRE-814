import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from '@/features/auth/context/auth-context';

function renderGuard(status: AuthStatus) {
  const value: AuthContextValue = {
    status,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
  };
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<div>secret content</div>} />
          </Route>
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('should redirect to /login when unauthenticated', () => {
    // Arrange / Act
    renderGuard('unauthenticated');

    // Assert
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
  });

  it('should render the protected content when authenticated', () => {
    // Arrange / Act
    renderGuard('authenticated');

    // Assert
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });

  it('should show a loader while the session is being restored', () => {
    // Arrange / Act
    renderGuard('loading');

    // Assert
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});
