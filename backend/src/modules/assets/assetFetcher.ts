import fs from 'fs/promises';
import path from 'path';
import { projectPaths } from '../../config/paths.js';

export interface FetchedAsset {
  title: string;
  sourceUrl: string;
  localPath: string;
  staticUrl: string;
  license?: string;
  attribution?: string;
}

type AssetCandidate = {
  title: string;
  imageUrl: string;
  sourceUrl: string;
  width: number;
  height: number;
  license?: string;
  attribution?: string;
  /** Relevance score 0-20; candidates with score < MIN_SCORE are discarded. */
  score: number;
};

const REQUEST_TIMEOUT_MS = Number(process.env.ASSET_FETCH_TIMEOUT_MS || 12000);
const RETRIES = 2;
/**
 * Minimum relevance score to accept a candidate.
 * Raised from 4 to 5 so old engravings that match one term are rejected.
 */
const MIN_SCORE = 5;
/** Minimum pixel dimensions for a usable image (portrait-safe). */
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;

const USER_AGENT = 'AIAnimationPipeline/1.0 (Educational Video Production; asset-fetcher)';

/** Words that add noise to a query without improving result relevance. */
const QUERY_NOISE = new Set([
  'aesthetic', 'actuation', 'clean', 'curve', 'diagram', 'exploded', 'graphic', 'graphics',
  'interface', 'matrix', 'minimalist', 'reality', 'setup', 'sheet', 'test', 'testing',
  'view', 'workstation', 'human', 'perception', 'experience', 'graph',
]);

/**
 * Patterns in a filename / title that strongly indicate a historical, archival,
 * or low-quality image that should never appear in a modern motion-video scene.
 *
 * Matched case-insensitively. If any of these appear in the candidate title the
 * candidate is silently skipped before scoring.
 */
const REJECTED_TITLE = new RegExp(
  [
    // Layout/design artefacts
    'watermark', 'logo', 'flag', 'disambiguation', 'symbol', 'poster',
    'typography', 'labelled', 'labeled', 'text[- ]heavy',
    // Historical document types
    'engraving', 'lithograph', 'woodcut', 'etching', 'woodblock',
    'illustration', 'portrait', 'bust', 'manuscript', 'illuminated',
    // Maps and diagrams
    'map', 'chart', 'diagram', 'blueprint', 'schematic', 'plan of',
    'floor plan', 'site plan', 'cross.?section',
    // Old-media markers
    'vintage', 'antique', 'ancient', 'medieval', 'historical', 'circa',
    'drawing', 'sketch', 'painting', 'caricature', 'cartoon',
    // Copyright/source noise
    'commons', 'wikimedia', 'wikipedia',
  ].join('|'),
  'i',
);

/**
 * Patterns inside Wikimedia category strings that indicate archival/historical
 * categories. Used when the Commons API returns extmetadata.Categories.
 */
const REJECTED_CATEGORY = /engrav|lithograph|woodcut|etch|illuminat|manuscript|histor|antique|vintage|portrait|map|diagram|drawing|sketch|painting|watercolor/i;

/** Patterns that boost the score – signs of modern photography. */
const MODERN_SIGNALS = /photo(?:graph)?|image|picture|shot|closeup|close[- ]up|macro|product|studio|render|3d|digital|modern|contemporary/i;

const cleanMetadata = (value: unknown) => String(value || '').replace(/<[^>]+>/g, '').trim();

const isPermissiveLicense = (license?: string) => {
  if (!license) return true;
  const normalized = license.toLowerCase().replace(/\s+/g, '');
  // Reject non-commercial (nc) and no-derivatives (nd) licenses explicitly
  if (/(^|[- ])(nc|nd)([- ]|$)/i.test(license) || normalized.includes('cc-by-nc') || normalized.includes('cc-by-nd')) return false;
  return (
    normalized.includes('cc0') ||
    normalized.includes('publicdomain') ||
    normalized.includes('pdm') ||
    normalized.includes('cc-by') ||
    normalized.includes('by-sa') ||
    normalized === 'by' ||
    normalized === 'by-sa'
  );
};

const extensionFor = (contentType: string, url: string) => {
  const mime = contentType.toLowerCase().split(';')[0].trim();
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/svg+xml') return 'svg';
  const match = url.match(/\.(jpe?g|png|webp|gif|svg)(?:[?#]|$)/i);
  return match?.[1].toLowerCase() === 'jpeg' ? 'jpg' : (match?.[1].toLowerCase() || 'jpg');
};

const looksLikeImage = (buffer: Buffer, contentType: string) => {
  const mime = contentType.toLowerCase().split(';')[0].trim();
  if (mime === 'image/svg+xml') return buffer.toString('utf8', 0, 512).includes('<svg');
  if (mime.startsWith('image/')) return buffer.length > 1024;
  return (
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
    buffer.subarray(0, 4).toString() === 'RIFF' ||
    buffer.subarray(0, 6).toString() === 'GIF87a' ||
    buffer.subarray(0, 6).toString() === 'GIF89a'
  );
};

export class AssetFetcher {
  private async request(url: string): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json,image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
        });
        if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) return response;
        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timeout);
      }
      if (attempt < RETRIES) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
    throw lastError instanceof Error ? lastError : new Error('request failed');
  }

  /**
   * Score a candidate title against the search query.
   *
   * Scoring rationale (max 20):
   *  +2  base score so a single-word match still beats 0
   *  +2  per query term found in the title (up to 5 terms → +10)
   *  +3  exact phrase match
   *  +2  modern-media signal word found in title
   *  −5  historical/archival signal word (engraving etc.) — penalises
   *      borderline cases that slipped past the rejection regex
   */
  private scoreCandidate(title: string, query: string, categories?: string): number {
    const queryTerms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
    const normalizedTitle = title.toLowerCase();
    const overlap = queryTerms.filter((term) => normalizedTitle.includes(term)).length;
    const exactPhrase = normalizedTitle.includes(query.toLowerCase().trim()) ? 3 : 0;
    const modernBoost = MODERN_SIGNALS.test(normalizedTitle) ? 2 : 0;
    // Penalise if historical patterns appear in the title despite passing the
    // rejection regex (e.g. "Apple - historical drawing" might pass 'drawing'
    // check if it also contains the query word "apple")
    const historicalPenalty = /engraving|lithograph|woodcut|etching|drawing|sketch|portrait|vintage|antique|medieval|historical/i.test(normalizedTitle) ? -5 : 0;
    // Penalise if Wikipedia/Commons categories indicate archival content
    const categoryPenalty = categories && REJECTED_CATEGORY.test(categories) ? -4 : 0;
    return Math.min(20, Math.max(0, 2 + overlap * 2 + exactPhrase + modernBoost + historicalPenalty + categoryPenalty));
  }

  /**
   * Build search query variants from most-specific to most-generic so we try
   * the full query first, then core terms, then just the key nouns.
   */
  private queryVariants(query: string): string[] {
    const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
    const core = tokens.filter((token) => !QUERY_NOISE.has(token));
    const variants = [
      query.trim(),
      core.join(' '),
      core.slice(0, 3).join(' '),
      core.slice(0, 2).join(' '),
    ].filter(Boolean);
    return [...new Set(variants)].slice(0, 5);
  }

  /** True when the candidate passes all hard quality gates. */
  private isUsableCandidate(candidate: AssetCandidate): boolean {
    return (
      candidate.width >= MIN_WIDTH &&
      candidate.height >= MIN_HEIGHT &&
      isPermissiveLicense(candidate.license) &&
      candidate.score >= MIN_SCORE
    );
  }

  private async searchCommons(query: string): Promise<AssetCandidate | null> {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '6',
      gsrlimit: '30', // fetch more so we have better candidates to rank
      prop: 'imageinfo|categories',
      iiprop: 'url|size|mime|extmetadata',
      iiurlwidth: '1400',
      cllimit: '5',
      format: 'json',
      origin: '*',
    });
    const response = await this.request(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);
    if (!response.ok) return null;
    const data: any = await response.json();
    const pages: any[] = Object.values(data?.query?.pages || {});
    const commonsRaw: Array<AssetCandidate | null> = pages.map((page: any) => {
      const info = page.imageinfo?.[0];
      const metadata = info?.extmetadata || {};
      const title = String(page.title || '').replace(/^File:/i, '');
      // Build category string to feed into scoring penalty
      const categories = (page.categories || []).map((cat: any) => String(cat.title || '')).join(' ');
      if (REJECTED_TITLE.test(title)) return null;
      return {
        title,
        imageUrl: String(info?.thumburl || info?.url || ''),
        sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(page.title || '').replace(/ /g, '_'))}`,
        width: Number(info?.thumbwidth || info?.width || 0),
        height: Number(info?.thumbheight || info?.height || 0),
        license: cleanMetadata(metadata.LicenseShortName?.value || metadata.License?.value),
        attribution: cleanMetadata(metadata.Attribution?.value || metadata.Artist?.value),
        score: this.scoreCandidate(title, query, categories),
      } satisfies AssetCandidate;
    });
    const candidates: AssetCandidate[] = commonsRaw.filter((c): c is AssetCandidate => c !== null && Boolean(c.imageUrl) && this.isUsableCandidate(c));
    return candidates.sort((a: AssetCandidate, b: AssetCandidate) => b.score - a.score)[0] || null;
  }

  private async searchWikipedia(query: string): Promise<AssetCandidate | null> {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrlimit: '15',
      prop: 'pageimages',
      piprop: 'thumbnail|original',
      pithumbsize: '1400',
      format: 'json',
      origin: '*',
    });
    const response = await this.request(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
    if (!response.ok) return null;
    const data: any = await response.json();
    const pages: any[] = Object.values(data?.query?.pages || {});
    const wikiRaw: Array<AssetCandidate | null> = pages.map((page: any) => {
      const title = String(page.title || '');
      if (REJECTED_TITLE.test(title)) return null;
      return {
        title,
        imageUrl: String(page.original?.source || page.thumbnail?.source || ''),
        sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        width: Number(page.original?.width || page.thumbnail?.width || 0),
        height: Number(page.original?.height || page.thumbnail?.height || 0),
        // Wikipedia does not expose per-image license through pageimages;
        // mark as unknown so isPermissiveLicense returns true (permissive default).
        license: undefined,
        score: this.scoreCandidate(title, query),
      } satisfies AssetCandidate;
    });
    const wikiCandidates: AssetCandidate[] = wikiRaw.filter((c): c is AssetCandidate => c !== null && Boolean(c.imageUrl) && this.isUsableCandidate(c));
    return wikiCandidates.sort((a: AssetCandidate, b: AssetCandidate) => b.score - a.score)[0] || null;
  }

  private async searchOpenverse(query: string): Promise<AssetCandidate | null> {
    const params = new URLSearchParams({ q: query, page_size: '15' });
    const response = await this.request(`https://api.openverse.org/v1/images/?${params.toString()}`);
    if (!response.ok) return null;
    const data: any = await response.json();
    const ovRaw: Array<AssetCandidate | null> = (data?.results || []).map((item: any) => {
      const title = String(item.title || '');
      if (REJECTED_TITLE.test(title)) return null;
      const tagString = (item.tags || []).map((t: any) => String(t?.name || '')).join(' ');
      return {
        title,
        imageUrl: String(item.thumbnail || item.url || ''),
        sourceUrl: String(item.foreign_landing_url || item.detail_url || item.url || ''),
        width: Number(item.width || 0),
        height: Number(item.height || 0),
        license: String(item.license || ''),
        attribution: String(item.attribution || item.creator || ''),
        score: this.scoreCandidate(`${title} ${item.creator || ''} ${tagString}`, query),
      } satisfies AssetCandidate;
    });
    const ovCandidates: AssetCandidate[] = ovRaw.filter((c): c is AssetCandidate => c !== null && Boolean(c.imageUrl) && this.isUsableCandidate(c));
    return ovCandidates.sort((a: AssetCandidate, b: AssetCandidate) => b.score - a.score)[0] || null;
  }

  private async download(candidate: AssetCandidate, projectId: string, sceneNumber: number): Promise<FetchedAsset | null> {
    const response = await this.request(candidate.imageUrl);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!looksLikeImage(buffer, contentType)) return null;

    const extension = extensionFor(contentType, candidate.imageUrl);
    const fileName = `${projectId}_scene_${sceneNumber}.${extension}`;
    const mediaDir = path.join(projectPaths.backendMedia, 'assets');
    const remotionDir = path.join(projectPaths.remotionPublic, 'assets');
    await fs.mkdir(mediaDir, { recursive: true });
    await fs.mkdir(remotionDir, { recursive: true });
    const backendFile = path.join(mediaDir, fileName);
    const remotionFile = path.join(remotionDir, fileName);
    await fs.writeFile(backendFile, buffer);
    await fs.writeFile(remotionFile, buffer);
    console.log(`[AssetFetcher] Downloaded asset for "${candidate.title}" (score ${candidate.score}): ${backendFile} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return {
      title: candidate.title,
      sourceUrl: candidate.sourceUrl,
      localPath: backendFile,
      staticUrl: `assets/${fileName}`,
      license: candidate.license,
      attribution: candidate.attribution,
    };
  }

  /**
   * Search all three open sources **in parallel** for each query variant, pick
   * the globally highest-scoring candidate, download it, and return it.
   *
   * Falls back gracefully to null (scene uses procedural blueprint visuals)
   * when no usable image is found — never throws to the caller.
   */
  async fetchDiagramForTopic(projectId: string, sceneNumber: number, searchQuery: string): Promise<FetchedAsset | null> {
    const failures: string[] = [];

    for (const query of this.queryVariants(searchQuery)) {
      // Run all three sources concurrently for this query variant
      const results = await Promise.allSettled([
        this.searchCommons(query).catch((e: any) => { failures.push(`Commons/${query}: ${e?.message || 'error'}`); return null; }),
        this.searchWikipedia(query).catch((e: any) => { failures.push(`Wikipedia/${query}: ${e?.message || 'error'}`); return null; }),
        this.searchOpenverse(query).catch((e: any) => { failures.push(`Openverse/${query}: ${e?.message || 'error'}`); return null; }),
      ]);

      // Collect fulfilled candidates and pick the best score globally
      const candidates: AssetCandidate[] = results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter((c): c is AssetCandidate => c !== null);

      if (candidates.length === 0) {
        failures.push(`${query}: no sources returned a candidate`);
        continue;
      }

      // Sort all candidates from all sources by score, try to download best first
      candidates.sort((a, b) => b.score - a.score);
      for (const candidate of candidates) {
        try {
          const asset = await this.download(candidate, projectId, sceneNumber);
          if (asset) return asset;
          failures.push(`download rejected for "${candidate.title}"`);
        } catch (error: any) {
          failures.push(`download failed for "${candidate.title}": ${error?.message || 'error'}`);
        }
      }
    }

    // All queries and sources exhausted — use procedural fallback (not an error)
    console.warn(
      `[AssetFetcher] No usable image found for "${searchQuery}" after all sources/queries ` +
      `(${failures.slice(0, 5).join('; ')}${failures.length > 5 ? ` …+${failures.length - 5} more` : ''}); ` +
      'scene will render with procedural blueprint visuals.',
    );
    return null;
  }
}

export const assetFetcher = new AssetFetcher();
