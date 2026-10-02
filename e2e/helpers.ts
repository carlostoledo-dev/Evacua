import { expect, type Page } from '@playwright/test';

/** The service worker finished precaching: the app bar says it works offline. */
export async function waitForOfflineReady(page: Page) {
  await expect(page.getByTestId('connection-pill')).toHaveText('Lista sin internet', {
    timeout: 20_000,
  });
}

export async function waitForMap(page: Page) {
  await expect(page.getByTestId('map')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
}

/** Opens a screen from the bottom tab bar (Spanish labels). */
export async function openTab(page: Page, name: 'Mapa' | 'Qué hacer' | 'Datos' | 'Ajustes') {
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('button', { name })
    .click();
}
