/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { globalHeaders } from './config/headers.ts';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    VitePWA({
      // Never reload the page on its own: an update mid-evacuation would be dangerous.
      // The UI offers "Actualizar" instead.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'logo.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'Evacua',
        short_name: 'Evacua',
        description:
          'Mapa de evacuación por tsunami, sin conexión, para la zona piloto de Coronel, Chile (Lagunillas, Yobilo y Coronel Centro). Herramienta de apoyo: sigue siempre a las autoridades.',
        lang: 'es-CL',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a1a3f', // splash screen when launched from the home screen
        theme_color: '#0a1a3f',
        categories: ['navigation', 'utilities'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Everything the app needs offline: shell, data, basemap tiles and label glyphs.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,webmanifest,json,geojson,mvt,pbf}'],
        globIgnores: ['**/node_modules/**', 'fonts/OFL.txt'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // Control the first page right away so it works offline without a second visit.
        clientsClaim: true,
      },
    }),
  ],
  worker: {
    // MapLibre starts its worker with { type: 'module' }.
    format: 'es',
  },
  preview: {
    headers: globalHeaders(),
  },
  build: {
    target: 'es2022',
    // The only large chunk is MapLibre, lazy-loaded with the map; the app shell stays small.
    chunkSizeWarningLimit: 1100,
    sourcemap: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/__fixtures__/**', 'src/main.tsx'],
      // The safety logic (routing, geo, navigation) must stay well tested: CI fails below this.
      thresholds: {
        'src/domain/**': { statements: 95, branches: 80, functions: 95, lines: 95 },
      },
    },
  },
});
