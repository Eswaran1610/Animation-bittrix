import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = (env.VITE_BACKEND_URL || `http://127.0.0.1:${env.BACKEND_PORT || '5000'}`).replace(/\/$/, '');

  return {
    plugins: [react()],
    resolve: {
      // The Remotion composition lives in the sibling remotion package. Keep
      // it on the exact same runtime and React instance as @remotion/player.
      // Two copies cause Player context/hooks to fail at runtime.
      alias: {
        remotion: path.resolve(frontendDirectory, 'node_modules/remotion'),
        react: path.resolve(frontendDirectory, 'node_modules/react'),
        'react-dom': path.resolve(frontendDirectory, 'node_modules/react-dom'),
      },
      dedupe: ['remotion', 'react', 'react-dom'],
    },
    server: {
      host: env.VITE_HOST || '0.0.0.0',
      port: Number(env.VITE_PORT || 5173),
      proxy: {
        '/api': { target: backendUrl, changeOrigin: true },
        '/media': { target: backendUrl, changeOrigin: true },
        '/sfx': { target: backendUrl, changeOrigin: true },
        '/ws': { target: backendUrl.replace(/^http/, 'ws'), ws: true, changeOrigin: true },
      },
    },
  };
});
