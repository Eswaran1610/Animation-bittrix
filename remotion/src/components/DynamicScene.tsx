import React from 'react';
import { SceneTemplate } from './SceneTemplate';
import { BlueprintVisual } from './BlueprintVisual';
import { WebsiteVisitVisual } from './WebsiteVisitVisual';
import { SceneData, StyleProfile } from '../data/sceneTypes';

export const DynamicScene: React.FC<{
  scene: SceneData;
  index: number;
  totalScenes: number;
  styleProfile?: StyleProfile;
}> = ({ scene, styleProfile }) => {
  const color = scene.themeColor || styleProfile?.primary || '#22d3ee';
  const title = scene.on_screen_text || scene.title || 'Dynamic Overview';
  const bullets = scene.key_takeaways?.length ? scene.key_takeaways.slice(0, 3) : undefined;
  const caption = scene.subtitle || scene.narration || '';
  const firstImageAsset = scene.image_assets ? Object.values(scene.image_assets)[0] : undefined;

  const visualContent = (() => {
    if (scene.visualBlueprint?.website_view) {
      return (
        <WebsiteVisitVisual
          view={scene.visualBlueprint.website_view}
          accent={color}
          imageAssets={scene.image_assets}
          styleProfile={styleProfile}
        />
      );
    }
    if (scene.visualBlueprint && scene.visualBlueprint.objects && scene.visualBlueprint.objects.length > 0) {
      return (
        <BlueprintVisual
          blueprint={scene.visualBlueprint}
          imageAssets={scene.image_assets}
          durationInFrames={scene.durationInFrames}
        />
      );
    }
    return undefined;
  })();

  return (
    <SceneTemplate
      title={title}
      bullets={bullets}
      screenshotUrl={firstImageAsset}
      caption={caption}
      accentColor={color}
    >
      {visualContent}
    </SceneTemplate>
  );
};
