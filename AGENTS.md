# SYSTEM RULES FOR ALL VIDEO GENERATION (apply to every video, every retry)

## A. ORDER OF WORK
1. **Write the script first**: one short sentence per scene.
2. **Generate the voice from that script**.
3. **Get word-level and sentence-level timestamps from the audio** (TTS output or speech-to-text).
4. **Only then build scenes, captions and animation from those timestamps**.  
*Never build visuals before the audio exists.*

## B. TIMING (no fixed durations, ever)
5. **Dynamic scene timing**: Each scene's start and length come from its spoken sentence: start = first word minus 5-8 frames, end = last word plus a short hold.
6. **Zero gaps or overlaps**: Scenes must tile the whole audio with no gaps or overlaps; total video length = audio length.
7. **Relative animations**: Compute all animation from the scene's own duration so short and long scenes both work.
8. **Audio cleanliness**: Trim silence or noise at the start and end of the audio.

## C. TEXT AND CAPTIONS
9. **Exact wording**: On-screen titles and captions use the exact narration wording. No paraphrasing.
10. **Zero offset alignment**: Word highlights are driven by word timestamps, with no offset.
11. **Consistency**: Keep the same tense, names and spelling in script, voice, title and captions.

## D. VISUALS
12. **Content focus**: Every scene must show what the sentence says (the object, place or idea), not the production process.
13. **No meta clutter**: Never show pipeline steps, code windows, tool names, placeholder counters or lorem text unless the video is about them.
14. **Mobile safe area**: Keep the layout safe for 9:16 vertical video, with text inside the safe margins and readable at phone size.

## E. MOTION
15. **Continuous motion**: Every scene needs continuous, smooth motion for its whole length (slow zoom or pan, moving glow, looping pulse, background drift), not just an entrance animation.
16. **Smooth easing**: Use easing only. No flicker, strobing or random jitter added just to pass checks.
17. **Motion energy threshold**: Quality gate: motion energy >= 0.80 per scene. Target >= 0.90 for a safety margin.
18. **Strict threshold adherence**: If a scene fails, add motion to that scene and re-render. Do not lower the threshold.

## F. FACTS AND SOURCES
19. **Ground truth**: Check every claim against a real, openly available source. Label implementation details separately from official specs.
20. **Verified URLs only**: List only sources with a real URL that you actually checked. Drop any you cannot confirm.
21. **Accuracy first**: Prefer accurate wording over catchy wording when they conflict.

## G. FINAL QA (all must pass before output)
22. Each scene change falls within +/-0.2s of its voice line's start.
23. Captions match the spoken words exactly.
24. No scene is static, and per-scene motion values are printed.
25. Audio and video durations match within one frame.
26. If any check fails, fix the cause, re-render, and report what changed.

## EXECUTION RULE: CLI-FIRST PIPELINE
- **All work is CLI-driven, not backend-dependent.**
- Audio file generation and voiceover are performed via CLI (`edgeTtsAlign.py` / CLI scripts), and the exact saved file paths (`audioPath`, `alignmentPath`) are returned and passed forward.
- Procedural object sound effects are generated via `make_sfx.py` so on-screen element movements, pops, and entrances have matching audio hits.
- Remotion rendering, motion energy checks, and QA sync verifications are run directly via CLI commands.

## I. 20-POINT MOTION ANIMATION ENGINE SPECIFICATION
28. **Scene Beats & Object Action List**: For each scene, enumerate objects + the explicit action each performs (`enter`, `move`, `hit`, `exit`).
29. **Unified Style String**: Fix one style string (e.g. `"flat vector, soft shadow, pastel, no text"`) and reuse it across every asset prompt in the project.
30. **Isolated Object Generation**: Generate each object as its own distinct asset (one prompt per object, plain background, adhering to the style string).
31. **Clean Background Generation**: Generate one background per scene with zero embedded objects and open empty center space for motion layers.
32. **Transparent Object Cutouts**: Remove backgrounds from objects (`rembg` / alpha mask) and save transparent PNGs: `/assets/scene_N/obj_name.png`.
33. **Visual Quality Gate**: Immediately reject and regenerate any asset containing burned-in text, cropped edges, or style mismatch.
34. **Layered Scene Scaffolding**: Construct each scene in four distinct z-index layers: (1) Background, (2) Midground Objects, (3) Foreground Objects, (4) Kinetic Typography on top.
35. **Spring Physics Law**: Animate using springs only (`damping: 12, stiffness: 120`). Never use linear easing.
36. **Organic Movement Triad**: Every moving object MUST exhibit: (1) Anticipation (small pullback), (2) Overshoot past target, (3) Elastic settle.
37. **Staggered Choreography**: Stagger object entrance timings by 4 to 8 frames so elements never arrive simultaneously.
38. **Continuous Parallax Drift**: Maintain slow camera drift or multi-plane parallax (Background: 2% drift, Foreground: 6% drift) so no frame is ever static.
39. **Subtle Idle Motion**: Apply continuous gentle idle motion after entry (floating, breathing, or rotating ±2°).
40. **Dynamic Shading & Motion Blur**: Render soft drop shadows that dynamically follow object coordinates, with velocity-proportional motion blur on fast moves.
41. **Animation Event Manifest**: Derive a structured event schedule from visual impacts: `{ frame, object, action }` (e.g. `{ frame: 42, object: "server", action: "hit" }`).
42. **Action-to-Sound Mapping**: Map each action to its corresponding acoustic role: `enter` → `whoosh`, `pop` → `pop`, `hit` → `thud/impact`, `click` → `tick`, `reveal` → `shimmer`, `text` → `soft tap`.
43. **Normalized Audio Cues**: Source SFX from library or procedural generation, trimmed to under 1.0s and loudness-normalized.
44. **Negative Two (-2) Frame Acoustic Lead**: Place sound events at `event_frame - 2` so auditory impact peaks synchronously with the visual hit.
45. **Three-Tier Audio Mix Levels**: Balance mix: Voice at `0 dB`, SFX at `-12 dB`, Background Music at `-22 dB` with automatic dynamic ducking under speech.
46. **Scene-by-Scene Crossfade Concatenation**: Render scenes individually at 1080p, 30fps (or 60fps), and crossfade transitions by 0.4s (12 frames @ 30fps).
47. **Automated QA Verification**: Enforce: zero overlapping object bounds, 100% sound coverage for visual events, and master loudness at `-14 LUFS`. Fix only the failing scene.

## J. MANDATORY BITTRIX TECHNOLOGIES OUTRO (FINAL 3 SECONDS & CONTINUOUS VOICE)
48. **Integrated Closing Outro (20s Content + 3s Bittrix)**:
    - Every video script is planned for **~20s content + 3s Bittrix outro = ~23s total runtime**.
    - The CLI script generates a continuous, seamless voiceover where the narration transitions from the topic summary directly into the Bittrix branded CTA.
    - **Visual Reference**: Built from `/home/eswaran/Downloads/bittrix-reel(1).html` and `remotion/public/bittrix-logo.mp4`.
    - **Canvas Animation Components**: Rotating hexagonal gear with "B", rolling chain link track, animated italic bold "BITTRIX" wordmark, tracking "TECHNOLOGIES" subtitle, expanding purple underline bar, and light shine sweep.
    - The voiceover and captions continue smoothly across the content and lead into the outro brand call-to-action with zero silence or gap.

---

# TWO-STAGE RENDER PIPELINE: PREVIEW, THEN FINAL

## STAGE 1: PREVIEW (Fast, Low Cost)
1. **Render settings**: Low-resolution preview (`540x960`, 15–30 fps, low quality) named `<topic>_preview_vN.mp4`. Use the identical script, audio, word/sentence timestamps, and scene timing as the final will use.
2. **Mandatory validation suite on preview**:
   - **LATENCY CHECK**: Output table of `voice_start`, `scene_start`, `caption_start`, and lags.
     - Scene lag: must be between `-0.30s` and `+0.10s`.
     - Caption lag: must be between `-0.10s` and `+0.20s`.
     - No cumulative timing drift from first to last scene.
   - **MOTION GATE**: Motion energy $\ge 0.80$ per scene (target $\ge 0.90$).
   - **TEXT**: Captions match narration word for word.
   - **AUDIO**: Audio and video duration match within 1 frame; zero silence or noise at start or end.
   - **VISUALS**: Zero pipeline UI, code windows, or placeholder content; text positioned within 9:16 safe margins.
3. **Retry limit**: If any check fails, fix the underlying cause, increment version (`preview_v2`, `preview_v3`...), and re-render. Maximum 3 preview retries.
4. **Failure cutoff**: After 3 failed retries, halt execution, report the failing rows and likely cause. Do NOT proceed to final.

## STAGE 2: FINAL (Only After Preview Passes Everything)
5. **Input freeze & manifest**: Lock all inputs (script, audio files, alignment JSON, scene timing). Generate and save a manifest with file checksums (SHA-256). Do not alter any inputs beyond this point.
6. **Full-resolution render**: Render final at 1080x1920 @ 30 fps using the locked inputs.
7. **Parity re-verification**: Ensure resolution/quality changes did not shift timing or motion:
   - Scene starts and caption starts within `0.05s` of preview values.
   - Motion energy within 10% of preview values per scene, and still $\ge 0.80$.
   - Audio and video durations match within 1 frame.
8. **Final retry guardrail**: If final differs from preview beyond tolerances, diagnose cause (e.g., fps shift, asset discrepancy), fix, and re-render final at most once. If it fails again, stop and report.

## DELIVERY
9. Deliver only the final `.mp4` plus a comprehensive report containing:
   - Latency alignment table (`voice_start`, `scene_start`, `caption_start`, `lag`).
   - Per-scene motion energy values.
   - Stage 1 preview and Stage 2 final check results.
   - Total number of retries used.
10. **Preserve artifacts**: Retain all preview files (`<topic>_preview_vN.mp4`) and reports for inspection. Never overwrite a previous version.
