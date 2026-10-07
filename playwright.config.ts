import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = Boolean(process.env.CI);

// E2E runs against the production build served by `vite preview`, which applies the same
// security headers as Vercel (see config/headers.ts), so CSP problems surface here.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: 'es-CL',
    // Most tests start as a returning user (profile created, tutorial seen). The onboarding
    // tests opt out with an empty storage state.
    storageState: 'e2e/state/onboarded.json',
    trace: 'on-first-retry',
    // No camera glides or sheet animations: faster, deterministic runs on software WebGL, and
    // the reduced-motion path (people who ask for it) is the one exercised.
    reducedMotion: 'reduce',
    // Software WebGL so MapLibre can draw in headless CI browsers.
    launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
  },
  projects: [
    {
      name: 'mobile-chromium',
      testIgnore: /map-3d\.spec\.ts/,
      use: { ...devices['Pixel 7'], locale: 'es-CL' },
    },
    // The 3D view is GPU-heavy on software WebGL: run it alone, after the rest.
    {
      name: 'mobile-chromium-3d',
      testMatch: /map-3d\.spec\.ts/,
      dependencies: ['mobile-chromium'],
      use: { ...devices['Pixel 7'], locale: 'es-CL' },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
