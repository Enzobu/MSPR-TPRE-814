import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthResponse, AuthenticatedUser } from '@futurekawa/contracts';
import { httpClient } from '@/lib/http-client';
import { login, logout, me, refresh } from '@/features/auth/api/auth.api';

vi.mock('@/lib/http-client', () => ({
  httpClient: { post: vi.fn(), get: vi.fn() },
}));

const mockedClient = vi.mocked(httpClient);

const AUTH_RESPONSE: AuthResponse = {
  accessToken: 'access-token',
  user: { id: 'u1', email: 'admin@futurekawa.test', role: 'ADMIN', country: null },
};

const USER: AuthenticatedUser = {
  id: 'u1',
  email: 'admin@futurekawa.test',
  role: 'ADMIN',
  country: null,
};

describe('auth.api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should post credentials and return the auth response on login', async () => {
    // Arrange
    const body = { email: 'admin@futurekawa.test', password: 'Abcdefgh1234' };
    mockedClient.post.mockResolvedValue({ data: AUTH_RESPONSE });

    // Act
    const result = await login(body);

    // Assert
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/login', body);
    expect(result).toEqual(AUTH_RESPONSE);
  });

  it('should post to the refresh endpoint without a body', async () => {
    // Arrange
    mockedClient.post.mockResolvedValue({ data: AUTH_RESPONSE });

    // Act
    const result = await refresh();

    // Assert
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/refresh');
    expect(result).toEqual(AUTH_RESPONSE);
  });

  it('should resolve to undefined on logout', async () => {
    // Arrange
    mockedClient.post.mockResolvedValue({ data: undefined });

    // Act
    const result = await logout();

    // Assert
    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/logout');
    expect(result).toBeUndefined();
  });

  it('should get the authenticated user from the me endpoint', async () => {
    // Arrange
    mockedClient.get.mockResolvedValue({ data: USER });

    // Act
    const result = await me();

    // Assert
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/auth/me');
    expect(result).toEqual(USER);
  });
});
