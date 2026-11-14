---
name: motion-sync
description: Use when generating or fixing a Remotion motion-graphics/explainer video where voiceover, word-highlight captions, object sound effects and on-screen movement must stay in sync, and the frame must be well composed for 1080x1920. Covers plan.json-driven timing, caption rules, SFX scheduling, framing and the post-render audit.
---

# motion-sync

Pair with the official skills: `npx skills add remotion-dev/skills` (remotion-best-practices, remotion-captions, remotion-docs).
Never hardcode one video's timings: the plan drives everything, so a new topic tomorrow works unchanged.

## Pipeline (do in this order)

1. Write `plan.json` (see `examples/plan.example.json`): per scene narration, voice file, SFX events.
2. Generate ONE voice clip per scene (not one long clip), plus word timestamps from the TTS provider or whisper. Save under `public/voice/`.
3. `node scripts/validate_plan.mjs plan.json` must pass.
4. `node scripts/build_timeline.mjs plan.json public/timeline.json`.
5. Remotion reads `timeline.json` only. Scene `from`/`durationInFrames`, caption words and SFX frames all come from it.
6. Render, then `bash scripts/audit_video.sh out/final.mp4` and LOOK at the contact sheet before declaring done.

## Sync rules

- Scene duration = measured voice length + tail. Never a guessed constant.
- Caption highlight uses real word start/end. Never `index * N` frames.
- Every visible movement that should make a sound is an `events[]` entry at the same ms as the motion starts. Motion code reads the same frame from the timeline. No sound without an event, no event without a sound file.
- Typical mapping: element enters = whoosh, UI appears = pop, button/toggle = click, big reveal or breach = impact, glitch/error = glitch, success state = success. Vary choices per video.
- Music bed ducks under voice (`MusicBed`). Voice is the loudest layer. Target about -16 to -14 LUFS overall, peak under -1 dBTP.
- Export audio at 48 kHz.

## Caption rules (these were the real bugs)

- Render each word as its own inline-block, separated by an actual space character. Never rely on CSS gap or flex to produce spaces; never strip whitespace between spans.
- The active word changes colour/glow/transform only. Never font-size, font-weight or letter-spacing. Those reflow the line and make the block jump.
- Highlight ONE word at a time (the word being spoken), not a multi-word chunk.
- Fixed width, fixed alignment (center), fixed bottom offset, max 2 lines. Keep inside the safe area (about 150 px from the bottom edge on 1080x1920 so the UI of TikTok/Shorts/Reels does not cover it).
- Caption size at least 56 px on 1080x1920.

## Framing rules for 1080x1920

- Hero visual fills about 60% of the frame width and sits between 20% and 65% of the height. Not a small card in an empty frame.
- Diagram labels at least 28 px. If a label would be smaller, cut the label or zoom into that part of the diagram. Text a phone viewer cannot read counts as a bug.
- One idea per scene. A scene that only restates the previous one gets merged or removed.
- Scene headers should be unique; do not show the same header on consecutive scenes.
- Transitions: start the next scene's entrance before the previous exit ends (overlap 6-10 frames); do not leave dead frames.

## Done checklist

- validate_plan passed
- contact sheet inspected: no merged words, no reflow, nothing tiny
- loudness within target, no clipping
- every moving object has a matching sound event
- caption word timestamps came from TTS/whisper, not estimates (the validator warns otherwise)
