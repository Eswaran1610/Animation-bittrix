import { query } from '../../config/db.js';
import { RenderJob, VideoRecord } from '../../types/index.js';
import { approvalsService } from '../approvals/approvalsService.js';
import { videoRenderer } from './videoRenderer.js';
import { ttsService } from '../audio/ttsService.js';
import { assetFetcher } from '../assets/assetFetcher.js';
import { sfxService, SfxRole } from '../audio/sfxService.js';
import { audioBedService } from '../audio/audioBedService.js';
import { audioMixerService } from '../audio/audioMixerService.js';
import path from 'path';
import fs from 'fs/promises';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';
import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { promisify } from 'util';
import { preflightRenderProps } from './preflight.js';
import { formatRenderFailure } from './renderDiagnostics.js';
import { productionPackageService } from '../production/productionPackageService.js';
import { unifiedCliProvider } from '../providers/cliProvider.js';
import { activeProviderService } from '../providers/activeProviderService.js';
import { getDrawingStyle, drawingSkillDir } from '../drawing/drawingStyles.js';

const execFileAsync = promisify(execFile);

export const OUTRO_SECONDS = 3;
const CLAUDE_VIDEO_FILE = 'ClaudeVideo';

/**
 * Timeline wiring only: mounts Claude's continuous video (or, for older
 * projects, its per-scene components) and layers the fixed 3s Bittrix logo
 * over the end. All visuals are Claude's code.
 */
function buildGeneratedVideoSource(scenes: any[], video?: any): string {
  const outro = `
      <Sequence from={total - outroFrames} durationInFrames={outroFrames}>
        <BittrixOutroExact />
      </Sequence>`;
  const header = (extra: string) => `import React from 'react';
import { Sequence } from 'remotion';
import type { SceneDataPayload } from '../../data/sceneTypes';
import { BittrixOutroExact } from '../../components/BittrixOutroExact';
${extra}

const timelineEnd = (list: any[]) =>
  list.reduce((end: number, s: any) => Math.max(end, (s.start ?? s.startFrame ?? 0) + (s.durationInFrames || s.frames || 0)), 0);
`;

  if (video?.claudeVideoPath) {
    return `${header(`import ClaudeVideo from './${CLAUDE_VIDEO_FILE}';`)}
export default function GeneratedVideo({ video, scenes }: SceneDataPayload) {
  const fps = video?.fps || 30;
  const list = (scenes || []) as any[];
  const total = timelineEnd(list);
  const outroFrames = Math.min(total, ${OUTRO_SECONDS} * fps);
  return (
    <>
      <ClaudeVideo fps={fps} durationInFrames={total} scenes={list} />${outro}
    </>
  );
}
`;
  }

  if (video?.drawingStyle) {
    // Hand-drawn projects: the Claude agent renders the mp4 itself with the claude-drawing skill.
    // This placeholder only keeps the Remotion project valid (and lets the agent render the outro frames from it).
    return `${header(`import { AbsoluteFill } from 'remotion';`)}
export default function GeneratedVideo({ video, scenes }: SceneDataPayload) {
  const fps = video?.fps || 30;
  const list = (scenes || []) as any[];
  const total = timelineEnd(list);
  const outroFrames = Math.min(total, ${OUTRO_SECONDS} * fps);
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: '#f3ecdc' }} />${outro}
    </>
  );
}
`;
  }

  const missing = (scenes || []).filter((s) => !s.customComponentPath).map((s) => s.scene_number);
  if (missing.length) {
    throw new Error(`Scene(s) ${missing.join(', ')} were made with the old template renderer. Send a visual revision so Claude writes the video, then render again.`);
  }
  const imports = scenes.map((s) => `import Scene_${s.scene_number} from './${s.customComponentPath}';`).join('\n');
  const mapEntries = scenes.map((s) => `  ${s.scene_number}: Scene_${s.scene_number},`).join('\n');
  return `${header(`import { CustomSceneHost } from '../../components/CustomSceneHost';\n${imports}`)}
const CUSTOM_SCENES: Record<number, any> = {
${mapEntries}
};

export default function GeneratedVideo({ video, scenes }: SceneDataPayload) {
  const fps = video?.fps || 30;
  const list = (scenes || []) as any[];
  const total = timelineEnd(list);
  const outroFrames = Math.min(total, ${OUTRO_SECONDS} * fps);
  return (
    <>
      {list.map((scene: any, index: number) => (
        <Sequence key={scene.id || index} from={scene.start ?? scene.startFrame ?? 0} durationInFrames={scene.durationInFrames || scene.frames}>
          <CustomSceneHost scene={scene} Component={CUSTOM_SCENES[scene.scene_number]} />
        </Sequence>
      ))}${outro}
    </>
  );
}
`;
}

export class RendersService {
  private buildWordCaptions(text: string, durationSec: number, fps: number) {
    const words = text.replace(/[\r\n]+/g, ' ').trim().match(/\S+/g) || [];
    const totalFrames = Math.max(1, Math.ceil(durationSec * fps));
    if (words.length === 0) return [];

    // Kokoro does not expose forced-alignment timestamps. Use the approved
    // script and natural audio duration to create readable deterministic word
    // timing; the narration itself is never time-stretched.
    const weights = words.map((word) => Math.max(1, word.replace(/[^\p{L}\p{N}]/gu, '').length));
    const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
    let previousEnd = 0;

    return words.map((word, index) => {
      const startFrame = previousEnd;
      const proportionalEnd = Math.round(
        (weights.slice(0, index + 1).reduce((sum, weight) => sum + weight, 0) / weightTotal) * totalFrames
      );
      const endFrame = index === words.length - 1
        ? totalFrames
        : Math.max(startFrame + 1, Math.min(totalFrames, proportionalEnd));
      previousEnd = endFrame;
      return { word, startFrame, endFrame };
    });
  }

  private isWhisperAvailable: boolean | null = null;
  /** claude-drawing style chosen on the dashboard for this project, if any. */
  private async projectDrawingStyle(projectId: string) {
    const res = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
    return getDrawingStyle(res.rows[0]?.drawing_style);
  }

  /**
   * Props media reference -> absolute file. Accepts '/media/...' URLs, absolute paths, and the relative
   * 'audio/master/...' style used in render props (backend media dir first, then remotion/public).
   */
  private mediaUrlToPath(url?: string): string | undefined {
    if (!url) return undefined;
    const clean = url.split('?')[0];
    if (clean.startsWith('/media/')) return path.join(projectPaths.backendMedia, clean.slice('/media/'.length));
    if (path.isAbsolute(clean) && existsSync(clean)) return clean;
    const rel = clean.replace(/^\/+/, '');
    const candidates = [path.join(projectPaths.backendMedia, rel), path.join(projectPaths.remotionPublic, rel)];
    return candidates.find((c) => existsSync(c));
  }

  /**
   * Hand-drawn path: Claude runs as a full agent with the claude-drawing skill and writes the mp4 itself.
   * The backend only verifies it (exists, size, resolution, fps, duration vs audio) -- it never patches the video.
   */
  private async buildDrawnVideoWithAgent(opts: {
    projectId: string;
    projectTitle: string;
    propsPath: string;
    outputMp4: string;
    style: NonNullable<ReturnType<typeof getDrawingStyle>>;
    feedback?: string;
    onProgress: (progress: number, status: string) => Promise<void>;
  }): Promise<void> {
    const props = JSON.parse(await fs.readFile(opts.propsPath, 'utf8'));
    const fps = Number(props.video?.fps || 30);
    const width = Number(props.video?.width || 1080);
    const height = Number(props.video?.height || 1920);
    const durationInFrames = Number(props.video?.durationInFrames);
    const audioPath = this.mediaUrlToPath(props.video?.audioUrl);
    if (!audioPath) throw new Error(`Hand-drawn build could not find the mixed master audio file for "${props.video?.audioUrl || '(no audioUrl in props)'}".`);
    await fs.access(audioPath);
    const workDir = path.join(projectPaths.backendMedia, 'projects', opts.projectId, 'drawing', path.basename(opts.outputMp4, '.mp4'));
    await fs.mkdir(workDir, { recursive: true });
    await fs.mkdir(path.dirname(opts.outputMp4), { recursive: true });
    await fs.rm(opts.outputMp4, { force: true });

    const targetDurationSec = durationInFrames / fps;
    const probe = async (file: string, args: string[]) =>
      JSON.parse((await execFileAsync('ffprobe', ['-v', 'error', ...args, '-of', 'json', file], { timeout: 60000 })).stdout);

    // Ensure master audio matches the target duration, padding with silence if speech/sfx ended earlier
    const initAudioProbe = await probe(audioPath, ['-show_entries', 'format=duration']);
    const initAudioDur = Number(initAudioProbe.format?.duration || 0);
    if (initAudioDur < targetDurationSec - (1 / fps + 0.02)) {
      console.log(`[RendersService] Master audio duration (${initAudioDur.toFixed(3)}s) is shorter than target video duration (${targetDurationSec.toFixed(3)}s). Padding master audio with silence...`);
      const tempPadded = `${audioPath}.padded.mp3`;
      await execFileAsync('ffmpeg', [
        '-v', 'error', '-y',
        '-i', audioPath,
        '-af', `apad=whole_dur=${targetDurationSec.toFixed(3)}`,
        '-t', targetDurationSec.toFixed(3),
        '-codec:a', 'libmp3lame', '-b:a', '192k',
        tempPadded
      ], { timeout: 30000 });
      await fs.rename(tempPadded, audioPath);
      const rel = path.relative(projectPaths.backendMedia, audioPath);
      const remotionCopy = path.join(projectPaths.remotionPublic, rel);
      if (existsSync(remotionCopy)) {
        await fs.copyFile(audioPath, remotionCopy);
      }
    }

    let progress = 52;
    await opts.onProgress(progress, `Claude agent drawing the video in "${opts.style.label}" style...`);
    let pending: Promise<void> = Promise.resolve();
    await unifiedCliProvider.runClaudeAgentBuild({
      projectId: opts.projectId,
      projectTitle: opts.projectTitle,
      fps, width, height, durationInFrames,
      outroFrames: Math.min(durationInFrames, OUTRO_SECONDS * fps),
      propsPath: opts.propsPath,
      audioPath,
      outputMp4: opts.outputMp4,
      workDir,
      drawingStyle: opts.style,
      skillDir: drawingSkillDir(),
      feedback: opts.feedback,
      onEvent: (evt) => {
        if (evt.kind === 'result') return;
        progress = Math.min(94, progress + 0.4);
        const label = evt.kind === 'tool' ? `Claude: ${evt.text}` : `Claude: ${evt.text.split('\n')[0]}`;
        const p = Math.round(progress);
        pending = pending.then(() => opts.onProgress(p, label.slice(0, 220))).catch(() => {});
      },
    });
    await pending;

    await opts.onProgress(96, 'Verifying the agent-rendered video...');
    const stat = await fs.stat(opts.outputMp4).catch(() => null);
    if (!stat || stat.size === 0) throw new Error(`Claude agent reported DONE but ${opts.outputMp4} is missing or empty.`);
    const v = await probe(opts.outputMp4, ['-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:format=duration']);
    const a = await probe(audioPath, ['-show_entries', 'format=duration']);
    const st = v.streams?.[0] || {};
    const [num, den] = String(st.r_frame_rate || '0/1').split('/').map(Number);
    const gotFps = den ? num / den : 0;
    const vDur = Number(v.format?.duration || 0);
    const aDur = Number(a.format?.duration || 0);
    const targetDur = durationInFrames / fps;
    const problems: string[] = [];
    if (st.width !== width || st.height !== height) problems.push(`resolution ${st.width}x${st.height} != ${width}x${height}`);
    if (Math.abs(gotFps - fps) > 0.01) problems.push(`fps ${gotFps.toFixed(2)} != ${fps}`);
    if (Math.abs(vDur - aDur) > 1 / fps + 0.02 && Math.abs(vDur - targetDur) > 1 / fps + 0.02) {
      problems.push(`video ${vDur.toFixed(3)}s vs audio ${aDur.toFixed(3)}s (target ${targetDur.toFixed(3)}s)`);
    }
    if (problems.length) throw new Error(`Agent-rendered video failed verification: ${problems.join('; ')}`);
  }

  private async checkWhisperAvailable(): Promise<boolean> {
    if (this.isWhisperAvailable !== null) return this.isWhisperAvailable;
    if (process.env.DISABLE_WHISPER === '1') {
      this.isWhisperAvailable = false;
      return false;
    }
    try {
      const bin = process.env.WHISPER_BIN || 'whisper';
      await execFileAsync(bin, ['--help'], { timeout: 3000 });
      this.isWhisperAvailable = true;
    } catch {
      this.isWhisperAvailable = false;
    }
    return this.isWhisperAvailable;
  }

  private async buildMeasuredCaptions(text: string, audioPath: string | undefined, durationSec: number, fps: number) {
    if (!audioPath || !(await this.checkWhisperAvailable())) return this.buildWordCaptions(text, durationSec, fps);
    const outputDir = path.join(projectPaths.backendMedia, 'captions');
    const outputBase = path.basename(audioPath).replace(/\.[^.]+$/, '');
    const outputPath = path.join(outputDir, `${outputBase}.json`);
    try {
      await fs.mkdir(outputDir, { recursive: true });
      await execFileAsync(process.env.WHISPER_BIN || 'whisper', [
        audioPath,
        '--model', process.env.WHISPER_MODEL || 'base',
        '--output_format', 'json',
        '--output_dir', outputDir,
        '--word_timestamps', 'True',
      ], { timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
      const transcript = JSON.parse(await fs.readFile(outputPath, 'utf8'));
      const words = (transcript.segments || []).flatMap((segment: any) => segment.words || [])
        .filter((word: any) => typeof word.word === 'string' && Number.isFinite(word.start) && Number.isFinite(word.end));
      if (words.length) {
        return words.map((word: any) => ({
          word: word.word.trim(),
          startFrame: Math.max(0, Math.round(Number(word.start) * fps)),
          endFrame: Math.max(1, Math.round(Number(word.end) * fps)),
        }));
      }
    } catch {
      // Whisper is optional. The deterministic audio-duration fallback keeps
      // captions available when the local Whisper CLI/model is not installed.
    }
    return this.buildWordCaptions(text, durationSec, fps);
  }

  /**
   * Convert the approved CLI scene plan into isolated Remotion input props.
   */
  private async writeRemotionSceneData(
    projectId: string,
    projectTitle: string,
   script: any,
   renderVersion: number,
    renderType: 'preview' | 'final' = 'preview',
    progressCallback?: (progress: number, status: string) => Promise<void>
 ) {
    const fps = Number(process.env.RENDER_FPS || script.fps || (renderType === 'final' ? 60 : 30));
    const scenePlan = script.scene_plan;
    if (!Array.isArray(scenePlan) || scenePlan.length === 0) {
      throw new Error('Approved script has no scene plan; render refused.');
    }
    const styleProfile = scenePlan.find((scene: any) => scene.style_profile)?.style_profile;
    const styleBrief = scenePlan.find((scene: any) => scene.style_brief)?.style_brief;
    const sfxPack = styleBrief?.sfxPack || 'digital';

    // 1. Generate one clip per scene with authoritative word-level alignment.
    // FFprobe measures each clip and the measured duration drives that scene's visual duration.
    const sceneNarration = new Map<number, any>();
    const projectAssets: Array<Record<string, unknown>> = [];
    let narrationCompleted = 0;
    try {
      for (const scene of scenePlan) {
        const result = await ttsService.generateSceneNarrationWithAlignment(projectId, Number(scene.scene_number), scene.narration, renderVersion);
        sceneNarration.set(Number(scene.scene_number), result);
        narrationCompleted += 1;
        if (progressCallback) {
          await progressCallback(8 + Math.round((narrationCompleted / scenePlan.length) * 17), `Narration prepared for scene ${narrationCompleted}/${scenePlan.length}`);
        }
      }
    } catch (err: any) {
      throw new Error(`Per-scene narration audio generation failed: ${err.message}`);
    }
    const narrationDurationSec = Array.from(sceneNarration.values()).reduce((total, audio) => total + audio.durationSec, 0);

    // Build ONE timeline array from measured voice durations:
    //   scene[i].start = scene[i-1].start + scene[i-1].frames
    //   scene[i].frames = ceil(voiceSec * fps) + leadFrames + tailFrames
    // Both the visual Sequence and the voice Audio read from this same array,
    // so they cannot drift. Never use a fixed per-scene duration.
    // CTA scene must be at least as long as its voice plus 1s; final video length = sum of scene frames.
    const leadFrames = 0;
    const tailFrames = Math.max(8, Math.round(0.4 * fps));

    let accumulatedStart = 0;
    const sceneTimeline = scenePlan.map((s: any, idx: number) => {
      const isCta = (idx === scenePlan.length - 1) || s.role === 'cta' || String(s.visual_type || '').toLowerCase() === 'outro' || /bittrix/i.test(s.narration || '');
      const narration = sceneNarration.get(Number(s.scene_number));
      // TTS clips carry ~0.8s of trailing silence; size the scene to the last spoken word
      // so sentences don't have >1s dead air between them. The mixer delays each clip
      // to its scene start, so the silent remainder harmlessly overlaps the next scene.
      const clipSec = Number(narration?.durationSec || 0);
      const lastWordEndSec = narration?.alignmentType === 'measured' && narration.words?.length
        ? Number(narration.words[narration.words.length - 1].endSec)
        : NaN;
      const voiceSec = Number.isFinite(lastWordEndSec) && lastWordEndSec > 0
        ? Math.min(clipSec, lastWordEndSec)
        : clipSec;
      const ctaPadding = isCta ? Math.ceil(1.0 * fps) : 0;
      let frames = Math.ceil(voiceSec * fps) + ctaPadding + leadFrames + tailFrames;
      if (isCta) {
        frames = Math.max(frames, Math.ceil((voiceSec + 1.0) * fps));
      }
      frames = Math.max(Math.round(1.5 * fps), frames);

      const start = accumulatedStart;
      accumulatedStart += frames;
      const voiceStart = start + leadFrames;
      const visualStart = start;

      // GATE: for every scene, |voiceStart - visualStart| <= 3 frames (100 ms); fail the render otherwise.
      if (Math.abs(voiceStart - visualStart) > 3) {
        throw new Error(`Sync gate failed: Scene ${idx + 1} voice-visual sync |voiceStart (${voiceStart}) - visualStart (${visualStart})| = ${Math.abs(voiceStart - visualStart)} frames > 3 frames (100ms).`);
      }

      return {
        start,
        frames,
        durationInFrames: frames,
        durationSec: frames / fps,
        voiceSec,
        voiceStart,
        visualStart,
        leadFrames,
        tailFrames,
        isCta
      };
    });

    // 2. Fetch Open Educational Web Diagrams for Scenes
    // Ensure procedural SFX library is generated ONCE for the entire render
    const sfxLibrarySeed = `${projectId}:${renderType}:${renderVersion}:${sfxPack}`;
    const sfxScope = { projectId, previewVersion: renderVersion };
    await sfxService.ensureLibrary(sfxLibrarySeed, sfxScope, sfxPack);

    let scenesPrepared = 0;
    const formattedScenes = await Promise.all(scenePlan.map(async (s: any, idx: number) => {
      const visualType = String(s.visual_type || '').toLowerCase();
      if (visualType !== 'blueprint') throw new Error(`Scene ${idx + 1} must use a CLI visual blueprint; regenerate the script before rendering.`);
      if (!s.visual_blueprint) throw new Error(`Scene ${idx + 1} has no CLI visual blueprint; render refused.`);
      if (!Number.isFinite(Number(s.duration_sec)) || Number(s.duration_sec) < 1.0 || Number(s.duration_sec) > 15) {
        throw new Error(`Scene ${idx + 1} must have a valid duration.`);
      }
      if (!s.theme_color || !/^#[0-9a-f]{6}$/i.test(s.theme_color)) throw new Error(`Scene ${idx + 1} has no valid theme_color.`);
      if (!s.on_screen_text || !s.subtitle || !s.visual_direction || !s.motion_cue || !s.continuity_to_next || !s.narration) {
        throw new Error(`Scene ${idx + 1} is incomplete; render refused.`);
      }
      const blueprint = s.visual_blueprint || undefined;
      const themeColor = s.theme_color;
      const narration = sceneNarration.get(Number(s.scene_number));
      const timelineItem = sceneTimeline[idx];
      const durationInFrames = timelineItem.frames;
      const durationSec = timelineItem.durationSec;
      const startFrame = timelineItem.start;
      const transitionOutFrames = 0;

      // Download the exact assets selected by CLI research. The CLI chooses
      // the source; the backend owns storage, licensing metadata, and staging.
      let imageUrl: string | undefined = undefined;
      const imageAssets: Record<string, string> = {};
      await Promise.all((blueprint.objects || []).map(async (object: any) => {
        const spec = object.render_spec || {};
        const isImage = spec.type === 'image';
        const isDownloadedModel = spec.type === '3d' && Boolean(spec.model_download_url);
        if (!isImage && !isDownloadedModel) return;
        const downloadUrl = isImage ? spec.asset_download_url : spec.model_download_url;
        if (typeof downloadUrl !== 'string' || !downloadUrl.trim()) {
          // If no URL, fall back to procedural graphics
          spec.type = 'procedural';
          return;
        }
        try {
          const fetched = await assetFetcher.fetchCodexSelectedAsset({
            projectId,
            previewVersion: renderVersion,
            sceneNumber: Number(s.scene_number),
            objectId: String(object.id),
            title: String(object.label || object.id),
            kind: isImage ? 'image' : '3d-model',
            downloadUrl,
            sourceUrl: String(spec.asset_source_url || ''),
            license: String(spec.asset_license || ''),
            attribution: typeof spec.asset_attribution === 'string' ? spec.asset_attribution : undefined,
          });
          if (isImage) {
            spec.asset_url = fetched.staticUrl;
            spec.asset_backend_url = `/media/${fetched.staticUrl}`;
            if (spec.asset_query) imageAssets[spec.asset_query] = fetched.staticUrl;
            imageAssets[downloadUrl] = fetched.staticUrl;
            if (!imageUrl) imageUrl = fetched.staticUrl;
          } else {
            spec.model_url = fetched.staticUrl;
            spec.model_backend_url = `/media/${fetched.staticUrl}`;
          }
          projectAssets.push({ type: fetched.kind, sceneNumber: fetched.sceneNumber, objectId: fetched.objectId, title: fetched.title, path: fetched.localPath, projectUrl: `/media/${fetched.staticUrl}`, remotionUrl: fetched.staticUrl, downloadUrl: fetched.downloadUrl, sourceUrl: fetched.sourceUrl, license: fetched.license, attribution: fetched.attribution || null, fileSizeBytes: fetched.fileSizeBytes });
        } catch (assetErr: any) {
          console.warn(`[RendersService] Non-fatal: Asset fetch skipped for scene ${s.scene_number} ("${object.label || object.id}"):`, assetErr.message);
          spec.type = 'vector';
          delete spec.asset_download_url;
          delete spec.model_download_url;
          // Generate procedural vector shapes so the scene never collapses to an empty orb
          const hue = ((Number(s.scene_number) * 67) % 360);
          spec.viewBox = [0, 0, 600, 400];
          spec.rects = [
            { x: 30, y: 30, width: 540, height: 340, rx: 24, fill: `hsla(${hue}, 70%, 15%, 0.85)`, stroke: `hsl(${hue}, 80%, 65%)`, strokeWidth: 4 }
          ];
          spec.circles = [
            { cx: 300, cy: 180, r: 65, fill: `hsla(${hue}, 85%, 55%, 0.25)`, stroke: `hsl(${hue}, 90%, 65%)`, strokeWidth: 5 },
            { cx: 180, cy: 260, r: 28, fill: `hsla(${hue + 40}, 80%, 50%, 0.4)`, stroke: `hsl(${hue + 40}, 85%, 65%)`, strokeWidth: 3 },
            { cx: 420, cy: 260, r: 28, fill: `hsla(${hue + 40}, 80%, 50%, 0.4)`, stroke: `hsl(${hue + 40}, 85%, 65%)`, strokeWidth: 3 }
          ];
          spec.lines = [
            { x1: 180, y1: 260, x2: 300, y2: 180, stroke: `hsl(${hue}, 80%, 60%)`, strokeWidth: 4, dash: '8 6' },
            { x1: 420, y1: 260, x2: 300, y2: 180, stroke: `hsl(${hue}, 80%, 60%)`, strokeWidth: 4, dash: '8 6' }
          ];
          spec.text = object.label || s.on_screen_text;
        }
      }));

      // Generate object sound cues using the already-ensured procedural library
      const lastHitTime: number[] = [];
      const cueRequests: Array<{ hitFrame: number; role: SfxRole; sourceId: string; seedKey: string; pan?: number }> = [];
      const productionCues = Array.isArray(s.production_audio_design?.cues) ? s.production_audio_design.cues : [];
      productionCues.slice(0, 5).forEach((cue: any, cueIndex: number) => {
        const object = blueprint.objects.find((candidate: any) => candidate.id === cue.object_id);
        const hitFrame = Math.max(0, Math.min(durationInFrames - 8, Math.round(Number(cue.hitFrame))));
        cueRequests.push({
          hitFrame,
          role: cue.role as SfxRole,
          sourceId: `${s.scene_number}.cli-cue-${cueIndex + 1}`,
          seedKey: `${projectId}:${s.scene_number}:cli:${cueIndex}`,
          pan: object ? Math.max(-1, Math.min(1, (Number(object.x) - 0.5) * 1.6)) : 0,
        });
        lastHitTime.push(hitFrame);
      });
      const movingObjectIndexes = blueprint.objects.map((object: any, objectIndex: number) => {
        const hasDestination = Number.isFinite(object.to_x) || Number.isFinite(object.to_y);
        const motion = String(object.motion || '');
        return hasDestination || /move|slide|travel|float|drift|orbit|rotate|spin|revolve|bounce|pulse/i.test(motion) ? objectIndex : -1;
      }).filter((objectIndex: number) => objectIndex >= 0);
      const focalMovingObjectIndex = movingObjectIndexes.find((objectIndex: number) => blueprint.objects[objectIndex]?.motion_plan?.focal) ?? movingObjectIndexes[0];

      blueprint.objects.forEach((object: any, objectIndex: number) => {
        // Only trigger appear sound for the focal object or primary 2 subjects to prevent noise clutter
        const isPrimary = objectIndex < 2 || object?.motion_plan?.focal;
        if (isPrimary) {
          // Visual entrance apex: matches spring hit timing in BlueprintVisual
          const plannedEnter = object.motion_plan?.enter_frame;
          const entranceHitFrame = Math.min(
            durationInFrames - 8,
            Number.isFinite(plannedEnter) ? Math.max(4, plannedEnter! + 6) : (idx === 0 ? 8 : 14) + objectIndex * 7
          );
          const appearRole = sfxService.determineRole(object, 'appear');

          // Space distinct sound events at least 8 frames apart
          const isSpaced = cueRequests.length < 6 && lastHitTime.every((t) => Math.abs(t - entranceHitFrame) >= 12);
          if (isSpaced) {
            lastHitTime.push(entranceHitFrame);
            cueRequests.push({
              hitFrame: entranceHitFrame,
              role: appearRole,
              sourceId: `${s.scene_number}.object-${objectIndex + 1}.appear`,
              seedKey: `${projectId}:${s.scene_number}:${objectIndex}:appear`,
              pan: Math.max(-1, Math.min(1, (Number(object.x) - 0.5) * 1.6)),
            });
          }
        }

        // Active purposeful motion: only trigger sound if the object has a real movement trajectory
        // (Do NOT trigger motion sound for idle drift, subtle float, or stationary objects)
        const hasDestination = (Number.isFinite(object.to_x) && object.to_x !== object.x) || (Number.isFinite(object.to_y) && object.to_y !== object.y);
        const motion = String(object.motion || '');
        const hasActiveMotion = hasDestination || /^(?=.*(?:slide|fly|travel|zoom|push|whip|spring|bounce|launch|drop|impact|pop))(?!.*(?:idle|subtle|drift|float)).*$/i.test(motion);

        if (hasActiveMotion && objectIndex === focalMovingObjectIndex) {
          const moveRole = sfxService.determineRole(object, 'move');
          // Movement window matches BlueprintVisual movement progress
          const plan = object.motion_plan;
          const movementStart = Math.min(durationInFrames - 1, plan?.enter_frame ?? (12 + objectIndex * 6));
          const movementEnd = Math.max(movementStart + 1, durationInFrames - 22);
          const moveHitFrame = Math.min(durationInFrames - 12, movementStart + Math.round((movementEnd - movementStart) * 0.35));

          const isMoveSpaced = cueRequests.length < 6 && lastHitTime.every((t) => Math.abs(t - moveHitFrame) >= 12);
          if (isMoveSpaced) {
            lastHitTime.push(moveHitFrame);
            cueRequests.push({
              hitFrame: moveHitFrame,
              role: moveRole,
              sourceId: `${s.scene_number}.object-${objectIndex + 1}.motion`,
              seedKey: `${projectId}:${s.scene_number}:${objectIndex}:motion`,
              pan: Math.max(-1, Math.min(1, (Number(object.to_x ?? object.x) - 0.5) * 1.6)),
            });
          }
        }
      });

      // Bullets / Takeaways sound: light tick for each bullet reveal
      const bulletItems = (s.key_takeaways || s.items || []).slice(0, 3);
      bulletItems.forEach((_: any, bIdx: number) => {
        const bulletHitFrame = Math.min(durationInFrames - 12, 22 + bIdx * 8);
        const isSpaced = cueRequests.length < 6 && lastHitTime.every((t) => Math.abs(t - bulletHitFrame) >= 12);
        if (isSpaced) {
          lastHitTime.push(bulletHitFrame);
          cueRequests.push({
            hitFrame: bulletHitFrame,
            role: 'tick',
            sourceId: `${s.scene_number}.bullet-${bIdx + 1}`,
            seedKey: `${projectId}:${s.scene_number}:bullet:${bIdx}`,
              pan: (bIdx - 1) * 0.22,
          });
        }
      });

      // Final CTA sting: Bittrix Outro chain rolling, gear ratchet, and shine chime
      if (s.role === 'cta' || idx === scenePlan.length - 1) {
        const chainHitFrame = Math.round(0.35 * fps);
        const gearHitFrame = Math.round(1.0 * fps);
        const shineHitFrame = Math.max(chainHitFrame + 20, durationInFrames - 20);

        cueRequests.push({
          hitFrame: chainHitFrame,
          role: 'tick',
          sourceId: `${s.scene_number}.chain-roll`,
          seedKey: `${projectId}:${s.scene_number}:chain`,
          pan: 0,
        });
        cueRequests.push({
          hitFrame: gearHitFrame,
          role: 'slide',
          sourceId: `${s.scene_number}.gear-slide`,
          seedKey: `${projectId}:${s.scene_number}:gear`,
          pan: 0,
        });
        cueRequests.push({
          hitFrame: shineHitFrame,
          role: 'chime',
          sourceId: `${s.scene_number}.cta-sting`,
          seedKey: `${projectId}:${s.scene_number}:cta`,
          pan: 0,
        });
      }

      // Scene transition: no repetitive transition whoosh between scenes
      // Motion sounds are strictly mapped to purposeful, unique object movements.

      // Sort by hitFrame
      cueRequests.sort((a, b) => a.hitFrame - b.hitFrame);

      // Resolve cues from sfxService, shifting start frame by transient duration for exact hits
      const audioCues = await Promise.all(
        cueRequests.map(async (req) => {
          const cueInfo = await sfxService.getCueForRole(req.role, req.seedKey, fps, sfxLibrarySeed, sfxScope, sfxPack, req.pan ?? 0);
          const startFrame = Math.max(0, req.hitFrame - cueInfo.transientFrames);
          return {
            frame: startFrame,
            hitFrame: req.hitFrame,
            src: cueInfo.src,
            role: cueInfo.role,
            volume: cueInfo.volume,
            durationFrames: cueInfo.durationFrames,
            transientMs: cueInfo.transientMs,
            pan: cueInfo.pan,
            sourceId: req.sourceId,
          };
        })
      );
      scenesPrepared += 1;
      if (progressCallback) {
        await progressCallback(22 + Math.round((scenesPrepared / scenePlan.length) * 16), `Prepared visual assets and motion for scene ${scenesPrepared}/${scenePlan.length}`);
      }

      return {
        id: `S${String(s.scene_number).padStart(2, '0')}`,
        scene_number: s.scene_number,
        role: s.role,
        template: s.template || s.layout,
        keyword: s.keyword,
        emphasis_words: s.emphasis_words,
        hero_asset: s.hero_asset,
        secondary_assets: s.secondary_assets,
        decoration: s.decoration,
        motion_in: s.motion_in,
        motion_loop: s.motion_loop,
        camera: s.camera,
        title: s.on_screen_text.slice(0, 35),
        on_screen_text: s.on_screen_text,
        subtitle: s.subtitle,
        key_takeaways: s.key_takeaways,
        concept_nodes: s.concept_nodes,
        metric_data: s.metric_data,
        start: startFrame,
        startFrame,
        voiceStart: timelineItem.voiceStart,
        visualStart: timelineItem.visualStart,
        frames: durationInFrames,
        visual_direction: s.visual_direction,
        duration_sec: durationSec,
        // The planner authors motion_plan frame indices assuming this ORIGINAL
        // estimated duration at a fixed 30fps. durationSec above is the REAL,
        // measured-audio duration (can differ in length and in fps). The
        // deterministic renderer needs both to rescale motion_plan correctly.
        plannedDurationSec: Number(s.duration_sec) || durationSec,
        durationInFrames,
        transitionOutFrames,
        visualType,
        visual_type: (idx === scenePlan.length - 1 || s.role === 'cta') 
          ? 'outro' 
          : (s.visual_type || s.template || s.layout || styleBrief?.archetype || 'callout'),
        themeColor,
        narration: s.narration,
        narrationAudio: narration?.staticUrl,
        narrationDurationSec: narration?.durationSec,
        words: (narration?.words || []).map((w: any) => ({
          ...w,
          startFrame: Number.isFinite(w.startSec) ? Math.round(w.startSec * fps) : w.startFrame,
          endFrame: Number.isFinite(w.endSec) ? Math.round(w.endSec * fps) : w.endFrame,
        })),
        audioCues,
        nodes: (s.visual_blueprint?.objects || []).map((o: any) => ({ label: o.label || o.id, sub: o.detail || '' })),
        labels: [s.on_screen_text, s.keyword].filter(Boolean),
        image_url: imageUrl,
        image_assets: imageAssets,
        visualBlueprint: blueprint,
        styleBrief,
        motion_cue: s.motion_cue,
        continuity_to_next: s.continuity_to_next,
        motion: s.motion || [],
        continuity: {
          fromPrevious: s.continuity_from_previous || (idx === 0 ? 'opening' : 'carried from previous scene as specified by the active CLI'),
          toNext: s.continuity_to_next
        }
      };
    }));

    // Claude writes the whole film in one pass; there is no template fallback.
    if (progressCallback) await progressCallback(37, 'Claude designing the full continuous video...');
    // Hand-drawn projects: the Claude agent paints the video later with the claude-drawing skill,
    // so the one-shot TSX authoring call is skipped here.
    const drawingStyle = await this.projectDrawingStyle(projectId);
    const claudeVideoPath = drawingStyle ? undefined : await this.authorAndStageFullVideo({
      projectId,
      projectTitle,
      scenes: formattedScenes,
      fps,
      styleBrief,
      sfx: { librarySeed: sfxLibrarySeed, scope: sfxScope, pack: sfxPack },
    });

    // Video duration is strictly the sum of all scene frame durations (zero gaps, zero overlaps)
    const totalFrames = formattedScenes.reduce((acc: number, s: any) => acc + s.durationInFrames, 0);

    if (progressCallback) await progressCallback(40, 'Generating ambient soundscape & background audio bed...');
    console.log(`[RendersService] Narration generated (${(narrationDurationSec).toFixed(1)}s total). Generating audio bed & master track...`);
    const backgroundAudioUrl = await audioBedService.generate(projectId, renderType, renderVersion, totalFrames / fps);

    if (progressCallback) await progressCallback(43, 'Mixing 1-track master audio (narration + sfx + background bed)...');
    // Mix narration + sfx + background bed into ONE unified master audio track
    const masterAudioUrl = await audioMixerService.mixMasterAudio({
      projectId,
      renderType,
      renderVersion,
      fps,
      totalDurationFrames: totalFrames,
      scenes: formattedScenes,
      backgroundAudioUrl,
    });

    if (progressCallback) await progressCallback(46, 'Synchronizing word-level captions to exact audio frames...');
    console.log('[RendersService] Synchronizing word-level captions...');
    const sceneCaptions = formattedScenes.map((scene: any) => {
      if (Array.isArray(scene.words) && scene.words.length > 0) {
        return scene.words.map((w: any) => ({
          word: String(w.word || ''),
          startFrame: Math.round(Number(w.startFrame || 0)),
          endFrame: Math.max(Math.round(Number(w.startFrame || 0)) + 1, Math.round(Number(w.endFrame || 0))),
        }));
      }
      return this.buildWordCaptions(
        scene.narration,
        scene.narrationDurationSec || scene.durationInFrames / fps,
        fps
      );
    });
    const captions = formattedScenes.flatMap((scene: any, index: number) => {
      const captionsForScene = sceneCaptions[index];
      const sceneCaptionsWithOffset = captionsForScene.map((caption: any) => ({
        ...caption,
        startFrame: caption.startFrame + scene.startFrame,
        endFrame: caption.endFrame + scene.startFrame,
      }));
      return sceneCaptionsWithOffset;
    });
    console.log(`[RendersService] Prepared ${captions.length} captions and Remotion scene data.`);
    if (progressCallback) await progressCallback(49, 'Remotion scene properties & caption timings locked.');

    const payload = {
      video: {
        title: projectTitle,
        width: 1080,
        height: 1920,
        fps,
        durationInFrames: totalFrames,
        targetDurationSec: totalFrames / fps,
        style: 'CLI-authored content-specific motion plan rendered by Remotion',
        generatedBy: activeProviderService.get(),
        sourceProjectId: projectId,
        previewVersion: renderVersion,
        scriptVersion: script.version,
        audioUrl: masterAudioUrl || undefined,
        audioDurationSec: narrationDurationSec || undefined,
        backgroundAudioUrl: masterAudioUrl ? undefined : backgroundAudioUrl,
        captions,
        styleBrief,
        styleProfile,
        claudeVideoPath,
        drawingStyle: drawingStyle?.id,
      },
      scenes: formattedScenes
    };

    const renderDataPath = projectPaths.renderData(projectId, renderType, renderVersion);
    await fs.mkdir(projectPaths.renderDataDir, { recursive: true });
    await fs.writeFile(renderDataPath, JSON.stringify(payload, null, 2), 'utf-8');
    const projectAssetDir = path.join(projectPaths.backendMedia, 'projects', projectId, 'previews', `v${renderVersion}`);
    await fs.mkdir(projectAssetDir, { recursive: true });
    await fs.writeFile(path.join(projectAssetDir, 'asset-manifest.json'), JSON.stringify({ projectId, scriptVersion: script.version, previewVersion: renderVersion, assets: projectAssets }, null, 2), 'utf-8');
    const cueManifest = formattedScenes.flatMap((scene: any, sceneIndex: number) => {
      const cues = (scene.audioCues || []).map((cue: any, cueIndex: number) => ({
        hitFrame: scene.startFrame + (cue.hitFrame ?? cue.frame),
        startFrame: scene.startFrame + cue.frame,
        transientMs: cue.transientMs,
        src: cue.src,
        role: cue.role || (cueIndex === 0 ? 'appear' : 'motion'),
        sourceId: cue.sourceId || `${scene.id}.object-${cueIndex + 1}`,
      }));
      return cues;
    });
    await fs.writeFile(`${renderDataPath}.cues.json`, JSON.stringify(cueManifest, null, 2), 'utf-8');
    console.log(`[RendersService] Prepared isolated ${activeProviderService.get()} render props at ${renderDataPath} with ${formattedScenes.length} scenes (${totalFrames} frames) and per-scene narration audio.`);
    return renderDataPath;
  }

  /**
   * Request a preview render. Strictly verifies Gate 1 (Script Approval).
   */
  async createPreviewRender(projectId: string, scriptVersion: number, visualFeedback?: string): Promise<RenderJob> {
    // GATE 1 CHECK: Is script approved?
    const isScriptApproved = await approvalsService.isScriptApproved(projectId, scriptVersion);
    if (!isScriptApproved) {
      throw new Error(`Gate 1 Violation: Script v${scriptVersion} must be explicitly approved before rendering a preview.`);
    }

    // Get current project
    const projectRes = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
    if (projectRes.rows.length === 0) {
      throw new Error('Project not found');
    }
    const activeRenderRes = await query(
      `SELECT * FROM render_jobs
       WHERE project_id = $1 AND render_type = 'preview' AND status IN ('queued', 'rendering')
       ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    );
    if (activeRenderRes.rows.length > 0) {
      const activeJob = activeRenderRes.rows[0];
      const jobAgeMs = Date.now() - new Date(activeJob.created_at).getTime();
      if (jobAgeMs < 300000) { // If less than 5 minutes old, return active job safely
        console.log(`[RendersService] Preview render ${activeJob.id} is already active (${activeJob.status}). Returning active job.`);
        return activeJob;
      }
      // If older than 5 minutes, mark superseded and continue
      await query(`UPDATE render_jobs SET status = 'failed', errors = 'Superseded by fresh render request' WHERE id = $1`, [activeJob.id]);
    }

    // Fetch the approved script data
    const scriptRes = await query(
      `SELECT * FROM scripts WHERE project_id = $1 AND version = $2`,
      [projectId, scriptVersion]
    );
    const script = scriptRes.rows[0];
    if (!script) {
      throw new Error(`Script v${scriptVersion} was not found for this project.`);
    }
    const packageRow = await productionPackageService.latest(projectId, scriptVersion);
    if (packageRow && packageRow.status !== 'ready') {
      if (process.env.REMOTE_PRODUCTION_WORKER !== '1') {
        void this.prepareCliProductionPackage(projectId, scriptVersion)
          .catch((error: any) => productionPackageService.fail(projectId, packageRow.package_version, String(error?.message || error)));
      }
      throw new Error('The CLI production package is still being prepared. Wait until its media, audio, timing metadata, and Remotion props are ready.');
    }

    const currentPreviewVersion = (projectRes.rows[0].current_preview_version || 0) + 1;
    const previewUrl = `/media/previews/${projectId}_preview_v${currentPreviewVersion}.mp4`;

    const renderJobRes = await query(
      `INSERT INTO render_jobs (
        project_id, render_type, preview_version, script_version, status, progress, output_location
      ) VALUES ($1, 'preview', $2, $3, 'queued', 0, $4)
      RETURNING *`,
      [projectId, currentPreviewVersion, scriptVersion, previewUrl]
    );

    await query(
      `UPDATE projects
       SET stage = 'preview_render', status = 'Rendering preview', current_preview_version = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [projectId, currentPreviewVersion]
    );

    // Do not hold the browser request open for the full Remotion render.
    void this.processPreviewRender(
      renderJobRes.rows[0].id,
      projectId,
      currentPreviewVersion,
      projectRes.rows[0].title,
      script,
      visualFeedback
    );

    return renderJobRes.rows[0];
  }

  /**
   * Revise an existing preview's visual animation code (Gate 2 Human-in-the-loop correction).
   * Spawns the AI agent to update the TSX code in the workspace according to visual feedback,
   * stages the updated code, increments preview version, and renders a new preview video.
   */
  async revisePreview(projectId: string, visualFeedback: string): Promise<RenderJob> {
    const projectRes = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
    if (projectRes.rows.length === 0) throw new Error('Project not found');
    const project = projectRes.rows[0];
    const scriptVersion = Number(project.current_script_version || 1);

    const isScriptApproved = await approvalsService.isScriptApproved(projectId, scriptVersion);
    if (!isScriptApproved) {
      throw new Error(`Gate 1 Violation: Script v${scriptVersion} must be explicitly approved before revising preview visuals.`);
    }

    const scriptRes = await query(`SELECT * FROM scripts WHERE project_id = $1 AND version = $2`, [projectId, scriptVersion]);
    const script = scriptRes.rows[0];
    if (!script) throw new Error(`Script v${scriptVersion} not found`);

    const latestPackage = await productionPackageService.latestReady(projectId, scriptVersion);
    if (!latestPackage?.package_path) {
      throw new Error('Production package not ready for visual revision.');
    }
    if (getDrawingStyle(project.drawing_style)) {
      realtime.publish({
        type: 'pipeline_progress',
        projectId,
        stage: 'preview_revision',
        progress: 25,
        status: `Claude agent redrawing the video with your feedback: "${visualFeedback.slice(0, 60)}..."`
      });
      return this.createPreviewRender(projectId, scriptVersion, visualFeedback);
    }
    const packagePayload = JSON.parse(await fs.readFile(latestPackage.package_path, 'utf8'));
    const remotionProps = packagePayload.remotionProps;
    const fps = Number(remotionProps?.video?.fps || 30);

    realtime.publish({
      type: 'pipeline_progress',
      projectId,
      stage: 'preview_revision',
      progress: 25,
      status: `Claude revising the video according to your feedback: "${visualFeedback.slice(0, 60)}..."`
    });

    const previewVersion = Number(project.current_preview_version || 1);
    const sfxPack = (remotionProps?.video?.styleBrief?.sfxPack || 'digital');
    const sfxLibrarySeed = `${projectId}:preview:${previewVersion}:${sfxPack}`;
    const sfxScope = { projectId, previewVersion };
    const sceneList: any[] = remotionProps.scenes || [];

    // Claude revises the whole film with the feedback, seeing its current version.
    // Older per-scene/template projects are re-authored as one continuous film.
    const existingPath = path.join(projectPaths.remotionRoot, 'src', 'projects', projectId, 'ClaudeVideo.tsx');
    const previousSource = remotionProps.video?.claudeVideoPath
      ? await fs.readFile(existingPath, 'utf8').catch(() => undefined)
      : undefined;
    remotionProps.video.claudeVideoPath = await this.authorAndStageFullVideo({
      projectId,
      projectTitle: project.title,
      scenes: sceneList,
      fps,
      styleBrief: remotionProps.video?.styleBrief,
      sfx: { librarySeed: sfxLibrarySeed, scope: sfxScope, pack: sfxPack },
      feedback: visualFeedback,
      previousSource,
    });

    packagePayload.remotionProps = remotionProps;
    packagePayload.tsxSource = buildGeneratedVideoSource(remotionProps.scenes, remotionProps.video);
    await fs.writeFile(latestPackage.package_path, JSON.stringify(packagePayload, null, 2), 'utf8');

    // Launch a new preview render (this automatically increments preview version to v2, v3, etc.)
    return this.createPreviewRender(projectId, scriptVersion, visualFeedback);
  }

  /**
   * Has Claude write the whole film, saves it as the project's ClaudeVideo.tsx,
   * and turns its declared hit moments into per-scene SFX cues.
   */
  private async authorAndStageFullVideo(opts: {
    projectId: string;
    projectTitle: string;
    scenes: any[];
    fps: number;
    styleBrief?: any;
    sfx: { librarySeed: string; scope: { projectId: string; previewVersion: number }; pack: any };
    feedback?: string;
    previousSource?: string;
  }): Promise<string> {
    const { projectId, scenes, fps, sfx } = opts;
    const durationInFrames = scenes.reduce((end: number, s: any) => Math.max(end, (s.start ?? s.startFrame ?? 0) + s.durationInFrames), 0);
    const authored = await unifiedCliProvider.authorFullVideo({
      projectId,
      projectTitle: opts.projectTitle,
      fps,
      durationInFrames,
      outroFrames: Math.min(durationInFrames, OUTRO_SECONDS * fps),
      styleBrief: opts.styleBrief,
      scenes: scenes.map((s: any) => ({
        scene_number: s.scene_number,
        start: s.start ?? s.startFrame ?? 0,
        durationInFrames: s.durationInFrames,
        narration: s.narration,
        on_screen_text: s.on_screen_text,
        visual_direction: s.visual_direction,
        motion_cue: s.motion_cue,
        continuity_to_next: s.continuity_to_next,
        words: s.words || [],
      })),
      feedback: opts.feedback,
      previousSource: opts.previousSource,
    });

    const projectDir = path.join(projectPaths.remotionRoot, 'src', 'projects', projectId);
    await fs.mkdir(projectDir, { recursive: true });
    await fs.writeFile(path.join(projectDir, `${CLAUDE_VIDEO_FILE}.tsx`), authored.tsxSource, 'utf8');

    if (authored.soundEvents.length > 0) {
      const roles = ['pop', 'click', 'tick', 'whoosh', 'slide', 'riser', 'impact', 'sparkle', 'chime', 'draw', 'count', 'ding'] as const;
      for (const scene of scenes) scene.audioCues = [];
      await Promise.all(authored.soundEvents.map(async (evt, cueIndex) => {
        const scene = scenes.find((s: any) => {
          const start = s.start ?? s.startFrame ?? 0;
          return evt.frame >= start && evt.frame < start + s.durationInFrames;
        });
        if (!scene) return;
        const rawRole = String(evt.role || '').toLowerCase();
        let role: SfxRole = 'pop';
        if (roles.includes(rawRole as any)) {
          role = rawRole as SfxRole;
        } else if (/key|type|code|terminal|keyboard/i.test(rawRole)) {
          role = 'tick';
        } else if (/shutter|camera|button|switch|toggle|tap|click/i.test(rawRole)) {
          role = 'click';
        } else if (/drop|boom|slam|crash|heavy|bass|thud|impact|smash/i.test(rawRole)) {
          role = 'impact';
        } else if (/glitch|pulse|laser|hum|sweep|fly|whoosh/i.test(rawRole)) {
          role = 'whoosh';
        } else if (/bell|chime|ring|success|win|check|ding/i.test(rawRole)) {
          role = 'ding';
        } else if (/glow|spark|shine|magic/i.test(rawRole)) {
          role = 'sparkle';
        } else if (/rise|build|charge|swell/i.test(rawRole)) {
          role = 'riser';
        } else if (/line|path|draw|write/i.test(rawRole)) {
          role = 'draw';
        } else if (/count|stat|num|score/i.test(rawRole)) {
          role = 'count';
        }
        const hitFrame = evt.frame - (scene.start ?? scene.startFrame ?? 0);
        const cueInfo = await sfxService.getCueForRole(role, `${projectId}:film:${cueIndex}`, fps, sfx.librarySeed, sfx.scope, sfx.pack, 0);
        scene.audioCues.push({
          frame: Math.max(0, hitFrame - cueInfo.transientFrames),
          hitFrame,
          src: cueInfo.src,
          role: cueInfo.role,
          volume: cueInfo.volume,
          durationFrames: cueInfo.durationFrames,
          transientMs: cueInfo.transientMs,
          pan: cueInfo.pan,
          sourceId: `film.cue-${cueIndex + 1}`,
        });
      }));
      for (const [sceneIndex, scene] of scenes.entries()) {
        if (!Array.isArray(scene.audioCues) || scene.audioCues.length === 0) {
          const role: SfxRole = sceneIndex === scenes.length - 1 ? 'chime' : 'pop';
          const cueInfo = await sfxService.getCueForRole(role, `${projectId}:fallback:${sceneIndex}`, fps, sfx.librarySeed, sfx.scope, sfx.pack, 0);
          scene.audioCues = [{
            frame: 0,
            hitFrame: 0,
            src: cueInfo.src,
            role: cueInfo.role,
            volume: cueInfo.volume,
            durationFrames: cueInfo.durationFrames,
            transientMs: cueInfo.transientMs,
            pan: cueInfo.pan,
            sourceId: `fallback.cue-${sceneIndex + 1}`,
          }];
        }
        scene.audioCues.sort((a: any, b: any) => a.hitFrame - b.hitFrame);
      }
    }
    return CLAUDE_VIDEO_FILE;
  }

  private async stageProjectRemotionFiles(projectId: string, tsxSource: string): Promise<void> {
    const projectDir = path.join(projectPaths.remotionRoot, 'src', 'projects', projectId);
    await fs.mkdir(projectDir, { recursive: true });

    // 1. Isolated GeneratedVideo.tsx
    const projectTsx = tsxSource
      .replace(/from\s+['"]\.\/components\/([^'"]+)['"]/g, "from '../../components/$1'")
      .replace(/from\s+['"]\.\/lib\/([^'"]+)['"]/g, "from '../../lib/$1'");
    await fs.writeFile(path.join(projectDir, 'GeneratedVideo.tsx'), projectTsx, 'utf8');

    // 2. Isolated Composition.tsx
    const compositionCode = `import React from 'react';
import { Audio, Sequence } from 'remotion';
import GeneratedVideo from './GeneratedVideo';
import { SceneDataPayload } from '../../data/sceneTypes';
import { assetSource } from '../../assetSource';

export const MainComposition: React.FC<SceneDataPayload> = (sceneData) => {
  const masterAudioUrl = sceneData?.video?.audioUrl;
  const backgroundAudioUrl = sceneData?.video?.backgroundAudioUrl;
  const scenes = sceneData?.scenes || [];
  let accumulatedFrame = 0;

  return (
    <>
      <GeneratedVideo {...(sceneData as any)} />
      {masterAudioUrl && <Audio src={assetSource(masterAudioUrl)} volume={1.0} />}
      {!masterAudioUrl && backgroundAudioUrl && <Audio src={assetSource(backgroundAudioUrl)} volume={0.25} loop />}
      {!masterAudioUrl &&
        scenes.map((scene, sceneIndex) => {
          const fromFrame = (scene as any).start !== undefined
            ? (scene as any).start
            : ((scene as any).startFrame !== undefined ? (scene as any).startFrame : accumulatedFrame);
          const durationFrames = scene.durationInFrames || (scene as any).frames || 90;
          accumulatedFrame = fromFrame + durationFrames;

          return (
            <React.Fragment key={\`audio-scene-\${scene.id || sceneIndex}\`}>
              {scene.narrationAudio && (
                <Sequence from={fromFrame} durationInFrames={durationFrames}>
                  <Audio src={assetSource(scene.narrationAudio)} volume={1.0} />
                </Sequence>
              )}
              {scene.audioCues?.map((cue, cueIdx) => {
                if (!cue?.src) return null;
                return (
                  <Sequence
                    key={\`cue-\${scene.id || sceneIndex}-\${cueIdx}\`}
                    from={fromFrame + (cue.frame ?? cue.hitFrame ?? 0)}
                    durationInFrames={cue.durationFrames || 60}
                  >
                    <Audio src={assetSource(cue.src)} volume={cue.volume ?? 0.6} />
                  </Sequence>
                );
              })}
            </React.Fragment>
          );
        })}
    </>
  );
};
export default MainComposition;
`;
    await fs.writeFile(path.join(projectDir, 'Composition.tsx'), compositionCode, 'utf8');

    // 3. Isolated Root.tsx (JSX)
    const rootCode = `import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { MainComposition } from './Composition';
import { SceneDataPayload } from '../../data/sceneTypes';
import { normalizeSceneData } from '../../data/normalizeSceneData';

const calcTimelineDuration = (scenes: any[] = []) =>
  scenes.reduce((total, scene) => total + (scene.durationInFrames || (scene as any).frames || 90), 0) || 900;

export const ProjectRoot: React.FC = () => {
  const rawInput = getInputProps();
  const resolvedProps = normalizeSceneData(rawInput) || (rawInput as unknown as SceneDataPayload);
  const mainFps = resolvedProps?.video?.fps || 30;
  const mainDuration = resolvedProps?.video?.durationInFrames || calcTimelineDuration(resolvedProps?.scenes);

  return (
    <Composition
      id="MainComposition"
      component={MainComposition as unknown as React.FC<Record<string, unknown>>}
      defaultProps={resolvedProps as unknown as Record<string, unknown>}
      durationInFrames={mainDuration}
      fps={mainFps}
      width={resolvedProps?.video?.width || 1080}
      height={resolvedProps?.video?.height || 1920}
    />
  );
};
`;
    await fs.writeFile(path.join(projectDir, 'Root.tsx'), rootCode, 'utf8');

    // 4. Isolated index.ts (Pure TypeScript entrypoint)
    const indexCode = `import { registerRoot } from 'remotion';
import { ProjectRoot } from './Root';

registerRoot(ProjectRoot);
`;
    await fs.writeFile(path.join(projectDir, 'index.ts'), indexCode, 'utf8');

    // 4. Also keep legacy GeneratedCliVideo.tsx in root src for compatibility
    // (the frontend's live preview -- LiveRemotionPreview.tsx -- imports this
    // shared root copy directly, so its relative imports must resolve from
    // remotion/src/, not from remotion/src/projects/<id>/ like the isolated
    // copy above). Per-scene bespoke components only ever exist under this
    // project's own scenes/ folder, so point there explicitly.
    const rootSrcTsx = tsxSource
      .replace(/from\s+['"]\.\.\/\.\.\/components\/([^'"]+)['"]/g, "from './components/$1'")
      .replace(/from\s+['"]\.\.\/\.\.\/lib\/([^'"]+)['"]/g, "from './lib/$1'")
      .replace(/from\s+['"]\.\.\/\.\.\/data\/([^'"]+)['"]/g, "from './data/$1'")
      .replace(/from\s+['"]\.\/scenes\/([^'"]+)['"]/g, `from './projects/${projectId}/scenes/$1'`)
      .replace(/from\s+['"]\.\/ClaudeVideo['"]/g, `from './projects/${projectId}/ClaudeVideo'`);
    const generatedTsxPath = path.join(projectPaths.remotionRoot, 'src', 'GeneratedCliVideo.tsx');
    await fs.writeFile(generatedTsxPath, rootSrcTsx, 'utf8');
    console.log(`[RendersService] Project ${projectId} isolated Remotion component and entry staged at ${projectDir}`);
  }

  private async useCliProductionPackage(projectId: string, scriptVersion: number, previewVersion: number): Promise<string> {
    const packageRow = await productionPackageService.latestReady(projectId, scriptVersion);
    if (!packageRow?.package_path) {
      throw new Error('The CLI production package is not ready. Wait for the active CLI to finish its production design and for the backend to stage audio, timing metadata, and Remotion props.');
    }
    const packagePayload = JSON.parse(await fs.readFile(packageRow.package_path, 'utf8'));
    const props = JSON.parse(JSON.stringify(packagePayload.remotionProps));
    if (!props || typeof props !== 'object' || !Array.isArray((props as any).scenes) || !(props as any).video) {
      throw new Error('The CLI production package contains invalid Remotion props.');
    }
    props.video.previewVersion = previewVersion;
    for (const [sceneIndex, scene] of (props.scenes || []).entries()) {
      if (!Array.isArray(scene.audioCues) || scene.audioCues.length === 0) {
        scene.audioCues = [{
          frame: 0,
          hitFrame: 0,
          src: '/media/audio/sfx/pop_01.wav',
          role: sceneIndex === props.scenes.length - 1 ? 'chime' : 'pop',
          volume: 0.5,
          durationFrames: 15,
          transientMs: 20,
          pan: 0,
          sourceId: `fallback.cue-${sceneIndex + 1}`,
        }];
      }
    }
    const renderDataPath = projectPaths.renderData(projectId, 'preview', previewVersion);
    await fs.mkdir(projectPaths.renderDataDir, { recursive: true });
    await fs.writeFile(renderDataPath, JSON.stringify(props, null, 2), 'utf8');

    // Rebuild wiring from the scene list so older packages pick up the current timeline/outro.
    await this.stageProjectRemotionFiles(projectId, buildGeneratedVideoSource(props.scenes, props.video));

    // Always derive global frames from scene-local Remotion cues. Older
    // packages stored local frames in `audio`; trusting them shifts later
    // scenes and produces missing/late hits during verification.
    const cueManifest = this.buildCueManifestFromProps(props);
    if (cueManifest.length) {
      await fs.writeFile(`${renderDataPath}.cues.json`, JSON.stringify(cueManifest, null, 2), 'utf8');
    }
    return renderDataPath;
  }

  private buildCueManifestFromProps(props: any) {
    let runningOffset = 0;
    return (props.scenes || []).flatMap((scene: any, sceneIndex: number) => {
      const sceneStart = Number(scene.start ?? scene.startFrame ?? runningOffset);
      const cues = (scene.audioCues || []).filter((cue: any) => Number.isFinite(Number(cue.hitFrame ?? cue.frame))).map((cue: any, cueIndex: number) => ({
        hitFrame: sceneStart + Number(cue.hitFrame ?? cue.frame),
        startFrame: sceneStart + Number(cue.frame ?? cue.hitFrame),
        transientMs: Number(cue.transientMs || 0),
        src: cue.src,
        role: cue.role || 'motion',
        sourceId: cue.sourceId || `${scene.id || sceneIndex}.cue-${cueIndex + 1}`,
      }));
      runningOffset = sceneStart + Number(scene.durationInFrames || scene.frames || 0);
      return cues;
    });
  }

  async prepareCliProductionPackage(projectId: string, scriptVersion: number): Promise<void> {
    const packageRow = await productionPackageService.latest(projectId, scriptVersion);
    if (!packageRow || packageRow.status === 'ready') return;
    await query(`UPDATE production_packages SET status = 'building', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [packageRow.id]);
    try {
    const projectResult = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
    const scriptResult = await query(`SELECT * FROM scripts WHERE project_id = $1 AND version = $2`, [projectId, scriptVersion]);
    if (!projectResult.rows[0] || !scriptResult.rows[0]) throw new Error('Project or approved script not found for production preparation.');
    const approvedScript = scriptResult.rows[0];

    const previewVersion = Number(projectResult.rows[0].current_preview_version || 0) + 1;
    const publishPackageProgress = async (progress: number, status: string) => {
      realtime.publish({
        type: 'render_progress',
        projectId,
        renderType: 'preview',
        previewVersion,
        progress,
        status,
      });
      realtime.publish({
        type: 'pipeline_progress',
        projectId,
        stage: 'animation_prepare',
        progress,
        status,
      });
    };

    // 1. Synthesize approved narration audio & extract authoritative word-level alignment
    await publishPackageProgress(15, 'Synthesizing narration speech & extracting word alignment timestamps...');
    const audioProgress = async (progress: number, status: string) => publishPackageProgress(15 + Math.round(progress * 0.35), status);
    const propsPath = await this.writeRemotionSceneData(projectId, projectResult.rows[0].title, approvedScript, previewVersion, 'preview', audioProgress);
    const remotionProps = JSON.parse(await fs.readFile(propsPath, 'utf8'));

    // 2. Visuals render deterministically from the same visual_blueprint/motion_plan
    // that the SFX cues above were already anchored to -- no second, blind LLM call
    // re-invents the picture, so sound and motion can never drift apart again.
    await publishPackageProgress(52, 'Staging deterministic blueprint renderer...');
    const cueManifest = this.buildCueManifestFromProps(remotionProps);
    await fs.writeFile(`${propsPath}.cues.json`, JSON.stringify(cueManifest, null, 2), 'utf8');

    const manifestPath = path.join(projectPaths.backendMedia, 'projects', projectId, 'previews', `v${previewVersion}`, 'asset-manifest.json');
    let manifest: any = {};
    try { manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch { /* procedural-only projects have no manifest */ }

    // 3. Validate & stage production package
    await productionPackageService.receive(projectId, Number(packageRow.package_version), {
      generatedBy: unifiedCliProvider.name,
      tsxSource: buildGeneratedVideoSource(remotionProps.scenes, remotionProps.video),
      remotionProps,
      assets: manifest.assets || [],
      audio: cueManifest,
      captions: remotionProps.video.captions || [],
    });

    await publishPackageProgress(58, 'Animation package prepared; launching preview render...');
    await this.createPreviewRender(projectId, scriptVersion);
    } catch (err: any) {
      await query(`UPDATE production_packages SET status = 'failed', error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [packageRow.id, err?.message || 'Production preparation failed']);
      await query(`UPDATE projects SET stage = 'failed', status = 'Active CLI production package failed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [projectId]);
      realtime.publish({
        type: 'pipeline_progress',
        projectId,
        stage: 'failed',
        progress: 100,
        status: `Active CLI production package failed: ${(err?.message || '').slice(0, 100)}`
      });
      realtime.publish({
        type: 'project_updated',
        projectId,
        stage: 'failed',
        status: 'Active CLI production package failed'
      });
      throw err;
    }
  }

  private async processPreviewRender(
    renderJobId: string,
    projectId: string,
    previewVersion: number,
    projectTitle: string,
    script: any,
    visualFeedback?: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE render_jobs SET status = 'rendering', progress = 5, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [renderJobId]
      );
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 5, status: 'Preparing dynamic CLI render' });

      // Prepare and render the exact Remotion composition that Gate 2 reviews.
      const publishPreviewProgress = async (progress: number, status: string) => {
        await query(
          `UPDATE render_jobs SET progress = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [renderJobId, progress]
        );
        realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress, status });
        realtime.publish({ type: 'pipeline_progress', projectId, stage: 'preview_render', progress, status });
      };
      // Always require the CLI production package so that every video plan and TSX is authored directly by the CLI agent
      let propsPath: string;
      const latestReady = await productionPackageService.latestReady(projectId, script.version);
      if (latestReady) {
        propsPath = await this.useCliProductionPackage(projectId, script.version, previewVersion);
      } else {
        await this.prepareCliProductionPackage(projectId, script.version);
        propsPath = await this.useCliProductionPackage(projectId, script.version, previewVersion);
      }
      const previewProps = JSON.parse(await fs.readFile(propsPath, 'utf8'));
      const previewDiskPath = path.join(projectPaths.backendMedia, 'previews', `${projectId}_preview_v${previewVersion}.mp4`);
      await preflightRenderProps(propsPath);
      const drawingStyle = await this.projectDrawingStyle(projectId);
      if (drawingStyle) {
        // Full-resolution agent build; the approved preview becomes the final video unchanged.
        await this.buildDrawnVideoWithAgent({
          projectId,
          projectTitle,
          propsPath,
          outputMp4: previewDiskPath,
          style: drawingStyle,
          feedback: visualFeedback,
          onProgress: publishPreviewProgress,
        });
      } else {
      await publishPreviewProgress(50, 'Preflight verified. Initializing Remotion motion renderer...');
      await videoRenderer.renderVideo({
        projectId,
        outputPath: previewDiskPath,
        title: projectTitle,
        subheading: script.scene_plan[0].subtitle,
        versionLabel: `PREVIEW • v${previewVersion}`,
        scale: 1,
        propsPath,
        scenes: previewProps.scenes,
        onProgress: async (progress, status) => {
          await publishPreviewProgress(progress, status);
        },
      });
      }
      await query(
        `UPDATE render_jobs
         SET status = 'completed', progress = 100, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [renderJobId]
      );
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 100, status: 'Preview ready for review' });
      const latestPackage = await productionPackageService.latestReady(projectId, script.version);
      if (latestPackage) {
        await productionPackageService.saveDonePackage(
          projectId,
          latestPackage.package_version,
          latestPackage.manifest || {},
          { videoDiskPath: previewDiskPath }
        ).catch(() => {});
      }

      await query(
        `UPDATE projects
         SET stage = 'preview_review', status = 'Preview ready for review', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [projectId]
      );
      realtime.publish({
        type: 'pipeline_progress',
        projectId,
        stage: 'preview_review',
        progress: 100,
        status: 'Preview ready for review'
      });
      realtime.publish({
        type: 'project_updated',
        projectId,
        stage: 'preview_review',
        status: 'Preview ready for review'
      });
    } catch (err: any) {
      const errorMessage = formatRenderFailure(err);
      console.error(`[RendersService] Preview render ${renderJobId} failed:`, errorMessage);
      await query(
        `UPDATE render_jobs
         SET status = 'failed', progress = 100, errors = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [renderJobId, errorMessage]
      );
      await query(
        `UPDATE projects
         SET stage = 'failed', status = 'Failed / Needs attention', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [projectId]
      );
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 100, status: 'Preview render failed' });
    }
  }

  /**
   * Request final video render. Strictly verifies Gate 2 (Approval of CURRENT preview version).
   */
  async createFinalRender(projectId: string): Promise<VideoRecord> {
    const projectRes = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
    if (projectRes.rows.length === 0) {
      throw new Error('Project not found');
    }
    const project = projectRes.rows[0];
    const previewVersion = project.current_preview_version;
    const scriptVersion = project.current_script_version;

    // GATE 2 CHECK: Is current preview version approved?
    const isPreviewApproved = await approvalsService.isCurrentPreviewApproved(projectId, previewVersion);
    if (!isPreviewApproved) {
      throw new Error(`Gate 2 Violation: Final render requires explicit approval of the CURRENT preview version (v${previewVersion}).`);
    }

    const scriptRes = await query(
      `SELECT * FROM scripts WHERE project_id = $1 AND version = $2`,
      [projectId, scriptVersion]
    );
    const script = scriptRes.rows[0];

    // Final render consumes the exact props and asset URLs that were used for
    // the approved browser preview. Never refetch media or regenerate audio.
    const approvedPreviewPropsPath = projectPaths.renderData(projectId, 'preview', previewVersion);
    const previewProps = JSON.parse(await fs.readFile(approvedPreviewPropsPath, 'utf8'));
    if (previewProps.video.previewVersion !== previewVersion || previewProps.video.scriptVersion !== scriptVersion) {
      throw new Error('The approved preview inputs do not match the current script and preview versions; render a fresh preview before finalizing.');
    }
    const renderPropsPath = projectPaths.renderData(projectId, 'final', previewVersion);
    await fs.mkdir(projectPaths.renderDataDir, { recursive: true });
    await fs.copyFile(approvedPreviewPropsPath, renderPropsPath);
    await fs.copyFile(`${approvedPreviewPropsPath}.cues.json`, `${renderPropsPath}.cues.json`).catch((error: any) => {
      if (error?.code !== 'ENOENT') throw error;
    });
    await preflightRenderProps(renderPropsPath);

    const drawingStyle = getDrawingStyle(project.drawing_style);
    if (!drawingStyle) {
      await this.stageProjectRemotionFiles(projectId, buildGeneratedVideoSource(previewProps.scenes, previewProps.video));
    }

    // Real output path on disk
    const diskPath = path.join(projectPaths.backendMedia, 'videos', `${projectId}_final.mp4`);
    const finalVideoUrl = `/media/videos/${projectId}_final.mp4`;

    const renderJobRes = await query(
      `INSERT INTO render_jobs (
        project_id, render_type, preview_version, script_version, status, progress, output_location
      ) VALUES ($1, 'final', $2, $3, 'rendering', 5, $4)
      RETURNING *`,
      [projectId, previewVersion, scriptVersion, finalVideoUrl]
    );
    await query(
      `UPDATE projects SET stage = 'final_render', status = 'Rendering final video', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [projectId]
    );

    // Render final high-res 1080p MP4 file via Remotion (scale 1.0)
    try {
      const publishFinalProgress = async (progress: number, status: string) => {
        await query(
          `UPDATE render_jobs SET progress = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [renderJobRes.rows[0].id, progress]
        );
        realtime.publish({
          type: 'render_progress',
          projectId,
          renderJobId: renderJobRes.rows[0].id,
          renderType: 'final',
          previewVersion,
          progress,
          status,
        });
        realtime.publish({
          type: 'pipeline_progress',
          projectId,
          stage: 'final_render',
          progress,
          status,
        });
      };

      if (drawingStyle) {
        // The agent already rendered the approved preview at full 1080x1920 quality; finalize that exact file.
        await publishFinalProgress(10, 'Finalizing the approved hand-drawn video...');
        const approvedPreview = path.join(projectPaths.backendMedia, 'previews', `${projectId}_preview_v${previewVersion}.mp4`);
        await fs.mkdir(path.dirname(diskPath), { recursive: true });
        await fs.copyFile(approvedPreview, diskPath);
      } else {
      await publishFinalProgress(10, 'Initializing 1080p final production render...');
      await videoRenderer.renderVideo({
        projectId,
        outputPath: diskPath,
        title: project.title,
        subheading: script.scene_plan[0].subtitle,
        versionLabel: `FINAL VIDEO • APPROVED v${previewVersion}`,
        scale: 1.0,
        propsPath: renderPropsPath,
        onProgress: async (progress, status) => {
          await publishFinalProgress(progress, status);
        },
      });
      }
      await publishFinalProgress(98, 'Finalizing audio normalization & quality verification...');
      await query(`UPDATE render_jobs SET status = 'completed', progress = 100, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [renderJobRes.rows[0].id]);
      realtime.publish({
        type: 'render_progress',
        projectId,
        renderJobId: renderJobRes.rows[0].id,
        renderType: 'final',
        previewVersion,
        progress: 100,
        status: 'Final video ready',
      });
    } catch (error) {
      const errorMessage = formatRenderFailure(error);
      await query(`UPDATE render_jobs SET status = 'failed', progress = 100, errors = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [renderJobRes.rows[0].id, errorMessage]);
      await query(`UPDATE projects SET stage = 'failed', status = 'Failed / Needs attention', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [projectId]);
      throw error;
    }

    const stats = await fs.stat(diskPath);
    const fileSize = stats.size;
    const finalProps = JSON.parse(await fs.readFile(renderPropsPath, 'utf8'));
    const durationSeconds = finalProps.video.durationInFrames / finalProps.video.fps;

    // Save final video record
    const videoRes = await query(
      `INSERT INTO videos (
        project_id, render_job_id, storage_url, preview_version_approved, script_version_approved, duration_seconds, file_size_bytes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [projectId, renderJobRes.rows[0].id, finalVideoUrl, previewVersion, scriptVersion, durationSeconds, fileSize]
    );

    // Update project state to completed
    await query(
      `UPDATE projects 
       SET stage = 'completed', status = 'Completed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [projectId]
    );

    const latestPackage = await productionPackageService.latestReady(projectId, scriptVersion);
    if (latestPackage) {
      await productionPackageService.saveDonePackage(
        projectId,
        latestPackage.package_version,
        latestPackage.manifest || {},
        { videoDiskPath: diskPath }
      ).catch(() => {});
    }

    return videoRes.rows[0];
  }

  /**
   * Get render jobs for a project.
   */
  async getRenderJobs(projectId: string): Promise<RenderJob[]> {
    const res = await query(
      `SELECT * FROM render_jobs WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    );
    return res.rows;
  }

  async getPreviewProps(projectId: string, previewVersion: number): Promise<unknown | null> {
    const renderDataPath = projectPaths.renderData(projectId, 'preview', previewVersion);
    try {
      return JSON.parse(await fs.readFile(renderDataPath, 'utf8'));
    } catch (error: any) {
      if (error?.code === 'ENOENT') return null;
      throw error;
    }
  }

  async getPreviewReport(projectId: string, previewVersion: number) {
    const jobResult = await query(`SELECT * FROM render_jobs WHERE project_id = $1 AND render_type = 'preview' AND preview_version = $2 LIMIT 1`, [projectId, previewVersion]);
    if (!jobResult.rows.length) return null;
    const propsPath = projectPaths.renderData(projectId, 'preview', previewVersion);
    let props: any = null;
    try { props = JSON.parse(await fs.readFile(propsPath, 'utf8')); } catch { /* report still includes job failure */ }
    const manifestPath = path.join(projectPaths.backendMedia, 'projects', projectId, 'previews', `v${previewVersion}`, 'asset-manifest.json');
    let manifest: any = null;
    try { manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch { /* remote packages may not use the legacy manifest */ }
    if (!manifest) {
      const packageResult = await query(`SELECT manifest FROM production_packages WHERE project_id = $1 AND status = 'ready' ORDER BY package_version DESC LIMIT 1`, [projectId]);
      manifest = packageResult.rows[0]?.manifest || null;
    }
    const scenes = Array.isArray(props?.scenes) ? props.scenes : [];
    const durationInFrames = Number(props?.video?.durationInFrames || 0);
    const fps = Number(props?.video?.fps || 30);
    return {
      generatedAt: new Date().toISOString(),
      render: jobResult.rows[0],
      summary: {
        status: jobResult.rows[0].status,
        durationSeconds: durationInFrames / fps,
        sceneCount: scenes.length,
        assetCount: Array.isArray(manifest?.assets) ? manifest.assets.length : 0,
        audioCueCount: scenes.reduce((sum: number, scene: any) => sum + (Array.isArray(scene.audioCues) ? scene.audioCues.length : 0), 0),
        captionCount: Array.isArray(props?.video?.captions) ? props.video.captions.length : 0,
        generatedBy: props?.video?.generatedBy || 'unknown',
      },
      scenes: scenes.map((scene: any) => ({ id: scene.id, title: scene.title, durationInFrames: scene.durationInFrames, narrationDurationSec: scene.narrationDurationSec, assetCount: scene.visualBlueprint?.objects?.filter((object: any) => object.render_spec?.type === 'image' || object.render_spec?.type === '3d').length || 0 })),
      assets: manifest?.assets || [],
    };
  }

  /**
   * Get final videos.
   */
  async getVideos(projectId?: string): Promise<VideoRecord[]> {
    if (projectId) {
      const res = await query(
        `SELECT v.*, p.title AS project_title
         FROM videos v
         JOIN projects p ON p.id = v.project_id
         WHERE v.project_id = $1
         ORDER BY v.created_at DESC`,
        [projectId]
      );
      return res.rows;
    }
    const res = await query(
      `SELECT v.*, p.title AS project_title
       FROM videos v
       JOIN projects p ON p.id = v.project_id
       ORDER BY v.created_at DESC`
    );
    return res.rows;
  }
}

export const rendersService = new RendersService();
