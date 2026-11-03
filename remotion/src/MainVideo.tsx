import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { SceneRenderer } from './components/SceneRenderer';
import { WordCaptions } from './components/WordCaptions';
import { SceneDataPayload, StyleBrief } from './data/sceneTypes';
import { assetSource } from './assetSource';
import { sceneTimelineDuration } from './short-video/sceneAdapter';

const defaultTransitionFrames = 12;

const getTransitionPresentation = (scene: any, index: number, styleProfile?: any, styleBrief?: StyleBrief) => {
  const preferred = styleBrief?.transitionSet?.[index % Math.max(1, styleBrief.transitionSet.length)];
  if (preferred === 'fade') return fade();
  if (preferred === 'wipe') return wipe({ direction: index % 2 ? 'from-left' : 'from-right' });
  if (preferred === 'flip') return flip({ direction: index % 2 ? 'from-left' : 'from-right' });
  if (preferred === 'push' || preferred === 'whip' || preferred === 'slide') return slide({ direction: index % 2 === 0 ? 'from-right' : 'from-left' });
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
  const frame = useCurrentFrame();
  const { scenes } = sceneData;
  const { audioUrl, backgroundAudioUrl, captions, styleProfile, styleBrief } = sceneData.video;
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
        <SceneRenderer scene={scene} index={index} totalScenes={scenes.length} styleProfile={styleProfile} styleBrief={styleBrief} />
      </TransitionSeries.Sequence>,
    );
    if (index < scenes.length - 1) {
      transitionNodes.push(
        <TransitionSeries.Transition
          key={`transition-${scene.id || index}`}
          timing={linearTiming({ durationInFrames: scene.transitionOutFrames || defaultTransitionFrames })}
          presentation={getTransitionPresentation(scene, index, styleProfile, styleBrief) as any}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: styleBrief?.palette.bg || styleProfile?.background || '#05070f' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          zIndex: 2,
          left: `${interpolate(frame, [0, Math.max(1, sceneOffset)], [8, 82], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%`,
          top: '48%',
          width: 34,
          height: 34,
          border: `2px solid ${styleBrief?.palette.accent || styleProfile?.secondary || '#38bdf8'}`,
          borderRadius: styleBrief?.archetype === 'neo-brutalist' ? 0 : '50%',
          opacity: 0.26,
          transform: `translate(-50%, -50%) rotate(${frame * 1.6}deg)`,
          pointerEvents: 'none',
        }}
      />
      {audioUrl ? (
        /* Unified 1-file master audio track (narration + sounds/sfx + background bed) */
        <Audio src={assetSource(audioUrl)} />
      ) : (
        /* Multi-track fallback when master audio is not yet generated */
        <>
          {backgroundAudioUrl && <Audio src={assetSource(backgroundAudioUrl)} volume={(frame) => 0.8 * (voiceActive(frame) ? 0.5 : 1) * narrationVolume(frame)} />}
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
        </>
      )}
      <TransitionSeries>{transitionNodes}</TransitionSeries>
      <WordCaptions captions={captions} color={styleProfile?.primary} />
    </AbsoluteFill>
  );
};

export { sceneTimelineDuration };
