import { expect, test } from '@playwright/test';
import { setupAuthMock } from './support/auth-mock';
import { setupDashboardMock } from './support/dashboard-mock';

// Depuis #20 les routes hors /login sont derrière <ProtectedRoute> : on simule
// une session déjà active (refresh au boot → 200) pour atteindre l'app.
// Le dashboard d'accueil interroge /stocks et /alerts : on les mocke aussi, sinon
// en CI (sans VITE_API_URL) ces appels reçoivent l'index.html de Vite et cassent
// le rendu du dashboard.
test.beforeEach(async ({ page }) => {
  await setupAuthMock(page, { initiallyAuthenticated: true });
  await setupDashboardMock(page);
});

test('home affiche le dashboard consolidé (hero + sélecteur pays)', async ({
  page,
}) => {
  await page.goto('/');

  // Hero du dashboard d'accueil (#102/#37) — contenu statique, sans dépendance
  // réseau. Sans pays sélectionné, le sous-titre décrit le périmètre consolidé.
  await expect(
    page.getByText(/Vue consolidée — tous les pays surveillés/i),
  ).toBeVisible();

  // Sélecteur pays global : « Tous » + une option par pays.
  await expect(page.getByRole('button', { name: 'Tous' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Brésil' })).toBeVisible();
});

test('route inconnue affiche la page 404', async ({ page }) => {
  await page.goto('/route-inexistante');

  await expect(page.getByText('404')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /page introuvable/i }),
  ).toBeVisible();
});
