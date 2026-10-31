import React, { useMemo } from 'react';
import { Player } from '@remotion/player';
import { MainComposition } from '../../../remotion/src/Composition';
import type { CaptionWord, SceneDataPayload } from '../../../remotion/src/data/sceneTypes';

interface LiveRemotionPreviewProps {
  props: unknown;
}

const mediaUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  if (/^(https?:|blob:|data:)/i.test(value) || value.startsWith('/')) return value;
  const clean = value.replace(/^\/+/, '');
  // Render props use Remotion-public paths. The browser preview uses the
  // backend media mount, where generated audio lives under /media/audio and
  // the procedural SFX library lives under /media/audio/sfx.
  if (clean.startsWith('sfx/')) return `/media/audio/${clean}`;
  return `/media/${clean}`;
};

const buildFallbackCaptions = (text: string, durationInFrames: number): CaptionWord[] => {
  const words = text.replace(/[\r\n]+/g, ' ').trim().match(/\S+/g) || [];
  if (words.length === 0) return [];
  const weights = words.map((word) => Math.max(1, word.replace(/[^\p{L}\p{N}]/gu, '').length));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  let previousEnd = 0;
  return words.map((word, index) => {
    const startFrame = previousEnd;
    const proportionalEnd = Math.round(
      (weights.slice(0, index + 1).reduce((sum, weight) => sum + weight, 0) / weightTotal) * durationInFrames
    );
    const endFrame = index === words.length - 1
      ? durationInFrames
      : Math.max(startFrame + 1, Math.min(durationInFrames, proportionalEnd));
    previousEnd = endFrame;
    return { word, startFrame, endFrame };
  });
};

const preparePlayerProps = (rawProps: unknown): SceneDataPayload => {
  const source = rawProps as SceneDataPayload;
  const captions = source.video.captions?.length
    ? source.video.captions
    : buildFallbackCaptions(
      source.scenes.map((scene) => scene.narration).join(' '),
      source.video.durationInFrames
    );
  return {
    ...source,
    video: {
      ...source.video,
      audioUrl: mediaUrl(source.video.audioUrl),
      backgroundAudioUrl: mediaUrl(source.video.backgroundAudioUrl),
      captions,
    },
    scenes: source.scenes.map((scene) => ({
      ...scene,
      narrationAudio: mediaUrl(scene.narrationAudio),
      image_url: mediaUrl(scene.image_url),
      image_assets: scene.image_assets
        ? Object.fromEntries(Object.entries(scene.image_assets).map(([query, path]) => [query, mediaUrl(path)])) as Record<string, string>
        : scene.image_assets,
      audioCues: scene.audioCues?.map((cue) => ({ ...cue, src: mediaUrl(cue.src) || cue.src })),
    })),
  };
};

export const LiveRemotionPreview: React.FC<LiveRemotionPreviewProps> = ({ props }) => {
  const playerProps = useMemo(() => preparePlayerProps(props), [props]);
  const durationInFrames = playerProps.video.durationInFrames || playerProps.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);

  return (
    <div style={{ width: '100%', aspectRatio: '16 / 9', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
      <Player
        component={MainComposition}
        inputProps={playerProps}
        durationInFrames={durationInFrames}
        compositionWidth={playerProps.video.width}
        compositionHeight={playerProps.video.height}
        fps={playerProps.video.fps}
        controls
        showVolumeControls
        initiallyMuted={false}
        clickToPlay
        autoPlay={false}
        acknowledgeRemotionLicense
        errorFallback={({ error }: { error: Error }) => (
          <div style={{ color: '#fecaca', padding: '24px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
            Live preview failed: {error.message}
          </div>
        )}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
