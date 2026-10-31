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

  /**
   * Convert the approved AGY scene plan into isolated Remotion input props.
   */
  private async writeRemotionSceneData(
    projectId: string,
    projectTitle: string,
    script: any,
    renderVersion: number,
    renderType: 'preview' | 'final' = 'preview'
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
    const sceneNarration = new Map<number, { staticUrl: string; durationSec: number }>();
    try {
      await Promise.all(scenePlan.map(async (scene: any) => {
        const result = await ttsService.generateSceneNarration(projectId, Number(scene.scene_number), scene.narration);
        sceneNarration.set(Number(scene.scene_number), result);
      }));
    } catch (err: any) {
      throw new Error(`Per-scene narration audio generation failed: ${err.message}`);
    }
    const narrationDurationSec = Array.from(sceneNarration.values()).reduce((total, audio) => total + audio.durationSec, 0);

    // 2. Fetch Open Educational Web Diagrams for Scenes
    const formattedScenes = await Promise.all(scenePlan.map(async (s: any, idx: number) => {
      const visualType = String(s.visual_type || '').toLowerCase();
      if (visualType !== 'blueprint') throw new Error(`Scene ${idx + 1} must use an AGY visual blueprint; regenerate the script before rendering.`);
      if (!s.visual_blueprint) throw new Error(`Scene ${idx + 1} has no AGY visual blueprint; render refused.`);
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
      const durationSec = Math.max(Number(s.duration_sec), (narration?.durationSec || 0) + 0.35);
      const durationInFrames = Math.max(1, Math.ceil(durationSec * fps));
      const transitionOutFrames = idx < scenePlan.length - 1
        ? Math.max(8, Math.min(15, Math.round(Number(s.transition_out_frames ?? blueprint.transition_out_frames ?? 12))))
        : 0;

      // Fetch every AGY-selected asset query for this scene. The blueprint decides
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

      // Generate object sound cues using the procedural SFX library and role resolution
      const lastHitTime: number[] = [];
      const cueRequests: Array<{ hitFrame: number; role: SfxRole; sourceId: string; seedKey: string }> = [];

      blueprint.objects.forEach((object: any, objectIndex: number) => {
        // First scene enters at frame 10; subsequent scenes enter after the 12-frame incoming transition
        const entranceHitFrame = Math.min(durationInFrames - 6, (idx === 0 ? 10 : 16) + objectIndex * 12);
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

        const hasDestination = Number.isFinite(object.to_x) || Number.isFinite(object.to_y);
        const motion = String(object.motion || '');
        const isMoving = hasDestination || /move|slide|travel|float|drift|orbit|rotate|spin|revolve|bounce|pulse/i.test(motion);
        if (isMoving) {
          const moveRole = sfxService.determineRole(object, 'move');
          const moveHitFrame = Math.min(durationInFrames - 18, Math.round(durationInFrames * 0.55) + (objectIndex % 3) * 6);
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

      // Sort by hitFrame
      cueRequests.sort((a, b) => a.hitFrame - b.hitFrame);

      // Resolve cues from sfxService, shifting start frame by transient duration for exact hits
      const audioCues = await Promise.all(
        cueRequests.map(async (req) => {
          const cueInfo = await sfxService.getCueForRole(req.role, req.seedKey, fps);
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
          fromPrevious: s.continuity_from_previous || (idx === 0 ? 'opening' : 'carried from previous scene as specified by AGY'),
          toNext: s.continuity_to_next
        }
      };
    }));

    const totalFrames = formattedScenes.reduce((acc: number, s: any, index: number) =>
      acc + s.durationInFrames - (index < formattedScenes.length - 1 ? s.transitionOutFrames || 0 : 0), 0);
    const backgroundAudioUrl = await audioBedService.generate(projectId, renderType, renderVersion, totalFrames / fps);
    let captionOffset = 0;
    const captions = formattedScenes.flatMap((scene: any, index: number) => {
      const sceneCaptions = this.buildWordCaptions(scene.narration, scene.narrationDurationSec || scene.durationInFrames / fps, fps)
        .map((caption: any) => ({ ...caption, startFrame: caption.startFrame + captionOffset, endFrame: caption.endFrame + captionOffset }));
      captionOffset += scene.durationInFrames - (index < formattedScenes.length - 1 ? scene.transitionOutFrames || 0 : 0);
      return sceneCaptions;
    });

    const payload = {
      video: {
        title: projectTitle,
        width: 1080,
        height: 1920,
        fps,
        durationInFrames: totalFrames,
        style: 'AGY-authored content-specific motion plan rendered by Remotion',
        generatedBy: 'agy',
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
    console.log(`[RendersService] Prepared isolated AGY render props at ${renderDataPath} with ${formattedScenes.length} scenes (${totalFrames} frames) and per-scene narration audio.`);
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
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 5, status: 'Preparing dynamic AGY render' });

      // Prepare dynamic scene data for the live Remotion Player (including
      // neural TTS, object cues, and web diagrams). Chromium MP4 rendering is
      // reserved for the final approved video.
      await this.writeRemotionSceneData(projectId, projectTitle, script, previewVersion);
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 20, status: 'Assets and Kokoro narration prepared' });
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 95, status: 'Live Remotion TSX preview ready' });

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
