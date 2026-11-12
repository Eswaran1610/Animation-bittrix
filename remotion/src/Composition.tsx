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
      <GeneratedCliVideo {...(sceneData as any)} />
      {/* Master Voiceover Audio */}
      {masterAudioUrl && <Audio src={assetSource(masterAudioUrl)} volume={1.0} />}
      {!masterAudioUrl && backgroundAudioUrl && <Audio src={assetSource(backgroundAudioUrl)} volume={0.15} />}

      {/* Per-scene Narration (if no master audio) & Dynamic Object SFX (Always Active) */}
      {scenes.map((scene, sceneIndex) => {
        const fromFrame = (scene as any).startFrame !== undefined ? (scene as any).startFrame : accumulatedFrame;
        const transOut = (scene as any).transitionOutFrames ?? (sceneIndex < scenes.length - 1 ? 10 : 0);
        accumulatedFrame += (scene.durationInFrames || 90) - (sceneIndex < scenes.length - 1 ? transOut : 0);

        return (
          <React.Fragment key={`audio-scene-${scene.id || sceneIndex}`}>
            {/* If master audio is absent, play per-scene narrationAudio */}
            {!masterAudioUrl && scene.narrationAudio && (
              <Sequence from={fromFrame} durationInFrames={scene.durationInFrames}>
                <Audio src={assetSource(scene.narrationAudio)} volume={1.0} />
              </Sequence>
            )}
            {/* Dynamic Procedural SFX Audio Cues (whoosh, pop, hit, tick on object actions) */}
            {scene.audioCues?.map((cue, cueIdx) => {
              if (!cue?.src) return null;
              const cueStart = Math.max(0, fromFrame + (cue.frame ?? cue.hitFrame ?? 0));
              return (
                <Sequence
                  key={`cue-${scene.id || sceneIndex}-${cueIdx}`}
                  from={cueStart}
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
