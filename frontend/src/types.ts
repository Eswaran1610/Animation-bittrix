export type ProjectStage = 
  | 'draft'
  | 'research'
  | 'script_review'
  | 'script_approved'
  | 'animation_prep'
  | 'preview_render'
  | 'preview_review'
  | 'preview_approved'
  | 'final_render'
  | 'completed'
  | 'failed';

export type ProjectStatus =
  | 'Draft'
  | 'Queued for research'
  | 'Researching'
  | 'Script ready for review'
  | 'Script changes requested'
  | 'Script approved'
  | 'Preparing animation'
  | 'Rendering preview'
  | 'Preview ready for review'
  | 'Preview changes requested'
  | 'Rendering final video'
  | 'Completed'
  | 'Failed / Needs attention';

export interface Project {
  id: string;
  title: string;
  input_content: string;
  input_type: 'text' | 'topic' | 'url';
  stage: ProjectStage;
  status: ProjectStatus;
  current_script_version: number;
  current_preview_version: number;
  created_at: string;
  updated_at: string;
}

export interface ScriptSource {
  title: string;
  url: string;
  note?: string;
}

export interface ScenePlanItem {
  scene_number: number;
  duration_sec: number;
  on_screen_text: string;
  visual_direction: string;
  asset_suggestions?: string;
}

export interface Script {
  id: string;
  project_id: string;
  version: number;
  topic_interpretation: string;
  research_notes: string;
  sources: ScriptSource[];
  fact_check_notes: string;
  narration: string;
  scene_plan: ScenePlanItem[];
  change_request_notes?: string;
  created_at: string;
}

export interface Approval {
  id: string;
  project_id: string;
  approval_type: 'script' | 'preview';
  approved_version_id?: string;
  version_number: number;
  approved_by: string;
  feedback_notes?: string;
  created_at: string;
}

export interface RenderJob {
  id: string;
  job_id?: string;
  project_id: string;
  render_type: 'preview' | 'final';
  preview_version: number;
  script_version: number;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number;
  composition_id: string;
  output_location?: string;
  errors?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoRecord {
  id: string;
  project_id: string;
  render_job_id?: string;
  storage_url: string;
  preview_version_approved: number;
  script_version_approved: number;
  duration_seconds?: number;
  file_size_bytes?: number;
  metadata?: any;
  created_at: string;
}

export interface ProjectDetail {
  project: Project;
  scripts: Script[];
  approvals: Approval[];
  renderJobs: RenderJob[];
  videos: VideoRecord[];
}
