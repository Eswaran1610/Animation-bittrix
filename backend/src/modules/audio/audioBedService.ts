import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { projectPaths } from '../../config/paths.js';

const execFileAsync = promisify(execFile);

/** A quiet procedural bed keeps every render continuous without licensed music. */
export class AudioBedService {
  async generate(projectId: string, renderType: 'preview' | 'final', renderVersion: number, durationSeconds: number): Promise<string> {
    const fileName = `${projectId}_${renderType}_v${renderVersion}_bed.wav`;
    const backendDirectory = path.join(projectPaths.backendMedia, 'audio', 'beds');
    const remotionDirectory = path.join(projectPaths.remotionPublic, 'audio', 'beds');
    const backendFile = path.join(backendDirectory, fileName);
    const remotionFile = path.join(remotionDirectory, fileName);
    await fs.mkdir(backendDirectory, { recursive: true });
    await fs.mkdir(remotionDirectory, { recursive: true });
    const fadeOut = Math.max(0, durationSeconds - 0.8).toFixed(3);
    await execFileAsync('ffmpeg', [
      '-y', '-f', 'lavfi', '-i', `anoisesrc=color=pink:amplitude=0.55:duration=${durationSeconds.toFixed(3)}`,
      '-af', `lowpass=f=900,highpass=f=55,afade=t=in:st=0:d=0.6,afade=t=out:st=${fadeOut}:d=0.8,volume=0.60`,
      '-ar', '44100', '-ac', '2', backendFile,
    ], { timeout: 30000 });
    await fs.copyFile(backendFile, remotionFile);
    return `audio/beds/${fileName}`;
  }
}

export const audioBedService = new AudioBedService();
