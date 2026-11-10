import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { realtime } from '../../realtime.js';

export interface AutonomousJob {
  id: string;
  topic: string;
  fps: number;
  resolution: string;
  voice: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentStage: 'stage_1_research' | 'stage_2_audio_sfx' | 'stage_3_render_qa' | 'complete' | 'error';
  progress: number;
  logs: string[];
  scenes?: any[];
  researchSources?: string[];
  propsPath?: string;
  videoUrl?: string;
  audioUrl?: string;
  sfxCues?: any[];
  durationSec?: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

class AutonomousPipelineService {
  private jobs = new Map<string, AutonomousJob>();
  private rootDir: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    this.rootDir = path.resolve(path.dirname(__filename), '../../../../');
  }

  listJobs(): AutonomousJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  getJob(id: string): AutonomousJob | undefined {
    return this.jobs.get(id);
  }

  async getLatest(): Promise<AutonomousJob | null> {
    const inMem = this.listJobs();
    if (inMem.length > 0 && inMem[0].status === 'completed') {
      return inMem[0];
    }

    // Fallback: Scan disk for recent 60fps CLI render runs
    try {
      const renderDataDir = path.join(this.rootDir, 'backend', 'media', 'render-data');
      const files = await fs.readdir(renderDataDir).catch(() => []);
      const propFiles = files
        .filter((f) => f.endsWith('_props_60fps.json'))
        .sort()
        .reverse();

      if (propFiles.length > 0) {
        const latestPropsFile = path.join(renderDataDir, propFiles[0]);
        const content = JSON.parse(await fs.readFile(latestPropsFile, 'utf8'));
        const projectIdMatch = propFiles[0].match(/([a-f0-9-]+)_props_60fps\.json/);
        const pId = projectIdMatch ? projectIdMatch[1] : 'latest';

        // Check for matching video
        const videoRelative = `/media/done/${pId}/${pId}_60fps.mp4`;
        const videoAbsolute = path.join(this.rootDir, 'backend', 'media', 'done', pId, `${pId}_60fps.mp4`);
        const videoExists = await fs.stat(videoAbsolute).then(() => true).catch(() => false);

        const syntheticJob: AutonomousJob = {
          id: pId,
          topic: content.scenes?.[0]?.title || content.video?.topic || 'Latest Dynamic Motion Video',
          fps: content.video?.fps || 60,
          resolution: `${content.video?.width || 1080}x${content.video?.height || 1920}`,
          voice: 'en-US-ChristopherNeural',
          status: 'completed',
          currentStage: 'complete',
          progress: 100,
          logs: ['[Loaded from disk manifest]', `Props path: ${latestPropsFile}`],
          scenes: content.scenes || [],
          propsPath: latestPropsFile,
          videoUrl: videoExists ? videoRelative : undefined,
          durationSec: (content.video?.durationInFrames || 1600) / (content.video?.fps || 60),
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        this.jobs.set(pId, syntheticJob);
        return syntheticJob;
      }
    } catch {}

    return null;
  }

  async getSfxCatalog(): Promise<any[]> {
    const sfxDir = path.join(this.rootDir, 'remotion', 'public', 'sfx');
    const roles = [
      { role: 'clock_tick', name: 'Stopwatch / Clock Tick', desc: 'Mechanical Watch Escapement Dual-Tick', hitMs: 10.7, durationMs: 80 },
      { role: 'shutter_click', name: 'Viewfinder Shutter', desc: 'Dual-Curtain Camera Snapshot Click', hitMs: 26.7, durationMs: 120 },
      { role: 'card_slap', name: 'Card Stack Slap', desc: 'Friction Whoosh + Paper Surface Slap', hitMs: 2.7, durationMs: 150 },
      { role: 'punch_hit', name: 'Kinetic Word Punch', desc: 'Pitch-Drop Kinetic Typography Punch', hitMs: 2.7, durationMs: 200 },
      { role: 'whoosh', name: 'Camera Sweep Whoosh', desc: 'High-Velocity Cinematic Scene Sweep', hitMs: 280.0, durationMs: 650 },
      { role: 'pop', name: 'Node Pop Entrance', desc: 'Snappy Bubble Pop for Node Entrances', hitMs: 3.5, durationMs: 180 },
      { role: 'ding', name: '5-Star Rating Chime', desc: 'Harmonic 5-Star Bell Chime', hitMs: 4.2, durationMs: 500 },
      { role: 'impact', name: 'Physics Collision', desc: 'Sub-Bass Physics Collision Impact', hitMs: 2.0, durationMs: 850 },
      { role: 'click', name: 'Mechanical Switch', desc: 'High-Pass Mechanical Switch Click', hitMs: 5.0, durationMs: 90 },
      { role: 'count', name: 'Metric Counter Ticks', desc: 'Rhythmic Decimal Metric Ticks', hitMs: 8.0, durationMs: 600 },
    ];

    try {
      const subdirs = await fs.readdir(sfxDir).catch(() => []);
      if (subdirs.length > 0) {
        const sampleSubdir = subdirs.find((d) => !d.startsWith('.')) || subdirs[0];
        return roles.map((r) => ({
          ...r,
          audioUrl: `/sfx/${sampleSubdir}/${r.role}_01.wav`,
        }));
      }
    } catch {}

    return roles.map((r) => ({
      ...r,
      audioUrl: `/sfx/default/${r.role}_01.wav`,
    }));
  }

  async startJob(params: {
    topic: string;
    projectName?: string;
    durationSec?: number;
    fps?: number;
    resolution?: string;
    voice?: string;
  }): Promise<AutonomousJob> {
    const id = crypto.randomUUID();
    const fps = params.fps || 60;
    const resolution = params.resolution || '1080x1920';
    const voice = params.voice || 'en-US-ChristopherNeural';
    const displayTopic = params.projectName ? `${params.projectName}: ${params.topic}` : params.topic;

    const job: AutonomousJob = {
      id,
      topic: displayTopic,
      fps,
      resolution,
      voice,
      status: 'running',
      currentStage: 'stage_1_research',
      progress: 5,
      logs: [`[Pipeline Initialized] Job ${id} for topic: "${displayTopic}" (Target: ${params.durationSec || 23}s @ 60 FPS)`],
      startedAt: new Date().toISOString(),
    };

    this.jobs.set(id, job);
    this.broadcast(job);

    const scriptPath = path.join(this.rootDir, 'scripts', 'run-autonomous-pipeline.mjs');
    const child = spawn(
      '/usr/bin/node',
      [scriptPath, '--topic', params.topic, '--fps', String(fps), '--resolution', resolution, '--voice', voice, '--auto-approve'],
      {
        cwd: this.rootDir,
        env: { ...process.env, NODE_ENV: 'production' },
      }
    );

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      const lines = text.split('\n').filter(Boolean);
      for (const line of lines) {
        job.logs.push(line);

        if (line.includes('STAGE 1: DEEP WEB RESEARCH')) {
          job.currentStage = 'stage_1_research';
          job.progress = 15;
        } else if (line.includes('STAGE 2: AUDIO SYNTHESIS')) {
          job.currentStage = 'stage_2_audio_sfx';
          job.progress = 45;
        } else if (line.includes('STAGE 3: HEADLESS 60 FPS RENDER')) {
          job.currentStage = 'stage_3_render_qa';
          job.progress = 75;
        } else if (line.includes('PROPS_PATH:')) {
          const p = line.split('PROPS_PATH:')[1]?.trim();
          if (p) job.propsPath = p;
        } else if (line.includes('FINAL_VIDEO:')) {
          const v = line.split('FINAL_VIDEO:')[1]?.trim();
          if (v) {
            const rel = v.includes('/media/') ? `/media/${v.split('/media/')[1]}` : v;
            job.videoUrl = rel;
          }
        }
      }
      this.broadcast(job);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      const lines = text.split('\n').filter(Boolean);
      for (const line of lines) {
        job.logs.push(`[STDERR] ${line}`);
      }
      this.broadcast(job);
    });

    child.on('close', async (code) => {
      if (code === 0) {
        job.status = 'completed';
        job.currentStage = 'complete';
        job.progress = 100;
        job.completedAt = new Date().toISOString();
        job.logs.push('🎉 [Pipeline Success] 60 FPS Video Render Completed & Verified!');

        if (job.propsPath) {
          try {
            const manifest = JSON.parse(await fs.readFile(job.propsPath, 'utf8'));
            job.scenes = manifest.scenes || [];
            job.durationSec = (manifest.video?.durationInFrames || 1600) / (manifest.video?.fps || 60);
          } catch {}
        }
      } else {
        job.status = 'failed';
        job.currentStage = 'error';
        job.error = `Pipeline exited with code ${code}`;
        job.logs.push(`❌ [Pipeline Failed] Exit code: ${code}`);
      }
      this.broadcast(job);
    });

    return job;
  }

  private broadcast(job: AutonomousJob) {
    try {
      realtime.publish({
        type: 'autonomous_pipeline_update',
        job: {
          id: job.id,
          topic: job.topic,
          status: job.status,
          currentStage: job.currentStage,
          progress: job.progress,
          videoUrl: job.videoUrl,
          propsPath: job.propsPath,
          error: job.error,
          lastLog: job.logs[job.logs.length - 1],
        },
      });
    } catch {}
  }

  async reviseJob(id: string, revision: { sceneIndex: number; title?: string; narration?: string; visual_type?: string; themeColor?: string }): Promise<AutonomousJob> {
    const job = this.jobs.get(id);
    if (!job) throw new Error(`Job ${id} not found`);
    if (!job.propsPath) throw new Error(`Job ${id} has no props path`);

    const raw = await fs.readFile(job.propsPath, 'utf8');
    const manifest = JSON.parse(raw);

    if (!manifest.scenes || !manifest.scenes[revision.sceneIndex]) {
      throw new Error(`Scene index ${revision.sceneIndex} out of bounds (total scenes: ${manifest.scenes?.length || 0})`);
    }

    const sc = manifest.scenes[revision.sceneIndex];
    if (revision.title !== undefined) sc.title = revision.title;
    if (revision.narration !== undefined) sc.narration = revision.narration;
    if (revision.visual_type !== undefined) sc.visual_type = revision.visual_type;
    if (revision.themeColor !== undefined) sc.themeColor = revision.themeColor;

    await fs.writeFile(job.propsPath, JSON.stringify(manifest, null, 2), 'utf8');

    job.scenes = manifest.scenes;
    job.logs.push(`✏️ [Instant Revision] Scene ${revision.sceneIndex + 1} updated: ${revision.title || revision.visual_type || 'attributes modified'}`);
    this.broadcast(job);
    return job;
  }
}

export const autonomousPipelineService = new AutonomousPipelineService();
