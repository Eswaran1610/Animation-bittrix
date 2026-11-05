import {defineConfig} from 'vite';
import rawMotionCanvas from '@motion-canvas/vite-plugin';
import rawFfmpeg from '@motion-canvas/ffmpeg';

const motionCanvas: any = typeof rawMotionCanvas === 'function'
  ? rawMotionCanvas
  : (rawMotionCanvas as any).default?.default || (rawMotionCanvas as any).default || rawMotionCanvas;

const ffmpeg: any = typeof rawFfmpeg === 'function'
  ? rawFfmpeg
  : (rawFfmpeg as any).default?.default || (rawFfmpeg as any).default || rawFfmpeg;

export default defineConfig({
  plugins: [
    motionCanvas(),
    ffmpeg(),
  ],
  server: {
    port: 9000,
    host: true,
  },
});
