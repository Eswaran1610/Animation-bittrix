---
name: sfx-library
description: Generate and use object sound effects (pop, click, tick, whoosh, slide, riser, impact, sparkle, chime, draw, count, ding) for every motion video. Use whenever a video plan needs sound, when sound is missing, late, or not matching on-screen objects, or when asked to add or change a sound role. Produces a seeded, licence-free library plus a manifest with measured hit times so sounds land exactly on the visual frame.
---

# sfx-library

Object sounds are synthesized by `make_sfx.py` (no samples, no downloads, no licence issues).
A new seed gives a new sound set, so each daily video sounds different but renders repeatably.

## Every video, in this order
1. Take the job id from the plan (`plan.jobId`).
2. Run: `python make_sfx.py --out public/sfx --seed <jobId> --variants 4`
3. Load `public/sfx/sfx.manifest.json` with `libraryFromManifest(manifest, plan.fps)` (audioCues.tsx).
4. Build cues from the plan with `buildCues(plan, library)`. Never place sounds by hand or by seconds.
5. After render run `verify_sync.py`. A video whose sounds are not within 40 ms is not published.

## Choosing roles (decided from the plan, never hardcoded)
- element enters: `pop` (cards, icons), `tick` (text/bullets appearing), `click` (UI/buttons), `chime` or `ding` (a result/checkmark)
- lines and paths drawing: `draw`; numbers counting up: `count`
- scene transition: `whoosh` (big) or `slide` (small), hit at the transition midpoint
- build-up before a reveal: `riser`, ending exactly on the reveal frame, then `impact` or `sparkle`
- do not put a sound on every element; keep one sound per visible event, minimum 3 frames between the same role

## Adding a new role
Write one function in `make_sfx.py` that returns a float array, register it in `ROLES` as
`(function, "onset" or "peak", gain)`. Use "peak" for swells (hit = loudest moment), "onset" for hits.
Run the generator and check: no clipping, hit time is sensible, the manifest has the new role.

## Rules
- Hit time comes from the manifest (`transientMs`), never guessed.
- Mix level comes from `gain`; files are normalized to about -1 dBFS.
- The background bed is separate and continuous; it ducks under these sounds (see audioCues.tsx).
