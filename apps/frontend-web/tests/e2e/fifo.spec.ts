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
  // La référence du lot vit dans la 2e colonne (« Référence »), rendue comme un
  // lien accessible (focusable, Enter natif) vers le détail.
  const rows = table.locator('tbody tr');
  const renderedIds = (
    await rows.locator('td:nth-child(2)').allInnerTexts()
  ).map((text) => text.trim());
  expect(renderedIds).toEqual(FIFO_LOT_IDS);

  // Naviguer via le lien de référence du lot le plus ancien (premier en FIFO).
  // On le focalise puis on valide au clavier (Enter) pour couvrir l'a11y.
  const oldestLink = page.getByRole('link', { name: FIFO_LOT_IDS[0] });
  await oldestLink.focus();
  await expect(oldestLink).toBeFocused();
  await oldestLink.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/lots/${FIFO_LOT_IDS[0]}$`));

  // Le détail identifie le lot (titre = référence) et affiche ses mesures :
  // cartes T°/humidité avec leur légende « zone conforme » (bande de tolérance).
  await expect(
    page.getByRole('heading', { name: FIFO_LOT_IDS[0] }),
  ).toBeVisible();
  await expect(page.getByText('Température').first()).toBeVisible();
  await expect(page.getByText('zone conforme').first()).toBeVisible();
});
