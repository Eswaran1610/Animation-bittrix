import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import { projectPaths } from '../../config/paths.js';
import { diagnosticError, formatRenderFailure, isRetryableRenderFailure, RenderDiagnosticError } from './renderDiagnostics.js';

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
  async extractMasterAudio(videoPath: string): Promise<string> {
    const audioPath = videoPath.replace(/\.mp4$/i, '.audio.m4a');
    await execFileAsync('ffmpeg', ['-v', 'error', '-y', '-i', videoPath, '-vn', '-c:a', 'aac', '-b:a', '192k', audioPath], { timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
    return audioPath;
  }

  private async normalizeLoudness(outputPath: string): Promise<void> {
    const normalizedPath = `${outputPath}.loudnorm.mp4`;
    try {
      await execFileAsync('ffmpeg', [
        '-v', 'error', '-y', '-i', outputPath,
        '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:linear=true',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-avoid_negative_ts', 'make_zero', normalizedPath,
      ], { timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
      await fs.rename(normalizedPath, outputPath);
      console.log('[VideoRenderer] Loudness normalization passed: target -14 LUFS, true peak -1.5 dBTP.');
    } catch (error: any) {
      await fs.unlink(normalizedPath).catch(() => undefined);
      throw new RenderDiagnosticError(`Loudness normalization failed: ${error?.stderr || error?.message || error}`, { tag: 'audio-sync', stdout: error?.stdout, stderr: error?.stderr });
    }
  }

  /**
   * Render genuine motion graphics MP4 video using the Remotion React engine.
   */
  async renderVideo(opts: RenderVideoOptions): Promise<string> {
    const dir = path.dirname(opts.outputPath);
    await fs.mkdir(dir, { recursive: true });

    const remotionDir = projectPaths.remotionRoot;
    const scale = opts.scale || 1.0;

    console.log(`[VideoRenderer] Executing Remotion motion graphics renderer for ${opts.outputPath} (scale ${scale})...`);

    const remotionHost = path.join(remotionDir, 'scripts', 'remotion-host.mjs');
    let renderError: RenderDiagnosticError | undefined;
    const defaultConcurrency = String(Math.min(4, Math.max(2, (os.cpus()?.length || 4) - 1)));
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const concurrency = attempt === 0 ? (process.env.REMOTION_CONCURRENCY || defaultConcurrency) : '1';
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
            `--concurrency=${concurrency}`,
            `--timeout=${process.env.REMOTION_FRAME_TIMEOUT_MS || 120000}`,
            '--gl=angle',
            '--overwrite'
          ],
          {
            cwd: remotionDir,
            timeout: Number(process.env.REMOTION_RENDER_TIMEOUT_MS || 600000),
            maxBuffer: 16 * 1024 * 1024,
          }
        );
        console.log(`[VideoRenderer] Remotion motion graphics render complete: ${stdout.slice(-150).trim()}`);
        if (stderr?.trim()) console.warn(`[VideoRenderer] Remotion stderr: ${stderr.slice(-4000)}`);
        renderError = undefined;
        break;
      } catch (err: any) {
        renderError = diagnosticError(err, undefined, attempt);
        console.error(`[VideoRenderer] Remotion render attempt ${attempt + 1} failed:\n${formatRenderFailure(renderError)}`);
        if (attempt === 0 && isRetryableRenderFailure(renderError)) {
          console.warn('[VideoRenderer] Retrying once with concurrency=1 after a timeout, memory, or GL failure.');
          continue;
        }
        break;
      }
    }
    if (renderError) throw renderError;

    await this.normalizeLoudness(opts.outputPath);

    const outputStats = await fs.stat(opts.outputPath);
    if (outputStats.size === 0) throw new Error('Remotion reported success but produced an empty video.');

    const { stdout: probeOutput } = await execFileAsync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', opts.outputPath,
    ]);
    const videoStream = JSON.parse(probeOutput).streams?.[0];
    const [fpsNumerator, fpsDenominator] = String(videoStream?.r_frame_rate || '0/1').split('/').map(Number);
    const measuredFps = fpsDenominator ? fpsNumerator / fpsDenominator : 0;
    if (videoStream?.width !== 1080 || videoStream?.height !== 1920 || Math.abs(measuredFps - 30) > 0.01) {
      throw new RenderDiagnosticError(`Remotion render format check failed: expected 1080x1920 at 30fps, got ${videoStream?.width}x${videoStream?.height} at ${measuredFps}fps.`, { tag: 'quality-gate' });
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
      throw new RenderDiagnosticError('Remotion render audio check failed: no usable audio stream was encoded.', { tag: 'audio-sync' });
    }
    console.log(`[VideoRenderer] ffprobe audio check passed: ${audioStream.codec_name}, ${audioStream.channels} channels, ${audioStream.sample_rate} Hz.`);

    const stillsScript = path.join(projectPaths.root, 'scripts', 'render-scene-stills.mjs');
    await execFileAsync(process.execPath, [stillsScript, opts.propsPath, '', opts.outputPath], {
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
      throw new RenderDiagnosticError(`Video preview rejected by Quality Gate: ${gateErr.message}`, { tag: 'quality-gate', stdout: gateErr?.stdout, stderr: gateErr?.stderr });
    }

    const motionEnergyScript = path.join(projectPaths.root, 'scripts', 'motionEnergy.mjs');
    try {
      const { stdout, stderr } = await execFileAsync(process.execPath, [motionEnergyScript, opts.outputPath, opts.propsPath], {
        cwd: projectPaths.root,
        timeout: 120000,
        maxBuffer: 4 * 1024 * 1024,
      });
      console.log(`[VideoRenderer] Motion energy check passed: ${(stdout || stderr).trim()}`);
    } catch (err: any) {
      const detail = err?.stdout || err?.stderr || err?.message || 'motion energy validation failed';
      throw new RenderDiagnosticError(`Rendered video failed motion-energy verification: ${detail}`, { tag: 'quality-gate', stdout: err?.stdout, stderr: err?.stderr });
    }

    const cueManifestPath = `${opts.propsPath}.cues.json`;
    try {
      await fs.access(cueManifestPath);
    } catch (error: any) {
      throw new RenderDiagnosticError(`Audio-sync verification cannot run because the cue manifest is missing: ${error?.message || error}`, { tag: 'audio-sync' });
    }
    try {
      const cueManifest = JSON.parse(await fs.readFile(cueManifestPath, 'utf8'));
      if (!Array.isArray(cueManifest) || cueManifest.some((cue: any) => !Number.isFinite(Number(cue?.hitFrame)))) {
        throw new Error('cue manifest contains captions or malformed entries; every sound cue must include hitFrame');
      }
    } catch (error: any) {
      throw new RenderDiagnosticError(`Audio-sync verification cannot run with an invalid cue manifest: ${error?.message || error}`, { tag: 'audio-sync' });
    }

    const venvPython = process.platform === 'win32'
      ? path.join(projectPaths.root, '.venv-motion-checks', 'Scripts', 'python.exe')
      : path.join(projectPaths.root, '.venv-motion-checks', 'bin', 'python');
    const candidates = [existsSync(venvPython) ? venvPython : null, 'python3', 'python'].filter(Boolean) as string[];
    const verifier = path.join(projectPaths.root, 'scripts', 'verify_sync.py');
    let verifierPython: string | undefined;
    let dependencyError: any = null;
    for (const pythonBin of candidates) {
      try {
        await execFileAsync(pythonBin, ['-c', 'import numpy, scipy'], {
          cwd: projectPaths.root,
          timeout: 15000,
          maxBuffer: 1024 * 1024,
        });
        verifierPython = pythonBin;
        break;
      } catch (err: any) {
        dependencyError = err;
      }
    }
    if (!verifierPython) {
      const detail = dependencyError?.stderr || dependencyError?.message || 'no Python interpreter is available';
      throw new RenderDiagnosticError(`Audio-sync verification requires NumPy and SciPy. Run npm run motion:setup, then render again. ${detail}`, { tag: 'audio-sync' });
    }
    try {
      const { stdout, stderr } = await execFileAsync(verifierPython, [verifier, opts.outputPath, cueManifestPath], {
        cwd: projectPaths.root,
        timeout: 120000,
        maxBuffer: 1024 * 1024,
      });
      console.log(`[VideoRenderer] Audio sync verification passed: ${(stdout || stderr).trim()}`);
    } catch (err: any) {
      const detail = err?.stdout || err?.stderr || err?.message || 'audio-sync validation failed';
      throw new RenderDiagnosticError(`Rendered video failed audio-sync verification: ${detail}`, { tag: 'audio-sync', stdout: err?.stdout, stderr: err?.stderr });
    }

    return opts.outputPath;
  }
}

export const videoRenderer = new VideoRenderer();
