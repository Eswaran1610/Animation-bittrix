import React, { useEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender, prefetch, staticFile } from 'remotion';

export const PreloadAssets: React.FC<{ assets: string[] }> = ({ assets }) => {
  const [handle] = useState(() => delayRender('Preloading short-video assets'));

  useEffect(() => {
    const requests = assets.map((asset) => prefetch(staticFile(asset), { method: 'blob-url' }));
    Promise.all(requests.map((request) => request.waitUntilDone()))
      .then(() => continueRender(handle))
      .catch((error) => cancelRender(error));

    // Remotion releases a completed prefetch handle after waitUntilDone().
    // Calling free() again during Studio hot reload throws "free() called".
    return undefined;
  }, [assets, handle]);

  return null;
};
