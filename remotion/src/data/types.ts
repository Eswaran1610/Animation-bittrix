export type LayoutPattern = 'HORIZONTAL_FLOW' | 'VERTICAL_STACK' | 'CENTRIC_FOCUS' | 'TRENDY_INSTA';

export interface VisualAsset {
  url: string;
  id: string;
  renderPosition: 'CENTER' | 'LEFT' | 'RIGHT';
}

export interface SfxConfig {
  src: string;
  triggerFrame: number;
}

export interface MotionSceneData {
  sceneId: string;
  layoutPattern: LayoutPattern;
  title: string;
  narrationText: string;
  sfxTrack?: SfxConfig;
  visualAssets?: VisualAsset[];
  durationInFrames?: number;
}

export interface VideoRenderContract {
  projectId: string;
  version: number;
  scenes: MotionSceneData[];
}
