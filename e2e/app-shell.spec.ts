import { expect, test, type Page } from '@playwright/test';

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

async function waitForOfflineReady(page: Page) {
  await expect(page.getByTestId('offline-status')).toHaveText('Lista para usar sin conexión', {
    timeout: 15_000,
  });
}

test('shows the app and the permanent disclaimer naming the authorities', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿Hacia dónde evacuar?');
  const disclaimer = page.getByRole('complementary', { name: 'Importante' });
  await expect(disclaimer).toBeVisible();
  await expect(disclaimer).toContainText('SENAPRED');
  await expect(disclaimer).toContainText('SHOA');
});

test('serves a strict CSP and only talks to its own origin, without errors', async ({
  page,
  baseURL,
}) => {
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
  await page.goto('/');
  await waitForOfflineReady(page);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿Hacia dónde evacuar?');
  await expect(page.getByTestId('network-status')).toHaveText(
    'Sin conexión: usando datos guardados',
  );
  await expect(page.getByRole('complementary', { name: 'Importante' })).toBeVisible();
});

test('switches to English and remembers the choice', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Where should I evacuate?');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Where should I evacuate?');
});

test.describe('with an English browser', () => {
  test.use({ locale: 'en-US' });

  test('starts in English automatically', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Where should I evacuate?');
    await expect(page.getByRole('complementary', { name: 'Important' })).toContainText(
      'does not replace the authorities',
    );
  });
});

test('still works when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Where should I evacuate?');
});
