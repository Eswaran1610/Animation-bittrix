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
import { promisify } from 'util';
import { preflightRenderProps } from './preflight.js';
import { formatRenderFailure } from './renderDiagnostics.js';
import { productionPackageService } from '../production/productionPackageService.js';
import { unifiedCliProvider } from '../providers/cliProvider.js';
import { activeProviderService } from '../providers/activeProviderService.js';

const execFileAsync = promisify(execFile);

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
      const voiceSec = Number(narration?.durationSec || 0);
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

      // Final CTA sting: short chime or ding on the closing scene
      if (s.role === 'cta' || idx === scenePlan.length - 1) {
        const ctaHitFrame = Math.max(12, durationInFrames - 24);
        const isSpaced = cueRequests.length < 6 && lastHitTime.every((t) => Math.abs(t - ctaHitFrame) >= 12);
        if (isSpaced) {
          lastHitTime.push(ctaHitFrame);
          cueRequests.push({
            hitFrame: ctaHitFrame,
            role: 'ding',
            sourceId: `${s.scene_number}.cta-sting`,
            seedKey: `${projectId}:${s.scene_number}:cta`,
            pan: 0,
          });
        }
      }

      // Scene transition: whoosh at the midpoint of the transition
      if (transitionOutFrames > 0 && idx < scenePlan.length - 1) {
        const transitionHitFrame = durationInFrames - Math.round(transitionOutFrames / 2);
        if (cueRequests.length < 6) cueRequests.push({
          hitFrame: transitionHitFrame,
          role: 'whoosh',
          sourceId: `${s.scene_number}.transition`,
          seedKey: `${projectId}:${s.scene_number}:transition`,
          pan: idx % 2 === 0 ? -0.28 : 0.28,
        });
        if (cueRequests.length < 6) cueRequests.push({
          hitFrame: Math.min(durationInFrames - 8, transitionHitFrame + 2),
          role: sfxPack === 'cinematic' ? 'impact' : 'click',
          sourceId: `${s.scene_number}.transition-layer`,
          seedKey: `${projectId}:${s.scene_number}:transition-layer`,
          pan: idx % 2 === 0 ? 0.28 : -0.28,
        });
      }

      // Defensive fallback: ensure at least one subtle entrance sound per scene
      if (cueRequests.length === 0) {
        cueRequests.push({
          hitFrame: 14,
          role: 'pop',
          sourceId: `${s.scene_number}.appear`,
          seedKey: `${projectId}:${s.scene_number}:fallback`,
          pan: 0,
        });
      }

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
      if (audioCues.length === 0) {
        throw new Error(`Object sound generation failed for scene ${s.scene_number}; render refused without audio.`);
      }
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
        words: narration?.words || [],
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
        styleProfile
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
      script
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
    const packagePayload = JSON.parse(await fs.readFile(latestPackage.package_path, 'utf8'));
    const currentTsx = packagePayload.tsxSource;
    const remotionProps = packagePayload.remotionProps;

    realtime.publish({
      type: 'pipeline_progress',
      projectId,
      stage: 'preview_revision',
      progress: 25,
      status: `Agent revising visual animation code according to your feedback: "${visualFeedback.slice(0, 60)}..."`
    });

    // Revise the visual code using the AI Agent (Solution B)
    const revisedBundle = await unifiedCliProvider.revisePreviewVisuals({
      projectId,
      projectTitle: project.title,
      scriptVersion,
      previewVersion: Number(project.current_preview_version || 1),
      visualFeedback,
      currentTsxSource: currentTsx,
      compactScenes: remotionProps.scenes || script.scene_plan || [],
    });

    // Update the package payload with the revised TSX source
    packagePayload.tsxSource = revisedBundle.tsxSource;
    await fs.writeFile(latestPackage.package_path, JSON.stringify(packagePayload, null, 2), 'utf8');

    // Stage the updated TSX into remotion/src/projects/${projectId}/GeneratedVideo.tsx
    await this.stageProjectRemotionFiles(projectId, revisedBundle.tsxSource);

    // Launch a new preview render (this automatically increments preview version to v2, v3, etc.)
    return this.createPreviewRender(projectId, scriptVersion, visualFeedback);
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
    const rootSrcTsx = tsxSource
      .replace(/from\s+['"]\.\.\/\.\.\/components\/([^'"]+)['"]/g, "from './components/$1'")
      .replace(/from\s+['"]\.\.\/\.\.\/lib\/([^'"]+)['"]/g, "from './lib/$1'");
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
    const renderDataPath = projectPaths.renderData(projectId, 'preview', previewVersion);
    await fs.mkdir(projectPaths.renderDataDir, { recursive: true });
    await fs.writeFile(renderDataPath, JSON.stringify(props, null, 2), 'utf8');

    // Stage the TSX source code into isolated project folder and legacy fallback
    if (packagePayload.tsxSource) {
      await this.stageProjectRemotionFiles(projectId, packagePayload.tsxSource);
    }

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

    // 2. CLI generates content-specific Remotion TSX code aligned to the measured audio timestamps
    await publishPackageProgress(52, 'CLI authoring scene-specific Remotion TSX code aligned to audio...');
    const productionBundle = await unifiedCliProvider.generateApprovedProductionPackage({
      projectId,
      projectTitle: projectResult.rows[0].title,
      scriptVersion,
      scenePlan: approvedScript.scene_plan,
      measuredScenes: remotionProps.scenes,
      styleBrief: remotionProps.video?.styleBrief,
    });

    // 3. Merge visual metadata & audio design cues into Remotion props
    if (Array.isArray(productionBundle.scenes) && productionBundle.scenes.length === remotionProps.scenes.length) {
      remotionProps.scenes = remotionProps.scenes.map((s: any, idx: number) => {
        const prod = productionBundle.scenes![idx] || {};
        return {
          ...s,
          visual_type: prod.visual_type || s.visual_type,
          nodes: prod.nodes || s.nodes,
          labels: prod.labels || s.labels,
          edges: prod.edges || s.edges,
          emphasis_word: prod.emphasis_word || s.emphasis_word,
          icon: prod.icon || s.icon,
          stat_value: prod.stat_value || s.stat_value,
        };
      });
    }

    if (productionBundle.audioDesign?.scenes?.length) {
      productionBundle.audioDesign.scenes.forEach((adScene: any, idx: number) => {
        if (remotionProps.scenes[idx]) {
          remotionProps.scenes[idx].production_audio_design = adScene;
          if (Array.isArray(adScene.cues) && adScene.cues.length > 0) {
            remotionProps.scenes[idx].audioCues = adScene.cues;
          }
        }
      });
    }
    await fs.writeFile(propsPath, JSON.stringify(remotionProps, null, 2), 'utf8');
    const cueManifest = this.buildCueManifestFromProps(remotionProps);
    await fs.writeFile(`${propsPath}.cues.json`, JSON.stringify(cueManifest, null, 2), 'utf8');

    const manifestPath = path.join(projectPaths.backendMedia, 'projects', projectId, 'previews', `v${previewVersion}`, 'asset-manifest.json');
    let manifest: any = {};
    try { manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch { /* procedural-only projects have no manifest */ }

    // 4. Validate & stage production package
    await productionPackageService.receive(projectId, Number(packageRow.package_version), {
      generatedBy: unifiedCliProvider.name,
      tsxSource: productionBundle.tsxSource,
      remotionProps,
      assets: manifest.assets || [],
      audio: this.buildCueManifestFromProps(remotionProps),
      captions: remotionProps.video.captions || [],
      productionDesign: productionBundle.audioDesign,
    });

    await publishPackageProgress(58, 'Animation package prepared; launching preview render...');
    await this.createPreviewRender(projectId, scriptVersion);
    } catch (err: any) {
      await query(`UPDATE production_packages SET status = 'failed', error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [packageRow.id, err?.message || 'Production preparation failed']);
      throw err;
    }
  }

  private async processPreviewRender(
    renderJobId: string,
    projectId: string,
    previewVersion: number,
    projectTitle: string,
    script: any
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
      await publishPreviewProgress(92, 'Headless render complete; extracting scene stills for visual audit...');

      // Extract scene midpoint stills in ~150ms using ffmpeg
      const stillsDir = path.join(projectPaths.backendMedia, 'projects', projectId, 'previews', `v${previewVersion}`, 'stills');
      await fs.mkdir(stillsDir, { recursive: true });
      const stillFiles: string[] = [];
      let offset = 0;
      for (let idx = 0; idx < previewProps.scenes.length; idx++) {
        const sc = previewProps.scenes[idx];
        const midpointFrame = offset + Math.floor((sc.durationInFrames || 90) / 2);
        offset += (sc.durationInFrames || 90);
        const timeSec = (midpointFrame / (previewProps.video.fps || 30)).toFixed(2);
        const stillTarget = path.join(stillsDir, `scene_${String(idx + 1).padStart(2, '0')}.png`);
        try {
          await execFileAsync('ffmpeg', [
            '-v', 'error', '-y',
            '-ss', timeSec,
            '-i', previewDiskPath,
            '-vframes', '1',
            '-q:v', '2',
            stillTarget
          ], { timeout: 15000 });
          stillFiles.push(stillTarget);
        } catch {}
      }

      // Autonomous Visual Audit & Self-Repair Gate (Active on preview v1)
      if (previewVersion === 1 && stillFiles.length > 0) {
        await publishPreviewProgress(94, 'AGY Visual QA Director auditing rendered scene stills...');
        const latestPackage = await productionPackageService.latestReady(projectId, script.version);
        let currentTsx: string | null = null;
        let packagePayload: any = null;
        if (latestPackage?.package_path) {
          try {
            packagePayload = JSON.parse(await fs.readFile(latestPackage.package_path, 'utf8'));
            currentTsx = packagePayload.tsxSource;
          } catch {}
        }
        if (!currentTsx) {
          try {
            const projectTsxPath = path.join(projectPaths.remotionRoot, 'src', 'projects', projectId, 'GeneratedVideo.tsx');
            currentTsx = await fs.readFile(projectTsxPath, 'utf8');
          } catch {}
        }
        if (currentTsx) {
          try {
            const audit = await unifiedCliProvider.auditAndSelfCorrectPreview({
              projectId,
              projectTitle,
              previewVersion,
              currentTsxSource: currentTsx,
              stillImages: stillFiles,
              compactScenes: previewProps.scenes,
            });

            if (!audit.approved && audit.revisedTsx) {
              console.log(`[RendersService] AGY Visual Audit requested automatic revision: "${audit.summary}". Launching Preview v2...`);
              await publishPreviewProgress(96, `AGY visual audit: self-repairing layout -> launching Preview v2`);

              // Update package payload with repaired TSX
              if (latestPackage?.package_path) {
                const pkg = packagePayload || JSON.parse(await fs.readFile(latestPackage.package_path, 'utf8'));
                pkg.tsxSource = audit.revisedTsx;
                await fs.writeFile(latestPackage.package_path, JSON.stringify(pkg, null, 2), 'utf8');
              }

              // Stage repaired files
              await this.stageProjectRemotionFiles(projectId, audit.revisedTsx);

              // Launch Preview v2 automatically
              await this.createPreviewRender(projectId, script.version, audit.summary);
              return; // End v1 gracefully as v2 takes over
            }
          } catch (auditErr: any) {
            console.warn(`[RendersService] AGY visual audit non-fatal error: ${auditErr.message}`);
          }
        }
      }

      await query(
        `UPDATE render_jobs
         SET status = 'completed', progress = 100, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [renderJobId]
      );
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 100, status: 'Preview verified by AGY visual audit and ready for review' });
      const latestPackage = await productionPackageService.latestReady(projectId, script.version);
      if (latestPackage) {
        await productionPackageService.saveDonePackage(
          projectId,
          latestPackage.package_version,
          latestPackage.manifest || {},
          { videoDiskPath: previewDiskPath }
        ).catch(() => {});
      }

      // Auto-save directly into videos folder as final video
      const finalDiskPath = path.join(projectPaths.backendMedia, 'videos', `${projectId}_final.mp4`);
      await fs.mkdir(path.dirname(finalDiskPath), { recursive: true });
      await fs.copyFile(previewDiskPath, finalDiskPath).catch(() => {});
      const finalVideoUrl = `/media/videos/${projectId}_final.mp4`;
      let fileSize = 0;
      try {
        const stats = await fs.stat(previewDiskPath);
        fileSize = stats.size;
      } catch {}
      const durationSeconds = previewProps?.video?.durationInFrames && previewProps?.video?.fps
        ? previewProps.video.durationInFrames / previewProps.video.fps
        : 30;

      await query(
        `INSERT INTO videos (
          project_id, render_job_id, storage_url, preview_version_approved, script_version_approved, duration_seconds, file_size_bytes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING`,
        [projectId, renderJobId, finalVideoUrl, previewVersion, script.version, durationSeconds, fileSize]
      ).catch(() => {});

      await query(
        `UPDATE projects
         SET stage = 'completed', status = 'Completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [projectId]
      );
      realtime.publish({
        type: 'pipeline_progress',
        projectId,
        stage: 'completed',
        progress: 100,
        status: `Video rendered and ready: ${finalDiskPath}`
      });
      realtime.publish({
        type: 'project_updated',
        projectId,
        stage: 'completed',
        status: 'Completed'
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

    const approvedPackage = await productionPackageService.latestReady(projectId, scriptVersion);
    if (approvedPackage?.package_path) {
      const bundle = JSON.parse(await fs.readFile(approvedPackage.package_path, 'utf8'));
      if (typeof bundle.tsxSource !== 'string') throw new Error('The approved production package is missing its Remotion entry component.');
      await this.stageProjectRemotionFiles(projectId, bundle.tsxSource);
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
