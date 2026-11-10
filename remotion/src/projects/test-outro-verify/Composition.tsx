import React from 'react';
import GeneratedVideo from './GeneratedVideo';
import { SceneDataPayload } from '../../data/sceneTypes';

export const MainComposition: React.FC<SceneDataPayload> = (props) => {
  return <GeneratedVideo {...props} />;
};
export default MainComposition;
