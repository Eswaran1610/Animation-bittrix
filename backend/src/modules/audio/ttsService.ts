import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);

export class TTSService {
  /**
   * Generate crystal-clear neural voice narration for a project script.
   */
  async generateNarration(projectId: string, text: string): Promise<{ audioPath: string; staticUrl: string; durationSec: number }> {
    const sanitizedText = text.replace(/[\r\n]+/g, ' ').replace(/"/g, '\\"').trim();
    const mediaDir = '/home/inkyank/Pictures/AnimationPipeline/backend/media/audio';
    const remotionPublicDir = '/home/inkyank/Pictures/AnimationPipeline/remotion/public/audio';

    await fs.mkdir(mediaDir, { recursive: true });
    await fs.mkdir(remotionPublicDir, { recursive: true });

    const fileName = `${projectId}_narration.mp3`;
    const backendFile = path.join(mediaDir, fileName);
    const remotionFile = path.join(remotionPublicDir, fileName);

    console.log(`[TTSService] Generating neural voice narration for project ${projectId}...`);

    try {
      // Primary: High-quality Microsoft Edge Neural Voice
      await execFileAsync('python3', [
        '-m',
        'edge_tts',
        '--voice',
        'en-US-ChristopherNeural',
        '--text',
        sanitizedText,
        '--write-media',
        backendFile
      ], { timeout: 30000 });
      console.log(`[TTSService] Edge neural voice synthesized: ${backendFile}`);
    } catch (edgeErr: any) {
      console.warn(`[TTSService] edge-tts error, falling back to espeak:`, edgeErr.message);
      const wavPath = path.join(mediaDir, `${projectId}_temp.wav`);
      await execFileAsync('espeak-ng', ['-w', wavPath, sanitizedText]);
      await execFileAsync('ffmpeg', ['-y', '-i', wavPath, '-b:a', '128k', backendFile]);
      try { await fs.unlink(wavPath); } catch (e) {}
    }

    // Copy to Remotion public audio directory so Remotion can access it via staticFile
    await fs.copyFile(backendFile, remotionFile);

    // Measure audio duration using ffprobe
    let durationSec = 15;
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        backendFile
      ]);
      durationSec = parseFloat(stdout.trim()) || 15;
    } catch (e) {}

    console.log(`[TTSService] Narration ready: ${remotionFile} (${durationSec.toFixed(1)}s)`);

    return {
      audioPath: backendFile,
      staticUrl: `audio/${fileName}`,
      durationSec
    };
  }
}

export const ttsService = new TTSService();
