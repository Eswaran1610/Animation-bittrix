import React from 'react';
import { DynamicScene } from './DynamicScene';
import { SceneData, StyleBrief, StyleProfile } from '../data/sceneTypes';

export const SceneRenderer: React.FC<{
  scene: SceneData;
  index: number;
  totalScenes: number;
  styleProfile?: StyleProfile;
  styleBrief?: StyleBrief;
  globalFrame?: number;
}> = ({ scene, index, totalScenes, styleProfile, styleBrief, globalFrame }) => {
  return (
    <DynamicScene
      scene={scene}
      index={index}
      totalScenes={totalScenes}
      styleProfile={styleProfile}
      styleBrief={styleBrief}
      globalFrame={globalFrame}
    />
  );
};
