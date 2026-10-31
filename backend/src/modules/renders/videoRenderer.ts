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
    const scale = opts.scale || 1.0;

    console.log(`[VideoRenderer] Executing Remotion motion graphics renderer for ${opts.outputPath} (scale ${scale})...`);

    try {
      // Use the project host wrapper so normal computers can select their
      // Chromium executable/port through REMOTION_* environment variables.
      const remotionHost = path.join(remotionDir, 'scripts', 'remotion-host.mjs');
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [
          remotionHost,
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

    const { stdout: probeOutput } = await execFileAsync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', opts.outputPath,
    ]);
    const videoStream = JSON.parse(probeOutput).streams?.[0];
    const [fpsNumerator, fpsDenominator] = String(videoStream?.r_frame_rate || '0/1').split('/').map(Number);
    const measuredFps = fpsDenominator ? fpsNumerator / fpsDenominator : 0;
    if (videoStream?.width !== 1080 || videoStream?.height !== 1920 || Math.abs(measuredFps - 30) > 0.01) {
      throw new Error(`Final render format check failed: expected 1080x1920 at 30fps, got ${videoStream?.width}x${videoStream?.height} at ${measuredFps}fps.`);
    }
    console.log('[VideoRenderer] ffprobe format check passed: 1080x1920 at 30fps.');

    const stillsScript = path.join(projectPaths.root, 'scripts', 'render-scene-stills.mjs');
    await execFileAsync(process.execPath, [stillsScript, opts.propsPath], {
      cwd: projectPaths.root,
      timeout: Number(process.env.REMOTION_STILLS_TIMEOUT_MS || 600000),
      maxBuffer: 10 * 1024 * 1024,
    });
    console.log('[VideoRenderer] Scene stills and contact sheet exported.');

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
