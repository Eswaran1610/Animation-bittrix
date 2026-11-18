import React from 'react';
import { Sequence } from 'remotion';
import type { SceneDataPayload } from './data/sceneTypes';
import { BittrixOutroExact } from './components/BittrixOutroExact';
import ClaudeVideo from './projects/627cd9eb-a5cf-47f5-ad22-e9f4cf72b596/ClaudeVideo';

const timelineEnd = (list: any[]) =>
  list.reduce((end: number, s: any) => Math.max(end, (s.start ?? s.startFrame ?? 0) + (s.durationInFrames || s.frames || 0)), 0);

export default function GeneratedVideo({ video, scenes }: SceneDataPayload) {
  const fps = video?.fps || 30;
  const list = (scenes || []) as any[];
  const total = timelineEnd(list);
  const outroFrames = Math.min(total, 3 * fps);
  return (
    <>
      <ClaudeVideo fps={fps} durationInFrames={total} scenes={list} />
      <Sequence from={total - outroFrames} durationInFrames={outroFrames}>
        <BittrixOutroExact />
      </Sequence>
    </>
  );
}
