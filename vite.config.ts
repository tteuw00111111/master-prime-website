import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { NOTEBOOK_QUOTE_PATH } from './src/data/notebook-quote'
import { GAMING_QUOTE_PATH } from './src/data/gaming-quote'
import { SMARTPHONE_QUOTE_PATH } from './src/data/smartphone-quote'
import { COMPUTER_QUOTE_PATH } from './src/data/computer-quote'
import { PC_BUILD_QUOTE_PATH } from './src/data/pc-build-quote'
import { IPHONE_PURCHASE_PATH } from './src/data/iphone-purchase'
import serviceSeoPages from './src/data/seo-pages.json'

// Keep the temporary category redirect identical in development and preview.
const quoteRedirect = (): Plugin => {
  const prerenderedPaths = new Set([NOTEBOOK_QUOTE_PATH, GAMING_QUOTE_PATH, SMARTPHONE_QUOTE_PATH, COMPUTER_QUOTE_PATH, PC_BUILD_QUOTE_PATH, IPHONE_PURCHASE_PATH, '/servicos', '/politica-de-privacidade', ...serviceSeoPages.map(page => page.path)])
  const redirect = (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    if (!['/orcamento', '/orcamento/', '/orcamento/index.html'].includes(url.pathname)) return next()
    response.writeHead(302, { Location: `${NOTEBOOK_QUOTE_PATH}${url.search}` })
    response.end()
  }
  return {
    name: 'notebook-quote-redirect',
    configureServer(server) { server.middlewares.use(redirect) },
    configurePreviewServer(server) {
      server.middlewares.use(redirect)
      server.middlewares.use((request, _response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost')
        // Serve the prerendered document at its clean canonical URL in preview.
        if (prerenderedPaths.has(url.pathname)) request.url = `${url.pathname}/index.html${url.search}`
        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    quoteRedirect(),
    react(),
    ...(!isSsrBuild ? [ViteImageOptimizer({
      // These cutouts are already encoded losslessly to preserve product pixels.
      exclude: /iphone-(?:13|14|15|16)(?:-pro)?(?:-max|-plus)?-[a-z-]+(?:-[\w-]+)?\.webp$/,
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      webp: {
        quality: 80,
      },
      avif: {
        quality: 70,
      },
    })] : []),
  ],
  publicDir: isSsrBuild ? false : 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    rollupOptions: isSsrBuild ? undefined : {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'motion-vendor': ['framer-motion'],
          'icons-vendor': ['react-icons'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
  },
}))
