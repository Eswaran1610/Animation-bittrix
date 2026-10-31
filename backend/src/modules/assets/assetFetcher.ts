import fs from 'fs/promises';
import path from 'path';
import { projectPaths } from '../../config/paths.js';

export interface FetchedAsset {
  title: string;
  sourceUrl: string;
  localPath: string;
  staticUrl: string;
}

export class AssetFetcher {
  /**
   * Search Wikipedia / Wikimedia Commons for open educational diagrams & illustrations.
   */
  async fetchDiagramForTopic(projectId: string, sceneNumber: number, searchQuery: string): Promise<FetchedAsset | null> {
    try {
      const encoded = encodeURIComponent(searchQuery.trim());
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encoded}&gsrlimit=10&prop=pageimages&pithumbsize=1400&format=json`;

      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'AIAnimationPipeline/1.0 (Educational Video Production; inkyank@local)'
        }
      });

      if (!response.ok) return null;
      const data: any = await response.json();
      const pages: any[] = Object.values(data?.query?.pages || {});

      const queryTerms = searchQuery.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
      const rejectedTitle = /watermark|engraving|logo|flag|disambiguation|outline|symbol|map|diagram|chart|poster|typography|labelled|labeled|text[- ]heavy/i;
      const candidates = pages
        .filter((page: any) => page.thumbnail?.source && Number(page.thumbnail.width || 0) >= 720 && Number(page.thumbnail.height || 0) >= 480)
        .filter((page: any) => !rejectedTitle.test(page.title || ''))
        .map((page: any) => {
          const title = String(page.title || '').toLowerCase();
          const overlap = queryTerms.filter((term) => title.includes(term)).length;
          const exactPhrase = title.includes(searchQuery.toLowerCase().trim()) ? 2 : 0;
          return { page, score: Math.min(10, 3 + overlap * 2 + exactPhrase) };
        })
        .sort((left: any, right: any) => right.score - left.score);
      // A weak title match is safer than showing a potentially unrelated image.
      const match = candidates.find((candidate: any) => candidate.score >= 7)?.page;
      if (!match || !match.thumbnail?.source) {
        return null;
      }

      const imageUrl = match.thumbnail.source;
      const ext = imageUrl.includes('.png') ? 'png' : (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') ? 'jpg' : 'png');
      const fileName = `${projectId}_scene_${sceneNumber}.${ext}`;

      const mediaDir = path.join(projectPaths.backendMedia, 'assets');
      const remotionDir = path.join(projectPaths.remotionPublic, 'assets');
      await fs.mkdir(mediaDir, { recursive: true });
      await fs.mkdir(remotionDir, { recursive: true });

      const backendFile = path.join(mediaDir, fileName);
      const remotionFile = path.join(remotionDir, fileName);

      // Download the asset
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) return null;
      const buffer = Buffer.from(await imgRes.arrayBuffer());

      await fs.writeFile(backendFile, buffer);
      await fs.writeFile(remotionFile, buffer);

      console.log(`[AssetFetcher] Downloaded educational asset for "${searchQuery}": ${backendFile} (${(buffer.length / 1024).toFixed(1)} KB)`);

      return {
        title: match.title,
        sourceUrl: imageUrl,
        localPath: backendFile,
        staticUrl: `assets/${fileName}`
      };
    } catch (err: any) {
      console.warn(`[AssetFetcher] Failed to fetch asset for "${searchQuery}":`, err.message);
      return null;
    }
  }
}

export const assetFetcher = new AssetFetcher();
