import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'spa-fallback',
      apply: 'serve',
      enforce: 'post',
      configureServer(server) {
        return () => {
          server.middlewares.use((req, res, next) => {
            // Allow all methods and files to pass through
            if (req.method !== 'GET' || req.url.includes('.') || req.url.startsWith('/api/')) {
              next()
              return
            }

            // For all other requests, serve index.html
            const filePath = path.join(server.config.root, 'index.html')
            if (fs.existsSync(filePath)) {
              req.url = '/index.html'
            }
            next()
          })
        }
      }
    }
  ],
  server: {
    middlewareMode: false,
  },
})
