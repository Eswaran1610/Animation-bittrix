import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { MainComposition } from './Composition';
import { SceneDataPayload } from '../../data/sceneTypes';
import { normalizeSceneData } from '../../data/normalizeSceneData';

const calcTimelineDuration = (scenes: any[] = []) =>
  scenes.reduce((total, scene, index) => total + (scene.durationInFrames || 90) - (index < scenes.length - 1 ? (scene.transitionOutFrames || 12) : 0), 0) || 900;

export const Root: React.FC = () => {
  const rawInput = getInputProps();
  const resolvedProps = normalizeSceneData(rawInput) || (rawInput as SceneDataPayload);
  const mainFps = resolvedProps?.video?.fps || 30;
  const mainDuration = resolvedProps?.video?.durationInFrames || calcTimelineDuration(resolvedProps?.scenes);

  return (
    <Composition
      id="MainComposition"
      component={MainComposition as unknown as React.FC<Record<string, unknown>>}
      defaultProps={resolvedProps as unknown as Record<string, unknown>}
      durationInFrames={mainDuration}
      fps={mainFps}
      width={resolvedProps?.video?.width || 1080}
      height={resolvedProps?.video?.height || 1920}
    />
  );
};
