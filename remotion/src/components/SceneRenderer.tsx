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
  // Website tours need their browser viewport renderer. Every other scene is
  // forced through one of the 15 reusable templates; unknown/missing templates
  // use the safe hero-object template instead of the legacy flat layout.
  if (scene.visualBlueprint?.website_view) {
    return <DynamicScene scene={scene} index={index} totalScenes={totalScenes} styleProfile={styleProfile} />;
  }
  if (isKnownShortVideoTemplate(scene.template)) {
    const adapted = sceneToTemplateProps(scene, styleProfile);
    return <TemplateScene scene={adapted.scene} index={index} totalScenes={totalScenes} palette={adapted.palette} />;
  }
  const adapted = sceneToTemplateProps({ ...scene, template: 'hero-object' }, styleProfile);
  return <TemplateScene scene={adapted.scene} index={index} totalScenes={totalScenes} palette={adapted.palette} />;
};
