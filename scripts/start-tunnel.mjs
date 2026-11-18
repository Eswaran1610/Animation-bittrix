#!/usr/bin/env node
import { spawn } from 'node:child_process';
import readline from 'node:readline';

console.log('🌐 [Cloudflare Tunnel] Starting tunnel for Office Laptop API (http://127.0.0.1:5000)...');

const tunnel = spawn('cloudflared', ['tunnel', '--url', 'http://127.0.0.1:5000'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

tunnel.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('\n❌ `cloudflared` is not installed on this office laptop.');
    console.log('\nTo install free Cloudflare Tunnel on Linux:');
    console.log('  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb');
    console.log('  sudo dpkg -i cloudflared.deb');
    console.log('\nOr run directly with binary without root:');
    console.log('  curl -L --output cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64');
    console.log('  chmod +x cloudflared && mv cloudflared ~/.local/bin/\n');
  } else {
    console.error('Tunnel error:', err.message);
  }
});

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');

const rl = readline.createInterface({ input: tunnel.stderr });
rl.on('line', (line) => {
  const match = line.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    const tunnelUrl = match[0];
    const configPath = path.join(rootDir, 'mobile-app', 'src', 'services', 'tunnelConfig.json');
    const backendFlag = path.join(rootDir, 'backend', '.active-tunnel-url');

    try {
      fs.writeFileSync(configPath, JSON.stringify({ tunnelUrl }, null, 2));
      fs.writeFileSync(backendFlag, tunnelUrl);
    } catch {}

    console.log('\n======================================================');
    console.log('🚀 CLOUDFLARE TUNNEL ONLINE (FREE & SECURE HTTPS)');
    console.log('======================================================');
    console.log(`📱 Connect your Mobile App to:`);
    console.log(`   ${tunnelUrl}`);
    console.log(`\nAll 7 team members can enter this URL in the app.`);
    console.log(`Auto-saved to mobile-app/src/services/tunnelConfig.json`);
    console.log('======================================================\n');
  }
});
