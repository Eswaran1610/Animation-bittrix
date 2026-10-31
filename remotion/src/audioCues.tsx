/**
 * audioCues.tsx: one clock for picture AND sound.
 *
 * Rule: audio is never built separately from the video. Every sound is derived from the
 * same plan (scenes + elements + frames) that drives the animation, so it works for any
 * video the pipeline makes tomorrow. Nothing here is specific to one video.
 */
import React from "react";
import { Audio, Sequence, interpolate, random, staticFile } from "remotion";

/* ---------- plan shape (subset of your plan JSON; frames are plan frames) ---------- */
export type PlanElement = { id: string; role?: string; enter: number };        // enter = frame inside scene
export type PlanScene = {
  id: string;
  startFrame: number;                 // absolute start AFTER transition overlap is applied
  durationFrames: number;
  transitionOutFrames?: number;       // occupies the last N frames of this scene
  voiceFile?: string;                 // public/ path, optional narration for this scene
  elements: PlanElement[];
};
export type Plan = { jobId: string; fps: number; totalFrames: number; scenes: PlanScene[] };

/* ---------- sound library: measured once, never guessed ---------- */
// transientFrames = frames from file start to the audible "hit" (detect with onset analysis
// when the file is added to the library). Without it every sound lands late by its attack time.
export type SfxAsset = { file: string; role: string; transientFrames: number; durationFrames: number; gain?: number };

/** Shape of public/sfx/sfx.manifest.json written by make_sfx.py (times in ms, so any fps works). */
export type SfxManifest = { seed: string; items: { file: string; role: string; transientMs: number; durationMs: number; gain: number }[] };
export const libraryFromManifest = (m: SfxManifest, fps: number): SfxAsset[] =>
  m.items.map((i) => ({
    file: i.file, role: i.role, gain: i.gain,
    transientFrames: Math.round((i.transientMs * fps) / 1000),
    durationFrames: Math.ceil((i.durationMs * fps) / 1000),
  }));
// usage: import manifest from "../public/sfx/sfx.manifest.json"; const library = libraryFromManifest(manifest, plan.fps);

export type Cue = {
  frame: number;          // when to START the file
  hitFrame: number;       // when the sound must be HEARD (= the visual frame). Used by verify_sync.py
  file: string; role: string; sourceId: string; volume: number; durationFrames: number;
};

/* ---------- 1. plan -> cues ---------- */
export const buildCues = (plan: Plan, library: SfxAsset[]): Cue[] => {
  const cues: Cue[] = [];
  const lastByRole: Record<string, number> = {};

  const push = (hitFrame: number, role: string, sourceId: string) => {
    const pool = library.filter((a) => a.role === role);
    if (!pool.length) return;
    // seeded choice: same job -> same result (renders are repeatable), new job -> new variety
    const a = pool[Math.floor(random(`${plan.jobId}:${sourceId}`) * pool.length)];
    const frame = Math.max(0, hitFrame - a.transientFrames);      // sound's hit lands ON the visual frame
    if (frame - (lastByRole[role] ?? -999) < 3) return;           // no machine-gun repeats of one role
    lastByRole[role] = frame;
    cues.push({ frame, hitFrame, file: a.file, role, sourceId, volume: a.gain ?? 1, durationFrames: a.durationFrames });
  };

  plan.scenes.forEach((s, i) => {
    s.elements.forEach((el) => push(s.startFrame + el.enter, el.role ?? "pop", `${s.id}.${el.id}`));
    const t = s.transitionOutFrames ?? 0;
    if (t > 0 && i < plan.scenes.length - 1) push(s.startFrame + s.durationFrames - t / 2, "whoosh", `${s.id}.transition`);
  });
  return cues.sort((a, b) => a.frame - b.frame);
};

/* ---------- 2. voice-first timing: scene length follows the voice, not a fixed 5 s ---------- */
export const sceneFramesFromVoice = (voiceSeconds: number, fps: number, minFrames = 60, leadFrames = 6, tailFrames = 12) =>
  Math.max(minFrames, Math.ceil(voiceSeconds * fps) + leadFrames + tailFrames);
// Measure voiceSeconds with ffprobe when the plan is built, then size the scene from it.

/* ---------- 3. ducking: bed gets out of the way of every sound ---------- */
const duckAt = (frame: number, cues: Cue[]) => {
  let d = 0;
  for (const c of cues) {
    const dt = frame - c.hitFrame;
    if (dt < -4 || dt > 12) continue;
    d = Math.max(d, interpolate(dt, [-4, 0, 12], [0, 1, 0]));
  }
  return d;
};

/* ---------- 4. the audio layer: render this once at the root of the composition ---------- */
export const SyncedAudio: React.FC<{
  plan: Plan; cues: Cue[]; bedFile?: string; bedVolume?: number; voiceLeadFrames?: number;
}> = ({ plan, cues, bedFile, bedVolume = 0.3, voiceLeadFrames = 6 }) => (
  <>
    {/* ONE continuous bed for the whole video: no restart per scene, no dead air */}
    {bedFile && (
      <Audio
        src={staticFile(bedFile)}
        volume={(f) =>
          bedVolume *
          (1 - 0.35 * duckAt(f, cues)) *
          interpolate(f, [0, 15], [0, 1], { extrapolateRight: "clamp" }) *
          interpolate(f, [plan.totalFrames - 20, plan.totalFrames], [1, 0], { extrapolateLeft: "clamp" })
        }
      />
    )}
    {/* voice starts a few frames after its scene starts, never before the visuals */}
    {plan.scenes.map((s) =>
      s.voiceFile ? (
        <Sequence key={`v-${s.id}`} from={s.startFrame + voiceLeadFrames} durationInFrames={s.durationFrames}>
          <Audio src={staticFile(s.voiceFile)} />
        </Sequence>
      ) : null
    )}
    {/* object sounds: one Sequence per cue, placed by frame */}
    {cues.map((c, i) => (
      <Sequence key={`c-${i}`} from={c.frame} durationInFrames={c.durationFrames}>
        <Audio src={staticFile(c.file)} volume={c.volume} />
      </Sequence>
    ))}
  </>
);

/* ---------- 5. usage ----------
 * const cues = buildCues(plan, library);
 * fs.writeFileSync(`out/${plan.jobId}.cues.json`, JSON.stringify(cues));   // for verify_sync.py
 * <AbsoluteFill> <Scenes/> <SyncedAudio plan={plan} cues={cues} bedFile={bed} /> </AbsoluteFill>
 * after render:  python verify_sync.py out/<job>.mp4 out/<job>.cues.json   (block publish on exit code 1)
 */
