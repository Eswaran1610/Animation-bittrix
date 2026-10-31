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
  agy_total_tokens?: number;
  agy_input_tokens?: number;
  agy_output_tokens?: number;
  agy_run_count?: number;
  agy_usage_estimated?: boolean;
}

export interface AgentRun {
  id: string;
  provider: string;
  task: string;
  project_id: string;
  input_references: Record<string, unknown>;
  output_references: Record<string, unknown>;
  execution_metadata: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    estimated?: boolean;
    source?: string;
  };
  created_at: string;
}

export interface ScriptSource {
  title: string;
  url: string;
  note?: string;
}

export type BlueprintRenderSpec = {
  type: 'vector' | 'image' | 'text' | '3d';
  primitive?: 'sphere' | 'cube' | 'torus' | 'cylinder' | 'molecule';
  viewBox?: [number, number, number, number];
  paths?: Array<{ d: string; fill?: string; stroke?: string; strokeWidth?: number; opacity?: number }>;
  circles?: Array<{ cx: number; cy: number; r: number; fill?: string; stroke?: string; strokeWidth?: number; opacity?: number }>;
  rects?: Array<{ x: number; y: number; width: number; height: number; rx?: number; fill?: string; stroke?: string; strokeWidth?: number; opacity?: number }>;
  lines?: Array<{ x1: number; y1: number; x2: number; y2: number; stroke?: string; strokeWidth?: number; dash?: string; opacity?: number }>;
  polygons?: Array<{ points: string; fill?: string; stroke?: string; strokeWidth?: number; opacity?: number }>;
  text?: string;
  asset_query?: string | null;
};

export interface BlueprintObject {
  id: string;
  label?: string;
  detail?: string;
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  color?: string;
  to_x?: number;
  to_y?: number;
  motion?: string;
  motion_plan?: {
    enter_frame?: number;
    exit_frame?: number;
    idle?: 'float' | 'pulse' | 'orbit' | 'shimmer' | 'drift';
    focal?: boolean;
  };
  render_spec: BlueprintRenderSpec;
}

export interface WebsitePanel {
  title: string;
  body: string;
  accent: string;
}

export interface WebsiteView {
  url: string;
  route: string;
  section: string;
  layout_variant: 'hero' | 'about-grid' | 'product-split' | 'contact';
  nav_items: string[];
  hero_label: string;
  hero_heading: string;
  hero_body: string;
  panels: WebsitePanel[];
  cta: string;
}

export type VisualStyleFamily = 'cinematic-neon' | 'editorial-paper' | 'playful-pop' | 'technical-terminal' | 'documentary-grid';

export interface StyleProfile {
  family: VisualStyleFamily;
  motif: string;
  background: string;
  surface: string;
  text: string;
  primary: string;
  secondary: string;
  motion_language: string;
  transition_language: string;
}

export interface VisualBlueprint {
  purpose: string;
  layout: string;
  camera_motion: string;
  transition_out_frames?: number;
  asset_queries: string[];
  objects: BlueprintObject[];
  website_view?: WebsiteView;
}

export interface ScenePlanItem {
  scene_number: number;
  role?: 'hook' | 'body' | 'cta';
  template?: 'hero-object' | 'split-compare' | 'stat-callout' | 'list-reveal' | 'quote-focus' | 'timeline' | 'steps-numbered' | 'map-pin' | 'chart-bar' | 'before-after' | 'question-hook' | 'cta-outro' | 'product-showcase' | 'fact-card' | 'icon-grid';
  duration_sec: number;
  on_screen_text: string;
  subtitle: string;
  visual_direction: string;
  visual_type: 'blueprint';
  theme_color: string;
  motion_cue: string;
  continuity_to_next: string;
  narration: string;
  key_takeaways?: string[];
  concept_nodes?: Array<{ label: string; sub?: string }>;
  metric_data?: { label: string; value: number; unit: string } | null;
  image_search_query?: string | null;
  motion?: Array<Record<string, unknown>>;
  transition_out_frames?: number;
  continuity_from_previous?: string;
  asset_suggestions?: string;
  visual_blueprint?: VisualBlueprint;
  style_profile?: StyleProfile;
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
  project_title?: string;
  render_job_id?: string;
  storage_url: string;
  preview_version_approved: number;
  script_version_approved: number;
  duration_seconds?: number;
  file_size_bytes?: number;
  metadata?: any;
  created_at: string;
}
