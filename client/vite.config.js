import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pulse.svg'],
      manifest: {
        name: 'Pulse — Behavioral Tracker',
        short_name: 'Pulse',
        description: 'Track what you do, what interrupts you, and how you respond. Improve focus and discipline with real data.',
        theme_color: '#0B0B0C',
        background_color: '#0B0B0C',
        display: 'standalone',
        icons: [
          {
            src: 'pulse.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
