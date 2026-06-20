import { expect, test } from '@playwright/test';
import { setupAuthMock } from './support/auth-mock';
import { FIFO_LOT_IDS, setupFifoMock } from './support/fifo-mock';

// Parcours utilisateur bout-en-bout (#38) : session active → liste des lots triée
// FIFO → détail d'un lot → ses mesures visibles. Réseau mocké (aucun backend).
test.beforeEach(async ({ page }) => {
  await setupAuthMock(page, { initiallyAuthenticated: true });
  await setupFifoMock(page);
});

test('liste FIFO triée par date asc → détail lot → mesures visibles', async ({
  page,
}) => {
  await page.goto('/lots');

  // Le tableau desktop (md:block) est rendu sous le viewport Desktop Chrome.
  const table = page.getByRole('table');
  await expect(table).toBeVisible();

  // Ordre FIFO : les ids de lot apparaissent dans l'ordre storedAt ascendant.
  const renderedIds = (await table.getByRole('link').allInnerTexts()).map(
    (text) => text.trim(),
  );
  expect(renderedIds).toEqual(FIFO_LOT_IDS);

  // Cliquer le lot le plus ancien (premier en FIFO) → page détail.
  await table.getByRole('link', { name: FIFO_LOT_IDS[0] }).click();
  await expect(page).toHaveURL(new RegExp(`/lots/${FIFO_LOT_IDS[0]}$`));

  // Le détail identifie le lot et affiche ses mesures (stats T°/humidité).
  await expect(page.getByText(`Lot ${FIFO_LOT_IDS[0]}`)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Courbes T° et humidité/i }),
  ).toBeVisible();
  await expect(page.getByText('Température').first()).toBeVisible();
  await expect(page.getByText('Hors tolérance').first()).toBeVisible();
});
