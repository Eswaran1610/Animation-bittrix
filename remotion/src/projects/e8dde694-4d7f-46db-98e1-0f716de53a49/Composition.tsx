import React from 'react';
import { Audio, Sequence } from 'remotion';
import GeneratedVideo from './GeneratedVideo';
import { SceneDataPayload } from '../../data/sceneTypes';
import { assetSource } from '../../assetSource';

export const MainComposition: React.FC<SceneDataPayload> = (sceneData) => {
  const masterAudioUrl = sceneData?.video?.audioUrl;
  const backgroundAudioUrl = sceneData?.video?.backgroundAudioUrl;
  const scenes = sceneData?.scenes || [];
  let accumulatedFrame = 0;

  return (
    <>
      <GeneratedVideo {...sceneData} />
      {masterAudioUrl && <Audio src={assetSource(masterAudioUrl)} volume={1.0} />}
      {!masterAudioUrl && backgroundAudioUrl && <Audio src={assetSource(backgroundAudioUrl)} volume={0.25} loop />}
      {!masterAudioUrl &&
        scenes.map((scene, sceneIndex) => {
          const fromFrame = (scene as any).start !== undefined
            ? (scene as any).start
            : ((scene as any).startFrame !== undefined ? (scene as any).startFrame : accumulatedFrame);
          const durationFrames = scene.durationInFrames || (scene as any).frames || 90;
          accumulatedFrame = fromFrame + durationFrames;

          return (
            <React.Fragment key={`audio-scene-${scene.id || sceneIndex}`}>
              {scene.narrationAudio && (
                <Sequence from={fromFrame} durationInFrames={durationFrames}>
                  <Audio src={assetSource(scene.narrationAudio)} volume={1.0} />
                </Sequence>
              )}
              {scene.audioCues?.map((cue, cueIdx) => {
                if (!cue?.src) return null;
                return (
                  <Sequence
                    key={`cue-${scene.id || sceneIndex}-${cueIdx}`}
                    from={fromFrame + (cue.frame ?? cue.hitFrame ?? 0)}
                    durationInFrames={cue.durationFrames || 60}
                  >
                    <Audio src={assetSource(cue.src)} volume={cue.volume ?? 0.6} />
                  </Sequence>
                );
              })}
            </React.Fragment>
          );
        })}
    </>
  );
};
export default MainComposition;
