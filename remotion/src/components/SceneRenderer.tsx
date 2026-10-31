import React from 'react';
import { DynamicScene } from './DynamicScene';
import { SceneData, StyleProfile } from '../data/sceneTypes';
import { TemplateScene } from '../short-video/scenes/TemplateScene';
import { isKnownShortVideoTemplate, sceneToTemplateProps } from '../short-video/sceneAdapter';

export const SceneRenderer: React.FC<{
  scene: SceneData;
  index: number;
  totalScenes: number;
  styleProfile?: StyleProfile;
}> = ({ scene, index, totalScenes, styleProfile }) => {
  const useTemplate = isKnownShortVideoTemplate(scene.template) && !scene.visualBlueprint?.website_view;
  if (useTemplate) {
    const adapted = sceneToTemplateProps(scene, styleProfile);
    return <TemplateScene scene={adapted.scene} index={index} totalScenes={totalScenes} palette={adapted.palette} />;
  }
  return <DynamicScene scene={scene} index={index} totalScenes={totalScenes} styleProfile={styleProfile} />;
};
