import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { projectPaths } from '../../config/paths.js';

const execFileAsync = promisify(execFile);

export interface RenderVideoOptions {
  outputPath: string;
  title: string;
  subheading: string;
  versionLabel: string;
  durationSeconds?: number;
  scale?: number;
  propsPath: string;
  scenes?: Array<{ scene_number: number; duration_sec: number; on_screen_text: string }>;
}

export class VideoRenderer {
  /**
   * Render genuine motion graphics MP4 video using the Remotion React engine.
   */
  async renderVideo(opts: RenderVideoOptions): Promise<string> {
    const dir = path.dirname(opts.outputPath);
    await fs.mkdir(dir, { recursive: true });

    const remotionDir = projectPaths.remotionRoot;
    const scale = opts.scale || 0.5; // 0.5 for fast preview, 1.0 for final 1080p

    console.log(`[VideoRenderer] Executing Remotion motion graphics renderer for ${opts.outputPath} (scale ${scale})...`);

    try {
      // Execute genuine Remotion CLI render
      const { stdout, stderr } = await execFileAsync(
        'npx',
        [
          'remotion',
          'render',
          'src/index.ts',
          'MainComposition',
          opts.outputPath,
          `--props=${opts.propsPath}`,
          `--scale=${scale}`,
          '--concurrency=3',
          '--overwrite'
        ],
        {
          cwd: remotionDir,
          timeout: Number(process.env.REMOTION_RENDER_TIMEOUT_MS || 600000),
          maxBuffer: 10 * 1024 * 1024
        }
      );

      console.log(`[VideoRenderer] Remotion motion graphics render complete: ${stdout.slice(-150).trim()}`);
    } catch (err: any) {
      console.error('[VideoRenderer] Remotion render error:', err.message);
      throw new Error(`Remotion render failed; no substitute video was produced: ${err.message}`);
    }

    const outputStats = await fs.stat(opts.outputPath);
    if (outputStats.size === 0) throw new Error('Remotion reported success but produced an empty video.');
    const cueManifestPath = `${opts.propsPath}.cues.json`;
    try {
      await fs.access(cueManifestPath);
      const python = path.join(projectPaths.root, '.venv-motion-checks', 'bin', 'python');
      const verifier = path.join(projectPaths.root, 'scripts', 'verify_sync.py');
      const { stdout, stderr } = await execFileAsync(python, [verifier, opts.outputPath, cueManifestPath], {
        cwd: projectPaths.root,
        timeout: 120000,
        maxBuffer: 1024 * 1024,
      });
      console.log(`[VideoRenderer] Audio sync verification passed: ${(stdout || stderr).trim()}`);
    } catch (err: any) {
      throw new Error(`Rendered video failed audio-sync verification: ${err.stderr || err.stdout || err.message}`);
    }
    return opts.outputPath;
  }
}

export const videoRenderer = new VideoRenderer();
