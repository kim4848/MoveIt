import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Frontend dev server proxies /api to the Hono server on :3000.
// In production the Hono server serves the built assets itself.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'Bevægelsesuge',
        short_name: 'Bevægelse',
        description: 'Familie-skema til fritidsbevægelse — fyld cirklerne op.',
        lang: 'da',
        theme_color: '#2f9e44',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache kun app-skallen (precache). API'et skal altid være live i en delt-state-app —
        // ingen runtime-caching af /api, så skrivninger aldrig maskeres af forældet cache.
        navigateFallbackDenylist: [/^\/api/, /^\/print/],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
