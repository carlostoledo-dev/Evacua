import { expect, test } from '@playwright/test';
import { waitForMap } from './helpers.ts';

// A computer: wide window, mouse, no touch. The app is shown inside a phone frame with the QR
// panel beside it, and everything it opens stays inside the phone screen.
test.use({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false });

test('on a computer the app sits in a phone frame, with a QR code to open it on a phone', async ({
  page,
}) => {
  await page.goto('/');
  await waitForMap(page);

  const phone = await page.locator('#root').boundingBox();
  expect(phone?.width).toBe(393);
  expect(phone?.height).toBe(852);

  const panel = page.getByRole('complementary', { name: 'Evacua en tu teléfono' });
  await expect(panel).toBeVisible();
  const qr = panel.getByRole('img', { name: /Código QR que abre evacua-phi\.vercel\.app/ });
  await expect(qr).toBeVisible();
  expect(await qr.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  const panelBox = await panel.boundingBox();
  expect((panelBox?.x ?? 0) + (panelBox?.width ?? 0)).toBeLessThan(phone?.x ?? 0);

  // The layers sheet is a <dialog> drawn above the page: it must line up with the phone screen.
  await page.getByTestId('layers-button').click();
  const sheet = page.getByTestId('layers-sheet');
  await expect(sheet).toBeVisible();
  await expect
    .poll(async () => {
      const box = await sheet.boundingBox();
      return box && phone
        ? [
            Math.round(box.x - phone.x),
            Math.round(phone.x + phone.width - (box.x + box.width)),
            Math.round(phone.y + phone.height - (box.y + box.height)),
          ]
        : null;
    })
    .toEqual([12, 12, 12]); // the bezel
});

test('on a phone there is no frame and no QR panel', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 412, height: 839 },
    isMobile: true,
    hasTouch: true,
    storageState: 'e2e/state/onboarded.json',
  });
  const page = await context.newPage();
  await page.goto('/');
  await waitForMap(page);
  const root = await page.locator('#root').boundingBox();
  expect(root?.width).toBe(412);
  await expect(page.locator('.showcase')).toBeHidden();
  await context.close();
});
