import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { AuthResponse } from '@futurekawa/contracts';
import {
  getAccessToken,
  setAccessToken,
  triggerForcedLogout,
} from '@/lib/auth-token';

const CORRELATION_ID_HEADER = 'x-correlation-id';
const AUTHORIZATION_HEADER = 'Authorization';
const HTTP_UNAUTHORIZED = 401;

const AUTH_PREFIX = '/api/v1/auth';
const REFRESH_PATH = `${AUTH_PREFIX}/refresh`;
// Routes d'auth pour lesquelles un 401 ne doit JAMAIS déclencher un refresh
// (sinon boucle infinie sur l'échec du refresh lui-même).
const NO_REFRESH_PATHS = [
  `${AUTH_PREFIX}/login`,
  REFRESH_PATH,
  `${AUTH_PREFIX}/logout`,
];

// Marqueur interne : une requête déjà rejouée après refresh ne sera pas rejouée
// une seconde fois.
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// Client axios partagé (rules front : interdit d'utiliser fetch / d'appeler axios
// hors de ce client). baseURL = VITE_API_URL (backend-central).
// withCredentials : indispensable pour que le cookie httpOnly `fk_refresh` parte
// vers /auth/refresh et /auth/logout (ADR-0006, CORS central `credentials: true`).
export const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Correlation-id + Bearer access token sur chaque requête sortante (rules 08 + ADR-0006).
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set(CORRELATION_ID_HEADER, crypto.randomUUID());
  const token = getAccessToken();
  if (token) {
    config.headers.set(AUTHORIZATION_HEADER, `Bearer ${token}`);
  }
  return config;
});

// Un seul refresh en vol partagé entre toutes les requêtes 401 concurrentes.
let refreshInFlight: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= httpClient
    .post<AuthResponse>(REFRESH_PATH)
    .then((response) => {
      setAccessToken(response.data.accessToken);
      return response.data.accessToken;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function isAuthPath(url: string | undefined): boolean {
  return NO_REFRESH_PATHS.some((path) => url?.endsWith(path));
}

// 401 → refresh transparent une fois → rejoue la requête. Échec du refresh →
// déconnexion forcée (état React vidé + redirection /login via AuthProvider).
httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original: RetriableConfig | undefined = error.config;
    const shouldRefresh =
      error.response?.status === HTTP_UNAUTHORIZED &&
      original !== undefined &&
      !original._retried &&
      !isAuthPath(original.url);

    if (!shouldRefresh) {
      throw error;
    }

    try {
      const token = await refreshAccessToken();
      original._retried = true;
      original.headers.set(AUTHORIZATION_HEADER, `Bearer ${token}`);
      return httpClient(original);
    } catch (refreshError) {
      triggerForcedLogout();
      throw refreshError;
    }
  },
);
