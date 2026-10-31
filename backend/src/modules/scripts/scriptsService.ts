import { query } from '../../config/db.js';
import { Script, ScriptSource, ScenePlanItem } from '../../types/index.js';
import { AGYProvider } from '../providers/agyProvider.js';
import { realtime } from '../../realtime.js';

const agyProvider = new AGYProvider();

const persistStyleProfile = (scenePlan: ScenePlanItem[], styleProfile: any): ScenePlanItem[] =>
  scenePlan.map((scene, index) => index === 0 ? { ...scene, style_profile: styleProfile } : scene);

export class ScriptsService {
  /**
   * Generate initial script (v1) using AGY provider.
   */
  async generateInitialScript(projectId: string, inputContent: string, inputType: 'text' | 'topic' | 'url'): Promise<Script> {
    realtime.publish({ type: 'pipeline_progress', projectId, stage: 'research', progress: 5, status: 'AGY researching submitted content' });
    const researchResult = await agyProvider.generateScript({
      projectId,
      topicOrContent: inputContent,
      inputType,
    });

    const version = 1;
    realtime.publish({
      type: 'token_usage',
      projectId,
      ...researchResult.tokenUsage,
    });
    realtime.publish({ type: 'pipeline_progress', projectId, stage: 'script_plan', progress: 75, status: 'AGY script and scene plan ready' });

    const res = await query(
      `INSERT INTO scripts (
        project_id, version, topic_interpretation, research_notes, sources, fact_check_notes, narration, scene_plan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        projectId,
        version,
        researchResult.topicInterpretation,
        researchResult.researchNotes,
        JSON.stringify(researchResult.sources),
        researchResult.factCheckNotes,
        researchResult.narration,
        JSON.stringify(persistStyleProfile(researchResult.scenePlan, researchResult.styleProfile))
      ]
    );

    await query(
      `INSERT INTO agent_runs (provider, task, project_id, input_references, output_references, execution_metadata)
       VALUES ('agy', 'research_script', $1, $2, $3, $4)`,
      [
        projectId,
        JSON.stringify({ inputType, contentLength: inputContent.length }),
        JSON.stringify({ scriptVersion: version, sceneCount: researchResult.scenePlan.length }),
        JSON.stringify(researchResult.tokenUsage)
      ]
    );

    realtime.publish({ type: 'pipeline_progress', projectId, stage: 'script_ready', progress: 100, status: 'Human approval required: script ready' });

    // Update project state
    await query(
      `UPDATE projects 
       SET stage = 'script_review', status = 'Script ready for review', current_script_version = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [projectId, version]
    );

    return res.rows[0];
  }

  /**
   * Request script revision, creating a new version while preserving the old one.
   */
  async reviseScript(projectId: string, feedbackNotes: string, changeNarration = false): Promise<Script> {
    // Get latest script version
    const latestRes = await query(
      `SELECT * FROM scripts WHERE project_id = $1 ORDER BY version DESC LIMIT 1`,
      [projectId]
    );

    if (latestRes.rows.length === 0) {
      throw new Error('No existing script found to revise.');
    }

    const previousScript = latestRes.rows[0];
    const newVersion = previousScript.version + 1;

    const projectRes = await query(`SELECT input_content, input_type FROM projects WHERE id = $1`, [projectId]);
    if (projectRes.rows.length === 0) throw new Error('Project not found while revising script.');

    const researchResult = await agyProvider.generateScript({
      projectId,
      topicOrContent: projectRes.rows[0].input_content,
      inputType: projectRes.rows[0].input_type,
      previousScriptVersion: previousScript.version,
      changeRequestFeedback: feedbackNotes,
      existingNarration: changeNarration ? undefined : previousScript.narration // Rule: preserve narration unless explicitly asked
    });
    realtime.publish({
      type: 'token_usage',
      projectId,
      ...researchResult.tokenUsage,
    });
    realtime.publish({ type: 'pipeline_progress', projectId, stage: 'script_revision', progress: 75, status: `AGY revised script v${newVersion} ready` });

    const res = await query(
      `INSERT INTO scripts (
        project_id, version, topic_interpretation, research_notes, sources, fact_check_notes, narration, scene_plan, change_request_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        projectId,
        newVersion,
        researchResult.topicInterpretation,
        researchResult.researchNotes,
        JSON.stringify(researchResult.sources),
        researchResult.factCheckNotes,
        researchResult.narration,
        JSON.stringify(persistStyleProfile(researchResult.scenePlan, researchResult.styleProfile)),
        feedbackNotes
      ]
    );

    await query(
      `INSERT INTO agent_runs (provider, task, project_id, input_references, output_references, execution_metadata)
       VALUES ('agy', 'research_script_revision', $1, $2, $3, $4)`,
      [
        projectId,
        JSON.stringify({ inputType: projectRes.rows[0].input_type, contentLength: projectRes.rows[0].input_content.length, previousScriptVersion: previousScript.version }),
        JSON.stringify({ scriptVersion: newVersion, sceneCount: researchResult.scenePlan.length }),
        JSON.stringify(researchResult.tokenUsage)
      ]
    );

    // A revised script invalidates every prior preview approval. Keep the
    // preview counter monotonic so every new render gets a unique media URL.
    await query(
      `DELETE FROM approvals WHERE project_id = $1 AND approval_type = 'preview'`,
      [projectId]
    );

    realtime.publish({ type: 'pipeline_progress', projectId, stage: 'script_ready', progress: 100, status: 'Human approval required: revised script ready' });

    await query(
      `UPDATE projects 
       SET stage = 'script_review', status = 'Script changes requested', current_script_version = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [projectId, newVersion]
    );

    return res.rows[0];
  }

  /**
   * Fetch all script versions for a project.
   */
  async getScripts(projectId: string): Promise<Script[]> {
    const res = await query(
      `SELECT * FROM scripts WHERE project_id = $1 ORDER BY version ASC`,
      [projectId]
    );
    return res.rows;
  }

  /**
   * Fetch a specific script version.
   */
  async getScriptByVersion(projectId: string, version: number): Promise<Script | null> {
    const res = await query(
      `SELECT * FROM scripts WHERE project_id = $1 AND version = $2`,
      [projectId, version]
    );
    return res.rows[0] || null;
  }
}

export const scriptsService = new ScriptsService();
