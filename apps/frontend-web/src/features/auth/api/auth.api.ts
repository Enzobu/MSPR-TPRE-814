import type {
  AuthResponse,
  AuthenticatedUser,
  LoginRequest,
} from '@futurekawa/contracts';
import { httpClient } from '@/lib/http-client';

const AUTH_PREFIX = '/api/v1/auth';

// Couche API auth (rules front : appels HTTP via http-client uniquement, jamais
// fetch ni axios direct dans un composant). Types issus de @futurekawa/contracts.

export function login(body: LoginRequest): Promise<AuthResponse> {
  return httpClient
    .post<AuthResponse>(`${AUTH_PREFIX}/login`, body)
    .then((response) => response.data);
}

// Aucun body : le cookie httpOnly `fk_refresh` est envoyé automatiquement.
export function refresh(): Promise<AuthResponse> {
  return httpClient
    .post<AuthResponse>(`${AUTH_PREFIX}/refresh`)
    .then((response) => response.data);
}

export function logout(): Promise<void> {
  return httpClient.post(`${AUTH_PREFIX}/logout`).then(() => undefined);
}

export function me(): Promise<AuthenticatedUser> {
  return httpClient
    .get<AuthenticatedUser>(`${AUTH_PREFIX}/me`)
    .then((response) => response.data);
}
