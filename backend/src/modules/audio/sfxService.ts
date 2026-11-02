import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
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
}

/** Procedural sound library synthesizer and role manager for motion graphics. */
export class SfxService {
  private cachedManifest: SfxManifest | null = null;
  private currentSeed = '';

  /**
   * Ensure procedural SFX library is generated and loaded into memory.
   */
  async ensureLibrary(seed = 'starter-library'): Promise<SfxManifest> {
    if (this.cachedManifest && this.currentSeed === seed) {
      return this.cachedManifest;
    }

    const sfxDir = path.join(projectPaths.remotionPublic, 'sfx');
    const manifestPath = path.join(sfxDir, 'sfx.manifest.json');
    await fs.mkdir(sfxDir, { recursive: true });

    let needGenerate = false;
    try {
      await fs.access(manifestPath);
      const content = await fs.readFile(manifestPath, 'utf-8');
      const parsed: SfxManifest = JSON.parse(content);
      if (parsed.seed !== seed && seed !== 'starter-library') {
        needGenerate = true;
      } else {
        this.cachedManifest = parsed;
        this.currentSeed = parsed.seed;
      }
    } catch {
      needGenerate = true;
    }

    if (needGenerate) {
      const python = path.join(projectPaths.root, '.venv-motion-checks', 'bin', 'python');
      const script = path.join(projectPaths.root, 'scripts', 'make_sfx.py');
      try {
        await execFileAsync(python, [script, '--out', sfxDir, '--seed', seed, '--variants', '4'], {
          cwd: projectPaths.root,
          timeout: 30000,
        });
        const content = await fs.readFile(manifestPath, 'utf-8');
        this.cachedManifest = JSON.parse(content);
        this.currentSeed = seed;
      } catch (err: any) {
        console.warn('[SfxService] make_sfx generation failed, falling back to existing manifest:', err.message);
        try {
          const content = await fs.readFile(manifestPath, 'utf-8');
          this.cachedManifest = JSON.parse(content);
          this.currentSeed = this.cachedManifest?.seed || 'fallback';
        } catch {
          throw new Error(`Failed to load or generate SFX library: ${err.message}`);
        }
      }
    }

    // Sync files to backend media audio/sfx as well
    const backendSfxDir = path.join(projectPaths.backendMedia, 'audio', 'sfx');
    await fs.mkdir(backendSfxDir, { recursive: true });
    try {
      const files = await fs.readdir(sfxDir);
      for (const file of files) {
        if (file.endsWith('.wav') || file.endsWith('.json')) {
          await fs.copyFile(path.join(sfxDir, file), path.join(backendSfxDir, file)).catch(() => {});
        }
      }
    } catch {}

    return this.cachedManifest!;
  }

  /**
   * Determine the most fitting SFX role from the authored scene object and event.
   */
  determineRole(object: any, eventType: 'appear' | 'move' | 'transition'): SfxRole {
    if (eventType === 'transition') {
      return 'whoosh';
    }

    const label = String(object?.label || object?.id || '').toLowerCase();
    const type = String(object?.type || '').toLowerCase();
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
  async getCueForRole(role: SfxRole, seedKey: string, fps = 30): Promise<ResolvedSfxCue> {
    const manifest = await this.ensureLibrary();
    const pool = manifest.items.filter((item) => item.role === role);
    const fallbackPool = pool.length > 0 ? pool : manifest.items.filter((item) => item.role === 'pop');
    const selected = fallbackPool[hashText(seedKey) % fallbackPool.length];

    const transientFrames = Math.round((selected.transientMs * fps) / 1000);
    const durationFrames = Math.ceil((selected.durationMs * fps) / 1000);

    return {
      src: selected.file,
      role: selected.role as SfxRole,
      transientMs: selected.transientMs,
      transientFrames,
      durationFrames,
      volume: selected.gain,
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
