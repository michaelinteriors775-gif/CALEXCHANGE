/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { ratesResponse } from './server/exchangeRates';

/**
 * Serves /api/rates during `npm run dev` with the same code the Vercel
 * function uses, so local development needs no extra tooling.
 */
function localApi(): Plugin {
  const handle = async (res: import('node:http').ServerResponse) => {
    const response = await ratesResponse();
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(await response.text());
  };
  return {
    name: 'calexchange-local-api',
    configureServer(server) {
      server.middlewares.use('/api/rates', (_req, res) => void handle(res));
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/rates', (_req, res) => void handle(res));
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make EXCHANGERATE_API_KEY from .env.local available to the local API only.
  // It is not prefixed with VITE_, so it is never bundled into browser code.
  const env = loadEnv(mode, process.cwd(), '');
  if (env.EXCHANGERATE_API_KEY) process.env.EXCHANGERATE_API_KEY = env.EXCHANGERATE_API_KEY;

  return {
    plugins: [react(), localApi()],
    test: { environment: 'node', include: ['tests/**/*.test.ts'] },
  };
});
