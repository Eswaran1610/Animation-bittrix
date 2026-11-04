import React from 'react';
import { SceneTemplate } from './SceneTemplate';
import { BlueprintVisual } from './BlueprintVisual';
import { WebsiteVisitVisual } from './WebsiteVisitVisual';
import {
  OrbitalRings,
  NetworkNodes,
  MetricBar,
  DynamicDiagram,
  AssetImageCard,
} from './MotionElements';
import { SceneData, StyleBrief, StyleProfile } from '../data/sceneTypes';

export const DynamicScene: React.FC<{
  scene: SceneData;
  index: number;
  totalScenes: number;
  styleProfile?: StyleProfile;
  styleBrief?: StyleBrief;
}> = ({ scene, index, styleProfile, styleBrief }) => {
  const color = scene.themeColor || styleProfile?.primary || '#22d3ee';
  const title = scene.on_screen_text || scene.title || 'Dynamic Overview';
  const bullets = scene.key_takeaways?.length ? scene.key_takeaways.slice(0, 3) : undefined;
  const firstImageAsset = scene.image_assets ? Object.values(scene.image_assets)[0] : scene.image_url;

  const visualContent = (() => {
    // 1. Website tour
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

    // 2. 3D / vector blueprint
    if (scene.visualBlueprint && scene.visualBlueprint.objects && scene.visualBlueprint.objects.length > 0) {
      return (
        <BlueprintVisual
          blueprint={scene.visualBlueprint}
          imageAssets={scene.image_assets}
          durationInFrames={scene.durationInFrames}
          styleBrief={styleBrief}
        />
      );
    }

    // 3. Image asset with Ken Burns dynamic motion
    if (firstImageAsset) {
      return (
        <AssetImageCard
          imageUrl={firstImageAsset}
          color={color}
          label={title}
          motionVariant={index % 2 === 0 ? 'zoom-in' : 'pan-right'}
        />
      );
    }

    // 4. Metric bar
    if (scene.metric_data) {
      return (
        <MetricBar
          color={color}
          label={scene.metric_data.label || 'KEY METRIC'}
          value={scene.metric_data.value}
          unit={scene.metric_data.unit || '%'}
        />
      );
    }

    // 5. Network nodes
    if (scene.concept_nodes && scene.concept_nodes.length > 0) {
      return <NetworkNodes color={color} nodes={scene.concept_nodes} />;
    }

    // 6. Orbital rings
    if (scene.visualType === 'orbital' || index % 3 === 1) {
      return <OrbitalRings color={color} />;
    }

    // 7. Dynamic technical diagram
    return <DynamicDiagram color={color} title={title} />;
  })();

  return (
    <SceneTemplate
      title={title}
      bullets={bullets}
      accentColor={color}
      styleBrief={styleBrief}
    >
      {visualContent}
    </SceneTemplate>
  );
};
