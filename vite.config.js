import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/progredi/',
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
    },
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt', // Changé de 'autoUpdate' à 'prompt' pour notifier l'utilisateur
      includeAssets: ['favicon.svg', 'icons.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Progredi',
        short_name: 'Progredi',
        description: 'Suivi du quotidien et objectifs',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], // Cache agressif des ressources
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})
