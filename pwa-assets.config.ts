// Generates the PWA icon set from public/logo.svg (run `npm run icons`, then commit the PNGs).
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const BRAND_BACKGROUND = '#0a1a3f';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: BRAND_BACKGROUND } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: BRAND_BACKGROUND } },
  },
  images: ['public/logo.svg'],
});
