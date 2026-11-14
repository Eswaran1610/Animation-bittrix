import { query } from '../../config/db.js';
import { Project } from '../../types/index.js';
import { scriptsService } from '../scripts/scriptsService.js';
import { approvalsService } from '../approvals/approvalsService.js';
import { rendersService } from '../renders/rendersService.js';
import fs from 'fs/promises';
import path from 'path';
import { projectPaths } from '../../config/paths.js';
import { productionPackageService } from '../production/productionPackageService.js';
import { realtime } from '../../realtime.js';

export class ProjectsService {
  private styleColumnReady?: Promise<void>;

  private async ensureMotionUpgrade(): Promise<void> {
    if (!this.styleColumnReady) {
      this.styleColumnReady = query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS style_signature TEXT`)
        .then(() => query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS requested_duration_sec INT`))
        .then(() => query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS theme_id TEXT`).then(() => undefined))
        .catch((error) => {
          this.styleColumnReady = undefined;
          throw error;
        });
    }
    await this.styleColumnReady;
  }

  /**
   * Create a new project and trigger initial research & script generation.
   */
  async createProject(inputContent: string, inputType: 'text' | 'topic' | 'url', title?: string, requestedDurationSec?: number, themeId?: string): Promise<Project> {
    await this.ensureMotionUpgrade();
    const derivedTitle = title || inputContent.slice(0, 40).replace(/[\r\n]+/g, ' ') || 'Untitled Animation';

    const res = await query(
      `INSERT INTO projects (title, input_content, input_type, requested_duration_sec, theme_id, stage, status)
       VALUES ($1, $2, $3, $4, $5, 'research', 'Researching')
       RETURNING *`,
      [derivedTitle, inputContent, inputType, requestedDurationSec || null, themeId || null]
    );

    const project = res.rows[0];

    // Publish realtime project_created event immediately so UI shows it in dashboard instantly!
    realtime.publish({
      type: 'project_created',
      project,
      projectId: project.id,
      stage: 'research',
      progress: 10,
      status: 'Researching topic & literature...'
    });

    // Run initial script generation in background so HTTP response returns immediately without timing out.
    // Publish an elapsed-time heartbeat while the CLI is researching; the dashboard
    // should not appear frozen at its initial 10-15% for the whole provider call.
    const generationStartedAt = Date.now();
    const progressTimer = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - generationStartedAt) / 1000);
      const progress = Math.min(80, 15 + Math.floor(elapsedSec / 6));
      const elapsed = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`;
      realtime.publish({
        type: 'pipeline_progress',
        projectId: project.id,
        stage: 'research',
        progress,
        status: `Research and scene planning in progress · ${elapsed} elapsed`
      });
    }, 5000);
    progressTimer.unref();

    void scriptsService.generateInitialScript(project.id, inputContent, inputType, requestedDurationSec, themeId)
      .then(async (script) => {
        clearInterval(progressTimer);
        const scriptVer = script?.version || 1;
        console.log(`[ProjectsService] Script generated for ${project.id} (v${scriptVer}). Ready for Gate 1 human review.`);

        // Only auto-advance straight to production if explicitly enabled via AUTO_APPROVE_PIPELINE
        if (process.env.AUTO_APPROVE_PIPELINE === '1') {
          try {
            const scriptId = script?.id;
            await approvalsService.approveScript(project.id, scriptId, scriptVer, 'auto_agent', 'Auto-approved for direct straight-through video pipeline');
            await productionPackageService.queue(project.id, scriptVer);
            await rendersService.prepareCliProductionPackage(project.id, scriptVer);
          } catch (autoErr: any) {
            console.error(`[ProjectsService] Auto-render pipeline error for ${project.id}:`, autoErr);
          }
        }
        const finishedRes = await query(`SELECT * FROM projects WHERE id = $1`, [project.id]);
        if (finishedRes.rows[0]) {
          realtime.publish({
            type: 'project_updated',
            project: finishedRes.rows[0],
            projectId: project.id,
            stage: finishedRes.rows[0].stage,
            status: finishedRes.rows[0].status,
            progress: 100
          });
        }
      })
      .catch(async (err: any) => {
        clearInterval(progressTimer);
        console.error(`[ProjectsService] Background initial script generation failed for ${project.id}:`, err);
        await query(
          `UPDATE projects SET stage = 'failed', status = 'Failed / Needs attention' WHERE id = $1`,
          [project.id]
        );
        realtime.publish({
          type: 'pipeline_progress',
          projectId: project.id,
          stage: 'failed',
          progress: 0,
          status: `Generation failed: ${err?.message || err}`
        });
        realtime.publish({
          type: 'project_updated',
          projectId: project.id,
          stage: 'failed',
          status: 'Failed / Needs attention'
        });
      });

    return project;
  }

  /**
   * List all projects.
   */
  async listProjects(): Promise<Project[]> {
    await this.ensureMotionUpgrade();
    const res = await query(`
      SELECT p.*,
        COALESCE((SELECT SUM(CASE WHEN ar.execution_metadata->>'total_tokens' ~ '^[0-9]+$'
          THEN (ar.execution_metadata->>'total_tokens')::bigint ELSE 0 END)
          FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex'), 0)::bigint AS codex_total_tokens,
        COALESCE((SELECT SUM(CASE WHEN ar.execution_metadata->>'total_tokens' ~ '^[0-9]+$'
          THEN (ar.execution_metadata->>'total_tokens')::bigint ELSE 0 END)
          FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'agy'), 0)::bigint AS agy_total_tokens,
        COALESCE((SELECT SUM(CASE WHEN ar.execution_metadata->>'total_tokens' ~ '^[0-9]+$'
          THEN (ar.execution_metadata->>'total_tokens')::bigint ELSE 0 END)
          FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'claude'), 0)::bigint AS claude_total_tokens,
        COALESCE((SELECT SUM(CASE WHEN ar.execution_metadata->>'input_tokens' ~ '^[0-9]+$'
          THEN (ar.execution_metadata->>'input_tokens')::bigint ELSE 0 END)
          FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex'), 0)::bigint AS codex_input_tokens,
        COALESCE((SELECT SUM(CASE WHEN ar.execution_metadata->>'output_tokens' ~ '^[0-9]+$'
          THEN (ar.execution_metadata->>'output_tokens')::bigint ELSE 0 END)
          FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex'), 0)::bigint AS codex_output_tokens,
        (SELECT COUNT(*)::int FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex') AS codex_run_count,
        (SELECT COUNT(*)::int FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'agy') AS agy_run_count,
        (SELECT COUNT(*)::int FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'claude') AS claude_run_count,
        COALESCE((SELECT BOOL_OR(COALESCE((ar.execution_metadata->>'estimated')::boolean, false))
          FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex'), false) AS codex_usage_estimated,
        COALESCE((SELECT BOOL_OR(COALESCE((ar.execution_metadata->>'available')::boolean, false)) FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex'), false) AS codex_usage_available,
        COALESCE((SELECT BOOL_OR(COALESCE((ar.execution_metadata->>'estimated')::boolean, false)) FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'agy'), false) AS agy_usage_estimated,
        COALESCE((SELECT BOOL_OR(COALESCE((ar.execution_metadata->>'available')::boolean, false)) FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'agy'), false) AS agy_usage_available,
        COALESCE((SELECT BOOL_OR(COALESCE((ar.execution_metadata->>'estimated')::boolean, false)) FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'claude'), false) AS claude_usage_estimated,
        COALESCE((SELECT BOOL_OR(COALESCE((ar.execution_metadata->>'available')::boolean, false)) FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'claude'), false) AS claude_usage_available
      FROM projects p ORDER BY p.updated_at DESC
    `);
    return res.rows;
  }

  /**
   * Get full project details including history.
   */
  async getProjectDetails(id: string) {
    await this.ensureMotionUpgrade();
    const projectRes = await query(`SELECT * FROM projects WHERE id = $1`, [id]);
    if (projectRes.rows.length === 0) {
      return null;
    }

    const scriptsRes = await query(`SELECT * FROM scripts WHERE project_id = $1 ORDER BY version ASC`, [id]);
    const approvalsRes = await query(`SELECT * FROM approvals WHERE project_id = $1 ORDER BY created_at DESC`, [id]);
    const renderJobsRes = await query(`SELECT * FROM render_jobs WHERE project_id = $1 ORDER BY created_at DESC`, [id]);
    const videosRes = await query(`SELECT * FROM videos WHERE project_id = $1 ORDER BY created_at DESC`, [id]);
    const agentRunsRes = await query(`SELECT * FROM agent_runs WHERE project_id = $1 ORDER BY created_at DESC`, [id]);
    await productionPackageService.ensureTable();
    const productionPackagesRes = await query(`SELECT * FROM production_packages WHERE project_id = $1 ORDER BY package_version DESC`, [id]);

    return {
      project: projectRes.rows[0],
      scripts: scriptsRes.rows,
      approvals: approvalsRes.rows,
      renderJobs: renderJobsRes.rows,
      videos: videosRes.rows,
      agentRuns: agentRunsRes.rows,
      productionPackages: productionPackagesRes.rows.map((pkg) => ({
        ...pkg,
        tsx_url: `/media/${path.relative(projectPaths.backendMedia, path.join(path.dirname(pkg.package_path || ''), `v${pkg.package_version}.tsx`)).replace(/\\/g, '/')}`,
      })),
    };
  }

  /**
   * Delete project.
   */
  async deleteProject(id: string): Promise<boolean> {
    await this.ensureMotionUpgrade();
    const res = await query(`DELETE FROM projects WHERE id = $1 RETURNING id`, [id]);
    if (!res.rows.length) return false;
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
    await Promise.all([
      fs.rm(path.join(projectPaths.backendMedia, 'projects', safeId), { recursive: true, force: true }),
      fs.rm(path.join(projectPaths.remotionPublic, 'projects', safeId), { recursive: true, force: true }),
      fs.rm(path.join(projectPaths.root, 'qa', 'scene-stills', safeId), { recursive: true, force: true }),
    ]);
    for (const [root, directory] of [
      [projectPaths.backendMedia, 'audio'], [projectPaths.backendMedia, 'captions'],
      [projectPaths.backendMedia, 'previews'], [projectPaths.backendMedia, 'videos'],
      [projectPaths.backendMedia, 'render-data'], [projectPaths.remotionPublic, 'audio'],
    ]) {
      const target = path.join(root, directory);
      try {
        for (const entry of await fs.readdir(target)) {
          if (entry.startsWith(`${safeId}_`)) await fs.rm(path.join(target, entry), { recursive: true, force: true });
        }
      } catch (error: any) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
    for (const bedsDir of [path.join(projectPaths.backendMedia, 'audio', 'beds'), path.join(projectPaths.remotionPublic, 'audio', 'beds')]) {
      try {
        for (const entry of await fs.readdir(bedsDir)) if (entry.startsWith(`${safeId}_`)) await fs.rm(path.join(bedsDir, entry), { force: true });
      } catch (error: any) { if (error?.code !== 'ENOENT') throw error; }
    }
    return true;
  }
}

export const projectsService = new ProjectsService();
