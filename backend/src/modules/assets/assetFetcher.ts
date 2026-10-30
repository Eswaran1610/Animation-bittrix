import fs from 'fs/promises';
import path from 'path';

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
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encoded}&prop=pageimages&pithumbsize=1000&format=json`;

      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'AIAnimationPipeline/1.0 (Educational Video Production; inkyank@local)'
        }
      });

      if (!response.ok) return null;
      const data: any = await response.json();
      const pages: any[] = Object.values(data?.query?.pages || {});

      // Find first page with an image thumbnail
      const match = pages.find((p: any) => p.thumbnail?.source);
      if (!match || !match.thumbnail?.source) {
        return null;
      }

      const imageUrl = match.thumbnail.source;
      const ext = imageUrl.includes('.png') ? 'png' : (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') ? 'jpg' : 'png');
      const fileName = `${projectId}_scene_${sceneNumber}.${ext}`;

      const mediaDir = '/home/inkyank/Pictures/AnimationPipeline/backend/media/assets';
      const remotionDir = '/home/inkyank/Pictures/AnimationPipeline/remotion/public/assets';
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
