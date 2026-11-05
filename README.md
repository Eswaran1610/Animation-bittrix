# AI Animation Pipeline

An end-to-end autonomous motion-graphics animation platform combining:
- **Codex Autonomous Agent** with active live web research and skill reference (`video-production-director`)
- **Remotion** deterministic motion-graphics engine with Chromium headless rendering
- **Motion Canvas** programmatic 2D vector animation engine (signals, generators, and interactive editor)
- **Neural Voiceover TTS** via local Kokoro model
- **Codex-selected media assets** downloaded, validated, versioned, and staged by the backend
- **PostgreSQL Database** for durable project states, scripts, approvals, and render records
- **React + Vite + TypeScript Frontend** dashboard with strict two-gate human approval workflows

---

## Architecture Overview

```
AnimationPipeline/
├── backend/                  # Express REST API & Orchestration
│   ├── src/
│   │   ├── modules/
│   │   │   ├── projects/     # Project lifecycle
│   │   │   ├── providers/    # Codex Provider with active web search & skill planning
│   │   │   ├── scripts/      # Script versioning & change requests
│   │   │   ├── approvals/    # Gate 1 & Gate 2 human verification
│   │   │   ├── audio/        # Kokoro narration and project-scoped sound effects
│   │   │   ├── assets/       # Codex-selected asset download and ingestion
│   │   │   ├── renders/      # Remotion render coordinator
│   │   │   └── videos/       # Completed videos library
│   │   └── server.ts         # Express server (Port 5000)
├── frontend/                 # React + Vite + TypeScript (Port 5173)
│   ├── src/
│   │   ├── components/       # Dashboard, ProjectDetail, VideosLibrary, Approval Gates
│   │   └── services/         # API integration
├── remotion/                 # Remotion 4.0 Motion Graphics Engine
│   ├── src/
│   │   ├── components/       # Blueprint scenes, asset images, and 3D model rendering
│   │   ├── data/             # Dynamic scene-data.json source of truth
│   │   ├── MainVideo.tsx     # Scene sequencer with <Audio /> playback
│   │   └── Root.tsx          # Dynamic composition registration
├── motion-canvas/            # Motion Canvas 3.17 Vector Animation Studio
│   ├── src/
│   │   ├── scenes/           # Procedural generator scenes (signals & vector layouts)
│   │   └── project.ts        # Motion Canvas project configuration
│   └── vite.config.ts        # Motion Canvas Vite + FFmpeg export plugin
├── database/                 # PostgreSQL cluster & schema
│   ├── schema.sql            # Table definitions
│   ├── start_pg.sh           # Start user-space PostgreSQL 5434
│   └── stop_pg.sh            # Stop PostgreSQL
└── .agents/skills/           # video-production-director skill
```

---

## Quickstart (office laptop or home laptop)

Prerequisites:

- Node.js 22.12+ (the repository pins this baseline in `.nvmrc`)
- Docker Desktop, recommended for the same PostgreSQL setup on Windows, macOS, and Linux
- Codex CLI installed and authenticated on the machine that runs the backend
- FFmpeg and FFprobe available on the backend machine for audio conversion

Clone the repository, then run these commands from the repository root:

```bash
npm run install:all
```

Copy `backend/.env.example` to `backend/.env`. Copy `frontend/.env.example` to `frontend/.env` if you need to change frontend ports or the backend address. The defaults are portable and do not contain a developer-specific path.

Start the database, backend, and frontend in separate terminals:

```bash
npm run db:start
npm run backend:dev
npm run frontend:dev
```

Open `http://localhost:5173`. The database command uses Docker when available and falls back to a native PostgreSQL installation with an existing `database/pgdata` directory. `npm run db:stop` stops either supported database mode.

For a production-style verification build:

```bash
npm run build
```

### Port and path configuration

Ports are configured through environment variables, not source-code edits:

- `backend/.env`: `HOST`, `PORT`, `DATABASE_URL`, `PGPORT`, `MEDIA_DIR`, and Remotion render worker/frame-timeout settings (`REMOTION_CONCURRENCY`, `REMOTION_FRAME_TIMEOUT_MS`)
- `frontend/.env`: `VITE_HOST`, `VITE_PORT`, and `VITE_BACKEND_URL`
- Docker: `PGPORT` controls the host PostgreSQL port

`MEDIA_DIR=./media` is resolved relative to the `backend` directory. Render, audio, and downloaded assets are written below that directory. Remotion is resolved from the repository root, so the app can be started from the root or backend directory without changing paths. Use `PROJECT_ROOT` only when the repository is intentionally mounted somewhere unusual.

### GitHub office/home workflow

Source code, lockfiles, configuration templates, and schema changes are versioned in Git. On the other laptop:

```bash
git pull
npm run install:all
npm run db:start
npm run backend:dev
npm run frontend:dev
```

Generated videos, audio, downloaded assets, and the PostgreSQL data directory are intentionally ignored by Git. They do not move between laptops with `git pull`. Export or copy those separately when you need the previous projects and videos on both machines; never commit `.env` files or provider tokens.

## Content-to-video contract

The production path is intentionally strict:

`submitted content → Codex live research → Codex narration + scene plan → human Gate 1 approval → headless Remotion MP4 preview + quality gates → human Gate 2 approval → final Remotion video`

Codex's returned plan is validated before it is stored. Scene type, colors, text, nodes, metrics, asset queries, motion cues, and continuity must be present in the Codex response; the renderer does not invent missing scene content. If Remotion fails, the request fails—there is no generic FFmpeg substitute that could be mistaken for the requested video. Visual corrections create a new Codex plan version and must pass Gate 1 again, while the approved narration is preserved unless a narration change is requested.

The Remotion composition also rejects a stale/manual scene-data file unless the backend has marked it with Codex provenance.

### Research and asset handoff

Before Codex researches or plans, the backend loads the repository `video-production-director` skill and supplies the live render contract from this Remotion project: composition dimensions, scene and object limits, accepted schema, supported templates and object types, installed model IDs, media formats, and file-size limits. The renderer contract takes precedence over generic skill defaults, so Codex plans against what this project can render. The dashboard starts the authenticated Codex CLI in read-only mode. For every request Codex researches the topic and candidate visual assets, then returns the narration, scene plan, exact direct download URLs, source pages, claimed licenses, and required attribution. Codex does not write media files. After Gate 1 approval, the backend downloads those exact Codex-selected files, validates them, records their provenance and backend media URL, and stages them for Remotion. Assets and `asset-manifest.json` are versioned under `backend/media/projects/<project-id>/previews/v<version>/`; Remotion reads the matching copy from `remotion/public/projects/<project-id>/previews/v<version>/`. Gate 1 displays the asset source and claimed license for human review.

No asset-catalog API key is required. If Codex cannot verify a suitable licensed image or 3D model, it should plan an authored vector or procedural visual. If a selected direct download fails or its license is unsupported, preview preparation reports the specific asset error instead of silently substituting a different file.

The Gate 2 preview is rendered headlessly by Remotion and passed through format, audio, still-frame, layout, and cue-sync checks before approval. Every scene object uses frame-driven motion; Remotion mixes narration, procedural object cues, and the audio bed on the same timeline. Missing cue manifests or failed sync checks block the render. If measured narration exceeds the planned scene time, the backend first redistributes available scene frames, then can regenerate the same approved words at a modestly faster Kokoro rate (up to `KOKORO_MAX_SPEED`) before reporting that the requested runtime cannot fit. The final render copies the prepared input props for the currently approved preview. It does not refetch images/models or rebuild the scene plan, so the final Remotion render uses the same content and media that the reviewer saw. Assets, narration, and procedural sound effects are stored per preview version so a later render cannot silently replace an approved preview's inputs. Only the final MP4 is delivered as a completed video; scene props, downloaded assets, narration, and sound effects remain internal render inputs.

---

## Strict Approval Gates

- **Gate 1 (Script Approval):** Preview animation rendering is strictly locked until a human reviewer explicitly approves the script narration and scene plan.
- **Gate 2 (Preview Approval):** Final high-resolution 1080p rendering is strictly locked to the *exact current preview version* approved by the human reviewer.
