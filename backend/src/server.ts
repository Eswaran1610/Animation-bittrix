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
import { query } from './config/db.js';
import { realtime } from './realtime.js';
import { projectPaths } from './config/paths.js';
import { agyAuthService } from './modules/auth/agyAuthService.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors());
app.use(express.json());

// Serve static media files (previews and final videos)
app.use('/media', express.static(projectPaths.backendMedia));
app.use('/sfx', express.static(path.join(projectPaths.remotionPublic, 'sfx')));

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
    aiProvider: 'agy',
    animationEngine: 'remotion (integrated by default)',
    database: databaseLabel
  });
});

// AGY is authenticated by the local CLI on the backend machine. The browser
// only receives a safe connection status; no credentials cross this boundary.
app.get('/api/auth/agy', (req, res) => {
  void agyAuthService.getStatus().then((status) => res.json(status));
});

app.post('/api/auth/agy', (req, res) => {
  void agyAuthService.connect().then((status) => res.json(status));
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
    const { input_content, input_type = 'text', title } = req.body;
    if (!input_content) {
      return res.status(400).json({ error: 'input_content is required' });
    }
    const project = await projectsService.createProject(input_content, input_type, title);
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

app.get('/api/usage/agy', async (req, res) => {
  try {
    const usage = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN execution_metadata->>'input_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'input_tokens')::bigint ELSE 0 END), 0)::bigint AS input_tokens,
        COALESCE(SUM(CASE WHEN execution_metadata->>'output_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'output_tokens')::bigint ELSE 0 END), 0)::bigint AS output_tokens,
        COALESCE(SUM(CASE WHEN execution_metadata->>'total_tokens' ~ '^[0-9]+$' THEN (execution_metadata->>'total_tokens')::bigint ELSE 0 END), 0)::bigint AS total_tokens,
        COUNT(*)::int AS run_count,
        COALESCE(BOOL_OR(COALESCE((execution_metadata->>'estimated')::boolean, true)), false) AS estimated
      FROM agent_runs WHERE provider = 'agy'
    `);
    res.json(usage.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Local AGY CLI authentication. OAuth credentials and one-time codes are never
// returned to, stored in, or logged by the frontend.
app.get('/api/providers/agy/status', async (req, res) => {
  res.json(await agyAuthService.status());
});

app.post('/api/providers/agy/connect', async (req, res) => {
  res.json(await agyAuthService.start());
});

app.post('/api/providers/agy/connect/:sessionId/code', (req, res) => {
  try {
    res.json(agyAuthService.submitCode(req.params.sessionId, String(req.body?.code || '')));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
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
    const { feedback, change_narration = false } = req.body;
    if (!feedback) {
      return res.status(400).json({ error: 'feedback is required for script revision' });
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
    res.json(approval);
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
    const { feedback } = req.body;
    if (!feedback) {
      return res.status(400).json({ error: 'feedback is required for preview revision' });
    }
    // A visual correction is regenerated by AGY as a new plan version. It must
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
  const listener = (event: Record<string, unknown>) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
  };
  realtime.on('event', listener);
  socket.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
  socket.send(JSON.stringify({ type: 'progress_snapshot', events: realtime.progressSnapshot() }));
  socket.on('close', () => realtime.off('event', listener));
});

httpServer.listen(PORT, HOST, () => {
  console.log(`[Animation Pipeline Backend] Server running on http://${HOST}:${PORT}`);
  console.log(`[Animation Pipeline Backend] Live updates available on ws://${HOST}:${PORT}/ws`);
});
