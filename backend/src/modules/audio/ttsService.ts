import { KokoroTTS } from 'kokoro-js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { projectPaths } from '../../config/paths.js';

const execFileAsync = promisify(execFile);
const TTS_PROVIDER = process.env.TTS_PROVIDER || 'edge-tts';
const EDGE_TTS_VOICE = process.env.EDGE_TTS_VOICE || 'en-US-JennyNeural';
const KOKORO_MODEL = process.env.KOKORO_MODEL || 'onnx-community/Kokoro-82M-v1.0-ONNX';
const KOKORO_VOICE = process.env.KOKORO_VOICE || 'af_sarah';
const KOKORO_MAX_SPEED = Number(process.env.KOKORO_MAX_SPEED || '1.15');

export interface WordAlignment {
  word: string;
  startSec: number;
  endSec: number;
  startMs: number;
  endMs: number;
  startFrame: number;
  endFrame: number;
}

export interface NarrationResult {
  audioPath: string;
  staticUrl: string;
  durationSec: number;
  durationInFrames: number;
  words: WordAlignment[];
  alignmentType: 'measured' | 'fallback';
}

let kokoroModelPromise: Promise<KokoroTTS> | undefined;

export class TTSService {
  getMaxSceneSpeedMultiplier(): number {
    return Math.max(1, Math.min(1.15, KOKORO_MAX_SPEED));
  }

  private resolveEdgeTtsBin(): string | null {
    const isWindows = process.platform === 'win32';
    const venvBin = path.join(
      projectPaths.root,
      '.venv-motion-checks',
      isWindows ? 'Scripts' : 'bin',
      isWindows ? 'edge-tts.exe' : 'edge-tts'
    );
    if (existsSync(venvBin)) {
      return venvBin;
    }
    return null;
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

  private async synthesizeEdgeTts(text: string, outputFile: string, speedMultiplier = 1): Promise<void> {
    const bin = this.resolveEdgeTtsBin() || 'edge-tts';
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
    const ratePercent = Math.round((speedMultiplier - 1) * 100);
    const rateArg = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`;

    console.log(`[TTSService] Generating audio with edge-tts (${EDGE_TTS_VOICE}, rate: ${rateArg})...`);
    await execFileAsync(bin, [
      '--voice', EDGE_TTS_VOICE,
      '--rate', rateArg,
      '--text', cleanText,
      '--write-media', outputFile,
      '--no-progress',
    ], { timeout: 45000 });
  }

  private async synthesizeEdgeTtsWithAlignment(
    text: string,
    outputAudio: string,
    outputAlignment: string,
    speedMultiplier = 1
  ): Promise<WordAlignment[]> {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const alignScript = path.join(currentDir, 'edgeTtsAlign.py');
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim();

    console.log(`[TTSService] Synthesizing speech with native word alignment (${EDGE_TTS_VOICE})...`);
    await execFileAsync('python3', [
      alignScript,
      '--text', cleanText,
      '--audio', outputAudio,
      '--alignment', outputAlignment,
      '--voice', EDGE_TTS_VOICE,
      '--speed', String(speedMultiplier),
    ], { timeout: 45000 });

    if (existsSync(outputAlignment)) {
      const data = JSON.parse(await fs.readFile(outputAlignment, 'utf8'));
      const words = Array.isArray(data.words) ? data.words : [];
      return words.map((w: any) => ({
        word: String(w.word || ''),
        startSec: Number(w.startSec || 0),
        endSec: Number(w.endSec || 0),
        startMs: Number(w.startMs || 0),
        endMs: Number(w.endMs || 0),
        startFrame: Math.round(Number(w.startSec || 0) * 30),
        endFrame: Math.max(Math.round(Number(w.startSec || 0) * 30) + 1, Math.round(Number(w.endSec || 0) * 30)),
      }));
    }
    return [];
  }

  private computeFallbackWordAlignment(text: string, durationSec: number, fps = 30): WordAlignment[] {
    const rawWords = text.replace(/[\r\n]+/g, ' ').trim().match(/\S+/g) || [];
    if (!rawWords.length) return [];
    const totalFrames = Math.max(1, Math.ceil(durationSec * fps));
    const weights = rawWords.map((w) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, '').length));
    const weightSum = weights.reduce((a, b) => a + b, 0);

    let prevEnd = 0;
    return rawWords.map((word, idx) => {
      const startFrame = prevEnd;
      const progress = weights.slice(0, idx + 1).reduce((a, b) => a + b, 0) / weightSum;
      const proportionalEnd = Math.round(progress * totalFrames);
      const endFrame = idx === rawWords.length - 1
        ? totalFrames
        : Math.max(startFrame + 1, Math.min(totalFrames, proportionalEnd));
      prevEnd = endFrame;
      return {
        word,
        startSec: Number((startFrame / fps).toFixed(3)),
        endSec: Number((endFrame / fps).toFixed(3)),
        startMs: Math.round((startFrame / fps) * 1000),
        endMs: Math.round((endFrame / fps) * 1000),
        startFrame,
        endFrame,
      };
    });
  }

  private async synthesizeKokoro(text: string, outputFile: string, speedMultiplier = 1): Promise<void> {
    const kokoro = await this.getKokoro();
    const voiceSpeed = Math.min(this.getMaxSceneSpeedMultiplier(), Math.max(1, speedMultiplier));
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
    const wavFile = outputFile.replace(/\.mp3$/i, '_kokoro_temp.wav');

    console.log(`[TTSService] Generating Kokoro narration with voice ${KOKORO_VOICE} at ${voiceSpeed.toFixed(2)}x...`);
    const audio = await kokoro.generate(cleanText, {
      voice: KOKORO_VOICE as any,
      speed: voiceSpeed,
    });
    await audio.save(wavFile);
    await execFileAsync('ffmpeg', ['-y', '-i', wavFile, '-codec:a', 'libmp3lame', '-b:a', '128k', outputFile], { timeout: 60000 });
    await fs.unlink(wavFile).catch(() => undefined);
  }

  /** Generate full narration with authoritative word-level alignment. */
  async generateNarrationWithAlignment(projectId: string, text: string): Promise<NarrationResult> {
    const mediaDir = path.join(projectPaths.backendMedia, 'audio');
    const remotionPublicDir = path.join(projectPaths.remotionPublic, 'audio');
    await fs.mkdir(mediaDir, { recursive: true });
    await fs.mkdir(remotionPublicDir, { recursive: true });

    const fileName = `${projectId}_narration.mp3`;
    const alignName = `${projectId}_narration_alignment.json`;
    const backendFile = path.join(mediaDir, fileName);
    const backendAlignFile = path.join(mediaDir, alignName);
    const remotionFile = path.join(remotionPublicDir, fileName);

    let words: WordAlignment[] = [];
    let alignmentType: 'measured' | 'fallback' = 'measured';

    if (existsSync(backendFile) && existsSync(backendAlignFile)) {
      try {
        const cachedAlign = JSON.parse(await fs.readFile(backendAlignFile, 'utf8'));
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'error', '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1', backendFile,
        ]);
        const cachedDuration = parseFloat(stdout.trim()) || 0;
        if (cachedDuration > 0.1 && Array.isArray(cachedAlign.words) && cachedAlign.words.length > 0) {
          try { await fs.access(remotionFile); } catch { await fs.copyFile(backendFile, remotionFile); }
          return {
            audioPath: backendFile,
            staticUrl: `audio/${fileName}`,
            durationSec: cachedDuration,
            durationInFrames: Math.ceil(cachedDuration * 30),
            words: cachedAlign.words,
            alignmentType: 'measured',
          };
        }
      } catch {}
    }

    if (TTS_PROVIDER === 'edge-tts') {
      try {
        words = await this.synthesizeEdgeTtsWithAlignment(text, backendFile, backendAlignFile, 1);
      } catch (err: any) {
        console.warn(`[TTSService] edge-tts alignment synthesis failed (${err.message}). Falling back to Kokoro...`);
      }
    }

    if (!existsSync(backendFile) || (await fs.stat(backendFile)).size < 100) {
      await this.synthesizeKokoro(text, backendFile, 1);
    }

    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', backendFile,
    ]);
    const durationSec = parseFloat(stdout.trim()) || 0;
    const durationInFrames = Math.ceil(durationSec * 30);

    if (!words.length) {
      words = this.computeFallbackWordAlignment(text, durationSec, 30);
      alignmentType = 'fallback';
      await fs.writeFile(backendAlignFile, JSON.stringify({ text, voice: 'fallback', words }, null, 2), 'utf8');
    }

    await fs.copyFile(backendFile, remotionFile);
    console.log(`[TTSService] Narration & Alignment ready: ${remotionFile} (${durationSec.toFixed(2)}s, ${words.length} words, type: ${alignmentType})`);

    return {
      audioPath: backendFile,
      staticUrl: `audio/${fileName}`,
      durationSec,
      durationInFrames,
      words,
      alignmentType,
    };
  }

  /** Generate narration with edge-tts or local Kokoro voice (legacy compatible). */
  async generateNarration(projectId: string, text: string): Promise<{ audioPath: string; staticUrl: string; durationSec: number }> {
    const result = await this.generateNarrationWithAlignment(projectId, text);
    return {
      audioPath: result.audioPath,
      staticUrl: result.staticUrl,
      durationSec: result.durationSec,
    };
  }

  /** Generate and probe one scene clip with real word alignment. */
  async generateSceneNarrationWithAlignment(
    projectId: string,
    sceneNumber: number,
    text: string,
    renderVersion = 1,
    speedMultiplier = 1
  ): Promise<NarrationResult> {
    const mediaDir = path.join(projectPaths.backendMedia, 'audio');
    const remotionPublicDir = path.join(projectPaths.remotionPublic, 'audio');
    await fs.mkdir(mediaDir, { recursive: true });
    await fs.mkdir(remotionPublicDir, { recursive: true });

    const rateSuffix = speedMultiplier > 1 ? `_rate_${Math.round(speedMultiplier * 100)}` : '';
    const baseName = `${projectId}_preview_v${renderVersion}_scene_${String(sceneNumber).padStart(2, '0')}_narration${rateSuffix}`;
    const fileName = `${baseName}.mp3`;
    const alignName = `${baseName}_alignment.json`;
    const backendFile = path.join(mediaDir, fileName);
    const backendAlignFile = path.join(mediaDir, alignName);
    const remotionFile = path.join(remotionPublicDir, fileName);

    let words: WordAlignment[] = [];
    let alignmentType: 'measured' | 'fallback' = 'measured';

    if (existsSync(backendFile) && existsSync(backendAlignFile)) {
      try {
        const cachedAlign = JSON.parse(await fs.readFile(backendAlignFile, 'utf8'));
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'error', '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1', backendFile,
        ]);
        const cachedDuration = parseFloat(stdout.trim()) || 0;
        if (cachedDuration > 0.1 && Array.isArray(cachedAlign.words) && cachedAlign.words.length > 0) {
          try { await fs.access(remotionFile); } catch { await fs.copyFile(backendFile, remotionFile); }
          return {
            audioPath: backendFile,
            staticUrl: `audio/${fileName}`,
            durationSec: cachedDuration,
            durationInFrames: Math.ceil(cachedDuration * 30),
            words: cachedAlign.words,
            alignmentType: 'measured',
          };
        }
      } catch {}
    }

    if (TTS_PROVIDER === 'edge-tts') {
      try {
        words = await this.synthesizeEdgeTtsWithAlignment(text, backendFile, backendAlignFile, speedMultiplier);
      } catch (err: any) {
        console.warn(`[TTSService] Scene ${sceneNumber} edge-tts alignment failed (${err.message}). Falling back to Kokoro...`);
      }
    }

    if (!existsSync(backendFile) || (await fs.stat(backendFile)).size < 100) {
      await this.synthesizeKokoro(text, backendFile, speedMultiplier);
    }

    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', backendFile,
    ]);
    const durationSec = parseFloat(stdout.trim()) || 0;
    const durationInFrames = Math.ceil(durationSec * 30);

    if (!words.length) {
      words = this.computeFallbackWordAlignment(text, durationSec, 30);
      alignmentType = 'fallback';
      await fs.writeFile(backendAlignFile, JSON.stringify({ text, voice: 'fallback', words }, null, 2), 'utf8');
    }

    await fs.copyFile(backendFile, remotionFile);
    console.log(`[TTSService] Scene ${sceneNumber} narration ready: ${remotionFile} (${durationSec.toFixed(2)}s, ${words.length} words, type: ${alignmentType})`);

    return {
      audioPath: backendFile,
      staticUrl: `audio/${fileName}`,
      durationSec,
      durationInFrames,
      words,
      alignmentType,
    };
  }

  /** Generate and probe one scene clip so visual timing follows real speech (legacy compatible). */
  async generateSceneNarration(projectId: string, sceneNumber: number, text: string, renderVersion = 1, speedMultiplier = 1): Promise<{ audioPath: string; staticUrl: string; durationSec: number }> {
    const result = await this.generateSceneNarrationWithAlignment(projectId, sceneNumber, text, renderVersion, speedMultiplier);
    return {
      audioPath: result.audioPath,
      staticUrl: result.staticUrl,
      durationSec: result.durationSec,
    };
  }
}

export const ttsService = new TTSService();

