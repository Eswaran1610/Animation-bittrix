import { query } from '../../config/db.js';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';
import { activeProviderService } from '../providers/activeProviderService.js';
import { tsxValidator } from './tsxValidator.js';
import fs from 'fs/promises';
import path from 'path';

type ProductionPackage = {
  tsxSource: string;
  remotionProps: Record<string, unknown>;
  assets: Array<Record<string, unknown>>;
  audio: Array<Record<string, unknown>>;
  captions: Array<Record<string, unknown>>;
  productionDesign?: Record<string, unknown>;
  generatedBy?: string;
};

const requiredKeys = ['tsxSource', 'remotionProps', 'assets', 'audio', 'captions'] as const;

export class ProductionPackageService {
  private tableReady?: Promise<void>;

  async ensureTable() {
    if (!this.tableReady) {
      this.tableReady = query(`CREATE TABLE IF NOT EXISTS production_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        script_version INT NOT NULL,
        package_version INT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'queued',
        manifest JSONB DEFAULT '{}'::jsonb,
        package_path TEXT,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (project_id, package_version)
      )`).then(() => undefined).catch((error) => { this.tableReady = undefined; throw error; });
    }
    await this.tableReady;
  }

  async queue(projectId: string, scriptVersion: number) {
    await this.ensureTable();
    const latest = await query(`SELECT COALESCE(MAX(package_version), 0) + 1 AS next_version FROM production_packages WHERE project_id = $1`, [projectId]);
    const version = Number(latest.rows[0].next_version);
    const result = await query(
      `INSERT INTO production_packages (project_id, script_version, package_version, status)
       VALUES ($1, $2, $3, 'queued') RETURNING *`,
      [projectId, scriptVersion, version],
    );
    await query(`UPDATE projects SET stage = 'animation_prep', status = 'Preparing animation', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [projectId]);
    realtime.publish({ type: 'pipeline_progress', projectId, progress: 10, status: 'Active CLI production package requested' });
    return result.rows[0];
  }

  async receive(projectId: string, packageVersion: number, payload: unknown) {
    await this.ensureTable();
    if (!payload || typeof payload !== 'object') throw new Error('Production package must be a JSON object.');
    const candidate = payload as Record<string, unknown>;
    const missing = requiredKeys.filter((key) => !(key in candidate));
    if (missing.length) throw new Error(`Production package is missing: ${missing.join(', ')}`);
    if (!candidate.remotionProps || typeof candidate.remotionProps !== 'object') throw new Error('Production package remotionProps must be an object.');
    if (typeof candidate.tsxSource !== 'string' || candidate.tsxSource.trim().length === 0) {
      throw new Error('Production package tsxSource must contain the Remotion composition code.');
    }

    const validation = await tsxValidator.validate(candidate.tsxSource);
    if (!validation.valid) {
      throw new Error(`Production package TSX validation failed: ${validation.errors.join('; ')}`);
    }

    if (!Array.isArray(candidate.assets) || !Array.isArray(candidate.audio) || !Array.isArray(candidate.captions)) throw new Error('Production package assets, audio, and captions must be arrays.');

    const packageDir = path.join(projectPaths.renderDataDir, 'production-packages', projectId);
    await fs.mkdir(packageDir, { recursive: true });
    const packagePath = path.join(packageDir, `v${packageVersion}.json`);
    const tsxPath = path.join(packageDir, `v${packageVersion}.tsx`);
    const generatedBy = candidate.generatedBy || activeProviderService.get();
    await fs.writeFile(packagePath, JSON.stringify({ ...candidate, receivedAt: new Date().toISOString(), generatedBy }, null, 2), 'utf8');
    await fs.writeFile(tsxPath, candidate.tsxSource, 'utf8');

    // Also persist into dedicated project source and metadata folders
    const projectDir = path.join(projectPaths.backendMedia, 'projects', projectId);
    await fs.mkdir(path.join(projectDir, 'source'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'metadata'), { recursive: true });
    await fs.writeFile(path.join(projectDir, 'source', 'VideoComposition.tsx'), candidate.tsxSource, 'utf8');
    await fs.writeFile(path.join(projectDir, 'metadata', 'package.json'), JSON.stringify(candidate, null, 2), 'utf8');
    await fs.writeFile(path.join(projectDir, 'metadata', 'props.json'), JSON.stringify(candidate.remotionProps, null, 2), 'utf8');

    const result = await query(
      `UPDATE production_packages SET status = 'ready', manifest = $3, package_path = $4, updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $1 AND package_version = $2 RETURNING *`,
      [projectId, packageVersion, { tsxPath, assets: candidate.assets, audio: candidate.audio, captions: candidate.captions, productionDesign: candidate.productionDesign || {}, generatedBy }, packagePath],
    );
    const doneManifest = await this.saveDonePackage(projectId, packageVersion, candidate);

    if (!result.rows.length) throw new Error('Production package version was not queued.');
    realtime.publish({ type: 'pipeline_progress', projectId, progress: 100, status: 'Production package ready in done path' });
    return {
      ...result.rows[0],
      tsx_url: `/media/${path.relative(projectPaths.backendMedia, tsxPath).replace(/\\/g, '/')}`,
      done_package: doneManifest,
    };
  }

  async saveDonePackage(
    projectId: string,
    packageVersion: number,
    candidate: Record<string, unknown>,
    extra?: { videoDiskPath?: string; audioDiskPath?: string }
  ) {
    const doneDir = path.join(projectPaths.backendMedia, 'done', projectId);
    await fs.mkdir(doneDir, { recursive: true });

    // 1. Composition TSX
    const tsxPath = path.join(doneDir, 'composition.tsx');
    if (typeof candidate.tsxSource === 'string') {
      await fs.writeFile(tsxPath, candidate.tsxSource, 'utf8');
    }

    // 2. Complete package JSON
    const packagePath = path.join(doneDir, 'package.json');
    await fs.writeFile(packagePath, JSON.stringify(candidate, null, 2), 'utf8');

    // 3. Isolated Remotion props
    if (candidate.remotionProps) {
      await fs.writeFile(path.join(doneDir, 'props.json'), JSON.stringify(candidate.remotionProps, null, 2), 'utf8');
    }

    // 4. Copy master audio if available
    const remotionVideo = (candidate.remotionProps as any)?.video;
    const audioUrl = remotionVideo?.audioUrl;
    if (extra?.audioDiskPath) {
      try {
        await fs.copyFile(extra.audioDiskPath, path.join(doneDir, 'master_audio.wav'));
      } catch {}
    } else if (audioUrl && typeof audioUrl === 'string' && audioUrl.startsWith('/media/')) {
      const srcAudio = path.join(projectPaths.backendMedia, audioUrl.replace(/^\/media\//, ''));
      try {
        await fs.copyFile(srcAudio, path.join(doneDir, 'master_audio.wav'));
      } catch {}
    }

    // 5. Copy video if available
    if (extra?.videoDiskPath) {
      try {
        await fs.copyFile(extra.videoDiskPath, path.join(doneDir, 'video.mp4'));
      } catch {}
    }

    // 6. Summary Done Manifest
    const manifest = {
      projectId,
      packageVersion,
      status: 'ready',
      generatedBy: candidate.generatedBy || activeProviderService.get(),
      completedAt: new Date().toISOString(),
      paths: {
        doneDir,
        tsx: path.join(doneDir, 'composition.tsx'),
        package: path.join(doneDir, 'package.json'),
        props: path.join(doneDir, 'props.json'),
        audio: path.join(doneDir, 'master_audio.wav'),
        video: path.join(doneDir, 'video.mp4'),
      },
      urls: {
        tsx: `/media/done/${projectId}/composition.tsx`,
        package: `/media/done/${projectId}/package.json`,
        props: `/media/done/${projectId}/props.json`,
        audio: `/media/done/${projectId}/master_audio.wav`,
        video: `/media/done/${projectId}/video.mp4`,
      },
    };
    await fs.writeFile(path.join(doneDir, 'done-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    return manifest;
  }

  async getDonePackage(projectId: string) {
    const doneDir = path.join(projectPaths.backendMedia, 'done', projectId);
    const manifestPath = path.join(doneDir, 'done-manifest.json');
    try {
      const content = await fs.readFile(manifestPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async latestReady(projectId: string, scriptVersion: number) {
    await this.ensureTable();
    const result = await query(`SELECT * FROM production_packages WHERE project_id = $1 AND script_version = $2 AND status = 'ready' ORDER BY package_version DESC LIMIT 1`, [projectId, scriptVersion]);
    return result.rows[0] || null;
  }

  async latest(projectId: string, scriptVersion: number) {
    await this.ensureTable();
    const result = await query(`SELECT * FROM production_packages WHERE project_id = $1 AND script_version = $2 ORDER BY package_version DESC LIMIT 1`, [projectId, scriptVersion]);
    return result.rows[0] || null;
  }

  async fail(projectId: string, packageVersion: number, errorMessage: string) {
    await this.ensureTable();
    await query(`UPDATE production_packages SET status = 'failed', error_message = $3, updated_at = CURRENT_TIMESTAMP WHERE project_id = $1 AND package_version = $2`, [projectId, packageVersion, errorMessage]);
    realtime.publish({ type: 'pipeline_progress', projectId, progress: 100, status: 'Active CLI production package failed' });
  }
}

export const productionPackageService = new ProductionPackageService();
