import { expect, test } from '@playwright/test';
import { openTab, waitForMap, waitForOfflineReady } from './helpers.ts';

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
  // The canvas must actually fill the screen (a collapsed container once hid the whole map).
  const box = await map.locator('canvas').boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(250);
  await expect(map.getByText('© OpenStreetMap contributors')).toBeVisible();
  await expect(map).toContainText('SENAPRED');

  const legend = page.getByTestId('map-legend');
  await legend.getByText('Leyenda').click();
  await expect(legend.getByRole('listitem')).toHaveCount(4);
  await expect(legend).toContainText('Puntos de encuentro');
  await expect(legend.getByText('Fuente oficial verificada')).toHaveCount(4);

  expect(foreign).toEqual([]);
  expect(problems).toEqual([]);
});

test('map controls are at least 48 px for touch', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);
  for (const name of ['Acercar', 'Alejar']) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
  }
});

test('switching hazard shows the matching official guidance', async ({ page }) => {
  await page.goto('/');
  await openTab(page, 'Qué hacer');
  const guidance = page.getByTestId('guidance');
  await expect(page.getByRole('radio', { name: 'Tsunami' })).toBeChecked();
  await expect(guidance).toContainText('Área de Evacuación por tsunami');

  await page.getByRole('radio', { name: 'Terremoto' }).check();
  await expect(guidance).toContainText('Lugar de Protección Sísmica');
  await expect(guidance).toContainText('evacúa inmediatamente hacia un punto de encuentro');
  await expect(page.getByRole('radio', { name: /Incendio/ })).toHaveCount(0);

  // The choice is shared with the map screen, where the tsunami layers still apply.
  await openTab(page, 'Mapa');
  await expect(page.getByRole('radio', { name: 'Terremoto' })).toBeChecked();
  await page.getByTestId('map-legend').getByText('Leyenda').click();
  await expect(page.getByTestId('map-legend').getByRole('listitem')).toHaveCount(4);
});

test('the map works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await waitForMap(page);
  await waitForOfflineReady(page);

  const failed: string[] = [];
  page.on('requestfailed', (r) => failed.push(r.url()));
  await context.setOffline(true);
  await page.reload();
  await waitForMap(page);
  await expect(page.getByTestId('map').getByText('© OpenStreetMap contributors')).toBeVisible();
  expect(failed).toEqual([]);
});
