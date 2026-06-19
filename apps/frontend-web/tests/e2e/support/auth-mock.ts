import type { Page } from '@playwright/test';
import type { AuthResponse, AuthenticatedUser } from '@futurekawa/contracts';

// Stratégie e2e front : on mocke les routes /api/v1/auth/* au niveau réseau
// (page.route) plutôt que de monter le backend + une DB seedée. Le parcours UI
// (login → garde → refresh → logout) est ainsi déterministe et sans dépendance
// d'infra ; l'intégration HTTP réelle est couverte par auth.e2e-spec.ts (#19).

export const VALID_EMAIL = 'admin@futurekawa.test';
// Respecte la politique ADR-0006 (≥12, 1 maj/1 min/1 chiffre) pour passer la
// validation zod et atteindre l'API mockée.
export const VALID_PASSWORD = 'E2e-Passw0rd-Demo';
export const WRONG_PASSWORD = 'E2e-Wr0ng-Passw0rd';

const USER: AuthenticatedUser = {
  id: 'u-e2e',
  email: VALID_EMAIL,
  role: 'ADMIN',
  country: null,
};
const ACCESS_TOKEN = 'e2e-access-token';

interface AuthMockOptions {
  // true → simule un cookie de refresh valide (session restaurable au boot).
  initiallyAuthenticated?: boolean;
}

function authResponse(): AuthResponse {
  return { accessToken: ACCESS_TOKEN, user: USER };
}

async function fulfillJson(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any,
  status: number,
  body: unknown,
): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function setupAuthMock(
  page: Page,
  options: AuthMockOptions = {},
): Promise<void> {
  // La "session serveur" est portée par cette closure : login l'active,
  // logout/échec la désactive. Le refresh au boot la consulte.
  const session = { active: options.initiallyAuthenticated ?? false };

  await page.route('**/api/v1/auth/login', async (route) => {
    const body = route.request().postDataJSON() as {
      email: string;
      password: string;
    };
    if (body.email === VALID_EMAIL && body.password === VALID_PASSWORD) {
      session.active = true;
      await fulfillJson(route, 200, authResponse());
      return;
    }
    await fulfillJson(route, 401, { title: 'Unauthorized', status: 401 });
  });

  await page.route('**/api/v1/auth/refresh', async (route) => {
    if (session.active) {
      await fulfillJson(route, 200, authResponse());
      return;
    }
    await fulfillJson(route, 401, { title: 'Unauthorized', status: 401 });
  });

  await page.route('**/api/v1/auth/logout', async (route) => {
    session.active = false;
    await route.fulfill({ status: 204, body: '' });
  });
}
