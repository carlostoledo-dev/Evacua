import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openTab, waitForMap } from './helpers.ts';

// A first-time visitor: no profile stored yet.
test.use({ storageState: { cookies: [], origins: [] } });

async function onboard(page: Page, profile: RegExp) {
  await page.goto('/');
  await expect(page.getByTestId('onboarding-welcome')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Importante' })).toBeVisible();
  await page.getByRole('button', { name: 'Comenzar' }).click();
  await expect(page.getByTestId('onboarding-install')).toBeVisible();
  await page.getByRole('button', { name: /Continuar|Ahora no/ }).click();
  // No name or other personal data is asked for.
  await expect(page.getByRole('textbox')).toHaveCount(0);
  const next = page.getByRole('button', { name: 'Continuar' });
  await expect(next).toBeDisabled(); // a profile must be chosen
  await page.getByRole('radio', { name: profile }).check();
  await next.click();
}

test('first run: welcome, install, profile, ready, then the tutorial over the map', async ({
  page,
}) => {
  await onboard(page, /Adulto mayor/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('¡Todo listo!');
  await page.getByRole('button', { name: 'Ver el mapa' }).click();
  await waitForMap(page);

  const tour = page.getByRole('dialog', { name: 'Elige la amenaza' });
  await expect(tour).toBeVisible();
  const viewport = page.viewportSize();
  for (let step = 1; step <= 5; step++) {
    const card = await page.locator('.tour__card').boundingBox();
    expect(card && viewport && card.y >= 0 && card.y + card.height <= viewport.height + 1).toBe(
      true,
    );
    await page.getByRole('button', { name: step === 5 ? 'Entendido' : 'Siguiente' }).click();
  }
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // A returning user goes straight to the map, without onboarding or tutorial.
  await page.reload();
  await waitForMap(page);
  await expect(page.getByTestId('onboarding-welcome')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Older-adult profile: larger text everywhere.
  await expect(page.locator('html')).toHaveAttribute('data-profile', 'senior');
  const fontSize = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  expect(parseFloat(fontSize)).toBeCloseTo(16 * 1.3, 0);
});

test('child profile: guardian message, no times, and the drill game', async ({ page }) => {
  await onboard(page, /Niño o niña/);
  await page.getByRole('button', { name: 'Ver el mapa' }).click();
  await page.getByRole('button', { name: 'Saltar tutorial' }).click();
  const panel = page.getByTestId('route-panel');
  await expect(panel.getByTestId('guardian')).toHaveText(
    'Busca a tu adulto o profesor y sigue el plan.',
  );
  await panel.getByText('Otras formas de ubicarte').click();
  await panel.getByRole('combobox').selectOption('yobilo-villa-mora');
  await expect(panel.getByTestId('plan')).toContainText('Sal del área de peligro');
  await expect(panel.getByTestId('plan')).not.toContainText('min');
  await panel.getByRole('button', { name: 'Empezar simulacro' }).click();
  await expect(panel.getByRole('timer')).toContainText('Caminando');
  await panel.getByRole('button', { name: '¡Llegamos!' }).click();
  await expect(panel.getByTestId('drill')).toContainText('¡Muy bien!');
});

test('profile can be changed and all local data deleted from Settings', async ({ page }) => {
  await onboard(page, /^Adulto Ruta/);
  await page.getByRole('button', { name: 'Ver el mapa' }).click();
  await page.getByRole('button', { name: 'Saltar tutorial' }).click();
  await openTab(page, 'Ajustes');

  await expect(page.getByRole('textbox')).toHaveCount(0);
  await page.getByRole('radio', { name: /Adulto mayor/ }).check();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-profile', 'senior');

  const stored = await page.evaluate(() => localStorage.getItem('evacua:user'));
  expect(stored).toBe('{"version":1,"profile":"senior","tourDone":true}');

  await page.getByRole('button', { name: 'Borrar mis datos' }).click();
  await page.getByRole('button', { name: /Toca otra vez para borrar/ }).click();
  await expect(page.getByTestId('onboarding-welcome')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test('no serious accessibility violations on the onboarding and main screens', async ({ page }) => {
  const check = async (label: string) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    );
    expect(serious.map((v) => `${label}: ${v.id} (${String(v.nodes.length)})`)).toEqual([]);
  };
  await page.goto('/');
  await check('welcome');
  await onboard(page, /Adulto mayor/);
  await check('ready');
  await page.getByRole('button', { name: 'Ver el mapa' }).click();
  await waitForMap(page);
  await check('tour');
  await page.getByRole('button', { name: 'Saltar tutorial' }).click();
  await check('map');
  for (const tab of ['Qué hacer', 'Datos', 'Ajustes'] as const) {
    await openTab(page, tab);
    await check(tab);
  }
});
