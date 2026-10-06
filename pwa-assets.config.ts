import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

// Generates the PNG icons in public/ from public/logo.svg. Run with `npm run icons`.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    transparent: { ...preset.transparent, padding: 0 },
    // The star must stay inside the 80% safe circle while the peak's base runs off the edge.
    maskable: { ...preset.maskable, padding: 0.12, resizeOptions: { background: '#2A2560' } },
    apple: { ...preset.apple, padding: 0, resizeOptions: { background: '#2A2560' } },
  },
  images: ['public/logo.svg'],
});
