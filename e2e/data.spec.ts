import { expect, test, type Page } from '@playwright/test';
import { openTab, waitForOfflineReady } from './helpers.ts';

const LAYER_IDS = [
  'tsunami-evacuation-area',
  'tsunami-safe-line',
  'tsunami-evacuation-routes',
  'tsunami-meeting-points',
];

function dataPanel(page: Page) {
  return page.getByRole('region', { name: 'Datos del sector' });
}

async function expectOfficialLayers(page: Page) {
  const panel = dataPanel(page);
  await expect(
    panel.getByText('Zona piloto: Lagunillas, Yobilo y Coronel Centro. Coronel, Biobío.'),
  ).toBeVisible();
  for (const id of LAYER_IDS) {
    const item = panel.getByTestId(`layer-${id}`);
    await expect(item).toContainText('Fuente oficial verificada');
    await expect(item).toContainText('SENAPRED');
    await expect(item).toContainText(/Elementos: \d+/);
  }
  await expect(panel).not.toContainText('DEMO');
}

test('lists every tsunami layer as an official SENAPRED source', async ({ page }) => {
  await page.goto('/');
  await openTab(page, 'Datos');
  await expectOfficialLayers(page);
  await expect(dataPanel(page).getByTestId('layer-tsunami-meeting-points')).toContainText(
    'Puntos de encuentro',
  );
});

test('keeps the sector data available offline after the first visit', async ({ page, context }) => {
  test.slow(); // waits for the offline precache
  await page.goto('/');
  await waitForOfflineReady(page);
  await context.setOffline(true);
  await page.reload();
  await openTab(page, 'Datos');
  await expectOfficialLayers(page);
});

test.describe('without the service worker, so requests can be intercepted', () => {
  test.use({ serviceWorkers: 'block' });

  test('refuses invalid data with an explicit message instead of crashing', async ({ page }) => {
    await page.route('**/data/communes/coronel/manifest.json', (route) =>
      route.fulfill({ json: { schemaVersion: 1, id: 'coronel' } }),
    );
    await page.goto('/');
    // The map screen explains the problem and links to the details.
    await expect(page.getByRole('alert')).toContainText('No se pudieron cargar los datos');
    await expect(page.getByTestId('map')).toHaveCount(0);
    await page.getByRole('button', { name: 'Ver detalles' }).click();

    const alert = dataPanel(page).getByRole('alert');
    await expect(alert).toContainText('Los datos no pasaron la validación');
    await expect(dataPanel(page).getByTestId(/^layer-/)).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'Importante' })).toBeVisible();
  });

  test('explains a failed download and recovers on retry', async ({ page }) => {
    let failNext = true;
    await page.route('**/data/communes/coronel/layers/*.geojson', (route) => {
      if (failNext) return route.abort('internetdisconnected');
      return route.continue();
    });
    await page.goto('/');
    await openTab(page, 'Datos');
    await expect(dataPanel(page).getByRole('alert')).toContainText(
      'Sin conexión y sin datos guardados',
    );

    failNext = false;
    await dataPanel(page).getByRole('button', { name: 'Reintentar' }).click();
    await expectOfficialLayers(page);
  });
});
