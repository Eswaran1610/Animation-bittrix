import { query } from '../../config/db.js';
import { Approval } from '../../types/index.js';

export class ApprovalsService {
  /**
   * Check if a specific script version has been approved.
   */
  async isScriptApproved(projectId: string, versionNumber: number): Promise<boolean> {
    const res = await query(
      `SELECT id FROM approvals 
       WHERE project_id = $1 AND approval_type = 'script' AND version_number = $2`,
      [projectId, versionNumber]
    );
    return res.rows.length > 0;
  }

  /**
   * Record human approval for a script version (Gate 1).
   */
  async approveScript(projectId: string, scriptId?: string, versionNumber = 1, approvedBy = 'human_reviewer', feedbackNotes?: string): Promise<Approval> {
    const validScriptId = (scriptId && /^[0-9a-fA-F-]{36}$/.test(scriptId)) ? scriptId : null;

    const res = await query(
      `INSERT INTO approvals (project_id, approval_type, approved_version_id, version_number, approved_by, feedback_notes)
       VALUES ($1, 'script', $2, $3, $4, $5)
       RETURNING *`,
      [projectId, validScriptId, versionNumber, approvedBy, feedbackNotes || null]
    );

    // Update project state to script_approved
    await query(
      `UPDATE projects 
       SET stage = 'script_approved', status = 'Script approved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [projectId]
    );

    return res.rows[0];
  }

  /**
   * Check if the current preview version has been approved (Gate 2).
   */
  async isCurrentPreviewApproved(projectId: string, previewVersion: number): Promise<boolean> {
    const res = await query(
      `SELECT id FROM approvals 
       WHERE project_id = $1 AND approval_type = 'preview' AND version_number = $2`,
      [projectId, previewVersion]
    );
    return res.rows.length > 0;
  }

  /**
   * Record human approval for the exact current preview version (Gate 2).
   */
  async approvePreview(projectId: string, renderJobId?: string, previewVersion = 1, approvedBy = 'human_reviewer', feedbackNotes?: string): Promise<Approval> {
    const validJobId = (renderJobId && /^[0-9a-fA-F-]{36}$/.test(renderJobId)) ? renderJobId : null;

    // Record explicit approval
    const res = await query(
      `INSERT INTO approvals (project_id, approval_type, approved_version_id, version_number, approved_by, feedback_notes)
       VALUES ($1, 'preview', $2, $3, $4, $5)
       RETURNING *`,
      [projectId, validJobId, previewVersion, approvedBy, feedbackNotes || null]
    );

    // Update project state to preview_approved
    await query(
      `UPDATE projects 
       SET stage = 'preview_approved', status = 'Preview approved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [projectId]
    );

    return res.rows[0];
  }

  /**
   * Fetch all approvals for a project.
   */
  async getApprovals(projectId: string): Promise<Approval[]> {
    const res = await query(
      `SELECT * FROM approvals WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    );
    return res.rows;
  }
}

export const approvalsService = new ApprovalsService();
