import { query } from '../../config/db.js';
import { Script, ScriptSource, ScenePlanItem } from '../../types/index.js';
import { AGYProvider } from '../providers/agyProvider.js';

const agyProvider = new AGYProvider();

export class ScriptsService {
  /**
   * Generate initial script (v1) using AGY provider.
   */
  async generateInitialScript(projectId: string, inputContent: string, inputType: 'text' | 'topic' | 'url'): Promise<Script> {
    const researchResult = await agyProvider.generateScript({
      projectId,
      topicOrContent: inputContent,
      inputType,
    });

    const version = 1;

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
        JSON.stringify(researchResult.scenePlan)
      ]
    );

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

    const researchResult = await agyProvider.generateScript({
      projectId,
      topicOrContent: previousScript.topic_interpretation,
      inputType: 'topic',
      previousScriptVersion: previousScript.version,
      changeRequestFeedback: feedbackNotes,
      existingNarration: changeNarration ? undefined : previousScript.narration // Rule: preserve narration unless explicitly asked
    });

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
        JSON.stringify(researchResult.scenePlan),
        feedbackNotes
      ]
    );

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
