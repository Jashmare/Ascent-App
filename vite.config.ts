import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registration happens in src/app/pwa.ts so it can report "ready to work offline".
      injectRegister: false,
      // The glob below already precaches every icon, so don't list them a second time.
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'Ascent',
        short_name: 'Ascent',
        description:
          'Plan today, aim for the summit, keep your dreams in view. The sky is the limit.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#E9EEEA',
        theme_color: '#2A2560',
        categories: ['productivity', 'lifestyle'],
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
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // Opens the right screen when a reminder notification is tapped.
        importScripts: ['notification-click.js'],
      },
    }),
  ],
  server: {
    port: 5180,
    strictPort: true,
    // Wait for a file write to finish before reloading, so a save is never read half-written.
    watch: { awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 30 } },
  },
  preview: { port: 5181, strictPort: true },
  build: {
    rolldownOptions: {
      output: {
        // Libraries change far less often than the app, so they get their own long-lived
        // chunks: an update to Ascent doesn't re-download React.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 2,
            },
            { name: 'libs', test: /node_modules[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // Load the real tokens so the contrast test checks the shipped colours.
    css: { include: [/tokens\.css/] },
  },
});
