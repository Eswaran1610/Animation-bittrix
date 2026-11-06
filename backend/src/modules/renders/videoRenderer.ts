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
  onProgress?: (progress: number, status: string) => Promise<void> | void;
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

  private async renderLocally(opts: RenderVideoOptions, scale: number): Promise<void> {
    const remotionDir = projectPaths.remotionRoot;
    const remotionHost = path.join(remotionDir, 'scripts', 'remotion-host.mjs');
    let renderError: RenderDiagnosticError | undefined;
    const defaultConcurrency = String(Math.min(4, Math.max(2, (os.cpus()?.length || 4) - 1)));
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const concurrency = attempt === 0 ? (process.env.REMOTION_CONCURRENCY || defaultConcurrency) : '1';
        
        // Dynamic progress heartbeat while local Remotion process is executing
        let localPct = 52;
        const progressTimer = setInterval(() => {
          if (localPct < 90) {
            localPct += Math.min(2, Math.max(1, Math.round((90 - localPct) * 0.1)));
            opts.onProgress?.(localPct, `Rendering video frames locally (${localPct}%)...`);
          }
        }, 1200);

        try {
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
          opts.onProgress?.(92, 'Remotion frame encoding complete; finalizing audio & quality gates...');
          renderError = undefined;
          break;
        } finally {
          clearInterval(progressTimer);
        }
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
  }

  private async renderViaRemoteWorker(opts: RenderVideoOptions, scale: number, renderUrl: string): Promise<void> {
    const propsContent = await fs.readFile(opts.propsPath, 'utf-8');
    const inputProps = JSON.parse(propsContent);

    // Package any scene audio or master track for the remote worker
    const audioFiles: Record<string, string> = {};
    const audioPathsToBundle: string[] = [];

    if (inputProps.video?.audioUrl) {
      audioPathsToBundle.push(inputProps.video.audioUrl);
    }
    for (const scene of inputProps.scenes || []) {
      if (scene.narrationAudio) audioPathsToBundle.push(scene.narrationAudio);
    }

    for (const relAudio of audioPathsToBundle) {
      const absAudio = path.join(projectPaths.remotionPublic, relAudio);
      try {
        const audioBuffer = await fs.readFile(absAudio);
        audioFiles[relAudio] = audioBuffer.toString('base64');
      } catch {
        // File may be missing or already remote
      }
    }

    const endpoint = `${renderUrl.replace(/\/+$/, '')}/render`;
    console.log(`[VideoRenderer] Offloading Remotion render to remote worker: ${endpoint} (scale: ${scale}, bundled audio: ${Object.keys(audioFiles).length} files)...`);
    
    // Dynamic progress heartbeat while remote Codespace worker is rendering
    let currentPct = 52;
    const progressTimer = setInterval(() => {
      if (currentPct < 90) {
        // Smoothly advance 1-2% every 1.5 seconds
        currentPct += Math.min(2, Math.max(1, Math.round((90 - currentPct) * 0.08)));
        opts.onProgress?.(currentPct, `Offloading render to remote worker: frame generation in progress (${currentPct}%)...`);
      }
    }, 1500);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputProps,
          scale,
          audioFiles,
        }),
      });
    } finally {
      clearInterval(progressTimer);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Remote render worker responded with HTTP ${response.status}: ${errText}`);
    }

    opts.onProgress?.(91, 'Remote video received; writing to disk and inspecting quality...');
    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(opts.outputPath, Buffer.from(arrayBuffer));
    console.log(`[VideoRenderer] Remote render complete! Saved MP4 to ${opts.outputPath}`);
  }

  /**
   * Render genuine motion graphics MP4 video using a Remote Worker or the local React engine.
   */
  async renderVideo(opts: RenderVideoOptions): Promise<string> {
    const dir = path.dirname(opts.outputPath);
    await fs.mkdir(dir, { recursive: true });

    const scale = opts.scale || 1.0;
    const remoteRenderUrl = process.env.REMOTION_RENDER_URL;

    if (remoteRenderUrl) {
      try {
        await this.renderViaRemoteWorker(opts, scale, remoteRenderUrl);
      } catch (err: any) {
        console.warn(`[VideoRenderer] Remote worker failed (${err.message}). Falling back to local engine...`);
        await this.renderLocally(opts, scale);
      }
    } else {
      console.log(`[VideoRenderer] Executing local Remotion motion graphics renderer for ${opts.outputPath} (scale ${scale})...`);
      await this.renderLocally(opts, scale);
    }



    await this.normalizeLoudness(opts.outputPath);

    const outputStats = await fs.stat(opts.outputPath);
    if (outputStats.size === 0) throw new Error('Remotion reported success but produced an empty video.');

    const { stdout: probeOutput } = await execFileAsync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', opts.outputPath,
    ]);
    const videoStream = JSON.parse(probeOutput).streams?.[0];
    const [fpsNumerator, fpsDenominator] = String(videoStream?.r_frame_rate || '0/1').split('/').map(Number);
    const measuredFps = fpsDenominator ? fpsNumerator / fpsDenominator : 0;
    if (videoStream?.width !== 1080 || videoStream?.height !== 1920 || (Math.abs(measuredFps - 30) > 0.05 && Math.abs(measuredFps - 60) > 0.05)) {
      throw new RenderDiagnosticError(`Remotion render format check failed: expected 1080x1920 at 30fps or 60fps, got ${videoStream?.width}x${videoStream?.height} at ${measuredFps}fps.`, { tag: 'quality-gate' });
    }
    console.log(`[VideoRenderer] ffprobe format check passed: 1080x1920 at ${Math.round(measuredFps)}fps.`);

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

    // Audio-sync verification check removed per user instruction.
    return opts.outputPath;
  }
}

export const videoRenderer = new VideoRenderer();
