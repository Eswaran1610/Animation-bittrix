import React from "react";
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import type { Timeline } from "./motionSyncTypes";

/** Map plan event types to files in /public/sfx. Add files, not code, to extend. */
export const SFX_LIBRARY: Record<string, string> = {
  whoosh: "sfx/whoosh.wav",
  click: "sfx/click.wav",
  pop: "sfx/pop.wav",
  impact: "sfx/impact.wav",
  glitch: "sfx/glitch.wav",
  success: "sfx/success.wav",
};

/** Voice + object sounds for the whole timeline. Everything is a <Sequence> at an exact frame. */
export const SfxTrack: React.FC<{ timeline: Timeline }> = ({ timeline }) => (
  <>
    {timeline.scenes.map((s) => (
      <Sequence key={s.id} from={s.fromFrame} durationInFrames={s.durationInFrames}>
        <Audio src={staticFile(s.voice)} />
        {s.sfx.map((e, i) =>
          SFX_LIBRARY[e.type] ? (
            <Sequence key={i} from={e.atFrame}>
              <Audio src={staticFile(SFX_LIBRARY[e.type])} volume={e.volume} />
            </Sequence>
          ) : null,
        )}
      </Sequence>
    ))}
  </>
);

/** Background bed that dips under voice. Volume is a per-frame function, so ducking is exact. */
export const MusicBed: React.FC<{
  timeline: Timeline;
  base?: number;
  ducked?: number;
  rampFrames?: number;
}> = ({ timeline, base = 0.22, ducked = 0.07, rampFrames = 6 }) => {
  if (!timeline.music) return null;
  const spans = timeline.scenes.map((s) => [s.fromFrame, s.fromFrame + s.voiceFrames] as const);
  const vol = (f: number) => {
    let v = base;
    for (const [a, b] of spans) {
      const d = interpolate(f, [a - rampFrames, a, b, b + rampFrames], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      v = Math.min(v, base - (base - ducked) * d);
    }
    return v;
  };
  return <Audio src={staticFile(timeline.music)} volume={vol} loop />;
};
