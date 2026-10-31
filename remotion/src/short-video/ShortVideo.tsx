import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { ShortVideoProps } from './shortVideoProps';
import { PreloadAssets } from './components/PreloadAssets';
import { TemplateScene } from './scenes/TemplateScene';
import { shortVideoTransitionFrames } from './designTokens';

const transitionTiming = linearTiming({ durationInFrames: shortVideoTransitionFrames });

export const ShortVideo: React.FC<ShortVideoProps> = (props) => {
  const frame = useCurrentFrame();
  const musicVolume = (currentFrame: number) => {
    const fadeIn = Math.min(1, currentFrame / 24);
    const fadeOut = Math.min(1, (props.durationInFrames - currentFrame) / 36);
    return 0.12 * Math.min(fadeIn, fadeOut);
  };
  const transitionNodes: React.ReactNode[] = [];
  props.scenes.forEach((scene, index) => {
    transitionNodes.push(<TransitionSeries.Sequence key={`scene-${scene.id}`} durationInFrames={scene.durationInFrames}><TemplateScene scene={scene} index={index} totalScenes={props.scenes.length} palette={props.palette} /></TransitionSeries.Sequence>);
    if (index < props.scenes.length - 1) transitionNodes.push(<TransitionSeries.Transition key={`transition-${scene.id}`} timing={transitionTiming} presentation={slide({ direction: index % 2 === 0 ? 'from-right' : 'from-left' })} />);
  });
  const whooshFrames = props.scenes.slice(0, -1).reduce<number[]>((frames, scene, index) => {
    frames.push((frames[index - 1] || 0) + scene.durationInFrames - shortVideoTransitionFrames);
    return frames;
  }, []);

  return <AbsoluteFill>
    <PreloadAssets assets={[props.music, props.whoosh, props.narration]} />
    <Audio src={staticFile(props.music)} volume={musicVolume} />
    <Audio src={staticFile(props.narration)} volume={0.92} />
    <TransitionSeries>{transitionNodes}</TransitionSeries>
    {whooshFrames.map((cutFrame) => <Sequence key={cutFrame} from={cutFrame} durationInFrames={18}><Audio src={staticFile(props.whoosh)} volume={0.55} /></Sequence>)}
    <div style={{ position: 'absolute', right: 120, bottom: 230, color: '#ffffff99', fontSize: 18, letterSpacing: 3, opacity: frame > props.durationInFrames - 60 ? 1 : 0 }}>BITTRIX / AGY</div>
  </AbsoluteFill>;
};
