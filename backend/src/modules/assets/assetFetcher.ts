import { lookup } from 'dns/promises';
import { isIP } from 'net';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { projectPaths } from '../../config/paths.js';

export type CodexAssetKind = 'image' | '3d-model';

export interface CodexAssetRequest {
  projectId: string;
  previewVersion: number;
  sceneNumber: number;
  objectId: string;
  title: string;
  kind: CodexAssetKind;
  downloadUrl: string;
  sourceUrl: string;
  license: string;
  attribution?: string;
  /** Words that must relate to the scene (from the scene's narration / asset_queries). */
  sceneKeywords?: string[];
}

export interface FetchedAsset extends CodexAssetRequest {
  localPath: string;
  staticUrl: string;
  fileSizeBytes: number;
}

const REQUEST_TIMEOUT_MS = Number(process.env.ASSET_FETCH_TIMEOUT_MS || 8000);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_MODEL_BYTES = 30 * 1024 * 1024;
const USER_AGENT = 'AnimationPipeline/1.0 (Codex-selected licensed video assets)';

const safeSegment = (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'asset';

const isPrivateAddress = (address: string) => {
  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  if (version === 6) {
    const normalized = address.toLowerCase().split('%')[0];
    if (normalized.startsWith('::ffff:')) return isPrivateAddress(normalized.slice(7));
    return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
      normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
      normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('ff');
  }
  return true;
};

const assertPermissiveLicense = (license: string) => {
  const normalized = license.toLowerCase().replace(/[\s_-]+/g, '');
  const allowed = normalized.includes('cc0') || normalized.includes('publicdomain') || normalized === 'pdm' ||
    normalized.includes('ccby') || normalized.includes('ccbysa') || normalized === 'by' || normalized === 'by-sa';
  if (!allowed || normalized.includes('nc') || normalized.includes('nd') || normalized.includes('allrightsreserved')) {
    throw new Error(`Codex selected an asset with an unsupported or unclear license: "${license || 'missing license'}".`);
  }
};

const assertAttribution = (license: string, attribution?: string) => {
  if (/\b(cc[- ]?by|cc[- ]?by[- ]?sa|by-sa)\b/i.test(license) && !attribution?.trim()) {
    throw new Error(`Codex selected "${license}" media but supplied no required attribution.`);
  }
};

const assertRelevantToScene = (request: CodexAssetRequest) => {
  const keywords = (request.sceneKeywords || [])
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length >= 3);
  if (keywords.length === 0) return; // caller did not ask for the check
  const haystack = [request.title, request.objectId, request.sourceUrl, request.downloadUrl, request.attribution]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (!keywords.some((k) => haystack.includes(k))) {
    throw new Error(
      `Asset "${request.title}" does not look related to this scene (expected one of: ${keywords.slice(0, 6).join(', ')}). ` +
        'Pick an asset whose title/source mentions the scene subject, or use an authored vector.',
    );
  }
};

const validateGlb = (buffer: Buffer, title: string) => {
  const declaredLength = buffer.length >= 12 ? buffer.readUInt32LE(8) : -1;
  const jsonLength = buffer.length >= 20 ? buffer.readUInt32LE(12) : -1;
  const jsonType = buffer.length >= 20 ? buffer.readUInt32LE(16) : -1;
  if (buffer.length < 20 || buffer.length > MAX_MODEL_BYTES || buffer.subarray(0, 4).toString('ascii') !== 'glTF' ||
    buffer.readUInt32LE(4) !== 2 || declaredLength !== buffer.length || jsonType !== 0x4e4f534a || jsonLength > buffer.length - 20) {
    throw new Error(`Codex-selected model "${title}" is not a valid bounded GLB 2.0 file.`);
  }
  let header: any;
  try {
    header = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength).replace(/\0+\s*$/, '').trim());
  } catch {
    throw new Error(`Codex-selected model "${title}" has an invalid GLB JSON chunk.`);
  }
  if (header?.asset?.version !== '2.0' ||
    (header.buffers || []).some((entry: any) => entry.uri && !String(entry.uri).startsWith('data:')) ||
    (header.images || []).some((entry: any) => entry.uri && !String(entry.uri).startsWith('data:'))) {
    throw new Error(`Codex-selected model "${title}" is invalid or depends on external files.`);
  }
};

export class AssetFetcher {
  private async validatePublicUrl(rawUrl: string): Promise<URL> {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new Error(`Codex returned an invalid asset URL: ${rawUrl}`);
    }
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) {
      throw new Error('Codex-selected asset URLs must use HTTPS and cannot contain credentials.');
    }
    const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
      throw new Error('Codex-selected asset URL points to a local host.');
    }
    let addresses: Array<{ address: string }>;
    if (isIP(hostname)) {
      addresses = [{ address: hostname }];
    } else {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        addresses = await Promise.race([
          lookup(hostname, { all: true, verbatim: true }),
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Asset host DNS lookup timed out.')), REQUEST_TIMEOUT_MS); }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
      throw new Error(`Codex-selected asset host resolves to a private or reserved address: ${hostname}.`);
    }
    return url;
  }

  private async download(urlValue: string, kind: CodexAssetKind): Promise<{ buffer: Buffer; contentType: string; finalUrl: string }> {
    let url = await this.validatePublicUrl(urlValue);
    for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
      const response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { 'User-Agent': USER_AGENT, Accept: 'image/*,model/gltf-binary,application/octet-stream,*/*;q=0.5' },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location || redirectCount === 5) throw new Error('Asset download returned too many or an invalid redirect.');
        await response.body?.cancel();
        url = await this.validatePublicUrl(new URL(location, url).toString());
        continue;
      }
      if (!response.ok) throw new Error(`Asset download failed with HTTP ${response.status}.`);
      const contentLength = Number(response.headers.get('content-length') || 0);
      const maxBytes = kind === '3d-model' ? MAX_MODEL_BYTES : MAX_IMAGE_BYTES;
      if (contentLength > maxBytes) throw new Error(`Selected asset exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB download limit.`);
      const buffer = Buffer.from(await response.arrayBuffer());
      return { buffer, contentType: response.headers.get('content-type') || '', finalUrl: url.toString() };
    }
    throw new Error('Asset download redirect limit reached.');
  }

  private imageExtension(buffer: Buffer, contentType: string): string {
    const mime = contentType.toLowerCase().split(';')[0].trim();
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'jpg';
    if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'webp';
    if (buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a') return 'gif';
    throw new Error(`Selected image is not a supported raster image (${mime || 'unknown content type'}).`);
  }

  async fetchCodexSelectedAsset(request: CodexAssetRequest): Promise<FetchedAsset> {
    assertPermissiveLicense(request.license);
    assertAttribution(request.license, request.attribution);
    assertRelevantToScene(request);
    await this.validatePublicUrl(request.sourceUrl);
    const { buffer, contentType } = await this.download(request.downloadUrl, request.kind);
    const extension = request.kind === '3d-model' ? 'glb' : this.imageExtension(buffer, contentType);
    if (request.kind === '3d-model') validateGlb(buffer, request.title);
    else if (buffer.length < 1024 || buffer.length > MAX_IMAGE_BYTES) throw new Error(`Selected image "${request.title}" has an invalid file size.`);

    // Keep downloaded raster assets close to their display size. This lowers
    // Chromium memory pressure while preserving the source URL and license
    // metadata in the generated scene plan.
    const normalizedBuffer = request.kind === 'image' && extension !== 'gif'
      ? await sharp(buffer).rotate().resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true }).toBuffer()
      : buffer;

    const safeProjectId = request.projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `scene_${request.sceneNumber}_${safeSegment(request.objectId)}.${extension}`;
    const relativePath = path.posix.join('projects', safeProjectId, 'previews', `v${request.previewVersion}`, 'assets', request.kind === 'image' ? 'images' : 'models', fileName);
    const backendFile = path.join(projectPaths.backendMedia, ...relativePath.split('/'));
    const remotionFile = path.join(projectPaths.remotionPublic, ...relativePath.split('/'));
    await fs.mkdir(path.dirname(backendFile), { recursive: true });
    await fs.mkdir(path.dirname(remotionFile), { recursive: true });
    await fs.writeFile(backendFile, normalizedBuffer);
    await fs.copyFile(backendFile, remotionFile);
    return { ...request, localPath: backendFile, staticUrl: relativePath, fileSizeBytes: normalizedBuffer.length };
  }
}

export const assetFetcher = new AssetFetcher();
