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

let kokoroModelPromise: Promise<KokoroTTS> | undefined;

export class TTSService {
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
  async generateNarration(projectId: string, text: string, maxDurationSec?: number): Promise<{ audioPath: string; staticUrl: string; durationSec: number }> {
    const mediaDir = path.join(projectPaths.backendMedia, 'audio');
    const remotionPublicDir = path.join(projectPaths.remotionPublic, 'audio');
    await fs.mkdir(mediaDir, { recursive: true });
    await fs.mkdir(remotionPublicDir, { recursive: true });

    const fileName = `${projectId}_narration.mp3`;
    const backendFile = path.join(mediaDir, fileName);
    const remotionFile = path.join(remotionPublicDir, fileName);
    const wavFile = path.join(mediaDir, `${projectId}_kokoro.wav`);

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

    // Keep the approved narration fully audible inside an explicitly requested
    // video duration. Remotion trims media at the composition boundary, which
    // can otherwise cut the last sentence off mid-word.
    if (maxDurationSec && durationSec > maxDurationSec + 0.05) {
      let tempo = durationSec / maxDurationSec;
      const filters: string[] = [];
      while (tempo > 2) {
        filters.push('atempo=2');
        tempo /= 2;
      }
      filters.push(`atempo=${Math.max(1, tempo).toFixed(4)}`);
      const fittedFile = path.join(mediaDir, `${projectId}_narration_fitted.mp3`);
      await execFileAsync('ffmpeg', [
        '-y', '-i', backendFile,
        '-filter:a', filters.join(','),
        '-codec:a', 'libmp3lame', '-b:a', '128k', fittedFile
      ], { timeout: 60000 });
      await fs.copyFile(fittedFile, backendFile);
      await fs.unlink(fittedFile).catch(() => undefined);
      ({ stdout } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        backendFile
      ]));
      durationSec = parseFloat(stdout.trim()) || maxDurationSec;
      console.log(`[TTSService] Fitted narration from ${durationSec.toFixed(1)}s target to ${maxDurationSec}s with atempo.`);
    }

    await fs.copyFile(backendFile, remotionFile);
    console.log(`[TTSService] Kokoro narration ready: ${remotionFile} (${durationSec.toFixed(1)}s)`);

    return { audioPath: backendFile, staticUrl: `audio/${fileName}`, durationSec };
  }
}

export const ttsService = new TTSService();
