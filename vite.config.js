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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('xlsx')) return 'vendor-xlsx'
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
            return 'vendor-charts'
          }
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('react-hot-toast')) return 'vendor-toast'
          if (id.includes('axios')) return 'vendor-network'
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
        },
      },
    },
  },
  server: {
    middlewareMode: false,
  },
})
