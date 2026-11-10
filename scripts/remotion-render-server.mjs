#!/usr/bin/env node
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';

const execFileAsync = promisify(execFile);
const root = path.resolve(import.meta.dirname, '..');
const remotionDir = path.join(root, 'remotion');
const remotionHost = path.join(remotionDir, 'scripts', 'remotion-host.mjs');
const tmpDir = path.join(root, 'tmp', 'render-server');
const PORT = Number(process.env.REMOTION_SERVER_PORT || process.env.PORT || 5050);

await fs.mkdir(tmpDir, { recursive: true });

console.log('====================================================');
console.log('REMOTION CLOUD RENDER SERVER');
console.log('====================================================');
console.log(`Starting render worker on port ${PORT}...`);
console.log(`Remotion root: ${remotionDir}`);
console.log(`Available CPU cores: ${os.cpus()?.length || 1}`);

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  // Health check
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'remotion-cloud-render-worker',
      cpus: os.cpus()?.length || 1,
      freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
      time: new Date().toISOString()
    }));
    return;
  }

  // Render endpoint
  if (req.method === 'POST' && url.pathname === '/render') {
    const renderId = `render_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tempPropsPath = path.join(tmpDir, `${renderId}_props.json`);
    const tempOutputPath = path.join(tmpDir, `${renderId}_output.mp4`);
    let payload = null;

    try {
      console.log(`\n[RenderWorker] [${renderId}] Received render request from ${req.socket.remoteAddress}`);

      // Read JSON payload
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf-8');
      payload = JSON.parse(rawBody);

      const scale = payload.scale || 1.0;
      const concurrency = payload.concurrency || String(Math.min(4, Math.max(1, (os.cpus()?.length || 2) - 1)));

      // Unpack bundled audio files if provided
      if (payload.audioFiles && typeof payload.audioFiles === 'object') {
        for (const [relPath, base64Content] of Object.entries(payload.audioFiles)) {
          const dest = path.join(remotionDir, 'public', relPath);
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.writeFile(dest, Buffer.from(base64Content, 'base64'));
        }
      }

      await fs.writeFile(tempPropsPath, JSON.stringify(payload.inputProps || payload.props || {}));

      console.log(`[RenderWorker] [${renderId}] Rendering Remotion composition (scale: ${scale}, concurrency: ${concurrency})...`);
      const t0 = Date.now();

      await execFileAsync(
        process.execPath,
        [
          remotionHost,
          'render',
          'src/index.ts',
          'MainComposition',
          tempOutputPath,
          `--props=${tempPropsPath}`,
          `--scale=${scale}`,
          `--concurrency=${concurrency}`,
          `--timeout=180000`,
          '--gl=angle',
          '--overwrite',
        ],
        {
          cwd: remotionDir,
          timeout: 600000,
          maxBuffer: 16 * 1024 * 1024,
        }
      );

      const renderDurationSec = ((Date.now() - t0) / 1000).toFixed(1);
      const stat = await fs.stat(tempOutputPath);
      console.log(`[RenderWorker] [${renderId}] Render complete in ${renderDurationSec}s! Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);

      // Stream the rendered MP4 video back
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
        'X-Render-Time-Sec': renderDurationSec,
      });

      const videoBuffer = await fs.readFile(tempOutputPath);
      res.end(videoBuffer);
    } catch (err) {
      console.error(`[RenderWorker] [${renderId}] Render error:`, err.message || err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Remotion render failed' }));
    } finally {
      // Clean up temp files and audio files
      await fs.unlink(tempPropsPath).catch(() => undefined);
      await fs.unlink(tempOutputPath).catch(() => undefined);
      if (payload?.audioFiles && typeof payload.audioFiles === 'object') {
        for (const relPath of Object.keys(payload.audioFiles)) {
          await fs.unlink(path.join(remotionDir, 'public', relPath)).catch(() => undefined);
        }
      }
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Remotion render worker is ready and listening on http://0.0.0.0:${PORT}`);
  console.log('Endpoints:');
  console.log(`  - Health: GET  http://localhost:${PORT}/health`);
  console.log(`  - Render: POST http://localhost:${PORT}/render`);
  console.log('====================================================\n');
});
