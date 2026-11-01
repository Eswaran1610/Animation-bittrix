import { query } from '../../config/db.js';
import { RenderJob, VideoRecord } from '../../types/index.js';
import { approvalsService } from '../approvals/approvalsService.js';
import { videoRenderer } from './videoRenderer.js';
import { ttsService } from '../audio/ttsService.js';
import { assetFetcher } from '../assets/assetFetcher.js';
import { sfxService, SfxRole } from '../audio/sfxService.js';
import { audioBedService } from '../audio/audioBedService.js';
import path from 'path';
import fs from 'fs/promises';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';
import { execFile } from 'child_process';
import { promisify } from 'util';

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

  private async buildMeasuredCaptions(text: string, audioPath: string | undefined, durationSec: number, fps: number) {
    if (!audioPath || process.env.DISABLE_WHISPER === '1') return this.buildWordCaptions(text, durationSec, fps);
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
      ], { timeout: 180000, maxBuffer: 2 * 1024 * 1024 });
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
   * Convert the approved Codex scene plan into isolated Remotion input props.
   */
  private async writeRemotionSceneData(
    projectId: string,
    projectTitle: string,
   script: any,
   renderVersion: number,
    renderType: 'preview' | 'final' = 'preview',
    progressCallback?: (progress: number, status: string) => Promise<void>
 ) {
    const fps = 30;
    const scenePlan = script.scene_plan;
    if (!Array.isArray(scenePlan) || scenePlan.length === 0) {
      throw new Error('Approved script has no scene plan; render refused.');
    }
    const styleProfile = scenePlan.find((scene: any) => scene.style_profile)?.style_profile;

    // 1. Generate one Kokoro clip per scene. FFprobe measures each clip and the
    // measured duration drives that scene's visual duration; speech is never
    // time-stretched to fit an estimated full-script duration.
    const sceneNarration = new Map<number, { audioPath: string; staticUrl: string; durationSec: number }>();
    let narrationCompleted = 0;
    try {
      await Promise.all(scenePlan.map(async (scene: any) => {
        const result = await ttsService.generateSceneNarration(projectId, Number(scene.scene_number), scene.narration);
        sceneNarration.set(Number(scene.scene_number), result);
        narrationCompleted += 1;
        if (progressCallback) {
          await progressCallback(8 + Math.round((narrationCompleted / scenePlan.length) * 17), `Narration prepared for scene ${narrationCompleted}/${scenePlan.length}`);
        }
      }));
    } catch (err: any) {
      throw new Error(`Per-scene narration audio generation failed: ${err.message}`);
    }
    const narrationDurationSec = Array.from(sceneNarration.values()).reduce((total, audio) => total + audio.durationSec, 0);

    // 2. Fetch Open Educational Web Diagrams for Scenes
    let scenesPrepared = 0;
    const formattedScenes = await Promise.all(scenePlan.map(async (s: any, idx: number) => {
      const visualType = String(s.visual_type || '').toLowerCase();
      if (visualType !== 'blueprint') throw new Error(`Scene ${idx + 1} must use an Codex visual blueprint; regenerate the script before rendering.`);
      if (!s.visual_blueprint) throw new Error(`Scene ${idx + 1} has no Codex visual blueprint; render refused.`);
      if (!Number.isFinite(Number(s.duration_sec)) || Number(s.duration_sec) < 2.5 || Number(s.duration_sec) > 5) {
        throw new Error(`Scene ${idx + 1} must be between 2.5 and 5 seconds.`);
      }
      if (!s.theme_color || !/^#[0-9a-f]{6}$/i.test(s.theme_color)) throw new Error(`Scene ${idx + 1} has no valid theme_color.`);
      if (!s.on_screen_text || !s.subtitle || !s.visual_direction || !s.motion_cue || !s.continuity_to_next || !s.narration) {
        throw new Error(`Scene ${idx + 1} is incomplete; render refused.`);
      }
      const blueprint = s.visual_blueprint || undefined;
      const themeColor = s.theme_color;
      const narration = sceneNarration.get(Number(s.scene_number));
      // The approved plan's 2.5-5s value is a target for the visual beat, but
      // the measured narration is authoritative for the rendered timeline.
      // Never cut or time-stretch a spoken clip just to satisfy that target:
      // doing so can remove words or make the voice sound unnatural. Let the
      // scene grow when the generated clip needs more room and keep the next
      // scene synchronized.
      const plannedDurationSec = Number(s.duration_sec);
      const narrationSec = narration?.durationSec || plannedDurationSec;
      // Preserve the approved scene timing as the minimum. If measured speech
      // needs more room, extend the scene; never shrink a requested 20-second
      // plan merely because TTS happened to finish early.
      const durationSec = Math.max(2.5, plannedDurationSec, narrationSec + (8 / fps));
      if (durationSec > 5) {
        console.warn(
          `[RendersService] Scene ${idx + 1} narration measures ${narrationSec.toFixed(2)}s; ` +
          `extending its visual timeline to ${durationSec.toFixed(2)}s to preserve the complete narration.`,
        );
      }
      const durationInFrames = Math.max(1, Math.ceil(durationSec * fps));
      const transitionOutFrames = idx < scenePlan.length - 1
        ? Math.max(8, Math.min(15, Math.round(Number(s.transition_out_frames ?? blueprint.transition_out_frames ?? 12))))
        : 0;

      // Fetch every Codex-selected asset query for this scene. The blueprint decides
      // whether an image or procedural object is the right visual treatment.
      let imageUrl: string | undefined = undefined;
      const assetQueries = Array.from(new Set([
        ...(s.image_search_query ? [s.image_search_query] : []),
        ...(blueprint?.asset_queries || []),
        ...((blueprint?.objects || []).map((object: any) => object.render_spec?.asset_query).filter(Boolean))
      ]));
      const imageAssets: Record<string, string> = {};
      await Promise.all(assetQueries.map(async (queryToSearch, assetIndex) => {
        const fetched = await assetFetcher.fetchDiagramForTopic(projectId, s.scene_number * 100 + assetIndex, queryToSearch);
        if (fetched) {
          imageAssets[queryToSearch] = fetched.staticUrl;
          if (!imageUrl) imageUrl = fetched.staticUrl;
        }
      }));

      // Generate object sound cues using one deterministic, render-specific
      // procedural library. Roles come from the authored object labels/motion,
      // while the seed keeps a render repeatable without reusing one global set.
      const sfxLibrarySeed = `${projectId}:${renderType}:${renderVersion}`;
      await sfxService.ensureLibrary(sfxLibrarySeed);
      const lastHitTime: number[] = [];
      const cueRequests: Array<{ hitFrame: number; role: SfxRole; sourceId: string; seedKey: string }> = [];
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
          const isSpaced = lastHitTime.every((t) => Math.abs(t - entranceHitFrame) >= 8);
          if (isSpaced) {
            lastHitTime.push(entranceHitFrame);
            cueRequests.push({
              hitFrame: entranceHitFrame,
              role: appearRole,
              sourceId: `${s.scene_number}.object-${objectIndex + 1}.appear`,
              seedKey: `${projectId}:${s.scene_number}:${objectIndex}:appear`,
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

          const isMoveSpaced = lastHitTime.every((t) => Math.abs(t - moveHitFrame) >= 8);
          if (isMoveSpaced) {
            lastHitTime.push(moveHitFrame);
            cueRequests.push({
              hitFrame: moveHitFrame,
              role: moveRole,
              sourceId: `${s.scene_number}.object-${objectIndex + 1}.motion`,
              seedKey: `${projectId}:${s.scene_number}:${objectIndex}:motion`,
            });
          }
        }
      });

      // Bullets / Takeaways sound: light tick for each bullet reveal
      const bulletItems = (s.key_takeaways || s.items || []).slice(0, 3);
      bulletItems.forEach((_: any, bIdx: number) => {
        const bulletHitFrame = Math.min(durationInFrames - 12, 22 + bIdx * 8);
        const isSpaced = lastHitTime.every((t) => Math.abs(t - bulletHitFrame) >= 6);
        if (isSpaced) {
          lastHitTime.push(bulletHitFrame);
          cueRequests.push({
            hitFrame: bulletHitFrame,
            role: 'tick',
            sourceId: `${s.scene_number}.bullet-${bIdx + 1}`,
            seedKey: `${projectId}:${s.scene_number}:bullet:${bIdx}`,
          });
        }
      });

      // Final CTA sting: short chime or ding on the closing scene
      if (s.role === 'cta' || idx === scenePlan.length - 1) {
        const ctaHitFrame = Math.max(12, durationInFrames - 24);
        const isSpaced = lastHitTime.every((t) => Math.abs(t - ctaHitFrame) >= 6);
        if (isSpaced) {
          lastHitTime.push(ctaHitFrame);
          cueRequests.push({
            hitFrame: ctaHitFrame,
            role: 'ding',
            sourceId: `${s.scene_number}.cta-sting`,
            seedKey: `${projectId}:${s.scene_number}:cta`,
          });
        }
      }

      // Scene transition: whoosh at the midpoint of the transition
      if (transitionOutFrames > 0 && idx < scenePlan.length - 1) {
        const transitionHitFrame = durationInFrames - Math.round(transitionOutFrames / 2);
        cueRequests.push({
          hitFrame: transitionHitFrame,
          role: 'whoosh',
          sourceId: `${s.scene_number}.transition`,
          seedKey: `${projectId}:${s.scene_number}:transition`,
        });
      }

      // Defensive fallback: ensure at least one subtle entrance sound per scene
      if (cueRequests.length === 0) {
        cueRequests.push({
          hitFrame: 14,
          role: 'pop',
          sourceId: `${s.scene_number}.appear`,
          seedKey: `${projectId}:${s.scene_number}:fallback`,
        });
      }

      // Sort by hitFrame
      cueRequests.sort((a, b) => a.hitFrame - b.hitFrame);

      // Resolve cues from sfxService, shifting start frame by transient duration for exact hits
      const audioCues = await Promise.all(
        cueRequests.map(async (req) => {
          const cueInfo = await sfxService.getCueForRole(req.role, req.seedKey, fps, sfxLibrarySeed);
          const startFrame = Math.max(0, req.hitFrame - cueInfo.transientFrames);
          return {
            frame: startFrame,
            hitFrame: req.hitFrame,
            src: cueInfo.src,
            role: cueInfo.role,
            volume: cueInfo.volume,
            durationFrames: cueInfo.durationFrames,
            sourceId: req.sourceId,
          };
        })
      );
      if (audioCues.length === 0) {
        throw new Error(`Object sound generation failed for scene ${s.scene_number}; render refused without audio.`);
      }
      scenesPrepared += 1;
      if (progressCallback) {
        await progressCallback(25 + Math.round((scenesPrepared / scenePlan.length) * 65), `Prepared visual assets and motion for scene ${scenesPrepared}/${scenePlan.length}`);
      }

      return {
        id: `S${String(s.scene_number).padStart(2, '0')}`,
        scene_number: s.scene_number,
        role: s.role,
        template: s.template,
        title: s.on_screen_text.slice(0, 35),
        on_screen_text: s.on_screen_text,
        subtitle: s.subtitle,
        key_takeaways: s.key_takeaways,
        concept_nodes: s.concept_nodes,
        metric_data: s.metric_data,
        visual_direction: s.visual_direction,
        duration_sec: durationSec,
        durationInFrames,
        transitionOutFrames,
        visualType,
        themeColor,
        narration: s.narration,
        narrationAudio: narration?.staticUrl,
        narrationDurationSec: narration?.durationSec,
        audioCues,
        image_url: imageUrl,
        image_assets: imageAssets,
        visualBlueprint: blueprint,
        motion_cue: s.motion_cue,
        continuity_to_next: s.continuity_to_next,
        motion: s.motion || [],
        continuity: {
          fromPrevious: s.continuity_from_previous || (idx === 0 ? 'opening' : 'carried from previous scene as specified by Codex'),
          toNext: s.continuity_to_next
        }
      };
    }));

    const totalFrames = formattedScenes.reduce((acc: number, s: any, index: number) =>
      acc + s.durationInFrames - (index < formattedScenes.length - 1 ? s.transitionOutFrames || 0 : 0), 0);
    const backgroundAudioUrl = await audioBedService.generate(projectId, renderType, renderVersion, totalFrames / fps);
    let captionOffset = 0;
    const sceneCaptions = await Promise.all(formattedScenes.map(async (scene: any) => this.buildMeasuredCaptions(
      scene.narration,
      sceneNarration.get(Number(scene.scene_number))?.audioPath,
      scene.narrationDurationSec || scene.durationInFrames / fps,
      fps,
    )));
    const captions = formattedScenes.flatMap((scene: any, index: number) => {
      const captionsForScene = sceneCaptions[index];
      const sceneCaptionsWithOffset = captionsForScene
        .map((caption: any) => ({ ...caption, startFrame: caption.startFrame + captionOffset, endFrame: caption.endFrame + captionOffset }));
      captionOffset += scene.durationInFrames - (index < formattedScenes.length - 1 ? scene.transitionOutFrames || 0 : 0);
      return sceneCaptionsWithOffset;
    });

    const payload = {
      video: {
        title: projectTitle,
        width: 1080,
        height: 1920,
        fps,
        durationInFrames: totalFrames,
        targetDurationSec: scenePlan.reduce((sum: number, scene: any) => sum + Number(scene.duration_sec || 0), 0),
        style: 'Codex-authored content-specific motion plan rendered by Remotion',
        generatedBy: 'codex',
        sourceProjectId: projectId,
        previewVersion: renderVersion,
        scriptVersion: script.version,
        audioDurationSec: narrationDurationSec || undefined,
        backgroundAudioUrl,
        captions,
        styleProfile
      },
      scenes: formattedScenes
    };

    const renderDataPath = projectPaths.renderData(projectId, renderType, renderVersion);
    await fs.mkdir(projectPaths.renderDataDir, { recursive: true });
    await fs.writeFile(renderDataPath, JSON.stringify(payload, null, 2), 'utf-8');
    let sceneOffset = 0;
    const cueManifest = formattedScenes.flatMap((scene: any, sceneIndex: number) => {
      const cues = (scene.audioCues || []).map((cue: any, cueIndex: number) => ({
        hitFrame: sceneOffset + (cue.hitFrame ?? cue.frame),
        role: cue.role || (cueIndex === 0 ? 'appear' : 'motion'),
        sourceId: cue.sourceId || `${scene.id}.object-${cueIndex + 1}`,
      }));
      sceneOffset += scene.durationInFrames - (sceneIndex < formattedScenes.length - 1 ? scene.transitionOutFrames || 0 : 0);
      return cues;
    });
    await fs.writeFile(`${renderDataPath}.cues.json`, JSON.stringify(cueManifest, null, 2), 'utf-8');
    console.log(`[RendersService] Prepared isolated Codex render props at ${renderDataPath} with ${formattedScenes.length} scenes (${totalFrames} frames) and per-scene narration audio.`);
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
      `SELECT id FROM render_jobs
       WHERE project_id = $1 AND render_type = 'preview' AND status IN ('queued', 'rendering')
       LIMIT 1`,
      [projectId]
    );
    if (activeRenderRes.rows.length > 0) {
      throw new Error('A preview render is already in progress for this project.');
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

    const currentPreviewVersion = (projectRes.rows[0].current_preview_version || 0) + 1;
    // Gate 2 previews are played from the Remotion TSX composition in the
    // browser. Store the prepared props URL instead of rendering an MP4 here.
    const previewUrl = `/api/projects/${projectId}/previews/${currentPreviewVersion}/props`;

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
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 5, status: 'Preparing dynamic Codex render' });

      // Prepare dynamic scene data for the live Remotion Player (including
      // neural TTS, object cues, and web diagrams). Chromium MP4 rendering is
      // reserved for the final approved video.
      const publishPreviewProgress = async (progress: number, status: string) => {
        await query(
          `UPDATE render_jobs SET progress = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [renderJobId, progress]
        );
        realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress, status });
      };
      await this.writeRemotionSceneData(projectId, projectTitle, script, previewVersion, 'preview', publishPreviewProgress);
      await publishPreviewProgress(95, 'Live Remotion TSX preview ready');

      await query(
        `UPDATE render_jobs
         SET status = 'completed', progress = 100, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [renderJobId]
      );
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 100, status: 'Preview ready for human review' });
      await query(
        `UPDATE projects
         SET stage = 'preview_review', status = 'Preview ready for review', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [projectId]
      );
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
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

    // Write dynamic scene data for Remotion
    const renderPropsPath = await this.writeRemotionSceneData(projectId, project.title, script, previewVersion, 'final');

    // Real output path on disk
    const diskPath = path.join(projectPaths.backendMedia, 'videos', `${projectId}_final.mp4`);
    const finalVideoUrl = `/media/videos/${projectId}_final.mp4`;

    // Render final high-res 1080p MP4 file via Remotion (scale 1.0)
    await videoRenderer.renderVideo({
      outputPath: diskPath,
      title: project.title,
      subheading: script.scene_plan[0].subtitle,
      versionLabel: `FINAL VIDEO • APPROVED v${previewVersion}`,
      scale: 1.0,
      propsPath: renderPropsPath
    });

    const stats = await fs.stat(diskPath);
    const fileSize = stats.size;
    const finalProps = JSON.parse(await fs.readFile(renderPropsPath, 'utf8'));
    const durationSeconds = finalProps.video.durationInFrames / finalProps.video.fps;

    const renderJobRes = await query(
      `INSERT INTO render_jobs (
        project_id, render_type, preview_version, script_version, status, progress, output_location
      ) VALUES ($1, 'final', $2, $3, 'completed', 100, $4)
      RETURNING *`,
      [projectId, previewVersion, scriptVersion, finalVideoUrl]
    );

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
