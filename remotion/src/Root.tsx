import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { MainComposition } from './Composition';
import { SceneDataPayload } from './data/sceneTypes';
import { ShortVideo } from './short-video/ShortVideo';
import { SHORT_VIDEO_DEFAULT_PROPS, ShortVideoPropsSchema } from './short-video/shortVideoProps';
import { collectShortVideoQaIssues } from './short-video/shortVideoQa';

export const Root: React.FC = () => {
  const shortVideoQaIssues = collectShortVideoQaIssues(SHORT_VIDEO_DEFAULT_PROPS);
  if (shortVideoQaIssues.length > 0) console.warn(`[ShortVideo QA] ${shortVideoQaIssues.join(' | ')}`);
  const sceneData = getInputProps() as Partial<SceneDataPayload>;
  const hasValidSceneData = Boolean(
    sceneData.video &&
    Array.isArray(sceneData.scenes) &&
    sceneData.video.generatedBy === 'agy'
  );
  const agyComposition = hasValidSceneData && sceneData.video && Array.isArray(sceneData.scenes)
    ? (() => {
      const fps = sceneData.video.fps;
      const totalDuration = sceneData.scenes.reduce((sum: number, scene: any) => sum + scene.durationInFrames, 0);
      return (
        <Composition
          id="MainComposition"
          component={MainComposition as unknown as React.FC<Record<string, unknown>>}
          defaultProps={sceneData as SceneDataPayload}
          durationInFrames={totalDuration}
          fps={fps}
          width={sceneData.video.width}
          height={sceneData.video.height}
        />
      );
    })()
    : null;

  return (
    <>
      {agyComposition}
      <Composition
        id="ShortVideo"
        component={ShortVideo}
        defaultProps={SHORT_VIDEO_DEFAULT_PROPS}
        schema={ShortVideoPropsSchema}
        durationInFrames={SHORT_VIDEO_DEFAULT_PROPS.durationInFrames}
        fps={SHORT_VIDEO_DEFAULT_PROPS.fps}
        width={SHORT_VIDEO_DEFAULT_PROPS.width}
        height={SHORT_VIDEO_DEFAULT_PROPS.height}
      />
    </>
  );
};
