import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { projectPaths } from '../../config/paths.js';

const execFileAsync = promisify(execFile);

export interface AudioMixScene {
  start?: number;
  startFrame?: number;
  durationInFrames: number;
  transitionOutFrames?: number;
  narrationAudio?: string;
  audioCues?: Array<{
    frame?: number;
    hitFrame?: number;
    src: string;
    volume?: number;
    role?: string;
  }>;
}

export interface AudioMixOptions {
  projectId: string;
  renderType: 'preview' | 'final';
  renderVersion: number;
  fps: number;
  totalDurationFrames: number;
  scenes: AudioMixScene[];
  backgroundAudioUrl?: string;
}

/**
 * AudioMixerService
 *
 * Merges all separate audio layers (per-scene voice narration, object SFX cues,
 * and ambient musical bed) into ONE single synchronized, high-fidelity master audio file.
 *
 * This reduces Remotion rendering overhead to TSX + 1 single audio track, eliminating
 * multi-track decoding stutter, CPU contention, and audio desync.
 */
export class AudioMixerService {
  async mixMasterAudio(options: AudioMixOptions): Promise<string> {
    const { projectId, renderType, renderVersion, fps, totalDurationFrames, scenes, backgroundAudioUrl } = options;
    const totalDurationSec = totalDurationFrames / fps;

    const fileName = `${projectId}_${renderType}_v${renderVersion}_master.mp3`;
    const backendDir = path.join(projectPaths.backendMedia, 'audio', 'master');
    const remotionDir = path.join(projectPaths.remotionPublic, 'audio', 'master');
    await fs.mkdir(backendDir, { recursive: true });
    await fs.mkdir(remotionDir, { recursive: true });

    const backendMasterFile = path.join(backendDir, fileName);
    const remotionMasterFile = path.join(remotionDir, fileName);

    // Collect all inputs with millisecond timeline offsets
    const inputs: Array<{ absPath: string; delayMs: number; volume: number; kind: 'voice' | 'sfx' | 'bed' }> = [];
    let sceneFrameOffset = 0;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneStartFrame = (scene as any).start !== undefined
        ? (scene as any).start
        : ((scene as any).startFrame !== undefined ? (scene as any).startFrame : sceneFrameOffset);
      const sceneDuration = scene.durationInFrames || (scene as any).frames || 90;

      // 1. Spoken narration for this scene
      if (scene.narrationAudio) {
        const absNarration = path.join(projectPaths.remotionPublic, ...scene.narrationAudio.replace(/^\//, '').split('/'));
        if (existsSync(absNarration)) {
          const delayMs = Math.max(0, Math.round((sceneStartFrame / fps) * 1000));
          inputs.push({ absPath: absNarration, delayMs, volume: 1.0, kind: 'voice' });
        }
      }

      // 2. Procedural object sound cues for this scene
      if (Array.isArray(scene.audioCues)) {
        for (const cue of scene.audioCues) {
          if (!cue.src) continue;
          const absCue = path.join(projectPaths.remotionPublic, ...cue.src.replace(/^\//, '').split('/'));
          if (existsSync(absCue)) {
            const cueTimelineFrame = sceneStartFrame + (cue.frame ?? cue.hitFrame ?? 0);
            const delayMs = Math.max(0, Math.round((cueTimelineFrame / fps) * 1000));
            const roleGain: Record<string, number> = {
              pop: 0.42, click: 0.38, tick: 0.36, draw: 0.38, slide: 0.42,
              whoosh: 0.40, riser: 0.36, impact: 0.42, sparkle: 0.36,
              chime: 0.36, count: 0.34, ding: 0.36,
            };
            const cueVolume = Math.min(0.40, (cue.volume ?? 0.7) * (roleGain[cue.role || ''] ?? 0.38));
            inputs.push({ absPath: absCue, delayMs, volume: cueVolume, kind: 'sfx' });
          }
        }
      }

      sceneFrameOffset = sceneStartFrame + sceneDuration;
    }

    // 3. Background musical bed
    if (backgroundAudioUrl) {
      const absBg = path.join(projectPaths.remotionPublic, ...backgroundAudioUrl.replace(/^\//, '').split('/'));
      if (existsSync(absBg)) {
        inputs.push({ absPath: absBg, delayMs: 0, volume: 0.30, kind: 'bed' });
      }
    }

    if (inputs.length === 0) {
      console.warn('[AudioMixerService] No audio inputs found to mix into master audio.');
      return '';
    }

    console.log(`[AudioMixerService] Mixing ${inputs.length} audio sources into 1 master audio track for ${projectId}...`);

    // Build FFmpeg command args
    const ffmpegArgs: string[] = ['-v', 'error', '-y'];
    for (const input of inputs) {
      ffmpegArgs.push('-i', input.absPath);
    }

    const filterParts: string[] = [];
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      filterParts.push(`[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${input.delayMs}|${input.delayMs},volume=${input.volume.toFixed(3)}[a${i}]`);
    }

    // Bus layout: voice + sfx are the "foreground"; the music bed is ducked under the
    // voice with a sidechain compressor so speech always sits on top of the music.
    const labelsOf = (kind: 'voice' | 'sfx' | 'bed') =>
      inputs.map((input, i) => (input.kind === kind ? `[a${i}]` : '')).filter(Boolean);
    const voiceLabels = labelsOf('voice');
    const sfxLabels = labelsOf('sfx');
    const bedLabels = labelsOf('bed');

    const sumBus = (labels: string[], out: string) => {
      if (labels.length === 0) return false;
      if (labels.length === 1) filterParts.push(`${labels[0]}anull[${out}]`);
      else filterParts.push(`${labels.join('')}amix=inputs=${labels.length}:duration=longest:normalize=0[${out}]`);
      return true;
    };

    const hasVoice = sumBus(voiceLabels, 'voicebus');
    const hasSfx = sumBus(sfxLabels, 'sfxbus');
    const hasBed = sumBus(bedLabels, 'bedbus');

    const finalLabels: string[] = [];
    if (hasVoice) {
      // one copy goes to the mix, one copy is the sidechain key for the bed
      filterParts.push('[voicebus]asplit=2[voicemix][voicekey]');
      finalLabels.push('[voicemix]');
    }
    if (hasSfx) finalLabels.push('[sfxbus]');
    if (hasBed) {
      if (hasVoice) {
        filterParts.push('[bedbus][voicekey]sidechaincompress=threshold=0.02:ratio=10:attack=30:release=500:makeup=1[bedduck]');
        finalLabels.push('[bedduck]');
      } else {
        finalLabels.push('[bedbus]');
      }
    }

    filterParts.push(
      `${finalLabels.join('')}amix=inputs=${finalLabels.length}:duration=longest:normalize=0,` +
      // broadcast-style loudness for shorts, then a hard ceiling so peaks never clip
      'loudnorm=I=-16:TP=-1.5:LRA=9,alimiter=limit=0.89,' +
      'aformat=sample_rates=48000:channel_layouts=stereo[mixed]',
    );

    ffmpegArgs.push('-filter_complex', filterParts.join(';'));
    ffmpegArgs.push('-map', '[mixed]');
    ffmpegArgs.push('-t', totalDurationSec.toFixed(3));
    ffmpegArgs.push('-codec:a', 'libmp3lame', '-b:a', '192k');
    ffmpegArgs.push(backendMasterFile);

    try {
      await execFileAsync('ffmpeg', ffmpegArgs, { timeout: 60000 });
      await fs.copyFile(backendMasterFile, remotionMasterFile);
      console.log(`[AudioMixerService] Master audio track ready: ${remotionMasterFile} (${totalDurationSec.toFixed(2)}s)`);
      return `audio/master/${fileName}`;
    } catch (err: any) {
      console.error(`[AudioMixerService] Master audio mixing failed (${err?.message}); falling back to multi-track.`);
      return '';
    }
  }
}

export const audioMixerService = new AudioMixerService();
