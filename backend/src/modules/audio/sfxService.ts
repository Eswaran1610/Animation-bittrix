import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { projectPaths } from '../../config/paths.js';

const execFileAsync = promisify(execFile);

const hashText = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
};

export type SfxRole =
  | 'pop'
  | 'click'
  | 'tick'
  | 'whoosh'
  | 'slide'
  | 'riser'
  | 'impact'
  | 'sparkle'
  | 'chime'
  | 'draw'
  | 'count'
  | 'ding';

export interface SfxManifestItem {
  file: string;
  role: string;
  transientMs: number;
  durationMs: number;
  gain: number;
  peakDb?: number;
}

export interface SfxManifest {
  seed: string;
  pack?: 'digital' | 'organic' | 'cinematic' | 'playful';
  sampleRate: number;
  items: SfxManifestItem[];
}

export interface ResolvedSfxCue {
  src: string;
  role: SfxRole;
  transientMs: number;
  transientFrames: number;
  durationFrames: number;
  volume: number;
  pan: number;
}

export interface SfxScope { projectId: string; previewVersion: number }

/** Procedural sound library synthesizer and role manager for motion graphics. */
export class SfxService {

  private async resolvePanVariant(sourceFile: string, pan: number, seedKey: string): Promise<string> {
    const boundedPan = Math.max(-1, Math.min(1, pan));
    if (Math.abs(boundedPan) < 0.05 || !sourceFile.endsWith('.wav')) return sourceFile;
    const sourcePath = path.join(projectPaths.remotionPublic, ...sourceFile.replace(/^\//, '').split('/'));
    const left = Math.cos(((boundedPan + 1) * Math.PI) / 4).toFixed(4);
    const right = Math.sin(((boundedPan + 1) * Math.PI) / 4).toFixed(4);
    const variantPath = sourcePath.replace(/\.wav$/i, `.pan-${hashText(`${seedKey}:${boundedPan.toFixed(2)}`)}.wav`);
    try {
      await fs.access(variantPath);
    } catch {
      await execFileAsync('ffmpeg', [
        '-v', 'error', '-y', '-i', sourcePath,
        '-af', `pan=stereo|c0=${left}*c0|c1=${right}*c0`,
        '-ac', '2', '-ar', '48000', variantPath,
      ], { timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
    }
    return path.relative(projectPaths.remotionPublic, variantPath).replace(/\\/g, '/');
  }

  /**
   * Ensure procedural SFX library is generated and loaded into memory.
   */
  async ensureLibrary(seed = 'starter-library', scope?: SfxScope, pack: SfxManifest['pack'] = 'digital'): Promise<SfxManifest> {
    const scopePath = scope
      ? path.join('projects', scope.projectId.replace(/[^a-zA-Z0-9_-]/g, '_'), 'previews', `v${scope.previewVersion}`, 'audio', 'sfx')
      : 'sfx';
    const sfxDir = path.join(projectPaths.remotionPublic, ...scopePath.split('/'));
    const manifestPath = path.join(sfxDir, 'sfx.manifest.json');
    const staticPrefix = scopePath.replace(/\\/g, '/');
    await fs.mkdir(sfxDir, { recursive: true });

    let needGenerate = false;
    try {
      await fs.access(manifestPath);
      const content = await fs.readFile(manifestPath, 'utf-8');
      const parsed: SfxManifest = JSON.parse(content);
      if ((parsed.seed !== seed && seed !== 'starter-library') || parsed.pack !== pack) {
        needGenerate = true;
      }
    } catch {
      needGenerate = true;
    }

    if (needGenerate) {
      const venvPython = process.platform === 'win32'
        ? path.join(projectPaths.root, '.venv-motion-checks', 'Scripts', 'python.exe')
        : path.join(projectPaths.root, '.venv-motion-checks', 'bin', 'python');
      const candidates = [existsSync(venvPython) ? venvPython : null, 'python3', 'python'].filter(Boolean) as string[];
      const script = path.join(projectPaths.root, 'scripts', 'make_sfx.py');

      let generated = false;
      let lastError: any = null;
      for (const pythonBin of candidates) {
        try {
          await execFileAsync(pythonBin, [script, '--out', sfxDir, '--seed', seed, '--pack', pack || 'digital', '--variants', '4', '--prefix', staticPrefix], {
            cwd: projectPaths.root,
            timeout: 30000,
          });
          const content = await fs.readFile(manifestPath, 'utf-8');
          const manifest: SfxManifest = JSON.parse(content);
          generated = true;
          return manifest;
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!generated) {
        console.warn('[SfxService] make_sfx generation failed, falling back to existing manifest:', lastError?.message || 'unknown error');
        try {
          const content = await fs.readFile(manifestPath, 'utf-8');
          const fallback: SfxManifest = JSON.parse(content);
          return fallback;
        } catch {
          throw new Error(`Failed to load or generate SFX library: ${lastError?.message || 'unknown error'}`);
        }
      }
    }

    // Sync files for legacy uses; scoped preview assets stay in their immutable
    // Remotion public directory and are addressed through the manifest URL.
    if (!scope) {
      const backendSfxDir = path.join(projectPaths.backendMedia, 'audio', 'sfx');
      await fs.mkdir(backendSfxDir, { recursive: true });
      for (const file of await fs.readdir(sfxDir)) {
        if (file.endsWith('.wav') || file.endsWith('.json')) {
          await fs.copyFile(path.join(sfxDir, file), path.join(backendSfxDir, file)).catch(() => {});
        }
      }
    }

    return JSON.parse(await fs.readFile(manifestPath, 'utf-8')) as SfxManifest;
  }

  /**
   * Determine the most fitting SFX role from the authored scene object and event.
   */
  determineRole(object: any, eventType: 'appear' | 'move' | 'transition'): SfxRole {
    if (eventType === 'transition') {
      return 'whoosh';
    }

    const label = String(object?.label || object?.id || '').toLowerCase();
    const type = String(object?.type || object?.render_spec?.type || '').toLowerCase();
    const motion = String(object?.motion || '').toLowerCase();

    if (eventType === 'move') {
      if (/rotate|spin|orbit|revolve|twist/i.test(motion)) return 'whoosh';
      if (/draw|trace|line|path/i.test(motion) || /drawing|flow|connection/i.test(label)) return 'draw';
      if (/bounce|pulse|pop/i.test(motion)) return 'pop';
      return 'slide';
    }

    // appear events
    if (type === 'metric_bar' || /metric|stat|counter|percent|number|score|progress/i.test(label)) return 'count';
    if (/check|checkmark|done|success|verified|complete|result|win|pass/i.test(label)) return 'ding';
    if (/star|sparkle|highlight|badge|trophy|award|glow|security/i.test(label)) return 'sparkle';
    if (type === 'code_block' || /code|text|bullet|snippet|list|item/i.test(type) || /code|text|title/i.test(label)) return 'tick';
    if (/button|click|switch|toggle|input|tab|nav|ui|link|terminal/i.test(label)) return 'click';
    if (/draw|path|line|diagram/i.test(type) || /diagram|flowchart|arrow|chart|network/i.test(label)) return 'draw';
    if (/impact|heavy|crush|drop|boom|launch/i.test(label)) return 'impact';
    if (/chime|bell|alert|notification/i.test(label)) return 'chime';

    // default entrance for cards, nodes, diagrams, procedural
    return 'pop';
  }

  /**
   * Resolve an audio cue for a given role and seeded key.
   */
  async getCueForRole(role: SfxRole, seedKey: string, fps = 30, librarySeed = 'starter-library', scope?: SfxScope, pack: SfxManifest['pack'] = 'digital', pan = 0): Promise<ResolvedSfxCue> {
    const manifest = await this.ensureLibrary(librarySeed, scope, pack);
    const pool = manifest.items.filter((item) => item.role === role);
    const fallbackPool = pool.length > 0 ? pool : manifest.items.filter((item) => item.role === 'pop');
    const selected = fallbackPool[hashText(seedKey) % fallbackPool.length];

    const transientFrames = Math.round((selected.transientMs * fps) / 1000);
    const durationFrames = Math.ceil((selected.durationMs * fps) / 1000);

    return {
      src: await this.resolvePanVariant(selected.file, pan, seedKey),
      role: selected.role as SfxRole,
      transientMs: selected.transientMs,
      transientFrames,
      durationFrames,
      volume: selected.gain,
      pan: Math.max(-1, Math.min(1, pan)),
    };
  }

  /** Backwards compatibility stub if called directly. */
  async generateObjectCue(
    projectId: string,
    _renderType: 'preview' | 'final',
    _renderVersion: number,
    sceneNumber: number,
    objectIndex: number,
    _objectLabel: string,
    kind: 'appear' | 'move' | 'rotate' = 'appear',
    cueIndex = 0,
  ): Promise<string> {
    const role: SfxRole = kind === 'appear' ? 'pop' : kind === 'rotate' ? 'whoosh' : 'slide';
    const cue = await this.getCueForRole(role, `${projectId}:${sceneNumber}:${objectIndex}:${cueIndex}`);
    return cue.src;
  }
}

export const sfxService = new SfxService();
