import { SceneData, StyleProfile } from '../data/sceneTypes';
import { ShortVideoPalette, shortVideoPalettes } from './designTokens';
import { SHORT_VIDEO_TEMPLATES } from './templates';
import { ShortVideoScene } from './shortVideoProps';

const paletteForFamily: Record<StyleProfile['family'], ShortVideoPalette> = {
  'cinematic-neon': 'neon',
  'editorial-paper': 'earth',
  'playful-pop': 'warm',
  'technical-terminal': 'dark',
  'documentary-grid': 'cool',
};

export const isKnownShortVideoTemplate = (template?: string): template is typeof SHORT_VIDEO_TEMPLATES[number] =>
  Boolean(template && (SHORT_VIDEO_TEMPLATES as readonly string[]).includes(template));

export const sceneTimelineDuration = (scenes: SceneData[]) =>
  scenes.reduce((total, scene, index) => total + scene.durationInFrames - (index < scenes.length - 1 ? scene.transitionOutFrames || 12 : 0), 0);

const iconForObject = (scene: SceneData) => {
  const object = scene.visualBlueprint?.objects?.[0];
  if (!object) return '✦';
  if (object.render_spec.type === 'image') return '◉';
  if (object.render_spec.type === '3d') return '◈';
  if (object.render_spec.type === 'text') return 'Aa';
  return '✦';
};

export const sceneToTemplateProps = (scene: SceneData, styleProfile?: StyleProfile): { scene: ShortVideoScene; palette: ShortVideoPalette } => {
  const items = scene.key_takeaways?.length
    ? scene.key_takeaways.slice(0, 6)
    : (scene.concept_nodes || []).map((node) => node.label).slice(0, 6);
  const labels = (scene.concept_nodes || []).map((node) => node.label).slice(0, 2);
  const metric = scene.metric_data
    ? { value: `${scene.metric_data.value}${scene.metric_data.unit || ''}`, label: scene.metric_data.label }
    : undefined;
  const values = scene.metric_data ? [Math.max(1, Math.min(100, scene.metric_data.value))] : undefined;
  const words = scene.on_screen_text.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  const palette = styleProfile ? paletteForFamily[styleProfile.family] : 'cool';

  return {
    palette,
    scene: {
      id: scene.id,
      durationInFrames: scene.durationInFrames,
      accent: scene.themeColor || shortVideoPalettes[palette].accent,
      template: scene.template as ShortVideoScene['template'],
      words: words.length ? words : ['THE', 'IDEA'],
      subtitle: scene.subtitle,
      detail: scene.visual_direction,
      items: items.length ? items : undefined,
      labels: labels.length ? labels : undefined,
      icons: scene.visualBlueprint?.objects?.slice(0, 6).map(() => iconForObject(scene)),
      values,
      metric,
      quote: scene.subtitle,
      attribution: scene.title,
      fact: scene.subtitle,
      icon: iconForObject(scene),
      label: scene.title,
      cta: scene.on_screen_text,
      narrationDurationSec: scene.narrationDurationSec,
    },
  };
};
