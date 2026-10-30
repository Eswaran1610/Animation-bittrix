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
├── frontend/                 # React 18 + Vite + Tailwind CSS (Port 5173)
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
│   ├── start_pg.sh           # Start user-space PostgreSQL 5433
│   └── stop_pg.sh            # Stop PostgreSQL
└── .agents/skills/           # video-production-director skill
```

---

## Quickstart

### 1. Database
```bash
./database/start_pg.sh
```

### 2. Backend
```bash
cd backend
npm install
npm run build
npm run start
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to create and direct animations.

---

## Strict Approval Gates

- **Gate 1 (Script Approval):** Preview animation rendering is strictly locked until a human reviewer explicitly approves the script narration and scene plan.
- **Gate 2 (Preview Approval):** Final high-resolution 1080p rendering is strictly locked to the *exact current preview version* approved by the human reviewer.
