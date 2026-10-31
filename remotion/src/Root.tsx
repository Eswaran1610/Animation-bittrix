import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { MainComposition } from './Composition';
import { SceneDataPayload } from './data/sceneTypes';

export const Root: React.FC = () => {
  const sceneData = getInputProps() as Partial<SceneDataPayload>;
  if (!sceneData.video || !Array.isArray(sceneData.scenes)) {
    throw new Error('No isolated AGY render props were provided. Render through the backend pipeline.');
  }

  const fps = sceneData.video.fps;
  const scenes = sceneData.scenes;

  if (sceneData.video.generatedBy !== 'agy') {
    throw new Error('No approved AGY plan is loaded. Generate and approve a script before rendering.');
  }
  
  // Calculate total duration in frames as sum of all scenes
  const totalDuration = scenes.reduce((sum: number, s: any) => {
    const frames = s.durationInFrames;
    return sum + frames;
  }, 0);

  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition as unknown as React.FC<Record<string, unknown>>}
        defaultProps={sceneData as SceneDataPayload}
        durationInFrames={totalDuration}
        fps={fps}
        width={sceneData.video.width}
        height={sceneData.video.height}
      />
    </>
  );
};
