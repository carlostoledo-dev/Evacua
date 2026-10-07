// Phone-size screenshots of the main screens, for the README and Devpost.
//
//   npm run build && npm run preview      (in another terminal, port 4173)
//   node scripts/screenshots.ts            → docs/screenshots/*.jpg
//
// Uses the DEMO points (always labeled DEMO on screen) and Playwright's Chromium.
import { mkdir } from 'node:fs/promises';
import { chromium, type Page } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const OUT = 'docs/screenshots';
const VIEWPORT = { width: 393, height: 852 }; // iPhone 15/16

async function open(profile: 'adult' | 'senior' | null, theme: 'light' | 'dark') {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'es-CL',
    colorScheme: theme,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.addInitScript((p) => {
    localStorage.setItem('evacua:locale', 'es-CL');
    if (p)
      localStorage.setItem(
        'evacua:user',
        JSON.stringify({ version: 1, profile: p, tourDone: true }),
      );
  }, profile);
  await page.goto(BASE);
  return { browser, page };
}

async function mapReady(page: Page) {
  await page.getByTestId('map').waitFor();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="map"]')?.getAttribute('data-state') === 'ready',
    undefined,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(2500); // let the remaining tiles draw
}

async function simulate(page: Page, demoId: string) {
  await page.getByTestId('route-panel').getByRole('combobox').selectOption(demoId);
  await page.waitForTimeout(3000);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 82 });
  console.log(`${OUT}/${name}.jpg`);
}

await mkdir(OUT, { recursive: true });

{
  const { browser, page } = await open(null, 'light');
  await page.getByTestId('onboarding-welcome').waitFor();
  await page.waitForTimeout(1000);
  await shot(page, '01-welcome');
  await browser.close();
}

{
  const { browser, page } = await open('adult', 'light');
  await mapReady(page);
  await simulate(page, 'lagunillas');
  await shot(page, '02-route');
  await page.getByRole('button', { name: /Ver cómo llegar y más/ }).click();
  await page.waitForTimeout(800);
  await shot(page, '03-details');
  await page.getByRole('button', { name: /Ocultar detalles/ }).click();
  await page.getByTestId('layers-button').click();
  await page.waitForTimeout(800);
  await shot(page, '04-layers');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Vista 3D' }).click();
  await page.waitForTimeout(5000);
  await shot(page, '05-3d');
  await page.getByRole('button', { name: 'Vista 3D' }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Iniciar evacuación' }).click();
  await page.waitForTimeout(6000);
  await shot(page, '06-navigation');
  await browser.close();
}

{
  const { browser, page } = await open('adult', 'dark');
  await mapReady(page);
  await simulate(page, 'nuevo-horizonte');
  await page.getByRole('button', { name: 'Iniciar evacuación' }).click();
  await page.getByTestId('arrived').waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot(page, '07-arrival');
  await browser.close();
}

{
  const { browser, page } = await open('senior', 'dark');
  await mapReady(page);
  await page.getByText('Otras formas de ubicarte').click();
  await simulate(page, 'yobilo-villa-mora');
  await shot(page, '08-older-adult');
  await page.getByRole('button', { name: 'Menú' }).click();
  await page.waitForTimeout(800);
  await shot(page, '09-menu');
  await browser.close();
}
