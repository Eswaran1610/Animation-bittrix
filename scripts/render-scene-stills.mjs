import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
const { renderFrames, selectComposition } = remotionRequire('@remotion/renderer');

// Some locked-down CI/container hosts deny uv_interface_addresses(). Remotion
// only needs a loopback bind for this local inspectability server, so provide a
// safe fallback while preserving the host's normal network interface lookup.
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

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/render-scene-stills.mjs <render-data.json> [output-dir] [video-path]');
  process.exit(1);
}

const props = JSON.parse(await fs.readFile(path.resolve(inputPath), 'utf8'));
const videoPath = process.argv[4] ? path.resolve(process.argv[4]) : undefined;
// Keep artifacts from overlapping preview versions isolated. A project-scoped
// directory lets a later render/delete race remove files while montage is
// consuming an earlier render's scene stills.
const renderKey = videoPath
  ? path.basename(videoPath, path.extname(videoPath))
  : `script-${Date.now()}-${process.pid}`;
const outputDir = path.resolve(process.argv[3] || path.join(root, 'qa', 'scene-stills', props.video.sourceProjectId, renderKey));
const transitionFrames = 12;
const sceneStartFrames = [];
let offset = 0;
props.scenes.forEach((scene, index) => {
  sceneStartFrames.push(offset);
  offset += scene.durationInFrames - (index < props.scenes.length - 1 ? scene.transitionOutFrames || transitionFrames : 0);
});

await fs.mkdir(outputDir, { recursive: true });

// FAST PATH: If the rendered MP4 already exists, extract scene stills in ~150ms using ffmpeg
// instead of spending 3-5 minutes re-bundling Remotion and rendering in headless Chrome.
const stillFiles = [];
if (videoPath && existsSync(videoPath)) {
  console.log(`[render-scene-stills] Fast-path: Extracting stills from rendered MP4 video: ${videoPath}`);
  for (let index = 0; index < props.scenes.length; index += 1) {
    const scene = props.scenes[index];
    const frame = sceneStartFrames[index] + Math.floor(scene.durationInFrames / 2);
    const timeSec = (frame / 30).toFixed(3);
    const target = path.join(outputDir, `${props.video.sourceProjectId}_S${String(index + 1).padStart(2, '0')}.png`);
    try {
      await execFileAsync('ffmpeg', [
        '-v', 'error', '-y',
        '-ss', timeSec,
        '-i', videoPath,
        '-vframes', '1',
        '-q:v', '2',
        target,
      ], { timeout: 15000 });
      const still = await fs.stat(target);
      if (!still.isFile() || still.size === 0) throw new Error('FFmpeg produced no usable still file.');
      stillFiles.push(target);
      console.log(`Rendered scene ${index + 1}/${props.scenes.length} at frame ${frame} (${timeSec}s): ${target}`);
    } catch (err) {
      console.warn(`[render-scene-stills] FFmpeg still extraction failed for scene ${index + 1}:`, err.message);
    }
  }
  if (stillFiles.length < props.scenes.length) {
    console.warn(`[render-scene-stills] FFmpeg extracted ${stillFiles.length}/${props.scenes.length} stills. Falling back to Remotion renderer for complete stills.`);
    stillFiles.length = 0;
  }
}

if (!stillFiles.length) {
const serveUrl = await bundle({
  entryPoint: path.join(remotionRoot, 'src/index.ts'),
  publicDir: path.join(remotionRoot, 'public'),
  outDir: await fs.mkdtemp(path.join(os.tmpdir(), 'bittrix-bundle-')),
  enableCaching: true,
});

const browserOptions = {
  logLevel: 'error',
  port: Number(process.env.REMOTION_PORT || 3000),
  chromeMode: 'headless-shell',
  chromiumOptions: { headless: true },
  ...(browserExecutable ? { browserExecutable } : {}),
};
const timeoutInMilliseconds = Number(process.env.REMOTION_FRAME_TIMEOUT_MS || 120000);
const composition = await selectComposition({
  serveUrl,
  id: 'MainComposition',
  inputProps: props,
  ...browserOptions,
  timeoutInMilliseconds,
});

for (let index = 0; index < props.scenes.length; index += 1) {
  const scene = props.scenes[index];
  const frame = Math.min(composition.durationInFrames - 1, sceneStartFrames[index] + Math.floor(scene.durationInFrames / 2));
  const temporaryDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bittrix-still-'));
  await renderFrames({
    serveUrl,
    composition,
    inputProps: props,
    frames: [frame],
    outputDir: temporaryDir,
    imageFormat: 'png',
    scale: 0.6,
    concurrency: 1,
    timeoutInMilliseconds,
    ...browserOptions,
  });
  const generated = (await fs.readdir(temporaryDir)).filter((file) => file.endsWith('.png')).sort()[0];
  if (!generated) throw new Error(`Remotion did not produce a still for scene ${index + 1}.`);
  const target = path.join(outputDir, `${props.video.sourceProjectId}_S${String(index + 1).padStart(2, '0')}.png`);
  await fs.copyFile(path.join(temporaryDir, generated), target);
  stillFiles.push(target);
  console.log(`Rendered scene ${index + 1}/${props.scenes.length} at frame ${frame}: ${target}`);
}
}

if (stillFiles.length) {
  // Recheck immediately before montage, and pass only files still present.
  // This avoids making an otherwise valid MP4 fail because a QA still vanished.
  const montageInputs = [];
  for (const stillFile of stillFiles) {
    try {
      const still = await fs.stat(stillFile);
      if (still.isFile() && still.size > 0) montageInputs.push(stillFile);
    } catch {
      console.warn(`[render-scene-stills] Skipping missing scene still: ${stillFile}`);
    }
  }
  if (montageInputs.length > 0) {
    try {
      await execFileAsync('montage', [...montageInputs, '-tile', '4x', '-geometry', '320x568+12+12', path.join(outputDir, 'contact-sheet.png')]);
      console.log(`Contact sheet: ${path.join(outputDir, 'contact-sheet.png')}`);
    } catch (montageErr) {
      console.warn(`[render-scene-stills] Montage contact sheet creation failed: ${montageErr.message}`);
    }
  } else {
    console.warn('[render-scene-stills] No valid scene stills were available to build the contact sheet.');
  }
}

const referencePath = process.env.BITTRIX_REFERENCE_VIDEO;
if (referencePath) {
  const referenceDir = path.join(outputDir, 'reference-fruit');
  await fs.mkdir(referenceDir, { recursive: true });
  await execFileAsync('ffmpeg', [
    '-y', '-i', path.resolve(referencePath), '-vf', 'fps=1/2,scale=324:576', '-frames:v', '6',
    path.join(referenceDir, 'fruit-%02d.png'),
  ]);
  console.log(`Reference fruit frames: ${referenceDir}`);
}
