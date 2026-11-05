---
name: motion-trend-researcher
description: Research the submitted content across multiple sources plus current motion-graphics trends (Claude / Claude Code style videos), and return a suggestion.txt brief for the planning agent.
---

# Motion Trend Researcher
# SUGGESTION.TXT - REEL-STYLE MOTION VIDEO BRIEF FOR THE CLI AGENT (AGY / CODEX / CLAUDE CLI)

## PURPOSE
Make a short vertical motion-graphics video in the style of a modern agency/product reel:
big topic-specific visuals, one idea per beat, kinetic text locked to the voice, and sound events
on every important movement. This brief describes HOW to plan. The SUBJECT comes only from the
user's submitted content. Never reuse example topics. Every video must look different.

> **CRITICAL RULE**: The examples in `[brackets]` come from a studied reel (marketing agency promo).
> They show the logic and techniques ONLY. Do NOT apply them verbatim to daily videos.
> Never copy that reel's brand, logos, characters, layouts, or wording.
> Every video's subject, palette, assets, and narrative must be dynamically derived from that specific user submission.

-------------------------------------------------------------------------------------------------
## 1. OUTPUT FORMAT
-------------------------------------------------------------------------------------------------
- 1080 x 1920, 30 fps, 20-40 seconds. Remotion is the only renderer.
- 8-12 scenes ("beats"), each 2-3.5 s (60-105 frames). Total must equal narration length.
- Safe area: side margin 64 px, top 220 px, bottom 380 px. Keep titles, captions and hero
  objects inside it (platform buttons cover the edges).
- The renderer contract in the main prompt wins over anything here if they conflict.

-------------------------------------------------------------------------------------------------
## 2. STORY STRUCTURE (adapt to the content, do not force the same order every time)
-------------------------------------------------------------------------------------------------
1. **HOOK (beat 1)**: a question, a pain, or a surprising claim about the topic. Under 10 words.
2. **FRAME (beat 2)**: who/what this is about, one line.
3. **BODY (beats 3-8)**: one idea per beat. Each idea = one noun/mechanism the viewer can SEE.
4. **PROOF or CONTRAST (1-2 beats)**: a number, a before/after, a comparison, a result.
5. **CTA (last beat)**: 2-4 words, big, nothing else on screen.
Sentences may continue across scenes ("Whether you need a ... / or a full ...") to keep people
watching until the thought is finished.

-------------------------------------------------------------------------------------------------
## 3. VOICE-OVER RULES
-------------------------------------------------------------------------------------------------
- Short spoken sentences, 6-12 words per beat. Plain words. No filler, no jargon unless the
  topic needs it and the term is shown on screen.
- One idea per beat. If a beat needs "and", split it.
- Mark 1-3 EMPHASIS WORDS per beat (the words that carry meaning). They get the visual accent.
- Preserve approved narration across visual-only revisions.
- Scene length is set by MEASURED narration time (word timestamps), not guessed durations.
  If speech does not fit, shorten the scene text first, then speed up voice a little.
- Last line is the call to action.

-------------------------------------------------------------------------------------------------
## 4. ASSET COLLECTION LOGIC (do this per beat, from the narration)
-------------------------------------------------------------------------------------------------
- **Step A: Extract the KEYWORD** of the beat (the one noun, mechanism or number that matters).
- **Step B: Decide the asset type** by what the keyword is:
  - concrete thing or tool -> 3D-style icon or object [logic: websites -> laptop + globe]
  - abstract idea -> a metaphor object [logic: save hours -> pocket watch; real-time -> map pin; growth -> rocket]
  - person / role / audience -> background-removed cutout photo in a coloured frame
  - product, app, page, dashboard -> UI mockup built as a vector card (or a licensed screenshot)
  - number, price, comparison -> large type badge or bar, no photo needed
  - well-known platform/brand -> its logo only if it is the real subject, small, may be blurred
- **Step C: Search for the asset** (web search). For every asset return: direct HTTPS file URL, source
  page URL, license, required attribution. Prefer open licenses (CC0, CC-BY, public domain).
- **Step D: If no suitable licensed asset is verified**, DO NOT guess. Write "use authored vector" and
  describe it as shapes + text so Remotion can draw it.
- **Step E: Normalise every asset** to one visual system (see section 5) so assets from different
  sources look like one set: remove background, recolour to the palette, same shadow,
  same perspective, same level of detail.

**Rules**:
- 1 HERO asset per beat, at least 40% of frame width. 0-2 secondary assets, each under 15%.
- Decoration (dot grid, lines, underline strokes, blobs) is texture only, never the message.
- Never repeat the same hero asset in two beats. Never use a generic placeholder (a plain
  circle, ball or glow) as the hero for a topic that has a real object.
- 3 asset families mixed across the video: photo cutouts, icons/objects, UI/data cards.

-------------------------------------------------------------------------------------------------
## 5. STYLE SYSTEM (choose per video, from the content; vary between videos)
-------------------------------------------------------------------------------------------------
- ONE accent colour + near-black text + one neutral background. Everything else is tints of these.
  Pick the accent and background to suit the topic and audience. Do not default to the same
  palette every time. [reference logic: purple accent, black text, light gray background]
- Photos: grayscale or duotone so the accent colour stays the loudest thing on screen.
- Headline type: heavy sans-serif. Mix weights inside one line: light for context, black or
  accent colour for the emphasis words.
- Minimum sizes: headline 64 px+, labels 36 px+, captions 28 px+. Nothing decorative below 24 px.
- Use the whole safe area. If more than about 45% of it is empty, enlarge or add a secondary.

-------------------------------------------------------------------------------------------------
## 6. SCENE LAYOUT TEMPLATES (pick one per beat, never the same twice in a row)
-------------------------------------------------------------------------------------------------
- `hero-center`: big headline above, hero object centred below.
- `frame-cutout`: person cutout standing in a coloured card/frame, headline above or beside.
- `card-stack`: 2-3 UI cards or pills sliding in one after another (list of features).
- `big-statement`: words only, huge, kinetic. Good for hook and call to action.
- `split-compare`: two states side by side, before/after, A vs B.
- `data-badge`: one number or price in a coloured bar with a label.
- `code-or-ui-stage`: typed code or interface panel with a highlighted line / cursor
  (for technical topics; show the real lines, not an analogy).
- `flow-path`: nodes joined by lines with packets travelling along the path.
The template must follow the content: technical topic -> code-or-ui-stage / flow-path;
people-focused topic -> frame-cutout; numbers -> data-badge. Do not pick by habit.

-------------------------------------------------------------------------------------------------
## 7. MOTION RULES (Remotion, frame-driven, 30 fps)
-------------------------------------------------------------------------------------------------
- Something must move within the first 10 frames of every beat. No dead frames, no static holds.
- **TEXT**: reveal word by word, 3-5 frames per word, each word fades in from 24 px below with a
  blur that sharpens (12 px -> 0). Reveal each word at its SPOKEN timestamp, not at scene start.
  Emphasis words: accent colour, heavier weight, tiny scale pop (1.0 -> 1.08 -> 1.0).
- **HERO ENTRANCE**: spring with small overshoot (mass 0.5, stiffness 160, damping 12).
  Secondaries enter 4-8 frames after the hero, staggered.
- **HERO LOOP after landing**: slow float, rotate 2-4 deg, or pulse so the screen never freezes.
- **CAMERA**: slow push (scale 1.00 -> 1.06 across the beat) and light parallax between layers.
- **LIST BEATS**: items arrive one per spoken item, aligned to the word.
- **TRANSITIONS**: overlap 8-12 frames. The incoming scene starts moving before the outgoing one is
  gone. Prefer MATCH CUTS / smooth continuous flow: a shape, colour block or object that exits scene N
  becomes the frame, panel or mask of scene N+1.
- Hook and CTA scenes get the strongest motion. Middle scenes stay readable.
- No two consecutive scenes may share template + transition + entrance.

-------------------------------------------------------------------------------------------------
## 8. SOUND RULES
-------------------------------------------------------------------------------------------------
Layers: VOICE (primary) + MUSIC BED (continuous) + SFX (from plan events).
- Bed: choose mood from the content (focused, upbeat, calm, cinematic). Generated or licensed
  per video, never one hard-coded loop. Duck the bed about 12-18 dB under the voice while speaking.
- IMPACT or RISER at the first major scene change (hook -> body) and at the CTA.
  Riser starts 0.8-1.2 s before the change, impact lands on the first frame of the new scene.
- SFX per motion event, each tied to a plan event and frame, not random:
  - hero lands -> soft pop / thud
  - card or pill in -> short whoosh
  - text word/typing -> light tick (only for typed or code text, keep very quiet)
  - number counts -> rising tick run
  - transition -> whoosh sized to the move
- At most one SFX per 0.5 s (except typing ticks). SFX sit about 8-10 dB under the voice.
- Every SFX event must be listed in the plan with scene, frame and type so the mixer can place it.

-------------------------------------------------------------------------------------------------
## 9. PLAN FIELDS PER SCENE (return these in the scene plan JSON)
-------------------------------------------------------------------------------------------------
```json
{
  "scene_number": 6,
  "role": "body",
  "duration_sec": 2.8,
  "narration": "so you save hours every week",
  "keyword": "hours",
  "emphasis_words": ["every week"],
  "layout": "hero-center",
  "template": "hero-center",
  "on_screen_text": "so you save hours / every week",
  "hero_asset": {
    "type": "3d-icon",
    "query": "pocket watch",
    "treatment": "tint-to-accent",
    "download_url": "...",
    "source_url": "...",
    "license": "...",
    "attribution": "..."
  },
  "secondary_assets": [],
  "decoration": ["dot-grid"],
  "motion_in": "spring-scale + blur-to-sharp",
  "motion_loop": "slow-rotate 3deg",
  "camera": "push 1.00-1.06",
  "transition_out": { "type": "match-cut", "frames": 10, "carries": "accent panel becomes next card" },
  "sfx": [ { "frame": 0, "type": "pop" }, { "frame": 40, "type": "tick" } ],
  "continuity_to_next": "accent panel wipes across and becomes the next frame"
}
```

-------------------------------------------------------------------------------------------------
## 10. QUALITY CHECK BEFORE RETURNING THE PLAN
-------------------------------------------------------------------------------------------------
- [ ] A beat has no topic-specific hero object (only glow, circle, ball or text).
- [ ] Hero is under 40% of frame width, or more than ~45% of the safe area is empty.
- [ ] Any text smaller than the minimum sizes, or outside the safe area.
- [ ] Caption or headline cut mid-phrase, or caption only repeats the headline.
- [ ] Two consecutive scenes use the same template, entrance or transition.
- [ ] A beat has more than one idea, or more than 12 spoken words.
- [ ] Emphasis words are not marked, or accent colour is not the loudest element.
- [ ] An asset has no URL + license, and is not marked "use authored vector".
- [ ] A scene has no motion in its first 10 frames.
- [ ] SFX list missing, or SFX not tied to a frame.
- [ ] The plan looks like the previous video (same palette, same layout order, same sounds).

-------------------------------------------------------------------------------------------------
## 11. DO NOT
-------------------------------------------------------------------------------------------------
- Do not copy another creator's brand, logo, characters, exact layout or wording.
- Do not invent facts, prices, statistics or claims. Every factual line needs a source.
- Do not use an analogy as the main visual when the content is about something real
  (for example, do not explain code with a ball; show the code).
- Do not output a static image sequence. Every object moves.
- Do not hard-code a topic, palette or scene list. Everything comes from THIS submission.
