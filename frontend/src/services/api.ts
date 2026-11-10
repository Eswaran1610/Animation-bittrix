import { Project, ProjectDetail, Script, Approval, RenderJob, VideoRecord } from '../types';

// Use Vite's same-origin proxy in development so browser requests do not
// depend on direct cross-origin access to the backend port.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getProviderUsage(provider?: string) {
    const query = provider ? `?provider=${encodeURIComponent(provider)}` : '';
    const res = await fetch(`${API_BASE}/usage${query}`);
    if (!res.ok) throw new Error('Failed to fetch AI usage');
    return res.json() as Promise<{
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      run_count: number;
      estimated: boolean;
      available: boolean;
      provider?: string;
    }>;
  },



  async listProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async createProject(input_content: string, input_type: 'text' | 'topic' | 'url', title?: string, requested_duration_sec?: number, theme_id?: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_content, input_type, title, requested_duration_sec, theme_id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create project');
    }
    return res.json();
  },

  async getProjectDetails(id: string): Promise<ProjectDetail> {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project details');
    return res.json();
  },

  async deleteProject(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
    const data = await res.json();
    return data.success;
  },

  async reviseScript(projectId: string, feedback: string, change_narration = false): Promise<Script> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/scripts/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback, change_narration }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to revise script');
    }
    return res.json();
  },

  async approveScript(projectId: string, script_id: string, version_number: number, feedback_notes?: string): Promise<Approval> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/scripts/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script_id, version_number, feedback_notes, approved_by: 'human_reviewer' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to approve script');
    }
    return res.json();
  },

  async renderPreview(projectId: string, script_version: number, visual_feedback?: string): Promise<RenderJob> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/previews/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script_version, visual_feedback }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to render preview');
    }
    return res.json();
  },

  async getPreviewProps(projectId: string, previewVersion: number): Promise<unknown> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/previews/${previewVersion}/props`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load live Remotion preview');
    }
    return res.json();
  },

  async getPreviewReport(projectId: string, previewVersion: number): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/previews/${previewVersion}/report`);
    if (!res.ok) throw new Error('Failed to load preview report');
    return res.json();
  },

  async revisePreview(projectId: string, feedback: string): Promise<Script> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/previews/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to request preview changes');
    }
    return res.json();
  },

  async approvePreview(projectId: string, render_job_id: string, preview_version: number, feedback_notes?: string): Promise<Approval> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/previews/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ render_job_id, preview_version, feedback_notes, approved_by: 'human_reviewer' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to approve preview');
    }
    return res.json();
  },

  async renderFinalVideo(projectId: string): Promise<VideoRecord> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/final-render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to render final video');
    }
    return res.json();
  },

  async listVideos(): Promise<VideoRecord[]> {
    const res = await fetch(`${API_BASE}/videos`);
    if (!res.ok) throw new Error('Failed to fetch videos');
    return res.json();
  },

  // AGY (Antigravity) CLI connection
  async getAgyConnection() {
    const res = await fetch(`${API_BASE}/auth/agy`);
    if (!res.ok) throw new Error('Failed to check AGY connection');
    return res.json() as Promise<CliConnection>;
  },

  async connectAgy() {
    const res = await fetch(`${API_BASE}/auth/agy`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to refresh AGY connection');
    return res.json() as Promise<CliConnection>;
  },

  async disconnectAgy() {
    const res = await fetch(`${API_BASE}/auth/agy/disconnect`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to disconnect AGY');
    return res.json() as Promise<CliConnection>;
  },

  // Claude Code CLI connection
  async getClaudeConnection() {
    const res = await fetch(`${API_BASE}/auth/claude`);
    if (!res.ok) throw new Error('Failed to check Claude Code connection');
    return res.json() as Promise<CliConnection>;
  },

  async connectClaude() {
    const res = await fetch(`${API_BASE}/auth/claude`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to refresh Claude Code connection');
    return res.json() as Promise<CliConnection>;
  },

  async disconnectClaude() {
    const res = await fetch(`${API_BASE}/auth/claude/disconnect`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to disconnect Claude Code');
    return res.json() as Promise<CliConnection>;
  },

  // Active provider selection
  async getActiveProvider() {
    const res = await fetch(`${API_BASE}/providers/active`);
    if (!res.ok) throw new Error('Failed to fetch active provider');
    return res.json() as Promise<ActiveProviderStatus>;
  },

  async setActiveProvider(provider: 'agy' | 'claude' | 'none') {
    const res = await fetch(`${API_BASE}/providers/active`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || 'Failed to set active provider');
    }
    return res.json() as Promise<{ activeProvider: 'agy' | 'claude' | 'none'; message: string }>;
  },

  async getLatestAutonomous(): Promise<any> {
    const res = await fetch(`${API_BASE}/pipeline/autonomous/latest`);
    if (!res.ok) throw new Error('Failed to fetch latest autonomous video');
    return res.json();
  },

  async runAutonomousPipeline(topic: string, fps = 60, resolution = '1080x1920', voice = 'en-US-ChristopherNeural', projectName?: string, durationSec?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/pipeline/autonomous/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, fps, resolution, voice, projectName, durationSec }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start autonomous pipeline');
    }
    return res.json();
  },

  async getAutonomousJobs(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/pipeline/autonomous/jobs`);
    if (!res.ok) return [];
    return res.json();
  },

  async getSfxCatalog(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/pipeline/sfx-catalog`);
    if (!res.ok) return [];
    return res.json();
  },

  async reviseAutonomousJob(id: string, revision: { sceneIndex: number; title?: string; narration?: string; visual_type?: string; themeColor?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/pipeline/autonomous/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, revision }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to revise job');
    }
    return res.json();
  },
};

/** Shared type for all local CLI auth status responses. */
export type CliConnection = {
  cliAvailable: boolean;
  state: 'unknown' | 'connected' | 'standby' | 'failed';
  isActive?: boolean;
  message: string;
  /** Only present on AGY: CLI version string */
  version?: string;
  /** Only present on AGY: active model name */
  model?: string;
};

export type ActiveProviderStatus = {
  activeProvider: 'agy' | 'claude' | 'none';
  available: Array<'agy' | 'claude' | 'none'>;
};
