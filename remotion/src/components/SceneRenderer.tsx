import React from 'react';
import { DynamicScene } from './DynamicScene';
import { SceneData, StyleBrief, StyleProfile } from '../data/sceneTypes';
import { TemplateScene } from '../short-video/scenes/TemplateScene';
import { isKnownShortVideoTemplate, sceneToTemplateProps } from '../short-video/sceneAdapter';

export const SceneRenderer: React.FC<{
  scene: SceneData;
  index: number;
  totalScenes: number;
  styleProfile?: StyleProfile;
  styleBrief?: StyleBrief;
}> = ({ scene, index, totalScenes, styleProfile, styleBrief }) => {
  // Website tours need their browser viewport renderer. Every other scene uses
  // the template selected by Codex from that scene's content. Unknown/missing
  // templates use the safe hero-object renderer as a defensive fallback.
  if (scene.visualBlueprint?.website_view) {
    return <DynamicScene scene={scene} index={index} totalScenes={totalScenes} styleProfile={styleProfile} styleBrief={styleBrief} />;
  }
  if (isKnownShortVideoTemplate(scene.template)) {
    const adapted = sceneToTemplateProps(scene, styleProfile);
    return <TemplateScene scene={adapted.scene} index={index} totalScenes={totalScenes} palette={adapted.palette} visualBlueprint={scene.visualBlueprint} imageAssets={scene.image_assets} styleBrief={styleBrief} />;
  }
  const adapted = sceneToTemplateProps({ ...scene, template: 'hero-object' }, styleProfile);
  return <TemplateScene scene={adapted.scene} index={index} totalScenes={totalScenes} palette={adapted.palette} visualBlueprint={scene.visualBlueprint} imageAssets={scene.image_assets} styleBrief={styleBrief} />;
};
