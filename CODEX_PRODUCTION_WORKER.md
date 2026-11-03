# Codex production worker handoff

The backend now starts its built-in Codex production worker automatically after Gate 1 approval. Set `REMOTE_PRODUCTION_WORKER=1` when a separate Codex worker will submit the package instead.

After Gate 1 script approval, the API returns `production_package.package_version` and queues a package. The Codex CLI/worker must generate and stage the complete package, then POST it to:

```text
POST /api/projects/:projectId/production-packages/:packageVersion
Content-Type: application/json
```

Required body:

```json
{
  "generatedBy": "codex",
  "tsxSource": "import React from 'react'; import { MainVideo } from './MainVideo'; export default (props) => <MainVideo sceneData={props} />;",
  "remotionProps": {
    "video": { "fps": 30, "durationInFrames": 900 },
    "scenes": []
  },
  "assets": [],
  "audio": [],
  "captions": []
}
```

`assets` contains the separate image/character/model files and their scene attachments. `audio` contains Kokoro narration, SFX, and FFmpeg mix outputs. `captions` contains Whisper timings. `remotionProps` is the approved screen plan consumed by Remotion.

`tsxSource` is the Codex-returned Remotion composition artifact. Its `audioCues` entries must match the object motion events in `remotionProps.scenes`.

Once the package is marked `ready`, the dashboard's preview button unlocks. Preview and final render consume the same returned package; the local dashboard does not generate assets, run TTS/Whisper, or assemble the scene plan.
