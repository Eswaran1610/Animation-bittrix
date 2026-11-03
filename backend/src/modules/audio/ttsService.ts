import { KokoroTTS } from 'kokoro-js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { projectPaths } from '../../config/paths.js';

const execFileAsync = promisify(execFile);
const KOKORO_MODEL = process.env.KOKORO_MODEL || 'onnx-community/Kokoro-82M-v1.0-ONNX';
const KOKORO_VOICE = process.env.KOKORO_VOICE || 'af_sarah';
const KOKORO_SPEED = Number(process.env.KOKORO_SPEED || '1');
const KOKORO_MAX_SPEED = Number(process.env.KOKORO_MAX_SPEED || '1.25');

let kokoroModelPromise: Promise<KokoroTTS> | undefined;

export class TTSService {
  getMaxSceneSpeedMultiplier(): number {
    return Math.max(1, KOKORO_MAX_SPEED / KOKORO_SPEED);
  }

  private async getKokoro(): Promise<KokoroTTS> {
    if (!kokoroModelPromise) {
      console.log(`[TTSService] Loading Kokoro model ${KOKORO_MODEL} (${KOKORO_VOICE}, CPU q8)...`);
      kokoroModelPromise = KokoroTTS.from_pretrained(KOKORO_MODEL, {
        dtype: 'q8',
        device: 'cpu',
        progress_callback: (progress: any) => {
          if (progress?.status === 'progress' && Number.isFinite(progress.progress)) {
            console.log(`[TTSService] Kokoro model download ${Math.round(progress.progress)}%`);
          }
        }
      }).catch((error) => {
        kokoroModelPromise = undefined;
        throw error;
      });
    }
    return kokoroModelPromise;
  }

  /** Generate the approved narration with the local Kokoro female voice. */
  async generateNarration(projectId: string, text: string): Promise<{ audioPath: string; staticUrl: string; durationSec: number }> {
    const mediaDir = path.join(projectPaths.backendMedia, 'audio');
    const remotionPublicDir = path.join(projectPaths.remotionPublic, 'audio');
    await fs.mkdir(mediaDir, { recursive: true });
    await fs.mkdir(remotionPublicDir, { recursive: true });

    const fileName = `${projectId}_narration.mp3`;
    const backendFile = path.join(mediaDir, fileName);
    const remotionFile = path.join(remotionPublicDir, fileName);
    const wavFile = path.join(mediaDir, `${projectId}_kokoro.wav`);

    // Check disk cache first
    try {
      const stats = await fs.stat(backendFile);
      if (stats.size > 1000) {
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'error', '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1', backendFile,
        ]);
        const cachedDuration = parseFloat(stdout.trim()) || 0;
        if (cachedDuration > 0.1) {
          try { await fs.access(remotionFile); } catch { await fs.copyFile(backendFile, remotionFile); }
          console.log(`[TTSService] Kokoro narration cached: ${remotionFile} (${cachedDuration.toFixed(1)}s)`);
          return { audioPath: backendFile, staticUrl: `audio/${fileName}`, durationSec: cachedDuration };
        }
      }
    } catch {}

    const kokoro = await this.getKokoro();
    console.log(`[TTSService] Generating Kokoro narration for project ${projectId} with voice ${KOKORO_VOICE}...`);
    const audio = await kokoro.generate(text.replace(/[\r\n]+/g, ' ').trim(), {
      voice: KOKORO_VOICE as any,
      speed: KOKORO_SPEED
    });
    await audio.save(wavFile);
    await execFileAsync('ffmpeg', ['-y', '-i', wavFile, '-codec:a', 'libmp3lame', '-b:a', '128k', backendFile], { timeout: 60000 });
    await fs.unlink(wavFile).catch(() => undefined);

    let { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      backendFile
    ]);
    let durationSec = parseFloat(stdout.trim()) || 0;

    await fs.copyFile(backendFile, remotionFile);
    console.log(`[TTSService] Kokoro narration ready: ${remotionFile} (${durationSec.toFixed(1)}s)`);

    return { audioPath: backendFile, staticUrl: `audio/${fileName}`, durationSec };
  }

  /** Generate and probe one scene clip so visual timing follows real speech. */
  async generateSceneNarration(projectId: string, sceneNumber: number, text: string, renderVersion = 1, speedMultiplier = 1): Promise<{ audioPath: string; staticUrl: string; durationSec: number }> {
    const mediaDir = path.join(projectPaths.backendMedia, 'audio');
    const remotionPublicDir = path.join(projectPaths.remotionPublic, 'audio');
    await fs.mkdir(mediaDir, { recursive: true });
    await fs.mkdir(remotionPublicDir, { recursive: true });

    const fileName = `${projectId}_preview_v${renderVersion}_scene_${String(sceneNumber).padStart(2, '0')}_narration.mp3`;
    const backendFile = path.join(mediaDir, fileName);
    const remotionFile = path.join(remotionPublicDir, fileName);
    const wavFile = path.join(mediaDir, `${projectId}_preview_v${renderVersion}_scene_${String(sceneNumber).padStart(2, '0')}_kokoro.wav`);

    // Check disk cache first to avoid redundant CPU TTS inference
    try {
      const stats = await fs.stat(backendFile);
      if (stats.size > 1000) {
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'error', '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1', backendFile,
        ]);
        const cachedDuration = parseFloat(stdout.trim()) || 0;
        if (cachedDuration > 0.1) {
          try {
            await fs.access(remotionFile);
          } catch {
            await fs.copyFile(backendFile, remotionFile);
          }
          console.log(`[TTSService] Scene ${sceneNumber} narration cached: ${remotionFile} (${cachedDuration.toFixed(2)}s)`);
          return { audioPath: backendFile, staticUrl: `audio/${fileName}`, durationSec: cachedDuration };
        }
      }
    } catch {}

    const kokoro = await this.getKokoro();
    const voiceSpeed = Math.min(KOKORO_MAX_SPEED, KOKORO_SPEED * speedMultiplier);
    const audio = await kokoro.generate(text.replace(/[\r\n]+/g, ' ').trim(), {
      voice: KOKORO_VOICE as any,
      speed: voiceSpeed,
    });
    await audio.save(wavFile);
    await execFileAsync('ffmpeg', ['-y', '-i', wavFile, '-codec:a', 'libmp3lame', '-b:a', '128k', backendFile], { timeout: 60000 });
    await fs.unlink(wavFile).catch(() => undefined);
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', backendFile,
    ]);
    const durationSec = parseFloat(stdout.trim()) || 0;
    await fs.copyFile(backendFile, remotionFile);
    console.log(`[TTSService] Scene ${sceneNumber} narration ready at ${voiceSpeed.toFixed(2)}x: ${remotionFile} (${durationSec.toFixed(2)}s)`);
    return { audioPath: backendFile, staticUrl: `audio/${fileName}`, durationSec };
  }
}

export const ttsService = new TTSService();
