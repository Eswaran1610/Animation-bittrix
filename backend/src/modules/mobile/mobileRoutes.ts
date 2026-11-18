import path from 'path';
import { Router, Request, Response, NextFunction } from 'express';
import { mobileService, MobileMember } from './mobileService.js';
import { THEME_CATALOG } from '../themes/themeCatalog.js';
import { query } from '../../config/db.js';
import { projectPaths } from '../../config/paths.js';

export const mobileRouter = Router();

// Extend Express Request to include member
export interface AuthenticatedRequest extends Request {
  member?: MobileMember;
}

// Authentication middleware for mobile API
export function requireMobileAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Bearer token required' });
  }

  const token = authHeader.slice(7).trim();
  const member = mobileService.verifyToken(token);
  if (!member) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired mobile session token' });
  }

  req.member = member;
  next();
}

/**
 * Public Mobile Login: 7 accounts (member1..member7, pass123 / bittrix123)
 */
mobileRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const result = await mobileService.login(username, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

/**
 * Public: List active members (for avatar / team info)
 */
mobileRouter.get('/members', async (_req, res) => {
  try {
    res.json(await mobileService.listMembers());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get current authenticated member profile
 */
mobileRouter.get('/me', requireMobileAuth, (req: AuthenticatedRequest, res) => {
  res.json({ member: req.member });
});

/**
 * Get themes catalog for topic pitching
 */
mobileRouter.get('/themes', (_req, res) => {
  res.json(THEME_CATALOG);
});

/**
 * Idea Pool: List all ideas pitched by team members
 */
mobileRouter.get('/ideas', requireMobileAuth, async (_req, res) => {
  try {
    const ideas = await mobileService.listIdeas();
    res.json(ideas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Idea Pool: Pitch a new idea
 */
mobileRouter.post('/ideas', requireMobileAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { topic, durationSec, themeId, notes } = req.body;
    const idea = await mobileService.submitIdea(req.member!, {
      topic,
      durationSec,
      themeId,
      notes,
    });
    res.status(201).json(idea);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Idea Pool: Peer Member Accept Idea (Pitcher cannot accept own idea!)
 */
mobileRouter.post('/ideas/:id/accept', requireMobileAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const ideaId = String(req.params.id);
    const idea = await mobileService.acceptIdea(ideaId, req.member!);
    res.json(idea);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Idea Pool: Trigger AGY Pipeline Video Generation on Office Laptop
 */
mobileRouter.post('/ideas/:id/generate', requireMobileAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const ideaId = String(req.params.id);
    const result = await mobileService.generateVideo(ideaId, req.member!);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Stage 1 Preview ("Before MP4", 540x960) video playback details
 */
mobileRouter.get('/projects/:id/preview', requireMobileAuth, async (req, res) => {
  try {
    const projectId = String(req.params.id);
    const preview = await mobileService.getPreviewDetails(projectId);
    res.json(preview);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Approve Stage 1 Preview on mobile -> launches Stage 2 Final 1080p Render
 */
mobileRouter.post('/projects/:id/approve', requireMobileAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const projectId = String(req.params.id);
    const { feedbackNotes } = req.body;
    const result = await mobileService.approvePreview(projectId, req.member!, feedbackNotes);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Request visual revision on Stage 1 Preview
 */
mobileRouter.post('/projects/:id/revise', requireMobileAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const projectId = String(req.params.id);
    const { feedback } = req.body;
    if (!feedback) return res.status(400).json({ error: 'Feedback string required' });
    const result = await mobileService.revisePreview(projectId, req.member!, feedback);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Direct file download attachment endpoint for mobile phones
 */
mobileRouter.get('/videos/:id/download', async (req, res) => {
  try {
    const videoId = String(req.params.id);
    const videoRes = await query('SELECT * FROM videos WHERE id = $1', [videoId]);
    if (videoRes.rows.length === 0) return res.status(404).json({ error: 'Video not found' });
    const video = videoRes.rows[0];

    const relativePath = video.storage_url.replace(/^\/media\//, '');
    const absolutePath = path.join(projectPaths.backendMedia, relativePath);

    const safeTitle = (video.title || 'bittrix_video').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.download(absolutePath, `${safeTitle}.mp4`);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

