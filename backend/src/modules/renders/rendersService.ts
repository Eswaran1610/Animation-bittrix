import { query } from '../../config/db.js';
import { RenderJob, VideoRecord } from '../../types/index.js';
import { approvalsService } from '../approvals/approvalsService.js';
import { videoRenderer } from './videoRenderer.js';
import { ttsService } from '../audio/ttsService.js';
import { assetFetcher } from '../assets/assetFetcher.js';
import { sfxService } from '../audio/sfxService.js';
import path from 'path';
import fs from 'fs/promises';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';

export class RendersService {
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

    // 1. Generate Synchronized Neural Voiceover Audio via TTS
    let audioUrl: string | undefined = undefined;
    const targetDurationSec = scenePlan.reduce((total: number, scene: any) => total + Number(scene.duration_sec || 0), 0);
    if (script.narration) {
      try {
        const ttsResult = await ttsService.generateNarration(projectId, script.narration, targetDurationSec);
        audioUrl = ttsResult.staticUrl;
      } catch (err: any) {
        throw new Error(`Narration audio generation failed: ${err.message}`);
      }
    }

    // 2. Fetch Open Educational Web Diagrams for Scenes
    const formattedScenes = await Promise.all(scenePlan.map(async (s: any, idx: number) => {
      const visualType = String(s.visual_type || '').toLowerCase();
      if (visualType !== 'blueprint') throw new Error(`Scene ${idx + 1} must use an AGY visual blueprint; regenerate the script before rendering.`);
      if (!s.visual_blueprint) throw new Error(`Scene ${idx + 1} has no AGY visual blueprint; render refused.`);
      if (!Number.isInteger(s.duration_sec) || s.duration_sec < 2) throw new Error(`Scene ${idx + 1} has no valid duration.`);
      if (!s.theme_color || !/^#[0-9a-f]{6}$/i.test(s.theme_color)) throw new Error(`Scene ${idx + 1} has no valid theme_color.`);
      if (!s.on_screen_text || !s.subtitle || !s.visual_direction || !s.motion_cue || !s.continuity_to_next || !s.narration) {
        throw new Error(`Scene ${idx + 1} is incomplete; render refused.`);
      }
      const themeColor = s.theme_color;
      const durationSec = s.duration_sec;
      const durationInFrames = durationSec * fps;

      // Fetch every AGY-selected asset query for this scene. The blueprint decides
      // whether an image or procedural object is the right visual treatment.
      let imageUrl: string | undefined = undefined;
      const blueprint = s.visual_blueprint || undefined;
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

      // Add subtle, procedural entrance cues for the first few AGY-authored
      // objects. Failed cue generation never blocks a valid video render.
      const generatedCues = await Promise.allSettled(
        blueprint.objects.slice(0, 4).map(async (object: any, objectIndex: number) => ({
          frame: 10 + objectIndex * 9,
          src: await sfxService.generateObjectCue(
            projectId,
            renderType,
            renderVersion,
            s.scene_number,
            objectIndex,
            object.label || object.id
          ),
          volume: 0.7,
        }))
      );
      const audioCues = generatedCues
        .filter((result): result is PromiseFulfilledResult<{ frame: number; src: string; volume: number }> => result.status === 'fulfilled')
        .map((result) => result.value);
      if (audioCues.length === 0) {
        throw new Error(`Object sound generation failed for scene ${s.scene_number}; render refused without audio.`);
      }

      return {
        id: `S${String(s.scene_number).padStart(2, '0')}`,
        scene_number: s.scene_number,
        title: s.on_screen_text.slice(0, 35),
        on_screen_text: s.on_screen_text,
        subtitle: s.subtitle,
        key_takeaways: s.key_takeaways,
        concept_nodes: s.concept_nodes,
        metric_data: s.metric_data,
        visual_direction: s.visual_direction,
        duration_sec: durationSec,
        durationInFrames,
        visualType,
        themeColor,
        narration: s.narration,
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

    const totalFrames = formattedScenes.reduce((acc: number, s: any) => acc + s.durationInFrames, 0);

    const payload = {
      video: {
        title: projectTitle,
        width: 1920,
        height: 1080,
        fps,
        durationInFrames: totalFrames,
        style: 'AGY-authored content-specific motion plan rendered by Remotion',
        generatedBy: 'agy',
        sourceProjectId: projectId,
        previewVersion: renderVersion,
        scriptVersion: script.version,
        audioUrl,
        styleProfile
      },
      scenes: formattedScenes
    };

    const renderDataPath = projectPaths.renderData(projectId, renderType, renderVersion);
    await fs.mkdir(projectPaths.renderDataDir, { recursive: true });
    await fs.writeFile(renderDataPath, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[RendersService] Prepared isolated AGY render props at ${renderDataPath} with ${formattedScenes.length} scenes (${totalFrames} frames) and audio: ${audioUrl || 'none'}`);
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
    const diskPath = path.join(projectPaths.backendMedia, 'previews', `${projectId}_preview_v${currentPreviewVersion}.mp4`);
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
      scriptVersion,
      currentPreviewVersion,
      projectRes.rows[0].title,
      script,
      diskPath
    );

    return renderJobRes.rows[0];
  }

  private async processPreviewRender(
    renderJobId: string,
    projectId: string,
    scriptVersion: number,
    previewVersion: number,
    projectTitle: string,
    script: any,
    diskPath: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE render_jobs SET status = 'rendering', progress = 5, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [renderJobId]
      );
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 5, status: 'Preparing dynamic AGY render' });

      // Write dynamic scene data for Remotion (including neural TTS and web diagrams).
      const renderPropsPath = await this.writeRemotionSceneData(projectId, projectTitle, script, previewVersion);
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 20, status: 'Assets and Kokoro narration prepared' });

      await videoRenderer.renderVideo({
        outputPath: diskPath,
        title: projectTitle,
        subheading: script.scene_plan[0].subtitle,
        versionLabel: `PREVIEW v${previewVersion} • SCRIPT v${scriptVersion}`,
        scale: 0.5,
        propsPath: renderPropsPath
      });
      realtime.publish({ type: 'render_progress', projectId, renderJobId, renderType: 'preview', previewVersion, progress: 95, status: 'Remotion render finished; saving preview' });

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
    const durationSeconds = script.scene_plan.reduce((total: number, scene: any) => total + Number(scene.duration_sec), 0);

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
