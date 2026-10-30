import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './Composition';
import sceneData from './data/scene-data.json';

export const Root: React.FC = () => {
  const fps = sceneData.video?.fps || 30;
  const scenes = sceneData.scenes || [];
  
  // Calculate total duration in frames as sum of all scenes
  const totalDuration = scenes.reduce((sum: number, s: any) => {
    const frames = s.durationInFrames || (s.duration_sec ? s.duration_sec * fps : 120);
    return sum + frames;
  }, 0) || 450;

  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={totalDuration}
        fps={fps}
        width={sceneData.video?.width || 1920}
        height={sceneData.video?.height || 1080}
      />
    </>
  );
};
