import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

const CORRELATION_ID_HEADER = 'x-correlation-id';
const HTTP_UNAUTHORIZED = 401;

// Client axios partagé (rules front : interdit d'utiliser fetch / d'appeler axios
// hors de ce client). baseURL = VITE_API_URL (backend-central).
export const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string | undefined,
  // withCredentials sera activé avec la stratégie d'auth par cookie (ADR-0006).
});

// Correlation-id généré et propagé en sortie → traçabilité bout-en-bout (rules 08).
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set(CORRELATION_ID_HEADER, crypto.randomUUID());
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === HTTP_UNAUTHORIZED) {
      // TODO(ADR-0006): déclencher le refresh token une fois la stratégie d'auth tranchée.
    }
    return Promise.reject(error);
  },
);
