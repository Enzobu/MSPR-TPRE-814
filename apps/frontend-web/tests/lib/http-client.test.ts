import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/lib/http-client';
import {
  getAccessToken,
  registerForcedLogoutHandler,
  setAccessToken,
} from '@/lib/auth-token';

const PROTECTED_URL = '/api/v1/lots';
const REFRESH_URL = '/api/v1/auth/refresh';

function makeResponse(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): Promise<AxiosResponse> {
  const response: AxiosResponse = {
    data,
    status,
    statusText: '',
    headers: {},
    config,
  };
  if (status >= 200 && status < 300) {
    return Promise.resolve(response);
  }
  // Mime le comportement de `settle` : un statut d'erreur rejette avec un AxiosError.
  return Promise.reject(
    new AxiosError('request failed', 'ERR', config, {}, response),
  );
}

describe('httpClient auth interceptor', () => {
  let originalAdapter: AxiosAdapter | undefined;

  beforeEach(() => {
    originalAdapter = httpClient.defaults.adapter as AxiosAdapter | undefined;
    setAccessToken('expired-access');
  });

  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
    setAccessToken(null);
    registerForcedLogoutHandler(null);
    vi.clearAllMocks();
  });

  it('should refresh once then replay the original request on 401', async () => {
    // Arrange
    let protectedCalls = 0;
    let refreshCalls = 0;
    httpClient.defaults.adapter = (config) => {
      const url = config.url ?? '';
      if (url.endsWith(REFRESH_URL)) {
        refreshCalls += 1;
        return makeResponse(config, 200, {
          accessToken: 'fresh-access',
          user: { id: 'u1', email: 'a@b.c', role: 'ADMIN', country: null },
        });
      }
      protectedCalls += 1;
      return protectedCalls === 1
        ? makeResponse(config, 401, { detail: 'expired' })
        : makeResponse(config, 200, { ok: true });
    };

    // Act
    const result = await httpClient.get(PROTECTED_URL);

    // Assert
    expect(result.data).toEqual({ ok: true });
    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBe(2);
    expect(getAccessToken()).toBe('fresh-access');
  });

  it('should force a logout when the refresh itself fails', async () => {
    // Arrange
    const onForcedLogout = vi.fn();
    registerForcedLogoutHandler(onForcedLogout);
    httpClient.defaults.adapter = (config) => {
      const url = config.url ?? '';
      return url.endsWith(REFRESH_URL)
        ? makeResponse(config, 401, { detail: 'no cookie' })
        : makeResponse(config, 401, { detail: 'expired' });
    };

    // Act / Assert
    await expect(httpClient.get(PROTECTED_URL)).rejects.toBeInstanceOf(
      AxiosError,
    );
    expect(onForcedLogout).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('should not attempt a refresh when the refresh endpoint returns 401', async () => {
    // Arrange
    const onForcedLogout = vi.fn();
    registerForcedLogoutHandler(onForcedLogout);
    let refreshCalls = 0;
    httpClient.defaults.adapter = (config) => {
      refreshCalls += 1;
      return makeResponse(config, 401, { detail: 'no cookie' });
    };

    // Act / Assert
    await expect(httpClient.post(REFRESH_URL)).rejects.toBeInstanceOf(
      AxiosError,
    );
    expect(refreshCalls).toBe(1);
    expect(onForcedLogout).not.toHaveBeenCalled();
  });
});
