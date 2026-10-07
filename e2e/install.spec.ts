import { expect, test } from '@playwright/test';
import { waitForOfflineReady } from './helpers.ts';

// Lighthouse 12 has no PWA category any more: ask Chrome itself, as DevTools' Application
// panel does, whether the app can be installed, and check the manifest it relies on.
test('the app is installable: Chrome reports no installability errors', async ({ page }) => {
  test.slow(); // waits for the service worker to control the page
  await page.goto('/');
  await waitForOfflineReady(page);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);

  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
    installabilityErrors: { errorId: string }[];
  };
  expect(installabilityErrors.map((e) => e.errorId)).toEqual([]);

  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = (await (await page.request.get(href ?? '')).json()) as {
    name: string;
    display: string;
    start_url: string;
    icons: { sizes: string; purpose?: string }[];
  };
  expect(manifest).toMatchObject({ name: 'Evacua', display: 'standalone', start_url: '/' });
  const sizes = manifest.icons.map((icon) => icon.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
});
