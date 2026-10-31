import { ShortVideoProps } from './shortVideoProps';
import { shortVideoTransitionFrames } from './designTokens';

export const getShortVideoDurationInFrames = (scenes: ShortVideoProps['scenes']) =>
  scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0) -
  Math.max(0, scenes.length - 1) * shortVideoTransitionFrames;

export const collectShortVideoQaIssues = (props: ShortVideoProps): string[] => {
  const issues: string[] = [];
  if (props.width !== 1080 || props.height !== 1920) issues.push('Short videos must use the 1080x1920 vertical canvas.');
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
