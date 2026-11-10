import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { projectsService } from './modules/projects/projectsService.js';
import { scriptsService } from './modules/scripts/scriptsService.js';
import { approvalsService } from './modules/approvals/approvalsService.js';
import { rendersService } from './modules/renders/rendersService.js';
import { pool, query } from './config/db.js';
import { realtime } from './realtime.js';
import { projectPaths } from './config/paths.js';
import { agyAuthService } from './modules/auth/agyAuthService.js';
import { claudeAuthService } from './modules/auth/claudeAuthService.js';
import { shutdownAllCliProcesses } from './modules/providers/cliProvider.js';
import { productionPackageService } from './modules/production/productionPackageService.js';
import { activeProviderService } from './modules/providers/activeProviderService.js';
import { THEME_CATALOG } from './modules/themes/themeCatalog.js';
import { motionCanvasService } from './modules/motionCanvas/motionCanvasService.js';
import { autonomousPipelineService } from './modules/pipeline/autonomousPipelineService.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors());
app.use(express.json());

// Serve static media files (previews and final videos)
app.use('/media', express.static(projectPaths.backendMedia));
app.use('/sfx', express.static(path.join(projectPaths.remotionPublic, 'sfx')));
app.use('/motion-canvas-dist', express.static(projectPaths.motionCanvasDist));

// Health & System Info
app.get('/api/health', (req, res) => {
  const configuredDatabase = process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5434/animation_pipeline';
  let databaseLabel = 'PostgreSQL';
  try {
    databaseLabel = `PostgreSQL ${new URL(configuredDatabase).port || 'default'}`;
  } catch {}
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiProvider: activeProviderService.get(),
    animationEngines: ['remotion', 'motion-canvas'],
    database: databaseLabel
  });
});

// Motion Canvas Endpoints
app.get('/api/motion-canvas/status', (_req, res) => {
  res.json({
    status: 'ready',
    engine: 'Motion Canvas (TypeScript generators + 2D vectors)',
    version: '3.17.2',
    bundleDist: '/motion-canvas-dist',
  });
});

app.post('/api/motion-canvas/build', async (req, res) => {
  try {
    const { name, title, subtitle, themeColor, nodes } = req.body;
    const result = await motionCanvasService.buildProject({
      name: name || 'dynamicScene',
      title: title || 'Motion Canvas Visual',
      subtitle,
      themeColor,
      nodes,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Autonomous 60 FPS Dynamic Engine Endpoints
app.get('/api/pipeline/autonomous/latest', async (_req, res) => {
  try {
    const latest = await autonomousPipelineService.getLatest();
    res.json(latest || { status: 'none' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pipeline/autonomous/jobs', (_req, res) => {
  res.json(autonomousPipelineService.listJobs());
});

app.get('/api/pipeline/autonomous/jobs/:id', (req, res) => {
  const job = autonomousPipelineService.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.post('/api/pipeline/autonomous/run', async (req, res) => {
  try {
    const { topic, projectName, durationSec, fps = 60, resolution = '1080x1920', voice = 'en-US-ChristopherNeural' } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'topic string is required' });
    }
    const job = await autonomousPipelineService.startJob({
      topic: topic.trim(),
      projectName: projectName?.trim() || undefined,
      durationSec: Number(durationSec) || 23,
      fps: Number(fps) || 60,
      resolution,
      voice,
    });
    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pipeline/autonomous/revise', async (req, res) => {
  try {
    const { id, revision } = req.body;
    if (!id || !revision || revision.sceneIndex === undefined) {
      return res.status(400).json({ error: 'id and revision.sceneIndex are required' });
    }
    const updated = await autonomousPipelineService.reviseJob(id, revision);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pipeline/sfx-catalog', async (_req, res) => {
  try {
    res.json(await autonomousPipelineService.getSfxCatalog());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Active provider selection — GET to read, PUT to switch.
app.get('/api/providers/active', (req, res) => {
  res.json(activeProviderService.status());
});

app.put('/api/providers/active', (req, res) => {
  try {
    const { provider } = req.body;
    if (!provider) return res.status(400).json({ error: '"provider" field is required (agy | claude | none)' });
    res.json(activeProviderService.set(provider));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Themes Endpoint
app.get('/api/themes', (_req, res) => {
  res.json(THEME_CATALOG);
});

// Projects Endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await projectsService.listProjects();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const input_content = req.body.input_content || req.body.content || req.body.topic;
    const input_type = req.body.input_type || req.body.type || 'text';
    const { title, theme_id, theme } = req.body;
    if (!input_content) {
      return res.status(400).json({ error: 'input_content is required' });
    }
    const rawDuration = req.body.requested_duration_sec ?? req.body.durationSec ?? req.body.duration;
    const duration = rawDuration === undefined || rawDuration === null || rawDuration === '' ? undefined : Number(rawDuration);
    if (duration !== undefined && (!Number.isInteger(duration) || duration < 15 || duration > 60)) {
      return res.status(400).json({ error: 'requested_duration_sec must be an integer between 15 and 60 seconds' });
    }
    const selectedTheme = typeof (theme_id || theme) === 'string' ? String(theme_id || theme).trim() : undefined;
    const project = await projectsService.createProject(input_content, input_type, title, duration, selectedTheme);
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const details = await projectsService.getProjectDetails(req.params.id);
    if (!details) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(details);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Token usage across providers
app.get(['/api/usage', '/api/usage/active'], async (req, res) => {
  try {
    const targetProvider = (req.query.provider as string) || activeProviderService.get();
    const usage = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN execution_metadata->>'input_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'input_tokens')::bigint ELSE 0 END), 0)::bigint AS input_tokens,
        COALESCE(SUM(CASE WHEN execution_metadata->>'output_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'output_tokens')::bigint ELSE 0 END), 0)::bigint AS output_tokens,
        COALESCE(SUM(CASE WHEN execution_metadata->>'total_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'total_tokens')::bigint ELSE 0 END), 0)::bigint AS total_tokens,
        COUNT(*)::int AS run_count,
        COALESCE(BOOL_OR(COALESCE((execution_metadata->>'estimated')::boolean, false)), false) AS estimated,
        COALESCE(BOOL_OR(COALESCE((execution_metadata->>'available')::boolean, false)), false) AS available
      FROM agent_runs WHERE ($1 = 'all' OR provider = $1)
    `, [targetProvider]);
    res.json({ ...usage.rows[0], provider: targetProvider });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/usage/codex', async (req, res) => {
  try {
    const usage = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN execution_metadata->>'input_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'input_tokens')::bigint ELSE 0 END), 0)::bigint AS input_tokens,
        COALESCE(SUM(CASE WHEN execution_metadata->>'output_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'output_tokens')::bigint ELSE 0 END), 0)::bigint AS output_tokens,
        COALESCE(SUM(CASE WHEN execution_metadata->>'total_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'total_tokens')::bigint ELSE 0 END), 0)::bigint AS total_tokens,
        COUNT(*)::int AS run_count,
        COALESCE(BOOL_OR(COALESCE((execution_metadata->>'estimated')::boolean, false)), false) AS estimated,
        COALESCE(BOOL_OR(COALESCE((execution_metadata->>'available')::boolean, false)), false) AS available
      FROM agent_runs WHERE provider = 'codex'
    `);
    res.json(usage.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/usage/agy', async (req, res) => {
  try {
    const usage = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN execution_metadata->>'input_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'input_tokens')::bigint ELSE 0 END), 0)::bigint AS input_tokens,
        COALESCE(SUM(CASE WHEN execution_metadata->>'output_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'output_tokens')::bigint ELSE 0 END), 0)::bigint AS output_tokens,
        COALESCE(SUM(CASE WHEN execution_metadata->>'total_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'total_tokens')::bigint ELSE 0 END), 0)::bigint AS total_tokens,
        COUNT(*)::int AS run_count,
        COALESCE(BOOL_OR(COALESCE((execution_metadata->>'estimated')::boolean, false)), false) AS estimated,
        COALESCE(BOOL_OR(COALESCE((execution_metadata->>'available')::boolean, false)), false) AS available
      FROM agent_runs WHERE provider = 'agy'
    `);
    res.json(usage.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/usage/claude', async (req, res) => {
  try {
    const usage = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN execution_metadata->>'input_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'input_tokens')::bigint ELSE 0 END), 0)::bigint AS input_tokens,
        COALESCE(SUM(CASE WHEN execution_metadata->>'output_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'output_tokens')::bigint ELSE 0 END), 0)::bigint AS output_tokens,
        COALESCE(SUM(CASE WHEN execution_metadata->>'total_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'total_tokens')::bigint ELSE 0 END), 0)::bigint AS total_tokens,
        COUNT(*)::int AS run_count,
        COALESCE(BOOL_OR(COALESCE((execution_metadata->>'estimated')::boolean, false)), false) AS estimated,
        COALESCE(BOOL_OR(COALESCE((execution_metadata->>'available')::boolean, false)), false) AS available
      FROM agent_runs WHERE provider = 'claude'
    `);
    res.json(usage.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AGY (Antigravity) CLI auth — local session, no credentials returned.
app.get('/api/auth/agy', async (req, res) => {
  res.json(await agyAuthService.status());
});

app.post('/api/auth/agy', async (req, res) => {
  res.json(await agyAuthService.connect());
});

app.post('/api/auth/agy/disconnect', async (req, res) => {
  res.json(await agyAuthService.disconnect());
});

app.get('/api/providers/agy/status', async (req, res) => {
  res.json(await agyAuthService.status());
});

app.post('/api/providers/agy/connect', async (req, res) => {
  res.json(await agyAuthService.connect());
});

app.post('/api/providers/agy/disconnect', async (req, res) => {
  res.json(await agyAuthService.disconnect());
});

// Claude Code CLI auth — local session, no credentials returned.
app.get('/api/auth/claude', async (req, res) => {
  res.json(await claudeAuthService.status());
});

app.post('/api/auth/claude', async (req, res) => {
  res.json(await claudeAuthService.start());
});

app.post('/api/auth/claude/disconnect', async (req, res) => {
  res.json(await claudeAuthService.disconnect());
});

app.get('/api/providers/claude/status', async (req, res) => {
  res.json(await claudeAuthService.status());
});

app.post('/api/providers/claude/connect', async (req, res) => {
  res.json(await claudeAuthService.start());
});

app.post('/api/providers/claude/disconnect', async (req, res) => {
  res.json(await claudeAuthService.disconnect());
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const deleted = await projectsService.deleteProject(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Scripts & Gate 1 Endpoints
app.post('/api/projects/:id/scripts/revise', async (req, res) => {
  try {
    const { feedback, change_narration = false, theme_id, theme } = req.body;
    if (!feedback) {
      return res.status(400).json({ error: 'feedback is required for script revision' });
    }
    const newTheme = typeof (theme_id || theme) === 'string' ? String(theme_id || theme).trim() : undefined;
    if (newTheme) {
      await query(`UPDATE projects SET theme_id = $2 WHERE id = $1`, [req.params.id, newTheme]);
    }
    const script = await scriptsService.reviseScript(req.params.id, feedback, change_narration);
    res.json(script);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:id/scripts/approve', async (req, res) => {
  try {
    const { script_id, version_number, approved_by, feedback_notes } = req.body;
    if (!version_number) {
      return res.status(400).json({ error: 'version_number is required' });
    }
    const approval = await approvalsService.approveScript(
      req.params.id,
      script_id,
      version_number,
      approved_by,
      feedback_notes
    );
    const packageRequest = await productionPackageService.queue(req.params.id, version_number);
    if (process.env.REMOTE_PRODUCTION_WORKER !== '1') {
      void rendersService.prepareCliProductionPackage(req.params.id, version_number)
        .catch((error: any) => productionPackageService.fail(req.params.id, packageRequest.package_version, String(error?.message || error)));
    }
    res.json({ ...approval, production_package: packageRequest });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Receives the approved production package from the local pipeline worker.
// The backend stores its assets and props, then owns preview and final rendering.
app.post('/api/projects/:id/production-packages/:version', async (req, res) => {
  try {
    const packageVersion = Number(req.params.version);
    if (!Number.isInteger(packageVersion) || packageVersion < 1) return res.status(400).json({ error: 'package version must be a positive integer' });
    res.json(await productionPackageService.receive(req.params.id, packageVersion, req.body));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/projects/:id/done', async (req, res) => {
  try {
    const donePackage = await productionPackageService.getDonePackage(req.params.id);
    if (!donePackage) {
      return res.status(404).json({ error: 'Done production package not yet assembled' });
    }
    res.json(donePackage);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Previews & Gate 2 Endpoints
app.get('/api/projects/:id/previews/:version/props', async (req, res) => {
  try {
    const previewVersion = Number(req.params.version);
    if (!Number.isInteger(previewVersion) || previewVersion < 1) {
      return res.status(400).json({ error: 'preview version must be a positive integer' });
    }
    const props = await rendersService.getPreviewProps(req.params.id, previewVersion);
    if (!props) return res.status(404).json({ error: 'Preview composition data not found' });
    res.json(props);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id/previews/:version/report', async (req, res) => {
  try {
    const version = Number(req.params.version);
    if (!Number.isInteger(version) || version < 1) return res.status(400).json({ error: 'preview version must be a positive integer' });
    const report = await rendersService.getPreviewReport(req.params.id, version);
    if (!report) return res.status(404).json({ error: 'Preview report not found' });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:id/previews/render', async (req, res) => {
  try {
    const { script_version, visual_feedback } = req.body;
    if (!script_version) {
      return res.status(400).json({ error: 'script_version is required' });
    }
    const renderJob = await rendersService.createPreviewRender(req.params.id, script_version, visual_feedback);
    res.json(renderJob);
  } catch (err: any) {
    // Return 403 Forbidden if Gate 1 is violated
    const status = err.message.includes('Gate 1') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

app.post('/api/projects/:id/previews/revise', async (req, res) => {
  try {
    const { feedback, theme_id, theme } = req.body;
    if (!feedback) {
      return res.status(400).json({ error: 'feedback is required for preview revision' });
    }
    const newTheme = typeof (theme_id || theme) === 'string' ? String(theme_id || theme).trim() : undefined;
    if (newTheme) {
      await query(`UPDATE projects SET theme_id = $2 WHERE id = $1`, [req.params.id, newTheme]);
    }
    // A visual correction is regenerated by the active CLI as a new plan version. It must
    // pass Gate 1 again before any new preview can be rendered.
    const script = await scriptsService.reviseScript(req.params.id, feedback, false);
    res.json(script);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:id/previews/approve', async (req, res) => {
  try {
    const { render_job_id, preview_version, approved_by, feedback_notes } = req.body;
    if (!preview_version) {
      return res.status(400).json({ error: 'preview_version is required' });
    }
    const approval = await approvalsService.approvePreview(
      req.params.id,
      render_job_id,
      preview_version,
      approved_by,
      feedback_notes
    );
    res.json(approval);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Final Video Render Endpoint
app.post('/api/projects/:id/final-render', async (req, res) => {
  try {
    const video = await rendersService.createFinalRender(req.params.id);
    res.json(video);
  } catch (err: any) {
    // Return 403 Forbidden if Gate 2 is violated
    const status = err.message.includes('Gate 2') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

// Videos Library Endpoint
app.get('/api/videos', async (req, res) => {
  try {
    const projectId = req.query.project_id as string | undefined;
    const videos = await rendersService.getVideos(projectId);
    res.json(videos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const httpServer = createServer(app);
const websocketServer = new WebSocketServer({ server: httpServer, path: '/ws' });

websocketServer.on('connection', (socket) => {
  let alive = true;
  const heartbeat = setInterval(() => {
    if (!alive) {
      socket.terminate();
      return;
    }
    alive = false;
    socket.ping();
  }, 30_000);
  socket.on('pong', () => { alive = true; });
  const listener = (event: Record<string, unknown>) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
  };
  realtime.on('event', listener);
  socket.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
  socket.send(JSON.stringify({ type: 'progress_snapshot', events: realtime.progressSnapshot() }));
  socket.on('close', () => {
    clearInterval(heartbeat);
    realtime.off('event', listener);
  });
});

let shuttingDown = false;

const shutdown = async (signal: string) => {
  if (shuttingDown) {
    process.exit(1);
    return;
  }
  shuttingDown = true;
  console.log(`[Animation Pipeline Backend] ${signal} received; shutting down cleanly...`);

  // A broken database socket or long-lived HTTP request must never leave the
  // dev watcher waiting forever. Normal cleanup gets four seconds; after that
  // the process exits so tsx can restart/stop without force-killing a stale
  // child process.
  const shutdownDeadline = setTimeout(() => {
    console.error('[Animation Pipeline Backend] Shutdown timed out; forcing process exit.');
    process.exit(1);
  }, 4000);

  shutdownAllCliProcesses();

  for (const socket of websocketServer.clients) {
    socket.close(1001, 'Server shutting down');
    socket.terminate();
  }

  await new Promise<void>((resolve) => {
    if (!httpServer.listening) {
      resolve();
      return;
    }
    httpServer.close((error) => {
      if (error && (error as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING') {
        console.error('[Animation Pipeline Backend] HTTP shutdown error:', error.message);
      }
      resolve();
    });
  });

  await new Promise<void>((resolve) => {
    websocketServer.close(() => resolve());
  });

  await pool.end().catch((error: any) => {
    console.error('[Animation Pipeline Backend] PostgreSQL shutdown error:', error.message);
  });
  clearTimeout(shutdownDeadline);
  process.exit(0);
};

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

httpServer.listen(PORT, HOST, () => {
  console.log(`[Animation Pipeline Backend] Server running on http://${HOST}:${PORT}`);
  console.log(`[Animation Pipeline Backend] Live updates available on ws://${HOST}:${PORT}/ws`);
});
