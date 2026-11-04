import React from 'react';
import { SceneTemplate } from '../../components/SceneTemplate';
import { BlueprintVisual } from '../../components/BlueprintVisual';
import {
  OrbitalRings,
  NetworkNodes,
  MetricBar,
  DynamicDiagram,
  AssetImageCard,
} from '../../components/MotionElements';
import { ShortVideoScene } from '../shortVideoProps';
import { shortVideoPalettes, ShortVideoPalette } from '../designTokens';
import { StyleBrief, VisualBlueprint } from '../../data/sceneTypes';

/**
 * Procedural TemplateScene:
 * Dynamically pairs each scene with procedural motion graphics:
 * - 3D Blueprints
 * - Ken Burns animated images with spring entrance & dynamic pan/zoom
 * - Dynamic counting MetricBar for stats / charts
 * - Animated NetworkNodes with pulsing circuits for timelines / processes
 * - 3D OrbitalRings for concept / hero objects
 * - Laser path draw-on DynamicDiagram for questions / blueprints
 */
export const TemplateScene: React.FC<{
  scene: ShortVideoScene;
  index: number;
  totalScenes: number;
  palette: ShortVideoPalette;
  visualBlueprint?: VisualBlueprint;
  imageAssets?: Record<string, string>;
  styleBrief?: StyleBrief;
}> = ({ scene, index, palette, visualBlueprint, imageAssets, styleBrief }) => {
  const colors = shortVideoPalettes[palette] || shortVideoPalettes.cool;
  const color = scene.accent || colors.accent || '#22d3ee';

  const title = (scene as any).title || (Array.isArray(scene.words) ? scene.words.join(' ') : 'Motion Overview');
  const bullets = scene.items?.length
    ? scene.items.slice(0, 3)
    : scene.subtitle
    ? [scene.subtitle]
    : undefined;

  const rawImage = imageAssets && Object.values(imageAssets).length > 0
    ? Object.values(imageAssets)[0]
    : (scene as any).image_url;

  // Narration-aware bullet timing if narration duration is provided
  const bulletTimings = scene.narrationDurationSec && bullets?.length
    ? bullets.map((_, i) => 0.6 + i * (scene.narrationDurationSec! / (bullets.length + 0.5)))
    : undefined;

  const hasBlueprint = Boolean(visualBlueprint?.objects && visualBlueprint.objects.length > 0);

  const visualContent = (() => {
    // 1. High priority: custom 3D / vector blueprint
    if (hasBlueprint && visualBlueprint) {
      return (
        <BlueprintVisual
          blueprint={visualBlueprint}
          imageAssets={imageAssets}
          durationInFrames={scene.durationInFrames}
          styleBrief={styleBrief}
        />
      );
    }

    // 2. High priority: Image asset with Ken Burns pan + zoom
    if (rawImage) {
      return (
        <AssetImageCard
          imageUrl={rawImage}
          color={color}
          label={title}
          motionVariant={index % 2 === 0 ? 'zoom-in' : 'zoom-out'}
        />
      );
    }

    // 3. Quantitative Metric Bar (stats, callouts, kpis)
    const metricData = (scene as any).metric_data || scene.metric;
    if (
      scene.template === 'stat-callout' ||
      scene.template === 'chart-bar' ||
      Boolean(metricData)
    ) {
      const parsedVal = scene.metric?.value ? parseInt(scene.metric.value, 10) : metricData?.value ?? 92;
      return (
        <MetricBar
          color={color}
          label={scene.metric?.label || metricData?.label || 'KEY METRIC'}
          value={isNaN(parsedVal) ? 92 : parsedVal}
          unit={scene.metric?.value?.includes('%') ? '%' : metricData?.unit || '%'}
        />
      );
    }

    // 4. Dynamic Network Nodes (timeline, process steps, concepts)
    const conceptNodes = (scene as any).concept_nodes;
    if (
      scene.template === 'timeline' ||
      scene.template === 'steps-numbered' ||
      scene.template === 'icon-grid' ||
      (Array.isArray(conceptNodes) && conceptNodes.length > 0)
    ) {
      return (
        <NetworkNodes
          color={color}
          nodes={conceptNodes || (scene.items ? scene.items.map((it: string) => ({ label: it })) : undefined)}
        />
      );
    }

    // 5. 3D Orbital Rings (hero objects, product showcase, planetary/atomic models)
    if (
      scene.template === 'hero-object' ||
      scene.template === 'product-showcase' ||
      index % 3 === 1
    ) {
      return <OrbitalRings color={color} />;
    }

    // 6. Technical Vector Diagram with Laser Draw-on (question hook, fact card, blueprint)
    return <DynamicDiagram color={color} title={title} />;
  })();

  return (
    <SceneTemplate
      title={title}
      bullets={bullets}
      bulletTimings={bulletTimings}
      accentColor={color}
      styleBrief={styleBrief}
    >
      {visualContent}
    </SceneTemplate>
  );
};
