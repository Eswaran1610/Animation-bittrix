export type Word = { text: string; startMs: number; endMs: number };

export type SfxEvent = {
  /** key into your sfx library, e.g. "whoosh", "click", "impact", "pop" */
  type: string;
  /** ms from the START of the scene (same clock as the voice clip) */
  atMs: number;
  volume?: number;
};

export type PlanScene = {
  id: string;
  narration: string;
  /** voice clip for this scene, relative to /public */
  voice: string;
  /** optional word timings (from TTS provider or whisper). If absent they are estimated from clip length. */
  words?: Word[];
  events?: SfxEvent[];
};

export type Plan = {
  fps: number;
  width: number;
  height: number;
  tailMs: number; // silence after voice before next scene
  music?: string;
  scenes: PlanScene[];
};

export type TimelineScene = {
  id: string;
  fromFrame: number;
  durationInFrames: number;
  voice: string;
  voiceFrames: number;
  words: { text: string; startFrame: number; endFrame: number }[];
  sfx: { type: string; atFrame: number; volume: number }[]; // atFrame is scene-relative
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  music?: string;
  scenes: TimelineScene[];
};
