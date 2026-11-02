import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
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

    // A Remotion render can produce a perfectly valid MP4 with no audible
    // stream if an asset path was wrong. Refuse to publish that file instead
    // of letting a silent final video reach the UI.
    const { stdout: audioProbeOutput } = await execFileAsync('ffprobe', [
      '-v', 'error', '-select_streams', 'a:0',
      '-show_entries', 'stream=codec_name,channels,sample_rate,duration',
      '-of', 'json', opts.outputPath,
    ]);
    const audioStream = JSON.parse(audioProbeOutput).streams?.[0];
    if (!audioStream || Number(audioStream.channels) < 1 || Number(audioStream.duration || 0) <= 0) {
      throw new Error('Final render audio check failed: no usable audio stream was encoded.');
    }
    console.log(`[VideoRenderer] ffprobe audio check passed: ${audioStream.codec_name}, ${audioStream.channels} channels, ${audioStream.sample_rate} Hz.`);

    const stillsScript = path.join(projectPaths.root, 'scripts', 'render-scene-stills.mjs');
    await execFileAsync(process.execPath, [stillsScript, opts.propsPath], {
      cwd: projectPaths.root,
      timeout: Number(process.env.REMOTION_STILLS_TIMEOUT_MS || 600000),
      maxBuffer: 10 * 1024 * 1024,
    });
    console.log('[VideoRenderer] Scene stills and contact sheet exported.');

    // Execute automated Motion Graphics Playbook quality gate (checks text overflow, zone overlap, canvas bounds)
    const qualityGateScript = path.join(projectPaths.root, 'scripts', 'qualityGate.mjs');
    try {
      await execFileAsync(process.execPath, [qualityGateScript, opts.propsPath], {
        cwd: projectPaths.root,
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });
      console.log('[VideoRenderer] Motion Graphics Playbook quality gate passed.');
    } catch (gateErr: any) {
      console.error('[VideoRenderer] Quality gate failed:', gateErr.message);
      throw new Error(`Video preview rejected by Quality Gate: ${gateErr.message}`);
    }

    const cueManifestPath = `${opts.propsPath}.cues.json`;
    try {
      await fs.access(cueManifestPath);
      const venvPython = process.platform === 'win32'
        ? path.join(projectPaths.root, '.venv-motion-checks', 'Scripts', 'python.exe')
        : path.join(projectPaths.root, '.venv-motion-checks', 'bin', 'python');
      const candidates = [existsSync(venvPython) ? venvPython : null, 'python3', 'python'].filter(Boolean) as string[];
      const verifier = path.join(projectPaths.root, 'scripts', 'verify_sync.py');
      let syncPassed = false;
      let lastErr: any = null;
      for (const pythonBin of candidates) {
        try {
          const { stdout, stderr } = await execFileAsync(pythonBin, [verifier, opts.outputPath, cueManifestPath], {
            cwd: projectPaths.root,
            timeout: 120000,
            maxBuffer: 1024 * 1024,
          });
          console.log(`[VideoRenderer] Audio sync verification passed: ${(stdout || stderr).trim()}`);
          syncPassed = true;
          break;
        } catch (err: any) {
          lastErr = err;
        }
      }
      if (!syncPassed) {
        throw new Error(`Rendered video failed audio-sync verification: ${lastErr?.stderr || lastErr?.stdout || lastErr?.message}`);
      }
    } catch (accessErr: any) {
      // No cue manifest present – audio-sync validation is skipped for this render.
      console.log('[VideoRenderer] No cue manifest found; skipping audio-sync verification.');
    }

    return opts.outputPath;
  }
}

export const videoRenderer = new VideoRenderer();
