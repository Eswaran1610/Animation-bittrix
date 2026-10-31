import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { SceneRenderer } from './components/SceneRenderer';
import { WordCaptions } from './components/WordCaptions';
import { SceneDataPayload } from './data/sceneTypes';
import { assetSource } from './assetSource';
import { sceneTimelineDuration } from './short-video/sceneAdapter';

const defaultTransitionFrames = 12;

type TimedCue = {
  frame: number;
  src: string;
  volume?: number;
  durationFrames?: number;
  sourceId?: string;
};

export const MainVideo: React.FC<{ sceneData: SceneDataPayload }> = ({ sceneData }) => {
  const { scenes } = sceneData;
  const { audioUrl, backgroundAudioUrl, captions, styleProfile } = sceneData.video;
  const timedCues: TimedCue[] = [];
  const narrationTracks: Array<{ frame: number; src: string; durationFrames: number }> = [];
  let sceneOffset = 0;

  scenes.forEach((scene, index) => {
    if (scene.narrationAudio) {
      narrationTracks.push({ frame: sceneOffset, src: scene.narrationAudio, durationFrames: scene.durationInFrames });
    }
    (scene.audioCues || []).forEach((cue) => timedCues.push({ ...cue, frame: sceneOffset + cue.frame }));
    sceneOffset += scene.durationInFrames - (
      index < scenes.length - 1 ? scene.transitionOutFrames || defaultTransitionFrames : 0
    );
  });

  const narrationVolume = (frame: number) => {
    const duck = timedCues.reduce((amount, cue) => {
      const distance = frame - cue.frame;
      if (distance < -3 || distance > 10) return amount;
      return Math.max(amount, interpolate(distance, [-3, 0, 10], [0, 0.34, 0]));
    }, 0);
    return 1 - duck;
  };

  const transitionNodes: React.ReactNode[] = [];
  scenes.forEach((scene, index) => {
    transitionNodes.push(
      <TransitionSeries.Sequence key={`scene-${scene.id || index}`} durationInFrames={scene.durationInFrames}>
        <SceneRenderer scene={scene} index={index} totalScenes={scenes.length} styleProfile={styleProfile} />
      </TransitionSeries.Sequence>,
    );
    if (index < scenes.length - 1) {
      transitionNodes.push(
        <TransitionSeries.Transition
          key={`transition-${scene.id || index}`}
          timing={linearTiming({ durationInFrames: scene.transitionOutFrames || defaultTransitionFrames })}
          presentation={fade()}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: styleProfile?.background || '#05070f' }}>
      {audioUrl && <Audio src={assetSource(audioUrl)} volume={narrationVolume} />}
      {backgroundAudioUrl && <Audio src={assetSource(backgroundAudioUrl)} volume={(frame) => 0.18 * narrationVolume(frame)} />}
      {narrationTracks.map((track, index) => (
        <Sequence key={`narration-${index}`} from={track.frame} durationInFrames={track.durationFrames}>
          <Audio src={assetSource(track.src)} volume={0.92} />
        </Sequence>
      ))}
      {timedCues.map((cue, index) => (
        <Sequence key={`cue-${cue.sourceId || index}`} from={cue.frame} durationInFrames={Math.max(1, cue.durationFrames || 18)}>
          <Audio src={assetSource(cue.src)} volume={cue.volume ?? 0.7} />
        </Sequence>
      ))}
      <TransitionSeries>{transitionNodes}</TransitionSeries>
      <WordCaptions captions={captions} color={styleProfile?.primary} />
    </AbsoluteFill>
  );
};

export { sceneTimelineDuration };
