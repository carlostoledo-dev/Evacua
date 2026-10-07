import { expect, test, type Page } from '@playwright/test';
import { openTab, waitForOfflineReady } from './helpers.ts';

/** Records every request URL and every CSP violation or page error while a test runs. */
function watchPage(page: Page) {
  const requests: string[] = [];
  const problems: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  return { requests, problems };
}

test('opens on a full-screen map with a menu and the permanent disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mapa del sector');
  // iOS Maps style: no tab bar; the other screens are behind ≡ in the route sheet.
  const menu = page.getByRole('button', { name: 'Menú' });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('button')).toHaveText(['Qué hacer', 'Datos', 'Ajustes']);
  const disclaimer = page.getByRole('complementary', { name: 'Importante' });
  await expect(disclaimer).toBeVisible();
  await expect(disclaimer).toContainText('SENAPRED');
  await expect(disclaimer).toContainText('SHOA');
});

test('every screen keeps the disclaimer visible and moves focus to its title', async ({ page }) => {
  await page.goto('/');
  for (const [tab, title] of [
    ['Qué hacer', '¿Hacia dónde evacuar?'],
    ['Datos', 'Datos del sector'],
    ['Ajustes', 'Ajustes'],
    ['Mapa', 'Mapa del sector'],
  ] as const) {
    await openTab(page, tab);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.locator(':focus')).toHaveText(title);
    await expect(page.getByRole('complementary', { name: 'Importante' })).toBeVisible();
  }
});

test('serves a strict CSP and only talks to its own origin, without errors', async ({
  page,
  baseURL,
}) => {
  test.slow(); // waits for the offline precache
  const { requests, problems } = watchPage(page);
  const response = await page.goto('/');
  const csp = response?.headers()['content-security-policy'] ?? '';
  expect(csp).toContain("script-src 'self'");
  expect(csp).not.toContain('unsafe-inline');

  await waitForOfflineReady(page);
  const origin = new URL(baseURL ?? '').origin;
  const foreign = requests.filter((url) => new URL(url).origin !== origin);
  expect(foreign).toEqual([]);
  expect(problems).toEqual([]);
});

test('keeps working offline after the first visit', async ({ page, context }) => {
  test.slow(); // waits for the offline precache
  await page.goto('/');
  await waitForOfflineReady(page);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mapa del sector');
  await expect(page.getByTestId('connection-pill')).toHaveText('Sin conexión');
  await openTab(page, 'Ajustes');
  await expect(page.getByTestId('network-status')).toHaveText(
    'Sin conexión: usando datos guardados',
  );
  await expect(page.getByRole('complementary', { name: 'Importante' })).toBeVisible();
});

test('switches to English and remembers the choice', async ({ page }) => {
  await page.goto('/');
  await openTab(page, 'Ajustes');
  await page.getByRole('radio', { name: 'English' }).check();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sector map');
});

test('the dark theme can be forced and is remembered', async ({ page }) => {
  await page.goto('/');
  await openTab(page, 'Ajustes');
  await page.getByRole('radio', { name: /Oscuro/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test.describe('with an English browser', () => {
  test.use({ locale: 'en-US' });

  test('starts in English automatically', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sector map');
    await expect(page.getByRole('complementary', { name: 'Important' })).toContainText(
      'does not replace SENAPRED',
    );
  });
});

test('still works when storage is blocked (profile lives only for the session)', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await page.goto('/');
  // Nothing can be stored, so onboarding runs; the app must still work end to end.
  await page.getByRole('button', { name: 'Comenzar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: /^Adulto Ruta/ }).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Ver el mapa' }).click();
  await page.getByRole('button', { name: 'Saltar tutorial' }).click();
  await openTab(page, 'Ajustes');
  await page.getByRole('radio', { name: 'English' }).check();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
});
