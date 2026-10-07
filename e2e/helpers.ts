import { expect, type Page } from '@playwright/test';

/**
 * The service worker finished precaching (≈ 200 files, 5.6 MB): the app bar says it works
 * offline. Slow with many parallel workers, so callers mark their test as slow.
 */
export async function waitForOfflineReady(page: Page) {
  await expect(page.getByTestId('connection-pill')).toHaveText('Lista sin internet', {
    timeout: 75_000,
  });
}

export async function waitForMap(page: Page) {
  await expect(page.getByTestId('map')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
}

/**
 * Opens a screen as a user would (Spanish labels): "Mapa" with the "‹ Mapa" back button; the
 * others from the map's ≡ menu, going back to the map first if needed.
 */
export async function openTab(page: Page, name: 'Mapa' | 'Qué hacer' | 'Datos' | 'Ajustes') {
  const back = page.getByRole('button', { name: 'Volver al mapa' });
  if (await back.isVisible()) await back.click();
  if (name === 'Mapa') return;
  const menu = page.getByRole('button', { name: 'Menú' });
  if ((await menu.getAttribute('aria-expanded')) !== 'true') await menu.click();
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('button', { name })
    .click();
}
