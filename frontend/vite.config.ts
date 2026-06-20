import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function bypassTunnelReminder() {
  return {
    name: 'bypass-tunnel-reminder',
    configureServer(server: any) {
      server.middlewares.use((_req: any, res: any, next: any) => {
        res.setHeader('bypass-tunnel-reminder', 'true');
        next();
      });
    },
  };
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',

    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')

        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  cacheDir: 'C:/Users/eswaraba/benchastra-vite-cache',

  plugins: [
    bypassTunnelReminder(),
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,

    proxy: {
      '/auth':          { target: 'http://localhost:8000', changeOrigin: true },
      '/users':         { target: 'http://localhost:8000', changeOrigin: true },
      '/requirements':  { target: 'http://localhost:8000', changeOrigin: true },
      '/resources':     { target: 'http://localhost:8000', changeOrigin: true },
      '/contracts':     { target: 'http://localhost:8000', changeOrigin: true },
      '/billing':       { target: 'http://localhost:8000', changeOrigin: true },
      '/dashboard':     { target: 'http://localhost:8000', changeOrigin: true },
      '/notifications': { target: 'http://localhost:8000', changeOrigin: true },
      '/messages':      { target: 'http://localhost:8000', changeOrigin: true },
      '/subscriptions': { target: 'http://localhost:8000', changeOrigin: true },
      '/analytics':     { target: 'http://localhost:8000', changeOrigin: true },
      '/health':        { target: 'http://localhost:8000', changeOrigin: true },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,

    proxy: {
      '/auth':          { target: 'http://localhost:8000', changeOrigin: true },
      '/users':         { target: 'http://localhost:8000', changeOrigin: true },
      '/requirements':  { target: 'http://localhost:8000', changeOrigin: true },
      '/resources':     { target: 'http://localhost:8000', changeOrigin: true },
      '/contracts':     { target: 'http://localhost:8000', changeOrigin: true },
      '/billing':       { target: 'http://localhost:8000', changeOrigin: true },
      '/dashboard':     { target: 'http://localhost:8000', changeOrigin: true },
      '/notifications': { target: 'http://localhost:8000', changeOrigin: true },
      '/messages':      { target: 'http://localhost:8000', changeOrigin: true },
      '/subscriptions': { target: 'http://localhost:8000', changeOrigin: true },
      '/analytics':     { target: 'http://localhost:8000', changeOrigin: true },
      '/health':        { target: 'http://localhost:8000', changeOrigin: true },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})