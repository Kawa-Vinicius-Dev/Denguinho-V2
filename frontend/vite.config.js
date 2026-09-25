import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { serviceWorkerPlugin } from './pwa/vitePlugin.js'

export default defineConfig({
  plugins: [react(), serviceWorkerPlugin()],
  server: {
    port: 5173,
  },
})
