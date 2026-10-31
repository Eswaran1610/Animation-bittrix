import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { projectPaths } from '../../config/paths.js';

const execFileAsync = promisify(execFile);

const hashText = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
};

/** Creates short, procedural entrance cues derived from each AGY object. */
export class SfxService {
  async generateObjectCue(
    projectId: string,
    renderType: 'preview' | 'final',
    renderVersion: number,
    sceneNumber: number,
    objectIndex: number,
    objectLabel: string
  ): Promise<string> {
    const seed = hashText(`${projectId}:${renderType}:${renderVersion}:${sceneNumber}:${objectIndex}:${objectLabel}`);
    const frequency = 260 + (seed % 520);
    const duration = 0.14 + ((seed % 5) * 0.015);
    const fadeStart = Math.max(0.04, duration - 0.08).toFixed(3);
    const fileName = `${projectId}_${renderType}_v${renderVersion}_s${sceneNumber}_o${objectIndex}.wav`;
    const backendDirectory = path.join(projectPaths.backendMedia, 'audio', 'sfx');
    const remotionDirectory = path.join(projectPaths.remotionPublic, 'audio', 'sfx');
    const backendFile = path.join(backendDirectory, fileName);
    const remotionFile = path.join(remotionDirectory, fileName);

    await fs.mkdir(backendDirectory, { recursive: true });
    await fs.mkdir(remotionDirectory, { recursive: true });
    await execFileAsync('ffmpeg', [
      '-y', '-f', 'lavfi', '-i', `sine=frequency=${frequency}:duration=${duration.toFixed(3)}`,
      '-af', `afade=t=in:st=0:d=0.015,afade=t=out:st=${fadeStart}:d=0.08,volume=0.16`,
      '-ar', '44100', '-ac', '1', backendFile,
    ], { timeout: 30000 });
    await fs.copyFile(backendFile, remotionFile);
    return `audio/sfx/${fileName}`;
  }
}

export const sfxService = new SfxService();
