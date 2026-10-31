import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = (env.VITE_BACKEND_URL || `http://127.0.0.1:${env.BACKEND_PORT || '5000'}`).replace(/\/$/, '');

  return {
    plugins: [react()],
    server: {
      host: env.VITE_HOST || '0.0.0.0',
      port: Number(env.VITE_PORT || 5173),
      proxy: {
        '/api': { target: backendUrl, changeOrigin: true },
        '/media': { target: backendUrl, changeOrigin: true },
        '/ws': { target: backendUrl.replace(/^http/, 'ws'), ws: true, changeOrigin: true },
      },
    },
  };
});
