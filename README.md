# AI Animation Pipeline

An end-to-end autonomous motion-graphics animation platform combining:
- **AGY Autonomous Agent** with active live web research and skill reference (`video-production-director`)
- **Remotion** deterministic motion-graphics engine with Chromium headless rendering
- **Neural Voiceover TTS** via Microsoft Edge Neural Voice (`edge-tts`)
- **Dynamic Web Diagram Asset Fetcher** via Wikimedia Commons / Wikipedia API
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
│   │   │   ├── providers/    # AGY Provider with active web search & skill planning
│   │   │   ├── scripts/      # Script versioning & change requests
│   │   │   ├── approvals/    # Gate 1 & Gate 2 human verification
│   │   │   ├── audio/        # edge-tts neural voiceover narration
│   │   │   ├── assets/       # Live Wikimedia diagram search & ingestion
│   │   │   ├── renders/      # Remotion render coordinator
│   │   │   └── videos/       # Completed videos library
│   │   └── server.ts         # Express server (Port 5000)
├── frontend/                 # React + Vite + TypeScript (Port 5173)
│   ├── src/
│   │   ├── components/       # Dashboard, ProjectDetail, VideosLibrary, Approval Gates
│   │   └── services/         # API integration
├── remotion/                 # Remotion 4.0 Motion Graphics Engine
│   ├── src/
│   │   ├── components/       # KineticTitle, DynamicDiagram, AssetImageCard, NetworkNodes, MetricBar
│   │   ├── data/             # Dynamic scene-data.json source of truth
│   │   ├── MainVideo.tsx     # Scene sequencer with <Audio /> playback
│   │   └── Root.tsx          # Dynamic composition registration
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
- AGY CLI installed and authenticated on the machine that runs the backend
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

- `backend/.env`: `HOST`, `PORT`, `DATABASE_URL`, `PGPORT`, and `MEDIA_DIR`
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

`submitted content → AGY live research → AGY narration + scene plan → human Gate 1 approval → Remotion preview → human Gate 2 approval → final Remotion video`

AGY's returned plan is validated before it is stored. Scene type, colors, text, nodes, metrics, asset queries, motion cues, and continuity must be present in the AGY response; the renderer does not invent missing scene content. If Remotion fails, the request fails—there is no generic FFmpeg substitute that could be mistaken for the requested video. Visual corrections create a new AGY plan version and must pass Gate 1 again, while the approved narration is preserved unless a narration change is requested.

The Remotion composition also rejects a stale/manual scene-data file unless the backend has marked it with AGY provenance.

---

## Strict Approval Gates

- **Gate 1 (Script Approval):** Preview animation rendering is strictly locked until a human reviewer explicitly approves the script narration and scene plan.
- **Gate 2 (Preview Approval):** Final high-resolution 1080p rendering is strictly locked to the *exact current preview version* approved by the human reviewer.
