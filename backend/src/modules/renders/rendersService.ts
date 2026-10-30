import { query } from '../../config/db.js';
import { RenderJob, VideoRecord } from '../../types/index.js';
import { approvalsService } from '../approvals/approvalsService.js';
import { videoRenderer } from './videoRenderer.js';
import { ttsService } from '../audio/ttsService.js';
import { assetFetcher } from '../assets/assetFetcher.js';
import path from 'path';
import fs from 'fs/promises';

export class RendersService {
  /**
   * Helper to write project's unique scene plan into remotion/src/data/scene-data.json
   * strictly adhering to SKILL.md Step 12 (Scene data schema) and loading dynamic web assets + voiceover.
   */
  private async writeRemotionSceneData(projectId: string, projectTitle: string, script: any, previewVersion: number) {
    const fps = 30;
    const scenePlan = script.scene_plan || [];

    // 1. Generate Synchronized Neural Voiceover Audio via TTS
    let audioUrl: string | undefined = undefined;
    if (script.narration) {
      try {
        const ttsResult = await ttsService.generateNarration(projectId, script.narration);
        audioUrl = ttsResult.staticUrl;
      } catch (err: any) {
        console.warn(`[RendersService] TTS generation warning:`, err.message);
      }
    }

    // 2. Fetch Open Educational Web Diagrams for Scenes
    const formattedScenes = await Promise.all(scenePlan.map(async (s: any, idx: number) => {
      const validVisualTypes = ['orbital', 'network', 'metric', 'diagram', 'headline'];
      const rawVisualType = (s.visual_type || '').toLowerCase();
      const visualType = validVisualTypes.includes(rawVisualType)
        ? rawVisualType
        : (idx % 2 === 0 ? 'headline' : 'diagram');

      const themeColor = s.theme_color || (idx === 0 ? '#38bdf8' : idx === 1 ? '#818cf8' : '#34d399');
      const durationSec = s.duration_sec || 5;
      const durationInFrames = durationSec * fps;

      // Fetch dynamic diagram from Wikipedia/Wikimedia if requested or if visualType is diagram
      let imageUrl: string | undefined = undefined;
      const queryToSearch = s.image_search_query || (visualType === 'diagram' ? `${projectTitle} ${s.on_screen_text}` : null);
      if (queryToSearch) {
        const fetched = await assetFetcher.fetchDiagramForTopic(projectId, s.scene_number || idx + 1, queryToSearch);
        if (fetched) {
          imageUrl = fetched.staticUrl;
        }
      }

      return {
        id: `S0${s.scene_number || idx + 1}`,
        scene_number: s.scene_number || idx + 1,
        title: s.on_screen_text?.slice(0, 35) || `Scene 0${idx + 1}`,
        on_screen_text: s.on_screen_text || 'Key Concept',
        subtitle: s.subtitle || '',
        key_takeaways: s.key_takeaways || [],
        concept_nodes: s.concept_nodes || [],
        metric_data: s.metric_data || null,
        visual_direction: s.visual_direction || 'Dynamic kinetic motion graphics.',
        duration_sec: durationSec,
        durationInFrames,
        visualType,
        themeColor,
        narration: s.narration || script.narration?.slice(0, 120),
        image_url: imageUrl,
        motion_cue: s.motion_cue || 'Spring-in kinetic entrance with scale and glow dynamics',
        continuity_to_next: s.continuity_to_next || (idx < scenePlan.length - 1 ? `morph transition to S0${idx + 2}` : 'final resolve'),
        motion: [
          { target: 'title', type: 'spring-in', property: 'scale', from: 0.8, to: 1.0, easing: 'snappy' }
        ],
        continuity: {
          fromPrevious: idx === 0 ? 'opening' : `camera push-in from S0${idx}`,
          toNext: s.continuity_to_next || (idx < scenePlan.length - 1 ? `morph transition to S0${idx + 2}` : 'final resolve')
        }
      };
    }));

    const totalFrames = formattedScenes.reduce((acc: number, s: any) => acc + s.durationInFrames, 0) || 450;

    const payload = {
      video: {
        title: projectTitle,
        width: 1920,
        height: 1080,
        fps,
        durationInFrames: totalFrames,
        style: 'Dynamic Remotion Motion Graphics referencing SKILL.md',
        previewVersion,
        scriptVersion: script.version,
        audioUrl
      },
      scenes: formattedScenes
    };

    const targetPath = '/home/inkyank/Pictures/AnimationPipeline/remotion/src/data/scene-data.json';
    await fs.writeFile(targetPath, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[RendersService] Updated ${targetPath} with ${formattedScenes.length} dynamic scenes (${totalFrames} frames) and audio: ${audioUrl || 'none'}`);
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
    const currentPreviewVersion = (projectRes.rows[0].current_preview_version || 0) + 1;

    // Fetch the approved script data
    const scriptRes = await query(
      `SELECT * FROM scripts WHERE project_id = $1 AND version = $2`,
      [projectId, scriptVersion]
    );
    const script = scriptRes.rows[0];

    // Write dynamic scene data for Remotion (including neural TTS audio and web diagrams)
    await this.writeRemotionSceneData(projectId, projectRes.rows[0].title, script, currentPreviewVersion);

    // Output path on disk
    const diskPath = path.join('/home/inkyank/Pictures/AnimationPipeline/backend/media/previews', `${projectId}_preview_v${currentPreviewVersion}.mp4`);
    const previewUrl = `/media/previews/${projectId}_preview_v${currentPreviewVersion}.mp4`;

    // Render the actual MP4 file via Remotion (scale 0.5 for fast preview)
    await videoRenderer.renderVideo({
      outputPath: diskPath,
      title: projectRes.rows[0].title,
      subheading: script.scene_plan?.[0]?.on_screen_text || 'Remotion Motion Graphics',
      versionLabel: `PREVIEW v${currentPreviewVersion} • SCRIPT v${scriptVersion}`,
      scale: 0.5
    });

    const renderJobRes = await query(
      `INSERT INTO render_jobs (
        project_id, render_type, preview_version, script_version, status, progress, output_location
      ) VALUES ($1, 'preview', $2, $3, 'completed', 100, $4)
      RETURNING *`,
      [projectId, currentPreviewVersion, scriptVersion, previewUrl]
    );

    // Update project state
    await query(
      `UPDATE projects 
       SET stage = 'preview_review', status = 'Preview ready for review', current_preview_version = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [projectId, currentPreviewVersion]
    );

    return renderJobRes.rows[0];
  }

  /**
   * Request preview changes (renders next preview version).
   */
  async requestPreviewChanges(projectId: string, visualFeedback: string): Promise<RenderJob> {
    const projectRes = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
    if (projectRes.rows.length === 0) {
      throw new Error('Project not found');
    }
    const scriptVersion = projectRes.rows[0].current_script_version;

    return this.createPreviewRender(projectId, scriptVersion, visualFeedback);
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
    await this.writeRemotionSceneData(projectId, project.title, script, previewVersion);

    // Real output path on disk
    const diskPath = path.join('/home/inkyank/Pictures/AnimationPipeline/backend/media/videos', `${projectId}_final.mp4`);
    const finalVideoUrl = `/media/videos/${projectId}_final.mp4`;

    // Render final high-res 1080p MP4 file via Remotion (scale 1.0)
    await videoRenderer.renderVideo({
      outputPath: diskPath,
      title: project.title,
      subheading: 'Final Production Render',
      versionLabel: `FINAL VIDEO • APPROVED v${previewVersion}`,
      scale: 1.0
    });

    let fileSize = 500000;
    try {
      const stats = await fs.stat(diskPath);
      fileSize = stats.size;
    } catch (e) {}

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
      ) VALUES ($1, $2, $3, $4, $5, 15.0, $6)
      RETURNING *`,
      [projectId, renderJobRes.rows[0].id, finalVideoUrl, previewVersion, scriptVersion, fileSize]
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
        `SELECT * FROM videos WHERE project_id = $1 ORDER BY created_at DESC`,
        [projectId]
      );
      return res.rows;
    }
    const res = await query(`SELECT * FROM videos ORDER BY created_at DESC`);
    return res.rows;
  }
}

export const rendersService = new RendersService();
