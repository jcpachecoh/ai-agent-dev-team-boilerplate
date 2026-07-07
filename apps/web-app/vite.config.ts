import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL ?? 'http://localhost:4000';
  const graphqlTarget = env.VITE_GRAPHQL_TARGET_URL ?? apiTarget;

  return {
    plugins: [
      react(),
      {
        name: 'log-api-proxy',
        configureServer() {
          console.log(`[web-app] Proxy /api → ${apiTarget} (inicia la API si ves ECONNREFUSED)`);
          console.log(`[web-app] Proxy /graphql → ${graphqlTarget} (GraphQL servido por apps/api)`);
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
          target: graphqlTarget,
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
  };
});
