import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { MainComposition } from './Composition';
import { SceneDataPayload } from './data/sceneTypes';
import { ShortVideo } from './short-video/ShortVideo';
import { SHORT_VIDEO_DEFAULT_PROPS, ShortVideoPropsSchema } from './short-video/shortVideoProps';
import { collectMainCompositionQaIssues, collectShortVideoQaIssues } from './short-video/shortVideoQa';
import { sceneTimelineDuration } from './short-video/sceneAdapter';

export const Root: React.FC = () => {
  const shortVideoQaIssues = collectShortVideoQaIssues(SHORT_VIDEO_DEFAULT_PROPS);
  if (shortVideoQaIssues.length > 0) console.warn(`[ShortVideo QA] ${shortVideoQaIssues.join(' | ')}`);
  const sceneData = getInputProps() as Partial<SceneDataPayload>;
  const hasValidSceneData = Boolean(
    sceneData.video &&
    Array.isArray(sceneData.scenes) &&
    sceneData.video.generatedBy === 'agy'
  );
  if (hasValidSceneData) {
    const mainQaIssues = collectMainCompositionQaIssues(sceneData as SceneDataPayload);
    if (mainQaIssues.length > 0) console.warn(`[MainComposition QA] ${mainQaIssues.join(' | ')}`);
  }
  const agyComposition = hasValidSceneData && sceneData.video && Array.isArray(sceneData.scenes)
    ? (() => {
      const fps = sceneData.video.fps;
      const totalDuration = sceneTimelineDuration(sceneData.scenes);
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
