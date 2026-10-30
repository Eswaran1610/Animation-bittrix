import React from 'react';
import { AbsoluteFill, Sequence, Audio, staticFile } from 'remotion';
import sceneData from './data/scene-data.json';
import { DynamicScene, SceneData } from './components/DynamicScene';

export const MainVideo: React.FC = () => {
  const scenes = (sceneData.scenes || []) as SceneData[];
  const fps = sceneData.video?.fps || 30;
  const audioUrl = (sceneData.video as any)?.audioUrl;

  let currentOffset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070f' }}>
      {/* Synchronized Neural Voiceover Narration Track */}
      {audioUrl && (
        <Audio src={staticFile(audioUrl)} volume={1.0} />
      )}

      {scenes.map((scene, idx) => {
        const startFrame = currentOffset;
        const durationFrames = scene.durationInFrames || (scene.duration_sec ? scene.duration_sec * fps : 120);
        currentOffset += durationFrames;

        return (
          <Sequence
            key={scene.id || idx}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <DynamicScene
              scene={scene}
              index={idx}
              totalScenes={scenes.length}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
