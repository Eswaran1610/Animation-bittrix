import { ShortVideoProps } from './shortVideoProps';
import { shortVideoTransitionFrames } from './designTokens';
import { SceneDataPayload } from '../data/sceneTypes';
import { sceneTimelineDuration } from './sceneAdapter';

export const getShortVideoDurationInFrames = (scenes: ShortVideoProps['scenes']) =>
  scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0) -
  Math.max(0, scenes.length - 1) * shortVideoTransitionFrames;

export const collectShortVideoQaIssues = (props: ShortVideoProps): string[] => {
  const issues: string[] = [];
  if (props.width !== 1080 || props.height !== 1920) issues.push('Short videos must use the 1080x1920 vertical canvas.');
  const durationSeconds = getShortVideoDurationInFrames(props.scenes) / props.fps;
  if (props.scenes.length < 7 || props.scenes.length > 9) issues.push('Short videos should contain 7-9 scenes.');
  if (durationSeconds < 25 || durationSeconds > 40) issues.push(`Short video duration is ${durationSeconds.toFixed(2)}s; target is 25-40s.`);
  props.scenes.forEach((scene, index) => {
    if (scene.durationInFrames < 75 || scene.durationInFrames > 150) issues.push(`Scene ${index + 1} must be 2.5-5 seconds.`);
  });
  for (let index = 2; index < props.scenes.length; index += 1) {
    if (props.scenes[index].template === props.scenes[index - 1].template && props.scenes[index].template === props.scenes[index - 2].template) {
      issues.push(`Template ${props.scenes[index].template} is repeated more than twice in a row.`);
    }
  }
  if (!['question-hook', 'hero-object'].includes(props.scenes[0]?.template)) issues.push('The first scene must be a hook.');
  if (props.scenes.at(-1)?.template !== 'cta-outro') issues.push('The final scene must be a CTA outro.');
  if (props.durationInFrames !== getShortVideoDurationInFrames(props.scenes)) issues.push('Composition duration does not account for transition overlap.');
  return issues;
};

export const collectMainCompositionQaIssues = (props: SceneDataPayload): string[] => {
  const issues: string[] = [];
  if (props.video.width !== 1080 || props.video.height !== 1920) issues.push('MainComposition must use the 1080x1920 vertical canvas.');
  if (props.video.fps !== 30) issues.push('MainComposition must use 30fps.');
  if (!props.scenes.length) issues.push('MainComposition must contain at least one scene.');
  const durationSeconds = sceneTimelineDuration(props.scenes) / props.video.fps;
  if (props.scenes.length < 7 || props.scenes.length > 9) issues.push(`MainComposition has ${props.scenes.length} scenes; the target is 7-9.`);
  if (durationSeconds < 25 || durationSeconds > 40) issues.push(`MainComposition duration is ${durationSeconds.toFixed(2)}s; the short-video target is 25-40s.`);
  const first = props.scenes[0];
  const last = props.scenes.at(-1);
  if (first && first.role !== 'hook' && !['question-hook', 'hero-object'].includes(first.template || '')) issues.push('MainComposition must open with a hook.');
  if (last && last.role !== 'cta' && last.template !== 'cta-outro') issues.push('MainComposition must end with a CTA.');
  const themeColors = new Set(props.scenes.map((scene) => scene.themeColor.toLowerCase()));
  if (themeColors.size > 2) issues.push('MainComposition uses more than two scene accent colors.');
  props.scenes.forEach((scene, index) => {
    if (scene.durationInFrames < 75 || scene.durationInFrames > 150) issues.push(`Scene ${index + 1} is outside the 2.5-5 second visual range.`);
    if (scene.on_screen_text.trim().split(/\s+/).filter(Boolean).length > 6 || scene.on_screen_text.trim().length > 40) issues.push(`Scene ${index + 1} headline is too long.`);
    if (index < props.scenes.length - 1 && ((scene.transitionOutFrames || 12) < 8 || (scene.transitionOutFrames || 12) > 15)) issues.push(`Scene ${index + 1} has an invalid transition length.`);
  });
  for (let index = 2; index < props.scenes.length; index += 1) {
    if (props.scenes[index].template && props.scenes[index].template === props.scenes[index - 1].template && props.scenes[index].template === props.scenes[index - 2].template) issues.push(`Template ${props.scenes[index].template} repeats three times.`);
  }
  return issues;
};
