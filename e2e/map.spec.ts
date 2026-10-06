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
  await legend.locator('summary').click();
  await expect(legend.getByRole('listitem')).toHaveCount(4);
  await expect(legend).toContainText('Puntos de encuentro');
  await expect(legend.getByText('Fuente oficial verificada')).toHaveCount(4);

  expect(foreign).toEqual([]);
  expect(problems).toEqual([]);
});

test('the map has only its essential buttons, each at least 48 px', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);
  // Zoom is pinch / scroll / keyboard: no +/- buttons on a phone screen.
  await expect(page.getByRole('button', { name: /Acercar|Alejar/ })).toHaveCount(0);
  for (const control of [
    page.getByRole('button', { name: 'Usar mi ubicación (GPS)' }),
    page.getByRole('button', { name: 'Vista 3D' }),
    page.getByTestId('map-legend').locator('summary'),
  ]) {
    const box = await control.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
  }
});

test('tsunami only: no hazard to choose, official tsunami guidance and layers', async ({
  page,
}) => {
  await page.goto('/');
  await waitForMap(page);
  // Owner decision 2026-10-04: a single hazard, so no selector anywhere.
  await expect(page.getByRole('radio', { name: /Tsunami|Terremoto|Incendio/ })).toHaveCount(0);
  await page.getByTestId('map-legend').locator('summary').click();
  await expect(page.getByTestId('map-legend').getByRole('listitem')).toHaveCount(4);

  await openTab(page, 'Qué hacer');
  const guidance = page.getByTestId('guidance');
  await expect(guidance).toContainText('Área de Evacuación por tsunami');
  await expect(guidance).not.toContainText('Lugar de Protección Sísmica');
  await expect(
    page.getByText('Zona piloto: Lagunillas, Yobilo y Coronel Centro (Coronel)'),
  ).toBeVisible();
});

test('the map works offline after the first visit', async ({ page, context }) => {
  test.slow(); // waits for the offline precache
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

test('the official SENAPRED backpack checklist can be ticked and is remembered', async ({
  page,
}) => {
  await page.goto('/');
  await openTab(page, 'Qué hacer');
  const kit = page.getByTestId('kit');
  await expect(kit.getByRole('checkbox')).toHaveCount(11);
  await expect(kit).toContainText('0 de 11 listos');
  await kit.getByRole('checkbox', { name: /Agua: considera dos litros/ }).check();
  await kit.getByRole('checkbox', { name: /Dinero en efectivo/ }).check();
  await expect(kit).toContainText('2 de 11 listos');
  await page.reload();
  await openTab(page, 'Qué hacer');
  await expect(page.getByTestId('kit')).toContainText('2 de 11 listos');
});
