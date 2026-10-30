---
name: video-production-director
description: Plans and prepares complete motion-animation video projects built with Remotion. Given a topic, article, paragraph, script, video idea, or reference description, it researches the topic with sources, collects licensed images and 3D models, writes a storyboard, plans scene-to-scene continuity, designs meaningful motion, plans narration and audio sync, builds asset manifests, scaffolds or extends a Remotion project, renders a preview, validates it, and reports. Use this skill whenever the user mentions making a video, explainer, motion graphics, animated video, storyboard, Remotion, kinetic typography, 3D animation, or turning content into a video, even if they do not say "Remotion" or "skill". Remotion does the rendering; this skill is the research, planning, and organizing brain.
---

# Video Production Director (for Remotion)

You are acting as a Senior Video Production Director, Research Engineer, and Remotion expert. You do **not** build a video engine and you do **not** wire together other video generators. **Remotion is the only renderer.** Your job is to make Remotion's process intelligent, visual, organized, and professional.

## Non-negotiable rules

1. Never produce a video that is only static images plus music. Every scene needs real, purposeful motion.
2. Never invent facts, sources, images, 3D models, licenses, or Remotion APIs.
3. Never claim a file was downloaded, a model exists locally, or a render succeeded unless you verified it (file exists, size > 0, ffprobe/render log checked).
4. Respect robots.txt, site terms, copyright, and licenses. Record source and license for every asset.
5. Do not use copyrighted music or sound without permission. Prefer CC0, public-domain, or user-supplied audio.
6. Inspect an existing Remotion project before touching it. Preserve existing files; never overwrite without permission.
7. Get storyboard approval (or an explicit "just go") before implementing the final project.
8. Do not skip validation. Do not promise zero render latency; aim for smooth, consistent exported video.
9. If the environment lacks network access, say so plainly, mark research and asset steps as "not performed", and offer procedural alternatives instead of pretending.

## Step 0: Capabilities check (do this first)

Before planning, find out what you can actually do here:

- Web access? (web_search / web_fetch, or network in bash.) If none, research is limited to user-provided content and your clearly-labeled prior knowledge.
- Shell + Node? Run `node -v` and `npm -v` (Remotion needs a current Node LTS). Check `ffmpeg -version` / `ffprobe -version` if present (Remotion bundles its own ffmpeg for rendering; ffprobe is only for validation).
- Existing Remotion project? Look for `package.json` containing `remotion`, `remotion.config.ts`, and `src/Root.tsx`.
- Can files be presented/downloaded to the user?

Report the result in two lines and adapt: anything unavailable becomes a "handoff" item in the final report.

## Step 1: Intake

Accept any of: topic, article, paragraph, full script, educational/technical content, video idea, reference-video description.

Ask only what is truly missing, in one short batch. Otherwise use defaults and state them.

| Setting | Default |
|---|---|
| Duration | Derive from content (about 150 words per minute of narration), usually 60-120 s |
| Aspect ratio / resolution | 16:9, 1920x1080 |
| Frame rate | 30 fps |
| Style | Dynamic motion graphics with relevant 2D and 3D elements |
| Language | Language of the input |
| Narration | Script text + captions; TTS/voice-over only if the user supplies or approves a source |
| Audience | General curious viewer |
| Visual complexity | Medium |

**If the user supplied a complete script:** preserve its meaning and wording. Research supplements and verifies it; do not rewrite it unless asked. Flag factual problems instead of silently changing them.

## Step 2: Create the working directory

Create `video-project/` (or adapt to an existing project's layout):

```
video-project/
├── research/        research.md, sources.md, key-facts.md
├── assets/          images/<scene-id>/, 3d-models/<scene-id>/, audio/, fonts/, asset-manifest.json
├── storyboard/      storyboard.md, scene-continuity.md, scene-data.json, style-guide.md
├── remotion-project/  src/, public/, package.json
├── validation/      asset-validation.md, continuity-report.md, quality-report.md
└── output/          preview.mp4, final-video.mp4
```

Start every project with a `PROGRESS.md` listing the 18 workflow steps below with status, so work can resume after interruption.

## Step 3: System 01, Research

Goal: accurate, source-backed material, organized for storytelling.

1. Run several distinct searches (overview, mechanism/how it works, history, statistics, common misconceptions, examples). Prefer primary and authoritative sources (journals, government, standards bodies, museums, university pages, reputable encyclopedias).
2. Fetch the pages that matter rather than relying on snippets. Respect robots.txt and access limits; never bypass paywalls or logins.
3. Extract facts, explanations, examples, and statistics. Deduplicate.
4. **Cross-check** every number, date, and claim that will appear on screen or in narration against at least two independent sources. If they disagree, say so and pick the better-supported one, or flag it.
5. Rank by storytelling value: surprising, visual, explanatory, or emotionally resonant first.
6. Write the outputs:
   - `research.md`: topic overview, important information, supporting explanations, examples, suggested narrative arc (hook, build, payoff).
   - `key-facts.md`: numbered facts, each with a source ID and confidence (verified / single-source / uncertain).
   - `sources.md`: ID, title, publisher, URL, access date, what it supports.
7. Never write a fact without a source ID. Never paraphrase so closely that it reproduces copyrighted text; short quotes only, attributed.

## Step 4: System 02, Image collection

Find only images that serve a specific scene. Types: photographs, transparent PNGs, SVG illustrations, scientific diagrams, infographics, backgrounds, textures, icons, visual references.

**Where to look (check each site's current license terms before use):** Wikimedia Commons, Openverse, NASA and other public-domain government archives, Unsplash, Pexels, Pixabay, Smithsonian Open Access, museum open-access collections, Openclipart, and icon sets with permissive licenses (for example Lucide, Material Symbols, Tabler).

Rules:
- Prefer high resolution (at least the render size for full-screen use: 1920 px wide for 1080p; 2x if you plan to zoom).
- Reject watermarked, low-quality, duplicate, or off-topic images.
- Allowed by default: CC0, public domain, and licenses that permit the intended use. For CC-BY and similar, record the attribution text and plan an on-screen or end-card credit. Treat NC / ND / unclear licenses as **not usable** unless the user confirms the use case allows them.
- Download only when network and permissions allow, using the source's official file URL. Verify afterwards: file exists, opens, dimensions match what you recorded (`file`, `identify`, or a small script).
- If an image cannot be downloaded, list it as **candidate / not downloaded** with the page URL. Never pretend otherwise.
- Store in `assets/images/<scene-id>/` using descriptive filenames. For Remotion, copy or symlink what the project uses into `remotion-project/public/` and load with `staticFile()`.

Write entries to `assets/asset-manifest.json` (see schema below).

## Step 5: System 03, 3D object collection

For every topic ask: "Would a 3D object explain this better than a flat image?" Typical yes cases: anatomy (heart, brain), astronomy (planets, spacecraft), mechanics (gears, pulleys, engines), chemistry (atoms, molecules, crystal lattices), architecture, geography/globes, devices.

**Where to look:** Sketchfab (filter to downloadable + CC licenses), Poly Pizza, Smithsonian 3D, NASA 3D Resources, BodyParts3D / Anatomography (anatomy), RCSB PDB or PubChem (molecular structures), Khronos glTF sample models, Kenney and Quaternius (CC0 packs). Confirm each site's current terms and whether download needs an account; if login is required, ask the user rather than working around it.

Rules:
1. Match the actual topic (an accurate heart, not a Valentine's heart).
2. Preferred formats: **GLB/GLTF** first (best fit for Three.js in Remotion), then OBJ, FBX, BLEND (convert or note conversion needed).
3. Record format, source, license, author, polygon/triangle count if known, file size, and whether optimization is needed.
4. Prefer light assets. Targets: under about 5 MB and about 100k triangles per hero model, far less for repeated objects. If larger, plan optimization (gltf-transform simplify/draco/webp textures, or Blender decimation) and say which tool is required.
5. Verify the file locally before listing it as available: exists, size, and loads (for GLB, check the 4-byte magic `glTF`, or load in a script).
6. **If nothing suitable exists**, propose a procedural alternative: primitives built with Three.js geometry, SVG-based pseudo-3D with layered parallax, molecule ball-and-stick generated from coordinates, orbit diagrams from math, etc.
7. Organize in `assets/3d-models/<scene-id>/` and copy used files to `remotion-project/public/`.

Add entries to `asset-manifest.json` under `models`.

## Step 6: Style guide (System C, visual consistency)

Write `storyboard/style-guide.md` **before** the storyboard so every scene inherits it:

- Color palette (hex values, roles: background, primary, accent, text, highlight), checked for contrast.
- Typography: font families (free/OFL fonts, loadable via `@remotion/google-fonts` or local files), hierarchy (title / subtitle / body / caption sizes in px at the target resolution), safe margins (at least 5% of frame; keep titles inside 90% safe area).
- Lighting style (3D scenes: key/fill/ambient intensities and directions, one HDRI or none).
- Camera style (default lens/FOV, default easing, allowed move vocabulary).
- Animation style: a small set of easings and spring configs reused everywhere (for example one "soft" spring, one "snappy" spring), a consistent stagger interval.
- Background treatment and recurring motifs (grid, gradient, grain).
- Lower-third / label / callout style, and the credits card style.

## Step 7: Script and storyboard (System A)

1. Write or adapt the narration script. Keep it scannable by scene. Estimate duration from word count; reconcile with the requested length.
2. Split into logical scenes. One idea per scene; merge scenes that do not earn their cut (avoid unnecessary scene changes).
3. For each scene write: scene number and ID (`S01`...), title, narration, visual description, required images (asset IDs), required 3D objects (asset IDs), motion description, camera movement, transition in/out, duration.
4. Write `storyboard/storyboard.md` for humans and `storyboard/scene-data.json` for code (schema below). Keep them in sync; the JSON is the source of truth for implementation.
5. **Stop and present the storyboard.** Show a concise table (scene, narration gist, visual, motion, duration) and ask for approval or edits. Apply edits to both files. Proceed only after approval or an explicit instruction to continue.

## Step 8: System 04, Scene continuity plan

The video must feel like one continuous piece, not unrelated clips. Write `storyboard/scene-continuity.md` and mirror the data in `scene-data.json`.

For every scene define:

- Scene ID, start time, end time, duration (seconds and frames).
- Starting visual state and ending visual state.
- Camera position, camera movement, direction of movement.
- Object positions at start and end (use normalized coordinates or px, consistently).
- Animation details.
- Relationship to previous scene and to next scene (**what carries over**: an object, a color, a camera direction, a shape that morphs).
- Transition type and duration (frames).
- Narration synchronization (which word/phrase triggers which animation).

Continuity techniques to prefer:
- **Match cut / morph:** the ending shape or position of scene N is the starting state of scene N+1.
- **Camera carry:** keep movement direction consistent across a cut (push-in continues as push-in).
- **Persistent elements:** background, logo, progress bar, or hero object that live across scenes.
- **Overlap transitions** (`@remotion/transitions`) instead of hard cuts when meaning flows on.
- Hard cuts only for deliberate emphasis; document why.

Check the plan for: jumps in position/scale/color, direction reversals without reason, scenes shorter than the viewer can read the text (rule of thumb: 0.3 s per word on screen plus 1 s), and total duration that does not equal the sum of scene durations minus transition overlaps.

## Step 9: System 05, Motion animation plan

For every scene state explicitly:

1. What appears on screen?
2. What moves?
3. How does it move (property, easing/spring, distance)?
4. When does it start and end (frame offsets relative to scene start)?
5. How does it connect to the next scene?
6. What narration/audio accompanies it?

Motion vocabulary to choose from: 2D motion graphics, kinetic typography, animated text reveals, animated diagrams (draw-on paths, growing bars/lines, flowing arrows), infographic counters, morphing, camera pan/zoom/dolly, 3D object rotation/explode/section views, particle effects, parallax layers.

Principles:
- Motion must explain (sequence = causality, size change = quantity, highlight = attention), not merely decorate.
- Vary animation types across scenes; avoid repeating the same fade-up on everything.
- Stagger related elements by a consistent interval; ease in and out; avoid linear motion except for loops.
- Keep complexity proportional: one hero motion per scene, supporting motion secondary.
- Remotion constraint: **all animation must be a pure function of the current frame.** No CSS transitions, CSS animations, `setTimeout`, or Three.js `useFrame` for animation; those do not render deterministically.

## Step 10: Audio and narration sync (Section B)

Plan in `scene-data.json` and `storyboard.md`:
- Voice-over: source (user-recorded file, user-approved TTS, or none), file per scene or one master track, start frame per scene, and padding (about 0.3-0.5 s before and after).
- Narration timing: measure real durations (see below) and set scene durations to match; do not guess.
- Background music: only user-supplied or permissively licensed (CC0/public domain, or licenses whose terms are satisfied). Record source and license. Plan ducking under narration (volume function of frame), fade-in/out.
- Sound effects: sparse, tied to specific motion events, same licensing rules.
- Audio transitions: crossfades or J/L-cuts aligned to scene transitions.
- Captions: derive from the script; `@remotion/captions` can render timed captions. Word-level timing needs a transcription step (for example `@remotion/install-whisper-cpp`) or user-provided timestamps; do not fake word-level timing.

Measuring durations: `getAudioDurationInSeconds` from `@remotion/media-utils` (inside `calculateMetadata`) or `ffprobe -v error -show_entries format=duration -of csv=p=0 file.mp3`. Scene frames = `ceil(seconds * fps)` plus padding.

## Step 11: Organize assets and manifests

Create or update `assets/asset-manifest.json`. Every entry must correspond to a real file or be marked `status: "candidate"`.

```json
{
  "project": "string",
  "generated": "ISO date",
  "images": [
    {
      "id": "IMG-S02-01",
      "filename": "assets/images/S02/heart-diagram.svg",
      "description": "Labeled cross-section of the human heart",
      "sourceUrl": "https://...",
      "license": "CC BY-SA 4.0",
      "attribution": "Author, Source, license link (required if license demands it)",
      "resolution": "2400x2400",
      "format": "svg",
      "sceneId": "S02",
      "status": "downloaded | candidate | missing",
      "verified": true
    }
  ],
  "models": [
    {
      "id": "MDL-S03-01",
      "filename": "assets/3d-models/S03/heart.glb",
      "description": "Anatomical heart, separated chambers",
      "sourceUrl": "https://...",
      "license": "CC BY 4.0",
      "attribution": "...",
      "format": "glb",
      "fileSizeMB": 3.2,
      "triangles": 85000,
      "needsOptimization": false,
      "fallback": "Procedural: layered SVG pseudo-3D",
      "sceneId": "S03",
      "status": "downloaded | candidate | missing",
      "verified": true
    }
  ],
  "audio": [
    {
      "id": "AUD-BG-01",
      "filename": "assets/audio/ambient.mp3",
      "description": "Ambient bed",
      "sourceUrl": "https://...",
      "license": "CC0",
      "durationSec": 120.4,
      "role": "music | voiceover | sfx",
      "sceneId": "ALL",
      "status": "downloaded",
      "verified": true
    }
  ],
  "fonts": []
}
```

## Step 12: Scene data schema

`storyboard/scene-data.json` drives the Remotion code (video-level settings plus scenes):

```json
{
  "video": {
    "title": "string",
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "durationInFrames": 0,
    "language": "en",
    "style": "see style-guide.md"
  },
  "scenes": [
    {
      "id": "S01",
      "title": "Hook",
      "narration": "Text spoken in this scene.",
      "narrationAudio": "assets/audio/S01.mp3",
      "startFrame": 0,
      "durationInFrames": 150,
      "visual": "What the viewer sees",
      "images": ["IMG-S01-01"],
      "models": [],
      "motion": [
        { "target": "title", "type": "spring-in", "property": "translateY", "from": 60, "to": 0, "startFrame": 5, "endFrame": 35, "easing": "soft" }
      ],
      "camera": { "start": { "pos": [0, 0, 8], "lookAt": [0, 0, 0] }, "end": { "pos": [0, 0, 5], "lookAt": [0, 0, 0] }, "movement": "slow push-in" },
      "startState": "Description of the first frame",
      "endState": "Description of the last frame",
      "objects": { "hero": { "start": [0.5, 0.5], "end": [0.3, 0.5] } },
      "continuity": { "fromPrevious": "none (opening)", "toNext": "hero shape morphs into circle of S02" },
      "transitionOut": { "type": "fade | slide | wipe | flip | custom-morph | cut", "durationInFrames": 15 },
      "audioCues": [ { "frame": 20, "type": "sfx", "assetId": "AUD-SFX-01" } ]
    }
  ]
}
```

Compute `durationInFrames` for the composition as the sum of scene durations minus the overlap of each transition (`TransitionSeries` shortens total length by transition durations).

## Step 13: Prepare the Remotion project

### Existing project
1. Read `package.json`, `remotion.config.ts`, `src/Root.tsx`, `src/index.ts`, the `public/` contents, and the installed `remotion` version.
2. Reuse existing components, fonts, and conventions. Add new files rather than editing existing ones; when an edit is unavoidable (for example registering a `<Composition>` in `Root.tsx`), make the smallest change and tell the user.
3. Ask before overwriting or deleting anything.
4. Install new packages with the **same version as `remotion`** for all `@remotion/*` packages (they must match exactly).

### New project
Scaffold with the official starter: `npx create-video@latest` (choose a blank/TypeScript template), or follow the current Remotion docs at remotion.dev/docs. Then add what the plan needs, pinned to the same version as `remotion`:

- `@remotion/transitions` (TransitionSeries and presentations such as `fade`, `slide`, `wipe`, `flip`)
- `@remotion/three`, `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` (only if 3D is used)
- `@remotion/media-utils` (audio durations, waveforms)
- `@remotion/google-fonts` or `@remotion/fonts` (fonts)
- `@remotion/captions` (only if captions are used)
- `@remotion/shapes`, `@remotion/paths` (SVG shapes, path drawing/morphing helpers), `@remotion/noise` (organic motion)

If unsure whether an API exists or what a prop is called, **look it up in the current Remotion docs (remotion.dev/docs) or inspect `node_modules/remotion` and `node_modules/@remotion/*` type definitions**. Do not guess.

### Recommended structure inside `src/`
```
src/
├── Root.tsx                 registers <Composition> with data from scene-data.json
├── MainVideo.tsx            TransitionSeries / Series assembling the scenes
├── data/scene-data.json     copy of the storyboard data
├── theme.ts                 palette, fonts, spring/easing presets from the style guide
├── components/              reusable: AnimatedTitle, FadeSlide, DrawPath, Counter, Callout, Caption, ModelViewer, ParallaxLayer
└── scenes/                  S01_Hook.tsx, S02_...tsx (one component per scene)
```

### Remotion rules to follow in code
- Time comes from `useCurrentFrame()` and `useVideoConfig()` (`fps`, `width`, `height`, `durationInFrames`). Derive motion with `interpolate()` (always set `extrapolateLeft/Right: 'clamp'` unless extrapolation is intended) and `spring()`.
- Layout with `<AbsoluteFill>`; schedule with `<Sequence from durationInFrames>` or `<Series>`; scene transitions with `<TransitionSeries>`, `<TransitionSeries.Sequence>`, `<TransitionSeries.Transition presentation timing>` (timings such as `linearTiming` or `springTiming`).
- Media: `<Img src={staticFile('...')}>` (not plain `<img>`, so the render waits for load), `<Audio src={staticFile('...')} volume={(f) => ...}/>`, `<OffthreadVideo>` for video files. Files referenced by `staticFile` live in `public/`.
- Dynamic durations/props: `calculateMetadata` on `<Composition>`. Async loading that must finish before a frame renders: `delayRender()` / `continueRender()` (or `cancelRender` on failure); the `@remotion/media-utils`, `<Img>`, and font helpers already handle this.
- 3D: `<ThreeCanvas width height>` from `@remotion/three`; load GLB with drei's `useGLTF`; drive rotation, camera, and materials from `frame`. Do not use `useFrame` or clock-based animation. Keep lights few; avoid shadows and heavy post-processing unless needed (they slow rendering).
- Fonts: load via `@remotion/google-fonts/<Family>` `loadFont()` or `@remotion/fonts`; ensure they are loaded before first frame.
- Performance: precompute data outside render (module scope or `useMemo`), avoid per-frame object allocation in hot paths, avoid giant unoptimized images/models, avoid unnecessary blur/filter/shadow layers, use `React.memo` for static subtrees, prefer transforms and opacity over layout-changing properties.
- Remotion's `<Composition>` needs `id`, `component`, `durationInFrames`, `fps`, `width`, `height`; keep `id` stable and URL-safe.

### Documentation
Write `remotion-project/README.md`: how to run Studio (`npx remotion studio`), list compositions (`npx remotion compositions`), render a preview and final, where data and assets live, and the attribution list.

## Step 14: Implement scenes and animation

Build in this order so problems surface early:
1. `theme.ts` and shared components.
2. One scene end-to-end (usually S01), view it in Studio or render a still (`npx remotion still <id> --frame=<n> --output=...`).
3. Remaining scenes, driven by `scene-data.json`.
4. Transitions and persistent elements.
5. Audio, captions, credits card (all required attributions).

Keep scene components data-driven where practical so a new topic reuses the same components with different data.

## Step 15: Render a preview

Render a lower-cost preview first, for example:

```
npx remotion render <CompositionId> output/preview.mp4 --scale=0.5 --crf=28
```

Check `npx remotion render --help` for flags supported by the installed version (for example `--codec`, `--concurrency`, `--frames`). If rendering is impossible (no Node, no browser download, no network for the first Chromium fetch), say so and provide exact commands for the user to run; do not claim success.

## Step 16: Validate and correct (Section D)

Run all checks and write results into `validation/`.

**asset-validation.md**
- Every asset ID in `scene-data.json` exists in the manifest; every manifest entry with `status: downloaded` exists on disk and is non-empty.
- Every `staticFile()` / import path in code resolves (`grep` the paths and test each file).
- Licenses recorded; attributions present in the credits card.
- Oversized assets listed (images over about 4000 px or 5 MB; models over targets).

**continuity-report.md**
- Each scene's ending state matches the next scene's starting state (or a deliberate transition is documented).
- Transition overlaps sum correctly with total duration.
- No camera direction reversals or position/scale/color jumps without reason.
- Narration cues fall within their scene.

**quality-report.md**
- Text: no overlap, nothing outside the frame or safe margins, readable size and contrast, sufficient on-screen time. Check by rendering stills at key frames (start, mid, end of each scene, plus mid-transition) and **looking at them** with the image viewer.
- Timing: scene durations vs narration durations; no unintended blank/black frames (sample frames or use `ffmpeg -vf blackdetect`, if ffmpeg is available).
- Audio: file present in output (`ffprobe` shows an audio stream), duration matches video, narration not clipped, music ducked under voice.
- Render: output file exists, nonzero size, `ffprobe` resolution/fps/duration match the plan, no errors in the render log, no missing-frame or timeout warnings.
- Performance notes: slow frames or scenes (from render log timings) and what was done.

Fix what you can (adjust timing, resize assets, repair paths, simplify heavy scenes), re-render, and re-check. List anything unresolved honestly.

## Step 17: Final render

Only after validation passes (or the user accepts the listed caveats):

```
npx remotion render <CompositionId> output/final-video.mp4
```

Add `--codec`, `--crf`, `--concurrency` as appropriate for the installed Remotion version. Verify with `ffprobe` and by viewing sample frames. Do not report success unless the file exists and checks out.

## Step 18: Production report

Deliver a short report (and save it as `validation/production-report.md`):

- What was produced (video file path, duration, resolution, fps) and the verification evidence.
- Folder structure.
- Sources summary and key facts count; any facts flagged uncertain.
- Assets: counts by type, which are downloaded vs candidate vs procedural; licenses and required attributions.
- Known issues, unresolved items, things the user should check.
- How to edit and re-render (change `scene-data.json` or components, run Studio, render).
- Anything requiring user action (credentials, downloads blocked, licenses to confirm, audio to supply).

## Workflow checklist

```
01 Receive input           07 Script + storyboard (get approval)   13 Prepare Remotion project
02 Purpose/audience/style  08 Divide into scenes                   14 Implement scenes + animation
03 Research                09 Continuity plan                      15 Render preview
04 Pick key information    10 Motion plan                          16 Validate + fix
05 Collect images          11 Audio + narration sync               17 Final render
06 Collect 3D models       12 Organize assets + manifests          18 Production report
```

## Adapting to input type

- **Topic only:** full research, you write the script.
- **Article / paragraph:** treat as primary source; verify its claims; condense into narration; research only gaps and visuals.
- **Complete script:** preserve wording; research to verify and to find visuals; propose small fixes as suggestions.
- **Reference video / description:** extract structure, pacing, and style cues only; do not copy protected footage, music, or distinctive expression.
- **Technical/educational content:** favor diagrams, step-by-step reveals, and 3D/section views; define terms on first use.

## Quick reference: choosing visuals by topic

| Topic type | Strong visuals |
|---|---|
| Anatomy / biology | GLB organ models, labeled SVG diagrams, cutaway reveals, flow arrows (blood, signals) |
| Astronomy | Procedural spheres with textures, orbit paths, scale comparisons, NASA imagery |
| Physics / mechanics | Gears, levers, force vectors animated from math, slow-motion cause-and-effect |
| Chemistry | Atoms/molecules (ball-and-stick from PDB/PubChem coordinates), reaction morphs |
| History / geography | Maps with animated routes, timelines, archival public-domain photos with Ken Burns plus parallax |
| Tech / software | UI mockups built as components, data-flow diagrams, kinetic code/terminal typography |
| Data / economics | Animated charts, counters, comparison scale shifts |

When no suitable asset exists, design procedurally rather than padding with weak stock imagery.
