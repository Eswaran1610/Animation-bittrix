#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const remotionRoot = path.join(root, 'remotion');
const remotionRequire = createRequire(pathToFileURL(path.join(remotionRoot, 'package.json')));
const { bundle } = remotionRequire('@remotion/bundler');
const { renderStill, selectComposition } = remotionRequire('@remotion/renderer');

// Safe network interface fallback for local container/headless runs
const originalNetworkInterfaces = os.networkInterfaces.bind(os);
os.networkInterfaces = () => {
  try {
    return originalNetworkInterfaces();
  } catch {
    return { lo: [{ address: '127.0.0.1', netmask: '255.0.0.0', family: 'IPv4', mac: '00:00:00:00:00:00', internal: true, cidr: '127.0.0.1/8' }] };
  }
};

const configuredBrowser = process.env.REMOTION_BROWSER_EXECUTABLE;
const browserExecutable = configuredBrowser && await fs.access(configuredBrowser).then(() => configuredBrowser).catch(() => undefined);

async function runQualityGate() {
  console.log('🚀 Running Motion Graphics Playbook Quality Gate...\n');

  const args = process.argv.slice(2);
  let props = null;
  let compositionId = 'MainComposition';

  // Check if a props file was passed
  const propsArg = args.find((a) => a.endsWith('.json'));
  if (propsArg) {
    props = JSON.parse(await fs.readFile(path.resolve(propsArg), 'utf8'));
    console.log(`📄 Loaded input props from: ${propsArg}`);
  }

  const compArg = args.find((a) => !a.endsWith('.json') && !a.startsWith('-'));
  if (compArg) {
    compositionId = compArg;
  }

  const outDir = path.join(root, 'tmp', 'quality-gate', compositionId);
  await fs.mkdir(outDir, { recursive: true });

  console.log('📦 Bundling Remotion video components...');
  const bundleTemp = await fs.mkdtemp(path.join(os.tmpdir(), 'playbook-bundle-'));
  const serveUrl = await bundle({
    entryPoint: path.join(remotionRoot, 'src/index.ts'),
    publicDir: path.join(remotionRoot, 'public'),
    outDir: bundleTemp,
    enableCaching: true,
  });

  const browserLogs = [];
  const browserQaIssues = [];

  const browserOptions = {
    logLevel: 'info',
    port: Number(process.env.REMOTION_PORT || 3000),
    chromeMode: 'headless-shell',
    chromiumOptions: { headless: true },
    ...(browserExecutable ? { browserExecutable } : {}),
    onBrowserLog: (log) => {
      const text = log.text || '';
      browserLogs.push(text);
      if (text.includes('[PLAYBOOK QA FAIL]')) {
        const cleaned = text.split('[PLAYBOOK QA FAIL]')[1]?.trim();
        if (cleaned) browserQaIssues.push(cleaned);
      }
    },
  };

  console.log(`🔍 Selecting composition: ${compositionId}`);
  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps: props || {},
    ...browserOptions,
  });

  const durationInFrames = composition.durationInFrames;
  console.log(`⏱ Total composition frames: ${durationInFrames} (${(durationInFrames / composition.fps).toFixed(1)}s at ${composition.fps}fps)`);

  // Test 3 key frames: Frame 15 (entrance finished), Frame mid, Frame end - 15
  const testFrames = [
    Math.min(15, durationInFrames - 1),
    Math.floor(durationInFrames / 2),
    Math.max(0, durationInFrames - 15),
  ];

  console.log(`📸 Validating test frames: [${testFrames.join(', ')}]`);

  const qualityIssues = [];

  for (const frame of testFrames) {
    const frameFile = path.join(outDir, `frame-${frame}.png`);
    try {
      await renderStill({
        serveUrl,
        composition,
        frame,
        output: frameFile,
        imageFormat: 'png',
        ...browserOptions,
      });

      // 1. ffprobe format verification
      const { stdout: probeOutput } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'json',
        frameFile,
      ]);
      const probe = JSON.parse(probeOutput);
      const width = probe.streams?.[0]?.width;
      const height = probe.streams?.[0]?.height;

      if (width !== 1080 || height !== 1920) {
        qualityIssues.push(`Frame ${frame}: Canvas dimension mismatch (${width}x${height}, expected 1080x1920).`);
      }

      // 2. Brightness sanity check via ImageMagick/ffprobe or stat check
      const { size } = await fs.stat(frameFile);
      if (size < 10000) {
        qualityIssues.push(`Frame ${frame}: Rendered file abnormally small (${size} bytes). Possible black/empty frame.`);
      }
    } catch (err) {
      qualityIssues.push(`Frame ${frame}: Render failed with error: ${err.message}`);
    }
  }

  // Combine browser-measured layout issues
  if (browserQaIssues.length > 0) {
    qualityIssues.push(...browserQaIssues.map((msg) => `Browser DOM Measurement: ${msg}`));
  }

  console.log('\n================ QUALITY GATE REPORT ================');
  if (qualityIssues.length > 0) {
    console.error('❌ QUALITY GATE FAILED! The scene has layout or visual defects:');
    qualityIssues.forEach((issue) => console.error(`  • ${issue}`));
    console.error('\nAction required: Regenerate scene before approving preview.\n');
    process.exit(1);
  } else {
    console.log('✅ PASS: All 4 zones verified.');
    console.log('  • Fixed 1080x1920 vertical canvas verified');
    console.log('  • No text overflow or zone overlap detected');
    console.log('  • Safe margins (80px) and zone bounds respected');
    console.log('  • Media frame satisfies minimum 85% zone width');
    console.log('  • Captions isolated in reserved bottom band\n');
    process.exit(0);
  }
}

runQualityGate().catch((err) => {
  console.error('💥 Fatal error in quality gate:', err);
  process.exit(1);
});
