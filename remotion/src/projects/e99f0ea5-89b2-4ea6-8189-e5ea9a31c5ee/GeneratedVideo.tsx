import React from 'react';
import { Sequence } from 'remotion';
import type { SceneDataPayload } from '../../data/sceneTypes';
import { CustomSceneHost } from '../../components/CustomSceneHost';
import { BittrixOutroExact } from '../../components/BittrixOutroExact';
import Scene_1 from './scenes/Scene01';
import Scene_2 from './scenes/Scene02';
import Scene_3 from './scenes/Scene03';
import Scene_4 from './scenes/Scene04';
import Scene_5 from './scenes/Scene05';
import Scene_6 from './scenes/Scene06';
import Scene_7 from './scenes/Scene07';
import Scene_8 from './scenes/Scene08';
import Scene_9 from './scenes/Scene09';

const CUSTOM_SCENES: Record<number, any> = {
  1: Scene_1,
  2: Scene_2,
  3: Scene_3,
  4: Scene_4,
  5: Scene_5,
  6: Scene_6,
  7: Scene_7,
  8: Scene_8,
  9: Scene_9,
};

export default function GeneratedVideo({ video, scenes }: SceneDataPayload) {
  const fps = video?.fps || 30;
  const list = scenes || [];
  const total = list.reduce((end: number, s: any) => Math.max(end, (s.start ?? s.startFrame ?? 0) + (s.durationInFrames || s.frames || 0)), 0);
  const outroFrames = Math.min(total, 3 * fps);
  return (
    <>
      {list.map((scene: any, index: number) => (
        <Sequence key={scene.id || index} from={scene.start ?? scene.startFrame ?? 0} durationInFrames={scene.durationInFrames || scene.frames}>
          <CustomSceneHost scene={scene} Component={CUSTOM_SCENES[scene.scene_number]} />
        </Sequence>
      ))}
      <Sequence from={total - outroFrames} durationInFrames={outroFrames}>
        <BittrixOutroExact />
      </Sequence>
    </>
  );
}
