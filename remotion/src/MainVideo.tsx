import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { SceneRenderer } from './components/SceneRenderer';
import { WordCaptions } from './components/WordCaptions';
import { SceneDataPayload } from './data/sceneTypes';
import { assetSource } from './assetSource';
import { sceneTimelineDuration } from './short-video/sceneAdapter';

const defaultTransitionFrames = 12;

const getTransitionPresentation = (scene: any, index: number, styleProfile?: any) => {
  const cue = `${scene.continuity_to_next || ''} ${scene.motion_cue || ''} ${styleProfile?.transition_language || ''}`.toLowerCase();
  if (/fade|dissolve|crossfade|soft/i.test(cue)) {
    return fade();
  }
  if (/wipe/i.test(cue)) {
    return wipe({ direction: /left/i.test(cue) ? 'from-right' : 'from-left' });
  }
  if (/flip/i.test(cue)) {
    return flip({ direction: 'from-right' });
  }
  if (/push|whip|pan|slide|up|down|top|bottom/i.test(cue)) {
    const direction = /up|top/i.test(cue) ? 'from-bottom' : /down|bottom/i.test(cue) ? 'from-top' : (index % 2 === 0 ? 'from-right' : 'from-left');
    return slide({ direction });
  }
  return slide({ direction: index % 2 === 0 ? 'from-right' : 'from-left' });
};

type TimedCue = {
  frame: number;
  src: string;
  volume?: number;
  durationFrames?: number;
  sourceId?: string;
  role?: string;
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
      return Math.max(amount, interpolate(distance, [-3, 0, 10], [0, 0.16, 0]));
    }, 0);
    return 1 - duck;
  };

  const sfxVolume = (cue: TimedCue) => {
    const roleGain: Record<string, number> = {
      pop: 0.42, click: 0.38, tick: 0.36, draw: 0.38, slide: 0.42,
      whoosh: 0.40, riser: 0.36, impact: 0.42, sparkle: 0.36,
      chime: 0.36, count: 0.34, ding: 0.36,
    };
    return Math.min(0.38, (cue.volume ?? 0.7) * (roleGain[cue.role || ''] ?? 0.38));
  };

  const voiceActive = (frame: number) => Boolean(audioUrl) || narrationTracks.some((track) => frame >= track.frame && frame < track.frame + track.durationFrames);

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
          presentation={getTransitionPresentation(scene, index, styleProfile) as any}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: styleProfile?.background || '#05070f' }}>
      {audioUrl && <Audio src={assetSource(audioUrl)} volume={narrationVolume} />}
      {/* Background audio loop: ducks 6-8 dB (-7 dB, multiplier 0.45) under spoken narration */}
      {backgroundAudioUrl && <Audio src={assetSource(backgroundAudioUrl)} volume={(frame) => 0.18 * (voiceActive(frame) ? 0.45 : 1) * narrationVolume(frame)} />}
      {narrationTracks.map((track, index) => (
        <Sequence key={`narration-${index}`} from={track.frame} durationInFrames={track.durationFrames}>
          <Audio src={assetSource(track.src)} volume={(localFrame) => 0.92 * narrationVolume(track.frame + localFrame)} />
        </Sequence>
      ))}
      {timedCues.map((cue, index) => (
        <Sequence key={`cue-${cue.sourceId || index}`} from={cue.frame} durationInFrames={Math.max(1, cue.durationFrames || 18)}>
          <Audio src={assetSource(cue.src)} volume={sfxVolume(cue)} />
        </Sequence>
      ))}
      <TransitionSeries>{transitionNodes}</TransitionSeries>
      <WordCaptions captions={captions} color={styleProfile?.primary} />
    </AbsoluteFill>
  );
};

export { sceneTimelineDuration };
