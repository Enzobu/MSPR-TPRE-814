import { expect, test } from '@playwright/test';
import {
  setupAuthMock,
  VALID_EMAIL,
  VALID_PASSWORD,
  WRONG_PASSWORD,
} from './support/auth-mock';

async function fillCredentials(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  email: string,
  password: string,
): Promise<void> {
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
}

test.describe('Authentification', () => {
  test('login valide → accès home → reload → toujours connecté', async ({
    page,
  }) => {
    await setupAuthMock(page);

    await page.goto('/');
    // Route privée sans session → redirigé vers /login.
    await expect(page).toHaveURL(/\/login$/);

    await fillCredentials(page, VALID_EMAIL, VALID_PASSWORD);

    // Redirigé vers la route d'origine (home) ; le menu utilisateur (header,
    // présent uniquement si authentifié) confirme l'accès à l'app.
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('button', { name: /menu utilisateur/i }),
    ).toBeVisible();

    // Reload : la session est restaurée via /auth/refresh (cookie simulé).
    await page.reload();
    await expect(
      page.getByRole('button', { name: /menu utilisateur/i }),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('login invalide → message d’erreur affiché', async ({ page }) => {
    await setupAuthMock(page);

    await page.goto('/login');
    await fillCredentials(page, VALID_EMAIL, WRONG_PASSWORD);

    await expect(page.getByRole('alert')).toContainText(
      /email ou mot de passe incorrect/i,
    );
    await expect(page).toHaveURL(/\/login$/);
  });

  test('accès route privée sans session → redirect /login', async ({
    page,
  }) => {
    await setupAuthMock(page);

    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('button', { name: /se connecter/i }),
    ).toBeVisible();
  });

  test('logout → plus d’accès aux routes privées', async ({ page }) => {
    await setupAuthMock(page);

    await page.goto('/login');
    await fillCredentials(page, VALID_EMAIL, VALID_PASSWORD);
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('button', { name: /menu utilisateur/i }).click();
    await page.getByRole('menuitem', { name: /se déconnecter/i }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Nouvelle tentative d'accès direct → toujours redirigé vers /login.
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });
});
