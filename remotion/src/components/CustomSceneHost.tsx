import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneData } from '../data/sceneTypes';

type Word = { word: string; startFrame: number; endFrame: number };
export type SceneComponent = React.ComponentType<{ frame: number; fps: number; durationInFrames: number; words: Word[]; theme: any }>;

class SceneErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[CustomSceneHost] Scene component threw at runtime:', error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Mounts one Claude-authored scene; the scene owns all of its visuals and captions. */
export const CustomSceneHost: React.FC<{ scene: SceneData; Component: SceneComponent }> = ({ scene, Component }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <SceneErrorBoundary>
        <Component
          frame={frame}
          fps={fps}
          durationInFrames={scene.durationInFrames}
          words={(scene.words || []) as Word[]}
          theme={scene.styleBrief}
        />
      </SceneErrorBoundary>
    </AbsoluteFill>
  );
};

export default CustomSceneHost;
