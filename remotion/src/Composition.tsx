import React from 'react';
import { Audio, Sequence } from 'remotion';
import GeneratedCliVideo from './GeneratedCliVideo';
import { SceneDataPayload } from './data/sceneTypes';
import { assetSource } from './assetSource';

export const MainComposition: React.FC<SceneDataPayload> = (sceneData) => {
  const masterAudioUrl = sceneData?.video?.audioUrl;
  const backgroundAudioUrl = sceneData?.video?.backgroundAudioUrl;
  const scenes = sceneData?.scenes || [];

  let accumulatedFrame = 0;

  return (
    <>
      <GeneratedCliVideo {...sceneData} />
      {masterAudioUrl && <Audio src={assetSource(masterAudioUrl)} volume={1.0} />}
      {!masterAudioUrl && backgroundAudioUrl && <Audio src={assetSource(backgroundAudioUrl)} volume={0.15} />}
      {!masterAudioUrl &&
        scenes.map((scene, sceneIndex) => {
          const fromFrame = accumulatedFrame;
          accumulatedFrame += scene.durationInFrames || 90;

          return (
            <React.Fragment key={`audio-scene-${scene.id || sceneIndex}`}>
              {/* If master audio is absent, play per-scene narrationAudio */}
              {scene.narrationAudio && (
                <Sequence from={fromFrame} durationInFrames={scene.durationInFrames}>
                  <Audio src={assetSource(scene.narrationAudio)} volume={1.0} />
                </Sequence>
              )}
              {/* Render SFX audio cues for scene */}
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
