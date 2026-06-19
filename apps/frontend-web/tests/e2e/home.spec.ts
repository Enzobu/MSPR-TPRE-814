import { expect, test } from '@playwright/test';

test('home affiche le titre et un toast au clic', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /café vert/i }),
  ).toBeVisible();

  await page.getByRole('button', { name: /afficher un toast/i }).click();
  await expect(page.getByText(/backbone opérationnel/i)).toBeVisible();
});

test('route inconnue affiche la page 404', async ({ page }) => {
  await page.goto('/route-inexistante');

  await expect(page.getByText('404')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /page introuvable/i }),
  ).toBeVisible();
});
