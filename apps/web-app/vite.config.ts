import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const apiTarget = process.env.VITE_API_URL ?? 'http://localhost:3001';
const gatewayTarget = process.env.VITE_GATEWAY_URL ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'log-api-proxy',
      configureServer() {
        console.log(`[web-app] Proxy /api → ${apiTarget} (inicia la API si ves ECONNREFUSED)`);
      },
    },
  ],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/graphql': {
        target: gatewayTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/tokens" as tokens;\n`,
      },
    },
  },
});
