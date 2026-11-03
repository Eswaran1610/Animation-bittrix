import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import { projectPaths } from '../../config/paths.js';
import { RenderDiagnosticError } from './renderDiagnostics.js';

const execFileAsync = promisify(execFile);
const MAX_MODEL_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 4000 * 4000;

const relativeMediaPath = (value: string): string | null => {
  if (/^(https?:|data:|blob:)/i.test(value)) return null;
  const normalized = value.replace(/^\/media\//, '').replace(/^\//, '').replace(/\\/g, '/');
  if (!normalized || normalized.includes('..')) return null;
  return normalized;
};

const collectMediaPaths = (value: unknown, output = new Set<string>()): Set<string> => {
  if (typeof value === 'string') {
    const normalized = relativeMediaPath(value);
    if (normalized && /\.(?:png|jpe?g|webp|gif|svg|glb|gltf|mp3|wav|m4a|aac|ogg)$/i.test(normalized)) output.add(normalized);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectMediaPaths(item, output));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectMediaPaths(item, output));
  }
  return output;
};

const fail = (message: string, tag: 'asset' | 'props-invalid' | 'audio-sync') => {
  throw new RenderDiagnosticError(message, { tag });
};

const checkAudio = async (filePath: string, relative: string) => {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
    ], { timeout: 15000 });
    const duration = Number(stdout.trim());
    if (!Number.isFinite(duration) || duration <= 0) fail(`Audio preflight failed for ${relative}: ffprobe returned no usable duration.`, 'asset');
  } catch (error: any) {
    if (error instanceof RenderDiagnosticError) throw error;
    fail(`Audio preflight failed for ${relative}: ${error?.stderr || error?.message || error}`, 'asset');
  }
};

const checkImage = async (filePath: string, relative: string) => {
  try {
    const metadata = await sharp(filePath).metadata();
    if (!metadata.width || !metadata.height) fail(`Image preflight failed for ${relative}: dimensions could not be decoded.`, 'asset');
    if (metadata.width * metadata.height > MAX_IMAGE_PIXELS || metadata.width > 2048 || metadata.height > 2048) {
      if (!/\.gif$/i.test(relative)) {
        const resized = await sharp(filePath).rotate().resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true }).toBuffer();
        await fs.writeFile(filePath, resized);
        console.log(`[RenderPreflight] Downscaled ${relative} to a display-safe raster size.`);
      }
    }
  } catch (error: any) {
    if (error instanceof RenderDiagnosticError) throw error;
    fail(`Image preflight failed for ${relative}: ${error?.stderr || error?.message || error}`, 'asset');
  }
};

export const preflightRenderProps = async (propsPath: string): Promise<void> => {
  let props: any;
  try {
    props = JSON.parse(await fs.readFile(propsPath, 'utf8'));
  } catch (error: any) {
    fail(`Props preflight failed: ${propsPath} is not valid JSON (${error?.message || error}).`, 'props-invalid');
  }

  if (!props?.video || props.video.generatedBy !== 'codex' || !Array.isArray(props.scenes) || props.scenes.length === 0) {
    fail('Props preflight failed: expected a Codex-generated video payload with at least one scene.', 'props-invalid');
  }
  if (props.video.width !== 1080 || props.video.height !== 1920 || props.video.fps !== 30) {
    fail(`Props preflight failed: expected 1080x1920 at 30 FPS, received ${props.video.width}x${props.video.height} at ${props.video.fps} FPS.`, 'props-invalid');
  }
  for (const [index, scene] of props.scenes.entries()) {
    if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 1 || !scene.visualBlueprint?.objects?.length) {
      fail(`Props preflight failed: scene ${index + 1} has no valid frame duration or visual blueprint.`, 'props-invalid');
    }
    if (!scene.narrationAudio) fail(`Props preflight failed: scene ${index + 1} has no approved narration audio.`, 'audio-sync');
    if (!Array.isArray(scene.audioCues) || scene.audioCues.length === 0) fail(`Props preflight failed: scene ${index + 1} has no object sound cues.`, 'audio-sync');
    if (index > 0 && scene.template && props.scenes[index - 1].template === scene.template) {
      fail(`Props preflight failed: adjacent scenes ${index} and ${index + 1} reuse the same template; Codex must create content-specific visual variety.`, 'props-invalid');
    }
    for (const object of scene.visualBlueprint.objects) {
      const spec = object?.render_spec;
      if (spec?.type === 'image' && (!spec.asset_url || /^(?:https?:|data:|blob:)/i.test(spec.asset_url))) {
        fail(`Props preflight failed: scene ${index + 1} image object ${object.id || 'unknown'} has no project-local asset_url.`, 'asset');
      }
    }
  }

  if (Array.isArray(props.video?.captions)) {
    for (const [cIdx, cap] of props.video.captions.entries()) {
      if (typeof cap.word !== 'string' || !Number.isInteger(cap.startFrame) || !Number.isInteger(cap.endFrame) || cap.startFrame > cap.endFrame || cap.startFrame < 0) {
        fail(`Props preflight failed: caption ${cIdx + 1} ("${cap.word}") has invalid frame bounds [${cap.startFrame}, ${cap.endFrame}].`, 'audio-sync');
      }
    }
  }

  const mediaPaths = collectMediaPaths(props);
  for (const relative of mediaPaths) {
    const filePath = path.join(projectPaths.remotionPublic, relative);
    let stats;
    try {
      stats = await fs.stat(filePath);
    } catch {
      fail(`Asset preflight failed: required media file is missing: remotion/public/${relative}`, 'asset');
    }
    if (!stats) {
      fail(`Asset preflight failed: required media file is missing: remotion/public/${relative}`, 'asset');
      continue;
    }
    if (stats.size <= 0) fail(`Asset preflight failed: required media file is empty: remotion/public/${relative}`, 'asset');
    if (/\.(?:mp3|wav|m4a|aac|ogg)$/i.test(relative)) await checkAudio(filePath, relative);
    else if (/\.(?:png|jpe?g|webp|gif|svg)$/i.test(relative)) await checkImage(filePath, relative);
    else if (/\.(?:glb|gltf)$/i.test(relative)) {
      if (stats.size > MAX_MODEL_BYTES) fail(`3D asset preflight failed: ${relative} is ${Math.round(stats.size / 1024 / 1024)} MB; maximum is 20 MB.`, 'asset');
      if (relative.endsWith('.glb')) {
        const header = await fs.readFile(filePath, { encoding: 'utf8', flag: 'r' }).catch(() => '');
        if (!header.startsWith('glTF')) fail(`3D asset preflight failed: ${relative} is not a valid GLB file.`, 'asset');
      }
    }
  }
  console.log(`[RenderPreflight] PASS: Props, ${mediaPaths.size} media files, and ${props.video?.captions?.length || 0} captions verified. Remotion render is now authorized as the FINAL step.`);
};
