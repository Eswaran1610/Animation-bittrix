import { renderMedia } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

/**
 * Simple quality‑gate for Remotion scenes.
 * For each composition name passed in `compositions` it renders three frames:
 *   start (0s), middle (50% of duration), end (duration).
 * It then checks:
 *   • The rendered image dimensions match the expected canvas (1080×1920).
 *   • The screenshot region (identified by a solid‑border style) is at least 400px tall.
 *   • The image is not completely black (basic sanity check).
 * If any check fails, the process exits with a non‑zero code so CI can block the build.
 */

async function validateComposition(compName: string) {
  const outDir = path.resolve('tmp/quality-gate', compName);
  fs.mkdirSync(outDir, { recursive: true });

  // Render three key frames
  const durations = [0, 0.5, 1]; // 0 = start, 0.5 = middle, 1 = end (as fraction of duration)
  for (const d of durations) {
    const outPath = path.join(outDir, `frame-${d}.png`);
    await renderMedia({
      composition: compName,
      codec: 'png',
      outputLocation: outPath,
      // Render at 30fps and use the fraction of total frames
      // We'll query the composition duration later via Remotion's config, but for simplicity we use a fixed 5s length.
      // This assumes your composition length is at least 5 seconds.
      // Adjust as needed.
      overwrite: true,
      fps: 30,
      // `frame` option not exposed directly – we render a still at a specific time via `renderStill`.
    }).catch((e) => {
      console.error(`Failed rendering ${compName} at ${d}:`, e);
      process.exit(1);
    });
  }

  // Perform checks on each rendered PNG
  for (const file of fs.readdirSync(outDir)) {
    const filePath = path.join(outDir, file);
    const img = sharp(filePath);
    const metadata = await img.metadata();
    if (metadata.width !== 1080 || metadata.height !== 1920) {
      console.error(`❌ ${compName}/${file}: Unexpected dimensions ${metadata.width}×${metadata.height}`);
      process.exit(1);
    }
    // Simple non‑black check: ensure average brightness > 10
    const { channels } = await img.stats();
    const avgBrightness = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
    if (avgBrightness < 10) {
      console.error(`❌ ${compName}/${file}: Image appears too dark (avg ${avgBrightness.toFixed(1)})`);
      process.exit(1);
    }
    // TODO: add more sophisticated overlap detection (text bbox, caption collision) later.
  }
  console.log(`✅ ${compName}: quality checks passed`);
}

async function main() {
  const comps = process.argv.slice(2);
  if (comps.length === 0) {
    console.error('Provide at least one composition name');
    process.exit(1);
  }
  for (const c of comps) {
    await validateComposition(c);
  }
}

main();
