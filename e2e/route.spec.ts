import { expect, test, type Page } from '@playwright/test';
import { openTab, waitForMap } from './helpers.ts';

const YOBILO = { latitude: -37.01, longitude: -73.152 }; // inside the evacuation area

function panel(page: Page) {
  return page.getByTestId('route-panel');
}

/** Pulls the route sheet up to its details (how to get there, listen, change location). */
async function expand(page: Page) {
  const toggle = panel(page).getByRole('button', { name: 'Mostrar u ocultar las opciones' });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
}

async function simulate(page: Page, demoId: string) {
  await panel(page)
    .getByRole('combobox', { name: /Simular ubicación/ })
    .selectOption(demoId);
}

test('a DEMO location shows a labeled route: out of danger first, then a meeting point', async ({
  page,
}) => {
  await page.goto('/');
  await waitForMap(page);
  await simulate(page, 'yobilo-villa-mora');

  await expect(page.getByTestId('map')).toHaveAttribute('data-route', 'shown');
  await expect(page.getByTestId('map-demo')).toHaveText('DEMO');
  // The design's first screen: danger on top, the nearest meeting point and one big button.
  await expect(page.getByTestId('danger-card')).toContainText('Estás en zona de evacuación');
  await expect(panel(page).getByTestId('plan-summary')).toContainText(
    /Punto de encuentro más cercano\s*PE0\d\d\s*[\d,]+ k?m · \d+–\d+ min/,
  );
  await expect(panel(page).getByRole('button', { name: 'Iniciar evacuación' })).toBeVisible();
  await expand(page);
  await expect(panel(page)).toContainText('DEMO');
  await expect(panel(page).getByRole('heading', { name: 'Cómo llegar' })).toBeVisible();
  await expect(panel(page)).toContainText('Simulada: Calle Yobilo');
  const plan = panel(page).getByTestId('plan');
  await expect(plan).toContainText('Estás dentro del área a evacuar por tsunami.');
  await expect(plan).toContainText(
    /Sal del área de peligro \d+ m a pie por la ruta marcada \d+–\d+ min/,
  );
  await expect(plan).toContainText(
    /Punto de encuentro PE0\d\d \d+ m en total, hacia el \S+ \d+–\d+ min/,
  );
  await expect(plan).toContainText('No esperes: evacúa de inmediato.');
});

test('outside the pilot sector there is no route, only a clear message', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);
  await simulate(page, 'outside-pilot');
  await expect(panel(page).getByTestId('plan')).toContainText(
    'fuera de la zona piloto (Lagunillas, Yobilo y Coronel Centro)',
  );
  await expect(panel(page)).not.toContainText('punto de encuentro');
  await expect(page.getByTestId('map')).toHaveAttribute('data-route', 'none');
});

test('outside the evacuation area it says so and points to the nearest meeting point', async ({
  page,
}) => {
  await page.goto('/');
  await waitForMap(page);
  await simulate(page, 'nuevo-horizonte');
  const plan = panel(page).getByTestId('plan');
  await expect(plan).toContainText('Estás fuera del área a evacuar por tsunami.');
  await expect(plan).toContainText(/Punto de encuentro PE0\d\d \d+ m hacia el \S+/);
  await expect(plan).not.toContainText('Sal del área de peligro');
});

test('the new pilot sectors get a route too: Lagunillas and Coronel Centro', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);
  for (const demo of ['lagunillas', 'coronel-centro']) {
    await simulate(page, demo);
    const plan = panel(page).getByTestId('plan');
    await expect(plan).toContainText('Estás dentro del área a evacuar por tsunami.');
    await expect(plan).toContainText(/Punto de encuentro PE0\d\d/);
    await expect(page.getByTestId('map')).toHaveAttribute('data-route', 'shown');
    await expand(page);
    await panel(page).getByRole('button', { name: 'Cambiar ubicación' }).click();
  }
});

test.describe('with GPS permission', () => {
  test.use({ geolocation: YOBILO, permissions: ['geolocation'] });

  test('uses the GPS position, shows its accuracy and plans the route', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await panel(page)
      .getByRole('button', { name: /Buscar mi ruta/ })
      .click();
    await expect(panel(page)).toContainText('Ubicación del GPS (precisión ±');
    await expect(panel(page).getByTestId('plan')).toContainText('Estás dentro del área a evacuar');
    await expect(page.getByTestId('map-demo')).toHaveCount(0);
    await expect(page.getByTestId('map')).toHaveAttribute('data-route', 'shown');
  });
});

test.describe('with an imprecise network location', () => {
  test.use({ geolocation: { ...YOBILO, accuracy: 20_000 }, permissions: ['geolocation'] });

  test('warns that the position may be wrong and offers to pick it on the map', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForMap(page);
    await panel(page)
      .getByRole('button', { name: /Buscar mi ruta/ })
      .click();
    const warning = panel(page).getByTestId('low-accuracy');
    await expect(warning).toContainText('Precisión baja (± 20 km)');
    await warning.getByRole('button', { name: 'Elegir en el mapa' }).click();
    await expect(panel(page)).toContainText('Toca el mapa en el lugar donde estás.');
  });
});

test.describe('without GPS permission', () => {
  test.use({ permissions: [] });

  test('explains the denied permission and offers the manual options', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await panel(page)
      .getByRole('button', { name: /Buscar mi ruta/ })
      .click();
    await expect(panel(page).getByRole('alert')).toContainText('No diste permiso');
    await expect(panel(page).getByRole('button', { name: 'Elegir en el mapa' })).toBeVisible();
  });
});

test('a position can be picked on the map when there is no GPS', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);
  await panel(page).getByRole('button', { name: 'Elegir en el mapa' }).click();
  await expect(panel(page)).toContainText('Toca el mapa en el lugar donde estás.');

  const canvas = page.getByTestId('map').locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('map canvas has no size');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  await expect(panel(page)).toContainText('Ubicación elegida en el mapa');
  await expect(panel(page).getByTestId('plan-summary')).toBeVisible();
  await expect(page.getByTestId('map-demo')).toHaveCount(0);
});

test('the location is never stored on the device', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);
  await simulate(page, 'yobilo-villa-mora');
  await expect(panel(page).getByTestId('plan-summary')).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  expect(stored).not.toMatch(/-73\.15|-37\.01|yobilo/i);
  await openTab(page, 'Ajustes');
  await openTab(page, 'Mapa');
  await page.reload();
  await waitForMap(page);
  await expect(panel(page).getByRole('button', { name: /Buscar mi ruta/ })).toBeVisible();
});

test('the sheet shows a summary first and pulls up for the details', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);
  await simulate(page, 'lagunillas');
  const toggle = panel(page).getByRole('button', { name: 'Mostrar u ocultar las opciones' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(panel(page).getByTestId('plan')).toBeHidden();
  // The red card on top opens the details too.
  await page.getByTestId('danger-card').click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(panel(page).getByTestId('plan')).toContainText('Sal del área de peligro');
  await expect(panel(page).getByTestId('guidance-brief')).toBeVisible();
  await toggle.click();
  await expect(panel(page).getByTestId('plan')).toBeHidden();
});

/** A finger flick on `selector` from `from` to `to` (viewport y), as pointer events. */
async function flick(page: Page, selector: string, from: number, to: number) {
  await page.evaluate(
    ({ selector, from, to }) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`no ${selector}`);
      const at = (y: number, buttons: number) => ({
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons,
        clientX: 200,
        clientY: y,
      });
      element.dispatchEvent(new PointerEvent('pointerdown', at(from, 1)));
      element.dispatchEvent(new PointerEvent('pointermove', at((from + to) / 2, 1)));
      element.dispatchEvent(new PointerEvent('pointerup', at(to, 0)));
    },
    { selector, from, to },
  );
}

test('the sheets follow the finger: swipe up for details, down to fold or close', async ({
  page,
}) => {
  await page.goto('/');
  await waitForMap(page);
  await simulate(page, 'yobilo-villa-mora');
  const toggle = panel(page).getByRole('button', { name: 'Mostrar u ocultar las opciones' });
  await flick(page, '[data-testid="plan-summary"]', 500, 340);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await flick(page, '[data-testid="plan-summary"]', 300, 480);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  // A tap right after a swipe still works.
  await panel(page).getByRole('button', { name: 'Menú' }).click();
  await expect(page.getByTestId('menu-sheet')).toBeVisible();
  await flick(page, '[data-testid="menu-sheet"] .sheet-dialog__head', 300, 460);
  await expect(page.getByTestId('menu-sheet')).toBeHidden();
});

test.describe('older-adult profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'evacua:user',
        JSON.stringify({ version: 1, profile: 'senior', tourDone: true }),
      );
    });
  });

  test('simple mode: no buttons over the map, one big button in the sheet', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await expect(page.getByRole('button', { name: 'Capas' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Vista 3D' })).toHaveCount(0);
    await expect(
      page.getByTestId('map').getByRole('button', { name: 'Usar mi ubicación (GPS)' }),
    ).toHaveCount(0);
    await expect(panel(page).getByRole('button', { name: /Buscar mi ruta/ })).toBeVisible();
  });
});

test('navigation: a DEMO walk gives turn-by-turn directions and arrives', async ({ page }) => {
  test.slow();
  await page.goto('/');
  await waitForMap(page);
  await simulate(page, 'nuevo-horizonte');
  await panel(page).getByRole('button', { name: 'Iniciar evacuación' }).click();
  await expect(page.getByTestId('nav-banner')).toBeVisible();
  const navPanel = panel(page).getByTestId('nav-panel');
  await expect(navPanel).toContainText('Recorrido simulado, 10 veces más rápido');
  await expect(navPanel.getByRole('progressbar', { name: 'Avance de la ruta' })).toBeVisible();
  // Arriving fills the screen (design screen 4), then "Terminar" goes back to the map.
  const arrived = page.getByTestId('arrived');
  await expect(arrived).toContainText('Llegaste al punto de encuentro PE0', { timeout: 30_000 });
  await expect(page.getByTestId('nav-banner')).toHaveCount(0);
  await arrived.getByRole('button', { name: 'Terminar' }).click();
  await expect(panel(page).getByTestId('nav-panel')).toHaveCount(0);
  await expect(arrived).toHaveCount(0);
  // Location is still never stored while navigating.
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('-37.0');
});
