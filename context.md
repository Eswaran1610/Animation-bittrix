# Animation Pipeline - Project Context & Specification

## Executive Summary
An end-to-end AI Animation Pipeline application where:
1. User submits content (topic, text, or URL) via the dashboard.
2. Codex conducts research, planning, and drafts a structured script with sources, complete narration, and scene-by-scene breakdown.
3. **Gate 1 (Script Approval):** Human verifies, edits, or requests changes. Only explicit approval unlocks animation generation.
4. System creates creative direction, scene plan, assets, and Remotion composition code.
5. System renders a fast preview video.
6. **Gate 2 (Preview Approval):** Human watches the preview and explicitly approves the *exact current preview version* or requests changes.
7. Only upon Gate 2 approval does the system render the final high-quality video and make it available in the video library.

---

## Non-Negotiable Core Rules
1. **Approval Gates are strictly enforced:**
   - No animation generation before explicit Script Approval.
   - No final render before explicit approval of the *current* preview version (an older preview's approval does not transfer).
2. **Narration Integrity:** Visual/code corrections must NOT alter approved narration unless the user explicitly requests script revision.
3. **Remotion is integrated by default:** No separate user login or external account required.
4. **Provider Abstraction:** Codex is the primary active provider now; Claude and Codex are designed as pluggable provider adapters for later.
5. **Security:** API keys and credentials reside strictly on the backend/worker, never in frontend code. AI-generated code is treated as untrusted and validated.

---

## Technology Stack
- **Frontend:** React 18+ / Vite / TypeScript, Tailwind CSS, Lucide icons
- **Backend:** Node.js (v26) + Express + TypeScript / ESM
- **Database:** Local PostgreSQL (`projects`, `scripts`, `approvals`, `assets`, `jobs`, `render_jobs`, `videos`, `agent_runs`)
- **Animation & Rendering:** Remotion (@remotion/bundler, @remotion/renderer, @remotion/shapes, @remotion/transitions)
- **Voiceover Engine:** Neural TTS (`edge-tts` Microsoft Edge Neural Voice `en-US-ChristopherNeural` + `ffmpeg`)
- **Web Asset Ingestion:** Live Wikipedia / Wikimedia Commons API for verified open scientific diagrams
- **AI Providers:** Codex CLI/SDK adapter (current, with active tool permissions), Claude / Codex (future provider adapters)
- **Media Storage:** Local media server with object storage / Cloudinary migration path

---

## System Architecture & Directory Structure
```
AnimationPipeline/
├── backend/                  # Node.js + Express API server
│   ├── src/
│   │   ├── config/           # DB & environment settings
│   │   ├── db/               # PostgreSQL schema & connection pool
│   │   ├── modules/
│   │   │   ├── projects/     # Project lifecycle management
│   │   │   ├── providers/    # AI Provider adapter (Codex, Claude, Codex)
│   │   │   ├── research/     # Topic research & fact checking
│   │   │   ├── scripts/      # Script generation, versioning & diffs
│   │   │   ├── approvals/    # Gate 1 (Script) & Gate 2 (Preview) gatekeeper
│   │   │   ├── assets/       # Media asset tracking & metadata
│   │   │   ├── animation/    # Creative direction & Remotion composition generator
│   │   │   ├── jobs/         # Durable DB-backed job queue & execution
│   │   │   ├── renders/      # Preview & final render job coordinator
│   │   │   └── videos/       # Completed videos library
│   │   ├── middleware/       # Error handling, validation
│   │   └── server.ts         # Express app entrypoint
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React + Vite + TypeScript application
│   ├── src/
│   │   ├── components/       # UI Components (Dashboard, Cards, Modals, Navbar)
│   │   ├── pages/            # Dashboard, ProjectDetail, ScriptReview, PreviewReview, Settings
│   │   ├── services/         # API client
│   │   ├── types/            # TypeScript data contracts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── remotion/                 # Remotion root template & dynamic compositions
│   ├── src/
│   │   ├── Root.tsx
│   │   ├── Composition.tsx
│   │   └── scenes/
│   ├── remotion.config.ts
│   └── package.json
├── worker/                   # Local rendering worker for Remotion previews & final renders
│   ├── src/
│   │   └── renderWorker.ts
│   └── package.json
├── database/                 # PostgreSQL migration scripts & init schema
│   ├── schema.sql
│   └── setup_db.sh
├── context.md                # Project architecture & specifications (this file)
└── content.md                # Persistent AI-to-AI conversation and handover log
```

---

## Milestones & Status
- [x] **Milestone 0:** Specification intake and architecture design
- [x] **Milestone 1:** Frontend UI (Dashboard, Content Input, Project Cards, Detail Views, Script & Preview Review panels)
- [x] **Milestone 2:** Backend & PostgreSQL setup (Schema, APIs, versioned models, approval gates)
- [x] **Milestone 3:** Codex Research & Script versioning workflow (Gate 1 enforcement verified)
- [x] **Milestone 4:** Remotion composition generation & Preview rendering worker (verified)
- [x] **Milestone 5:** Preview revision & Versioned Approval (Gate 2 enforcement verified)
- [x] **Milestone 6:** Final video rendering & delivery library (verified)
- [x] **Milestone 7:** Provider adapter extension interface (Claude / Codex ready)
