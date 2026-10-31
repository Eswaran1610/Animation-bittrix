import React from 'react';
import { AbsoluteFill, Sequence, Audio } from 'remotion';
import { DynamicScene } from './components/DynamicScene';
import { WordCaptions } from './components/WordCaptions';
import { SceneDataPayload } from './data/sceneTypes';
import { assetSource } from './assetSource';

export const MainVideo: React.FC<{ sceneData: SceneDataPayload }> = ({ sceneData }) => {
  const scenes = sceneData.scenes;
  const fps = sceneData.video.fps;
  const audioUrl = sceneData.video.audioUrl;

  let currentOffset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070f' }}>
      {/* Synchronized Neural Voiceover Narration Track */}
      {audioUrl && (
        <Audio src={assetSource(audioUrl)} volume={1.0} />
      )}

      {scenes.map((scene, idx) => {
        const startFrame = currentOffset;
        const durationFrames = scene.durationInFrames;
        currentOffset += durationFrames;

        return (
          <Sequence
            key={scene.id || idx}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            {scene.audioCues?.map((cue, cueIndex) => (
              <Sequence key={`${scene.id}-cue-${cueIndex}`} from={cue.frame} durationInFrames={Math.max(1, durationFrames - cue.frame)}>
                <Audio src={assetSource(cue.src)} volume={cue.volume ?? 0.7} />
              </Sequence>
            ))}
            <DynamicScene
              scene={scene}
              index={idx}
              totalScenes={scenes.length}
              styleProfile={sceneData.video.styleProfile}
            />
          </Sequence>
        );
      })}

      <WordCaptions captions={sceneData.video.captions} color={sceneData.video.styleProfile?.primary} />
    </AbsoluteFill>
  );
};
