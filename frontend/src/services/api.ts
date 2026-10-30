import { Project, ProjectDetail, Script, Approval, RenderJob, VideoRecord } from '../types';

const API_BASE = 'http://localhost:5000/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async listProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async createProject(input_content: string, input_type: 'text' | 'topic' | 'url', title?: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_content, input_type, title }),
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

  async revisePreview(projectId: string, feedback: string): Promise<RenderJob> {
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
};
