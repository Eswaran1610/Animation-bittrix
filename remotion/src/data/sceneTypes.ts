export interface DynamicNode {
  label: string;
  sub?: string;
}

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
  render_spec: {
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

export interface CaptionWord {
  word: string;
  startFrame: number;
  endFrame: number;
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

export interface SceneData {
  id: string;
  scene_number: number;
  role?: 'hook' | 'body' | 'cta';
  template?: 'hero-object' | 'split-compare' | 'stat-callout' | 'list-reveal' | 'quote-focus' | 'timeline' | 'steps-numbered' | 'map-pin' | 'chart-bar' | 'before-after' | 'question-hook' | 'cta-outro' | 'product-showcase' | 'fact-card' | 'icon-grid';
  title: string;
  on_screen_text: string;
  subtitle: string;
  key_takeaways?: string[];
  concept_nodes?: DynamicNode[];
  metric_data?: {
    label: string;
    value: number;
    unit: string;
  } | null;
  visual_direction: string;
  motion_cue: string;
  continuity_to_next: string;
  duration_sec: number;
  durationInFrames: number;
  transitionOutFrames?: number;
  visualType: 'blueprint';
  themeColor: string;
  narration: string;
  audioCues?: Array<{ frame: number; src: string; volume?: number; hitFrame?: number; role?: string; sourceId?: string; durationFrames?: number }>;
  image_url?: string;
  image_assets?: Record<string, string>;
  visualBlueprint?: VisualBlueprint;
  styleProfile?: StyleProfile;
}

export interface SceneDataPayload {
  video: {
    title: string;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    style: string;
    generatedBy: 'agy';
    sourceProjectId: string;
    previewVersion: number;
    scriptVersion: number;
    audioUrl?: string;
    audioDurationSec?: number;
    captions?: CaptionWord[];
    styleProfile?: StyleProfile;
  };
  scenes: SceneData[];
}
