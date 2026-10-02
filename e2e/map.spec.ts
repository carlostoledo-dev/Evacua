import { expect, test, type Page } from '@playwright/test';

async function waitForMap(page: Page) {
  await expect(page.getByTestId('map')).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
}

test('draws the offline map with credits, legend and badges, without CSP errors', async ({
  page,
  baseURL,
}) => {
  const problems: string[] = [];
  const foreign: string[] = [];
  const origin = new URL(baseURL ?? '').origin;
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('request', (r) => {
    if (new URL(r.url()).origin !== origin) foreign.push(r.url());
  });

  await page.goto('/');
  await waitForMap(page);

  const map = page.getByTestId('map');
  await expect(map.locator('canvas')).toBeVisible();
  // The canvas must actually fill the frame (a collapsed container once hid the whole map).
  const box = await map.locator('canvas').boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(250);
  await expect(map.getByText('© OpenStreetMap contributors')).toBeVisible();
  await expect(map).toContainText('© OpenStreetMap contributors');
  await expect(map).toContainText('SENAPRED');

  const legend = page.getByRole('region', { name: 'Leyenda' });
  await expect(legend.getByRole('listitem')).toHaveCount(4);
  await expect(legend).toContainText('Puntos de encuentro');
  await expect(legend.getByText('Fuente oficial verificada')).toHaveCount(4);

  expect(foreign).toEqual([]);
  expect(problems).toEqual([]);
});

test('switching hazard shows the matching official guidance', async ({ page }) => {
  await page.goto('/');
  const guidance = page.getByTestId('guidance');
  await expect(page.getByRole('radio', { name: 'Tsunami' })).toBeChecked();
  await expect(guidance).toContainText('Área de Evacuación por tsunami');

  await page.getByRole('radio', { name: 'Terremoto' }).check();
  await expect(guidance).toContainText('Lugar de Protección Sísmica');
  await expect(guidance).toContainText('evacúa inmediatamente hacia un punto de encuentro');
  // Near the coast the tsunami layers still apply after a strong quake.
  await expect(page.getByRole('region', { name: 'Leyenda' }).getByRole('listitem')).toHaveCount(4);
  await expect(page.getByRole('radio', { name: /Incendio/ })).toHaveCount(0);
});

test('the map works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await waitForMap(page);
  await expect(page.getByTestId('offline-status')).toHaveText('Lista para usar sin conexión', {
    timeout: 15_000,
  });

  const failed: string[] = [];
  page.on('requestfailed', (r) => failed.push(r.url()));
  await context.setOffline(true);
  await page.reload();
  await waitForMap(page);
  await expect(page.getByTestId('map')).toContainText('© OpenStreetMap contributors');
  expect(failed).toEqual([]);
});
