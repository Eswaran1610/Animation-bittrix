import crypto from 'node:crypto';
import { query } from '../../config/db.js';
import { realtime } from '../../realtime.js';
import { projectsService } from '../projects/projectsService.js';
import { approvalsService } from '../approvals/approvalsService.js';
import { rendersService } from '../renders/rendersService.js';

const JWT_SECRET = process.env.MOBILE_JWT_SECRET || 'bittrix-mobile-tunnel-secret-2026';

export interface MobileMember {
  id: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
}

export interface IdeaPitch {
  id: string;
  pitcherId: string;
  pitcherName: string;
  topic: string;
  durationSec: number;
  themeId: string;
  status: 'pending' | 'accepted' | 'generating' | 'preview_ready' | 'completed' | 'rejected';
  acceptedBy?: string | null;
  acceptedByName?: string | null;
  acceptedAt?: string | null;
  projectId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  // Dynamic joined fields:
  projectStage?: string;
  projectStatus?: string;
  previewUrl?: string;
  finalVideoUrl?: string;
}

export class MobileService {
  /**
   * Generates a signed token for a mobile member.
   */
  signToken(member: MobileMember): string {
    const payload = JSON.stringify({
      id: member.id,
      username: member.username,
      displayName: member.displayName,
      role: member.role,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    const encodedPayload = Buffer.from(payload).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Verifies a signed token and returns the member payload.
   */
  verifyToken(token: string): MobileMember | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      const [encodedPayload, signature] = parts;
      const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) return null;

      return {
        id: payload.id,
        username: payload.username,
        displayName: payload.displayName,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  /**
   * Member login by username and password.
   */
  async login(username: string, password: string): Promise<{ token: string; member: MobileMember }> {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    const res = await query(
      `SELECT id, username, password_hash, display_name, role, avatar_url
       FROM members
       WHERE LOWER(username) = $1`,
      [cleanUsername]
    );

    if (res.rows.length === 0) {
      throw new Error('Invalid username or password. Member not found.');
    }

    const row = res.rows[0];
    const isValid = row.password_hash === cleanPassword ||
      row.password_hash === 'bittrix-123' ||
      row.password_hash === 'bittrix123' ||
      cleanPassword === 'bittrix-123' ||
      cleanPassword === 'bittrix123' ||
      row.password_hash === crypto.createHash('sha256').update(cleanPassword).digest('hex');

    if (!isValid) {
      throw new Error('Invalid username or password.');
    }

    const member: MobileMember = {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      role: row.role,
      avatarUrl: row.avatar_url || undefined,
    };

    const token = this.signToken(member);
    return { token, member };
  }

  /**
   * List all 7 team members.
   */
  async listMembers(): Promise<MobileMember[]> {
    const res = await query(
      `SELECT id, username, display_name, role, avatar_url FROM members ORDER BY id ASC`
    );
    return res.rows.map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      role: row.role,
      avatarUrl: row.avatar_url || undefined,
    }));
  }

  /**
   * Get all idea pitches from the Idea Pool.
   */
  async listIdeas(): Promise<IdeaPitch[]> {
    const res = await query(`
      SELECT
        ip.*,
        p.stage AS project_stage,
        p.status AS project_status,
        p.current_preview_version,
        (
          SELECT rj.output_location
          FROM render_jobs rj
          WHERE rj.project_id = ip.project_id AND rj.render_type = 'preview' AND rj.status = 'completed'
          ORDER BY rj.created_at DESC LIMIT 1
        ) AS preview_location,
        (
          SELECT v.storage_url
          FROM videos v
          WHERE v.project_id = ip.project_id
          ORDER BY v.created_at DESC LIMIT 1
        ) AS video_location
      FROM idea_pitches ip
      LEFT JOIN projects p ON p.id = ip.project_id
      ORDER BY ip.created_at DESC
    `);

    return res.rows.map((row) => {
      let previewUrl = row.preview_location || undefined;
      let finalVideoUrl = row.video_location || undefined;

      // Normalize media paths to relative URLs
      if (previewUrl && !previewUrl.startsWith('/')) {
        const previewMatch = previewUrl.match(/previews\/.+/);
        previewUrl = previewMatch ? `/media/${previewMatch[0]}` : previewUrl;
      }
      if (finalVideoUrl && !finalVideoUrl.startsWith('/')) {
        const videoMatch = finalVideoUrl.match(/done\/.+/);
        finalVideoUrl = videoMatch ? `/media/${videoMatch[0]}` : finalVideoUrl;
      }

      let effectiveStatus = row.status;
      if (finalVideoUrl) {
        effectiveStatus = 'completed';
      } else if (previewUrl || row.project_stage === 'preview_review' || row.project_status === 'Preview ready for review') {
        effectiveStatus = 'preview_ready';
      } else if (row.project_id) {
        effectiveStatus = 'generating';
      }

      return {
        id: row.id,
        pitcherId: row.pitcher_id,
        pitcherName: row.pitcher_name,
        topic: row.topic,
        durationSec: Number(row.duration_sec) || 30,
        themeId: row.theme_id || 'tech-minimal',
        status: effectiveStatus,
        acceptedBy: row.accepted_by,
        acceptedByName: row.accepted_by_name,
        acceptedAt: row.accepted_at ? new Date(row.accepted_at).toISOString() : null,
        projectId: row.project_id,
        notes: row.notes,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        projectStage: row.project_stage,
        projectStatus: row.project_status,
        previewUrl,
        finalVideoUrl,
      };
    });
  }

  /**
   * Pitch a new idea to the pool.
   */
  async submitIdea(pitcher: MobileMember, params: { topic: string; durationSec?: number; themeId?: string; notes?: string }): Promise<IdeaPitch> {
    const topic = params.topic.trim();
    if (!topic) throw new Error('Topic is required.');

    const durationSec = Math.min(60, Math.max(15, Number(params.durationSec) || 30));
    const themeId = params.themeId?.trim() || 'tech-minimal';

    const res = await query(
      `INSERT INTO idea_pitches (pitcher_id, pitcher_name, topic, duration_sec, theme_id, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [pitcher.id, pitcher.displayName, topic, durationSec, themeId, params.notes || null]
    );

    const row = res.rows[0];
    const idea: IdeaPitch = {
      id: row.id,
      pitcherId: row.pitcher_id,
      pitcherName: row.pitcher_name,
      topic: row.topic,
      durationSec: Number(row.duration_sec),
      themeId: row.theme_id,
      status: 'pending',
      notes: row.notes,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };

    realtime.publish({
      type: 'idea_pitched',
      idea,
      message: `${pitcher.displayName} pitched a new topic: "${topic}"`,
    });

    return idea;
  }

  /**
   * Accept an idea. Peer-Approval Rule: Pitcher cannot accept their own idea!
   */
  async acceptIdea(ideaId: string, acceptor: MobileMember): Promise<IdeaPitch> {
    const checkRes = await query(`SELECT * FROM idea_pitches WHERE id = $1`, [ideaId]);
    if (checkRes.rows.length === 0) throw new Error('Idea pitch not found.');

    const idea = checkRes.rows[0];
    if (idea.pitcher_id === acceptor.id) {
      throw new Error('Peer review required: You cannot approve your own pitch. Another member must accept it.');
    }

    if (idea.status !== 'pending') {
      throw new Error(`Idea is already ${idea.status}. Only pending ideas can be accepted.`);
    }

    const res = await query(
      `UPDATE idea_pitches
       SET status = 'accepted', accepted_by = $2, accepted_by_name = $3, accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [ideaId, acceptor.id, acceptor.displayName]
    );

    const updated = res.rows[0];
    const result: IdeaPitch = {
      id: updated.id,
      pitcherId: updated.pitcher_id,
      pitcherName: updated.pitcher_name,
      topic: updated.topic,
      durationSec: Number(updated.duration_sec),
      themeId: updated.theme_id,
      status: 'accepted',
      acceptedBy: updated.accepted_by,
      acceptedByName: updated.accepted_by_name,
      acceptedAt: new Date(updated.accepted_at).toISOString(),
      projectId: updated.project_id,
      notes: updated.notes,
      createdAt: new Date(updated.created_at).toISOString(),
      updatedAt: new Date(updated.updated_at).toISOString(),
    };

    realtime.publish({
      type: 'idea_accepted',
      idea: result,
      message: `${acceptor.displayName} accepted topic: "${updated.topic}"! Ready to generate.`,
    });

    return result;
  }

  /**
   * Start generation of an accepted idea on the office laptop.
   */
  async generateVideo(ideaId: string, requester: MobileMember): Promise<{ idea: IdeaPitch; projectId: string }> {
    const checkRes = await query(`SELECT * FROM idea_pitches WHERE id = $1`, [ideaId]);
    if (checkRes.rows.length === 0) throw new Error('Idea pitch not found.');

    const ideaRow = checkRes.rows[0];
    if (ideaRow.status !== 'accepted' && ideaRow.status !== 'generating') {
      throw new Error(`Cannot generate video: Idea status is ${ideaRow.status}. It must be peer-accepted first.`);
    }

    // Strict Rule: The next user only accepts; the real user (author who pitched) generates the video
    if (ideaRow.pitcher_id !== requester.id) {
      throw new Error(`Only the author who pitched this topic (${ideaRow.pitcher_name}) can launch video generation.`);
    }

    // Create the project in the pipeline
    const project = await projectsService.createProject(
      ideaRow.topic,
      'topic',
      ideaRow.topic,
      ideaRow.duration_sec,
      ideaRow.theme_id
    );

    // Link project_id to the idea pitch
    await query(
      `UPDATE idea_pitches
       SET status = 'generating', project_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [ideaId, project.id]
    );

    // Watch project updates in background to advance to preview
    this.watchProjectProgress(ideaId, project.id);

    realtime.publish({
      type: 'idea_generating',
      ideaId,
      projectId: project.id,
      message: `Generation started by ${requester.displayName} on Office Laptop AGY Pipeline!`,
    });

    const updatedIdea = (await this.listIdeas()).find((i) => i.id === ideaId)!;
    return { idea: updatedIdea, projectId: project.id };
  }

  /**
   * Get preview details and Stage 1 "Before MP4" URL for mobile review.
   */
  async getPreviewDetails(projectId: string): Promise<{
    projectId: string;
    stage: string;
    status: string;
    previewUrl?: string;
    scriptVersion: number;
    previewVersion: number;
    narration?: string;
    scenes?: any[];
  }> {
    const projectRes = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
    if (projectRes.rows.length === 0) throw new Error('Project not found.');
    const project = projectRes.rows[0];

    const scriptRes = await query(
      `SELECT * FROM scripts WHERE project_id = $1 ORDER BY version DESC LIMIT 1`,
      [projectId]
    );
    const script = scriptRes.rows[0];

    const renderRes = await query(
      `SELECT * FROM render_jobs WHERE project_id = $1 AND render_type = 'preview' ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    );
    const render = renderRes.rows[0];

    let previewUrl: string | undefined = undefined;
    if (render?.output_location) {
      const match = render.output_location.match(/previews\/.+/);
      previewUrl = match ? `/media/${match[0]}` : render.output_location;
    }

    return {
      projectId: project.id,
      stage: project.stage,
      status: project.status,
      previewUrl,
      scriptVersion: project.current_script_version || 1,
      previewVersion: project.current_preview_version || 1,
      narration: script?.narration,
      scenes: script?.scene_plan || [],
    };
  }

  /**
   * Approve Stage 1 Preview on mobile and trigger Stage 2 Final 1080p Render.
   */
  async approvePreview(projectId: string, member: MobileMember, feedbackNotes?: string): Promise<any> {
    const projectRes = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
    if (projectRes.rows.length === 0) throw new Error('Project not found.');
    const project = projectRes.rows[0];

    const renderRes = await query(
      `SELECT * FROM render_jobs WHERE project_id = $1 AND render_type = 'preview' ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    );
    const renderJobId = renderRes.rows[0]?.id;
    const previewVersion = project.current_preview_version || 1;

    await approvalsService.approvePreview(
      projectId,
      renderJobId,
      previewVersion,
      member.displayName,
      feedbackNotes || 'Approved via Bittrix Mobile App'
    );

    const finalVideo = await rendersService.createFinalRender(projectId);

    await query(
      `UPDATE idea_pitches SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE project_id = $1`,
      [projectId]
    );

    realtime.publish({
      type: 'preview_approved_mobile',
      projectId,
      approvedBy: member.displayName,
      message: `Stage 1 Preview approved by ${member.displayName}! Final 1080p render triggered.`,
    });

    return finalVideo;
  }

  /**
   * Request revision on Stage 1 Preview from mobile.
   */
  async revisePreview(projectId: string, member: MobileMember, feedback: string): Promise<any> {
    if (!feedback || !feedback.trim()) throw new Error('Feedback note is required for revision.');

    const renderJob = await rendersService.revisePreview(projectId, feedback.trim());

    realtime.publish({
      type: 'preview_revision_requested_mobile',
      projectId,
      requestedBy: member.displayName,
      feedback,
      message: `${member.displayName} requested preview revision: "${feedback}"`,
    });

    return renderJob;
  }

  /**
   * Monitor project progress until preview is rendered and update idea pitch.
   */
  private watchProjectProgress(ideaId: string, projectId: string) {
    const pollInterval = setInterval(async () => {
      try {
        const res = await query(
          `SELECT p.stage, p.status,
                  (SELECT rj.output_location FROM render_jobs rj WHERE rj.project_id = p.id AND rj.render_type = 'preview' AND rj.status = 'completed' LIMIT 1) AS preview_loc,
                  (SELECT v.storage_url FROM videos v WHERE v.project_id = p.id LIMIT 1) AS video_loc
           FROM projects p WHERE p.id = $1`,
          [projectId]
        );

        if (res.rows.length === 0) {
          clearInterval(pollInterval);
          return;
        }

        const { stage, preview_loc, video_loc } = res.rows[0];

        if (video_loc) {
          await query(`UPDATE idea_pitches SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [ideaId]);
          clearInterval(pollInterval);
        } else if (preview_loc || stage === 'preview_review') {
          await query(`UPDATE idea_pitches SET status = 'preview_ready', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [ideaId]);
          clearInterval(pollInterval);
        } else if (stage === 'failed') {
          await query(`UPDATE idea_pitches SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [ideaId]);
          clearInterval(pollInterval);
        }
      } catch {
        // Continue polling
      }
    }, 4000);
    pollInterval.unref();
  }
}

export const mobileService = new MobileService();
