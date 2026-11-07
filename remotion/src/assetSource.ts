import { staticFile } from 'remotion';

/**
 * Remotion renders use files from remotion/public, while the browser Player
 * receives the same generated files through the backend /media route.
 */
export const assetSource = (assetPath?: string | null): string => {
  if (!assetPath || typeof assetPath !== 'string') {
    return '';
  }
  if (/^(https?:|blob:|data:)/i.test(assetPath)) {
    return assetPath;
  }
  const clean = assetPath.replace(/^\/?(public\/)?/, '');
  return staticFile(clean);
};
