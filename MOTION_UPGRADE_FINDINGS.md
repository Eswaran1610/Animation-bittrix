# Motion Upgrade Findings

Date: 2026-11-02

## Phase 0 findings

- Visual variety was constrained by the legacy five-value `StyleProfile`, a fixed adapter path, and a hard-coded neon/grid treatment in the renderer.
- Motion was mostly generic entrance/drift behavior. Blueprint objects did not have a required frame plan for hold, stagger, easing, or idle behavior.
- Render failures retained only a short error message. Captured renderer stdout/stderr, failure tags, preflight checks, retry policy, and heavy-frame protection were missing.
- Sound generation had one digital treatment and did not persist an explicit SFX pack or enforce a layered cue budget.
- Historical failure-rate analysis could not be completed because PostgreSQL was unavailable at `127.0.0.1:5434` during this run.

## Resolution decisions

- Added a validated top-level `styleBrief` and a shared root vocabulary contract in `motion-contract.json`.
- Preserved the existing approval-sensitive preview/final contract at **1080x1920, 30 FPS**. The task notes mention 540x960 preview output, but changing that would alter the current preview contract and therefore requires an explicit product decision.
- Preserved Gate 1 script approval, Gate 2 current-preview approval, approved narration, exact preview props for final rendering, structured JSON output, asset provenance, and frame-driven animation.

