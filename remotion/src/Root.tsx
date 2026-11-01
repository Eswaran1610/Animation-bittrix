import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { MainComposition } from './Composition';
import { SceneDataPayload } from './data/sceneTypes';
import { ShortVideo } from './short-video/ShortVideo';
import { SHORT_VIDEO_DEFAULT_PROPS, ShortVideoPropsSchema } from './short-video/shortVideoProps';
import { collectMainCompositionQaIssues, collectShortVideoQaIssues } from './short-video/shortVideoQa';
import { sceneTimelineDuration } from './short-video/sceneAdapter';

/**
 * Minimal default payload used to register MainComposition in Remotion Studio
 * and CLI composition listings when no live inputProps are provided. Real
 * renders pass a full SceneDataPayload via renderMedia({ inputProps }), which
 * overrides these defaults at render time.
 */
const MAIN_COMPOSITION_DEFAULT_PROPS: SceneDataPayload = {
  video: {
    title: 'Codex Preview',
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 150,
    targetDurationSec: 5,
    style: 'cinematic-neon',
    generatedBy: 'codex',
    sourceProjectId: 'preview',
    previewVersion: 1,
    scriptVersion: 1,
    styleProfile: {
      family: 'cinematic-neon',
      motif: 'geometric',
      background: '#05070f',
      surface: '#0e1020',
      text: '#e8eaf6',
      primary: '#7c4dff',
      secondary: '#00e5ff',
      motion_language: 'spring-pop',
      transition_language: 'slide',
    },
  },
  scenes: [
    {
      id: 'preview-1',
      scene_number: 1,
      role: 'hook',
      template: 'question-hook',
      title: 'Preview Scene',
      on_screen_text: 'Ready to render?',
      subtitle: 'Codex MainComposition default preview',
      key_takeaways: ['Scene 1 placeholder'],
      visual_direction: 'bold typography with neon glow',
      motion_cue: 'spring entrance from bottom',
      continuity_to_next: 'None (final scene)',
      duration_sec: 5,
      durationInFrames: 150,
      transitionOutFrames: 0,
      visualType: 'blueprint',
      themeColor: '#7c4dff',
      narration: 'This is a preview scene for the Codex MainComposition.',
      visualBlueprint: {
        purpose: 'Opening hook preview',
        layout: 'centered',
        camera_motion: 'static',
        asset_queries: [],
        objects: [
          {
            id: 'obj_preview_1',
            label: 'Neon Sphere',
            x: 0.5,
            y: 0.45,
            scale: 1.2,
            render_spec: { type: '3d', primitive: 'sphere' },
          },
        ],
      },
    },
  ],
};

export const Root: React.FC = () => {
  const shortVideoQaIssues = collectShortVideoQaIssues(SHORT_VIDEO_DEFAULT_PROPS);
  if (shortVideoQaIssues.length > 0) console.warn(`[ShortVideo QA] ${shortVideoQaIssues.join(' | ')}`);
  const sceneData = getInputProps() as Partial<SceneDataPayload>;
  const hasValidSceneData = Boolean(
    sceneData.video &&
    Array.isArray(sceneData.scenes) &&
    sceneData.video.generatedBy === 'codex'
  );
  if (hasValidSceneData) {
    const mainQaIssues = collectMainCompositionQaIssues(sceneData as SceneDataPayload);
    if (mainQaIssues.length > 0) console.warn(`[MainComposition QA] ${mainQaIssues.join(' | ')}`);
  }

  // Use live input props when a real Codex render is in progress; fall back to
  // the default preview payload so the composition is always registered and
  // visible in Remotion Studio / CLI listings without props.
  const resolvedProps: SceneDataPayload = hasValidSceneData
    ? (sceneData as SceneDataPayload)
    : MAIN_COMPOSITION_DEFAULT_PROPS;
  const mainFps = resolvedProps.video.fps;
  const mainDuration = sceneTimelineDuration(resolvedProps.scenes);
  const codexComposition = (
    <Composition
      id="MainComposition"
      component={MainComposition as unknown as React.FC<Record<string, unknown>>}
      defaultProps={resolvedProps}
      durationInFrames={mainDuration}
      fps={mainFps}
      width={resolvedProps.video.width}
      height={resolvedProps.video.height}
    />
  );

  return (
    <>
      {codexComposition}
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
