import React from 'react';
import { MainVideo } from './MainVideo';
import { SceneDataPayload } from './data/sceneTypes';

export const MainComposition: React.FC<SceneDataPayload> = (sceneData) => {
  return <MainVideo sceneData={sceneData} />;
};
