import { expect, test } from '@playwright/test';
import { waitForMap } from './helpers.ts';

// Its own Playwright project, run after the others: the tilted 3D view (relief + extruded
// buildings) is heavy for software WebGL and slowed the tests running beside it.
test('3D view: relief, buildings and compass, labeled approximate', async ({ page }) => {
  await page.goto('/');
  await waitForMap(page);
  const toggle = page.getByRole('button', { name: 'Vista 3D' });
  const compass = page.getByRole('button', { name: 'Apuntar al norte' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  // The flat map always points north: no compass until the map can turn.
  await expect(compass).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(compass).toBeVisible();
  await expect(page.getByTestId('map')).toContainText('Relieve: USGS, NOAA');
  await expect(page.getByTestId('map-3d-note')).toContainText('relieve y edificios aproximados');
  // Tiles towards the horizon are outside the offline area: the map must not break.
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('map')).toHaveAttribute('data-state', 'ready');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('map-3d-note')).toHaveCount(0);
  await expect(compass).toBeHidden();
});
