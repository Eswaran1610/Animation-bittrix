import { ScriptSource, ScenePlanItem, StyleProfile } from '../../types/index.js';

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated: boolean;
  available?: boolean;
  source: 'codex' | 'agy' | 'unavailable';
}

export interface ResearchAndScriptRequest {
  projectId: string;
  topicOrContent: string;
  inputType: 'text' | 'topic' | 'url';
  previousScriptVersion?: number;
  changeRequestFeedback?: string;
  existingNarration?: string; // Must be preserved on visual edits unless explicitly asked
  requestedDurationSec?: number;
  selectedTheme?: string;
}

export interface ResearchAndScriptResult {
  topicInterpretation: string;
  researchNotes: string;
  sources: ScriptSource[];
  factCheckNotes: string;
  narration: string;
  scenePlan: ScenePlanItem[];
  styleBrief: StyleBrief;
  styleProfile: StyleProfile;
  searchStatus: 'active' | 'unavailable' | 'cached';
  providerName: string;
  tokenUsage: TokenUsage;
}

export interface StyleBrief {
  archetype: 'kinetic-type' | 'isometric-diagram' | 'data-story' | 'paper-cutout' | 'neo-brutalist' | 'glass-ui' | 'blueprint-technical' | 'retro-terminal';
  palette: { bg: string; primary: string; accent: string; text: string };
  fonts: { heading: string; body: string };
  motionPersonality: 'snappy' | 'fluid' | 'bouncy' | 'precise';
  transitionSet: Array<'slide' | 'wipe' | 'flip' | 'fade' | 'push' | 'whip'>;
  background: 'grid' | 'particles' | 'gradient-flow' | 'halftone' | 'lines';
  sfxPack: 'digital' | 'organic' | 'cinematic' | 'playful';
  bedMood: string;
}

export interface AnimationCodeRequest {
  projectId: string;
  scriptVersion: number;
  narration: string;
  scenePlan: ScenePlanItem[];
  previewVersion: number;
  visualCorrectionFeedback?: string;
}

export interface AnimationCodeResult {
  compositionCode: string;
  assetInstructions: Array<{ name: string; type: string; purpose: string }>;
  durationInFrames: number;
  fps: number;
}

export interface AIProvider {
  name: string;
  generateScript(req: ResearchAndScriptRequest): Promise<ResearchAndScriptResult>;
  generateAnimationCode(req: AnimationCodeRequest): Promise<AnimationCodeResult>;
}
