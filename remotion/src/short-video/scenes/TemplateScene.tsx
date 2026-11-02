import React from 'react';
import { SceneTemplate } from '../../components/SceneTemplate';
import { BlueprintVisual } from '../../components/BlueprintVisual';
import { ShortVideoScene } from '../shortVideoProps';
import { shortVideoPalettes, ShortVideoPalette } from '../designTokens';
import { VisualBlueprint } from '../../data/sceneTypes';

/**
 * Playbook-compliant TemplateScene:
 * Strictly bound to the 4-zone layout (Title, Bullets, Media Frame, Captions)
 * ensuring zero overlap and responsive text fitting.
 */
export const TemplateScene: React.FC<{
  scene: ShortVideoScene;
  index: number;
  totalScenes: number;
  palette: ShortVideoPalette;
  visualBlueprint?: VisualBlueprint;
  imageAssets?: Record<string, string>;
}> = ({ scene, palette, visualBlueprint, imageAssets }) => {
  const colors = shortVideoPalettes[palette] || shortVideoPalettes.cool;
  const color = scene.accent || colors.accent || '#22d3ee';

  const title = (scene as any).title || (Array.isArray(scene.words) ? scene.words.join(' ') : 'Motion Overview');
  const bullets = scene.items?.length
    ? scene.items.slice(0, 3)
    : scene.subtitle
    ? [scene.subtitle]
    : undefined;

  const caption = scene.subtitle || scene.detail || '';
  const screenshotUrl = imageAssets && Object.values(imageAssets).length > 0
    ? Object.values(imageAssets)[0]
    : undefined;

  // Narration-aware bullet timing if narration duration is provided
  const bulletTimings = scene.narrationDurationSec && bullets?.length
    ? bullets.map((_, i) => 0.6 + i * (scene.narrationDurationSec! / (bullets.length + 0.5)))
    : undefined;

  const hasBlueprint = Boolean(visualBlueprint?.objects && visualBlueprint.objects.length > 0);

  return (
    <SceneTemplate
      title={title}
      bullets={bullets}
      screenshotUrl={screenshotUrl}
      caption={caption}
      bulletTimings={bulletTimings}
      accentColor={color}
    >
      {hasBlueprint && visualBlueprint && (
        <BlueprintVisual
          blueprint={visualBlueprint}
          imageAssets={imageAssets}
          durationInFrames={scene.durationInFrames}
        />
      )}
    </SceneTemplate>
  );
};
