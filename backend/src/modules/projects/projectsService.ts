import { query } from '../../config/db.js';
import { Project } from '../../types/index.js';
import { scriptsService } from '../scripts/scriptsService.js';

export class ProjectsService {
  /**
   * Create a new project and trigger initial research & script generation.
   */
  async createProject(inputContent: string, inputType: 'text' | 'topic' | 'url', title?: string): Promise<Project> {
    const derivedTitle = title || inputContent.slice(0, 40).replace(/[\r\n]+/g, ' ') || 'Untitled Animation';

    const res = await query(
      `INSERT INTO projects (title, input_content, input_type, stage, status)
       VALUES ($1, $2, $3, 'research', 'Researching')
       RETURNING *`,
      [derivedTitle, inputContent, inputType]
    );

    const project = res.rows[0];

    // Automatically generate initial script v1
    try {
      await scriptsService.generateInitialScript(project.id, inputContent, inputType);
    } catch (err) {
      console.error('Error generating initial script:', err);
      await query(
        `UPDATE projects SET stage = 'failed', status = 'Failed / Needs attention' WHERE id = $1`,
        [project.id]
      );
      // Do not return HTTP 201 for a project whose required script was not
      // generated. The failed project remains stored for inspection, while
      // the API correctly tells the frontend that creation did not complete.
      throw err;
    }

    const updatedRes = await query(`SELECT * FROM projects WHERE id = $1`, [project.id]);
    return updatedRes.rows[0];
  }

  /**
   * List all projects.
   */
  async listProjects(): Promise<Project[]> {
    const res = await query(`
      SELECT p.*,
        COALESCE((SELECT SUM(CASE WHEN ar.execution_metadata->>'total_tokens' ~ '^[0-9]+$'
          THEN (ar.execution_metadata->>'total_tokens')::bigint ELSE 0 END)
          FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex'), 0)::bigint AS codex_total_tokens,
        COALESCE((SELECT SUM(CASE WHEN ar.execution_metadata->>'input_tokens' ~ '^[0-9]+$'
          THEN (ar.execution_metadata->>'input_tokens')::bigint ELSE 0 END)
          FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex'), 0)::bigint AS codex_input_tokens,
        COALESCE((SELECT SUM(CASE WHEN ar.execution_metadata->>'output_tokens' ~ '^[0-9]+$'
          THEN (ar.execution_metadata->>'output_tokens')::bigint ELSE 0 END)
          FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex'), 0)::bigint AS codex_output_tokens,
        (SELECT COUNT(*)::int FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex') AS codex_run_count,
        COALESCE((SELECT BOOL_OR(COALESCE((ar.execution_metadata->>'estimated')::boolean, true))
          FROM agent_runs ar WHERE ar.project_id = p.id AND ar.provider = 'codex'), false) AS codex_usage_estimated
      FROM projects p ORDER BY p.updated_at DESC
    `);
    return res.rows;
  }

  /**
   * Get full project details including history.
   */
  async getProjectDetails(id: string) {
    const projectRes = await query(`SELECT * FROM projects WHERE id = $1`, [id]);
    if (projectRes.rows.length === 0) {
      return null;
    }

    const scriptsRes = await query(`SELECT * FROM scripts WHERE project_id = $1 ORDER BY version ASC`, [id]);
    const approvalsRes = await query(`SELECT * FROM approvals WHERE project_id = $1 ORDER BY created_at DESC`, [id]);
    const renderJobsRes = await query(`SELECT * FROM render_jobs WHERE project_id = $1 ORDER BY created_at DESC`, [id]);
    const videosRes = await query(`SELECT * FROM videos WHERE project_id = $1 ORDER BY created_at DESC`, [id]);
    const agentRunsRes = await query(`SELECT * FROM agent_runs WHERE project_id = $1 ORDER BY created_at DESC`, [id]);

    return {
      project: projectRes.rows[0],
      scripts: scriptsRes.rows,
      approvals: approvalsRes.rows,
      renderJobs: renderJobsRes.rows,
      videos: videosRes.rows,
      agentRuns: agentRunsRes.rows,
    };
  }

  /**
   * Delete project.
   */
  async deleteProject(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM projects WHERE id = $1 RETURNING id`, [id]);
    return res.rows.length > 0;
  }
}

export const projectsService = new ProjectsService();
