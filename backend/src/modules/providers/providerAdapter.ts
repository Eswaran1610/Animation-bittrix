import { ScriptSource, ScenePlanItem } from '../../types/index.js';

export interface ResearchAndScriptRequest {
  projectId: string;
  topicOrContent: string;
  inputType: 'text' | 'topic' | 'url';
  previousScriptVersion?: number;
  changeRequestFeedback?: string;
  existingNarration?: string; // Must be preserved on visual edits unless explicitly asked
}

export interface ResearchAndScriptResult {
  topicInterpretation: string;
  researchNotes: string;
  sources: ScriptSource[];
  factCheckNotes: string;
  narration: string;
  scenePlan: ScenePlanItem[];
  searchStatus: 'active' | 'unavailable' | 'cached';
  providerName: string;
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
