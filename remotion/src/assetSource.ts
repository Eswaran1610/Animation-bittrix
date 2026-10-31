import { staticFile } from 'remotion';

/**
 * Remotion renders use files from remotion/public, while the browser Player
 * receives the same generated files through the backend /media route.
 */
export const assetSource = (assetPath: string): string => {
  if (/^(https?:|blob:|data:)/i.test(assetPath) || assetPath.startsWith('/')) {
    return assetPath;
  }
  return staticFile(assetPath);
};
