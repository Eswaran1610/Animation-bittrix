import { query } from '../../config/db.js';
import { Script, ScriptSource, ScenePlanItem } from '../../types/index.js';
import { getActiveAIProvider } from '../providers/providerFactory.js';
import { activeProviderService } from '../providers/activeProviderService.js';
import { realtime } from '../../realtime.js';

const persistStyleProfile = (scenePlan: ScenePlanItem[], styleProfile: any, styleBrief: any): ScenePlanItem[] =>
  scenePlan.map((scene, index) => index === 0 ? { ...scene, style_profile: styleProfile, style_brief: styleBrief } : scene);

const hueBucket = (hex: string) => {
  const value = hex.replace('#', '').slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(value)) return 'unknown';
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  if (max === r && r > g * 1.2 && r > b * 1.2) return 'red';
  if (max === g && g > r * 1.2 && g > b * 1.2) return 'green';
  if (max === b && b > r * 1.2 && b > g * 1.2) return 'blue';
  if (r > 170 && g > 120 && b < 120) return 'warm';
  if (r > 150 && b > 150) return 'violet';
  return 'neutral';
};

const styleSignature = (styleBrief: any): string => [
  styleBrief?.archetype || 'unknown',
  styleBrief?.motionPersonality || 'unknown',
  styleBrief?.background || 'unknown',
  hueBucket(styleBrief?.palette?.primary || ''),
].join('|');

const styleParts = (signature: string) => signature.split('|');
const styleOverlap = (left: string, right: string) => styleParts(left).reduce((count, value, index) => count + (value && value === styleParts(right)[index] ? 1 : 0), 0);

export class ScriptsService {
  private async generateDistinctInitialScript(projectId: string, inputContent: string, inputType: 'text' | 'topic' | 'url', requestedDurationSec?: number) {
    const recent = await query(`SELECT style_signature FROM projects WHERE style_signature IS NOT NULL ORDER BY updated_at DESC LIMIT 5`);
    const recentSignatures = recent.rows.map((row) => String(row.style_signature));
    const provider = getActiveAIProvider();
    let lastResult: any;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      lastResult = await provider.generateScript({
        projectId,
        topicOrContent: inputContent,
        inputType,
        requestedDurationSec,
        changeRequestFeedback: attempt === 0 ? undefined : 'Choose a materially different styleBrief from recent projects. Keep the content and narration requirements unchanged.',
      });
      const signature = styleSignature(lastResult.styleBrief);
      const conflict = recentSignatures.find((candidate) => styleOverlap(signature, candidate) >= 2);
      if (!conflict) return { result: lastResult, signature };
      if (attempt === 1) {
        if (lastResult.styleBrief) {
          lastResult.styleBrief.archetype = lastResult.styleBrief.archetype === 'kinetic-type' ? 'blueprint-technical' : 'kinetic-type';
          lastResult.styleBrief.background = lastResult.styleBrief.background === 'grid' ? 'particles' : 'grid';
        }
        return { result: lastResult, signature: styleSignature(lastResult.styleBrief) };
      }
    }
    throw new Error('Style variety validation failed without a usable plan.');
  }

  /**
   * Generate initial script (v1) using the currently active AI provider (Codex or AGY).
   */
  async generateInitialScript(projectId: string, inputContent: string, inputType: 'text' | 'topic' | 'url', requestedDurationSec?: number): Promise<Script> {
    const activeProvider = activeProviderService.get();
    const providerLabel = activeProvider === 'agy' ? 'AGY' : activeProvider === 'codex' ? 'Codex' : 'AI';
    realtime.publish({ type: 'pipeline_progress', projectId, stage: 'research', progress: 15, status: `${providerLabel} deep research across multiple web sources` });
    const { result: researchResult, signature } = await this.generateDistinctInitialScript(projectId, inputContent, inputType, requestedDurationSec);

    const version = 1;
    realtime.publish({ type: 'pipeline_progress', projectId, stage: 'script_plan', progress: 85, status: `${providerLabel} plan ready: scenes, blueprints & narration` });

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
        JSON.stringify(persistStyleProfile(researchResult.scenePlan, researchResult.styleProfile, researchResult.styleBrief))
      ]
    );

    await query(`UPDATE projects SET style_signature = $2 WHERE id = $1`, [projectId, signature]);

    await query(
      `INSERT INTO agent_runs (provider, task, project_id, input_references, output_references, execution_metadata)
       VALUES ($1, 'research_script', $2, $3, $4, $5)`,
      [
        activeProvider,
        projectId,
        JSON.stringify({ inputType, contentLength: inputContent.length, requestedDurationSec }),
        JSON.stringify({ scriptVersion: version, sceneCount: researchResult.scenePlan.length }),
        JSON.stringify(researchResult.tokenUsage)
      ]
    );

    // Publish only after the durable record exists. Clients re-fetch the
    // aggregate from the API, so a reconnect cannot lose or double-count it.
    realtime.publish({ type: 'token_usage', projectId, provider: activeProvider, ...researchResult.tokenUsage });

    realtime.publish({ type: 'pipeline_progress', projectId, stage: 'script_ready', progress: 100, status: 'Script loaded into dashboard: ready for review' });

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

    const activeProvider = activeProviderService.get();
    const providerLabel = activeProvider === 'agy' ? 'AGY' : activeProvider === 'codex' ? 'Codex' : 'AI';
    const provider = getActiveAIProvider();

    const researchResult = await provider.generateScript({
      projectId,
      topicOrContent: projectRes.rows[0].input_content,
      inputType: projectRes.rows[0].input_type,
      requestedDurationSec: projectRes.rows[0].requested_duration_sec || undefined,
      previousScriptVersion: previousScript.version,
      changeRequestFeedback: feedbackNotes,
      existingNarration: changeNarration ? undefined : previousScript.narration // Rule: preserve narration unless explicitly asked
    });
    realtime.publish({ type: 'pipeline_progress', projectId, stage: 'script_revision', progress: 75, status: `${providerLabel} revised script v${newVersion} ready` });

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
        JSON.stringify(persistStyleProfile(researchResult.scenePlan, researchResult.styleProfile, researchResult.styleBrief)),
        feedbackNotes
      ]
    );

    await query(
      `INSERT INTO agent_runs (provider, task, project_id, input_references, output_references, execution_metadata)
       VALUES ($1, 'research_script_revision', $2, $3, $4, $5)`,
      [
        activeProvider,
        projectId,
        JSON.stringify({ inputType: projectRes.rows[0].input_type, contentLength: projectRes.rows[0].input_content.length, previousScriptVersion: previousScript.version }),
        JSON.stringify({ scriptVersion: newVersion, sceneCount: researchResult.scenePlan.length }),
        JSON.stringify(researchResult.tokenUsage)
      ]
    );

    realtime.publish({ type: 'token_usage', projectId, provider: activeProvider, ...researchResult.tokenUsage });

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
