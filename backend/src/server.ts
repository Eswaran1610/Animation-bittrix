import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { projectsService } from './modules/projects/projectsService.js';
import { scriptsService } from './modules/scripts/scriptsService.js';
import { approvalsService } from './modules/approvals/approvalsService.js';
import { rendersService } from './modules/renders/rendersService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static media files (previews and final videos)
app.use('/media', express.static(path.join(__dirname, '../media')));

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiProvider: 'agy',
    animationEngine: 'remotion (integrated by default)',
    database: 'PostgreSQL 5433'
  });
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
    const renderJob = await rendersService.requestPreviewChanges(req.params.id, feedback);
    res.json(renderJob);
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

app.listen(PORT, () => {
  console.log(`[Animation Pipeline Backend] Server running on http://localhost:${PORT}`);
});
