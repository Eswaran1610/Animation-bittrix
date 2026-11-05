import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { TransitionSeries } from '@remotion/transitions';
import type { TransitionTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { SceneRenderer } from './components/SceneRenderer';
import { WordCaptions } from './components/WordCaptions';
import { SceneDataPayload, StyleBrief } from './data/sceneTypes';
import { assetSource } from './assetSource';
import { sceneTimelineDuration } from './short-video/sceneAdapter';

const defaultTransitionFrames = 12;

const continuousFadeTiming = (durationInFrames: number): TransitionTiming => ({
  getDurationInFrames: () => durationInFrames,
  getProgress: ({ frame }) => {
    const progress = Math.max(0, Math.min(1, frame / durationInFrames));
    // Smooth cubic ease-in-out for continuous cross-dissolve
    return progress * progress * (3 - 2 * progress);
  },
});

const getTransitionPresentation = () => {
  return fade({ shouldFadeOutExitingScene: true });
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
        <SceneRenderer scene={scene} index={index} totalScenes={scenes.length} styleProfile={styleProfile} styleBrief={styleBrief} globalFrame={frame} />
      </TransitionSeries.Sequence>,
    );
    if (index < scenes.length - 1) {
      transitionNodes.push(
        <TransitionSeries.Transition
          key={`transition-${scene.id || index}`}
          timing={continuousFadeTiming(scene.transitionOutFrames || defaultTransitionFrames)}
          presentation={getTransitionPresentation()}
        />,
      );
    }
  });

  const accentColor = styleBrief?.palette.accent || styleProfile?.secondary || '#38bdf8';
  const primaryColor = styleBrief?.palette.primary || styleProfile?.primary || '#22d3ee';
  const bgColor = styleBrief?.palette.bg || styleProfile?.background || '#05070f';

  // Global ambient persistent background that NEVER breaks or wipes across the full video
  const stageBackground = styleBrief?.background === 'halftone'
    ? `radial-gradient(${accentColor}33 1px, transparent 1px), ${bgColor}`
    : styleBrief?.background === 'gradient-flow'
      ? `radial-gradient(circle at ${35 + Math.sin(frame * 0.012) * 18}% ${25 + Math.cos(frame * 0.009) * 12}%, ${accentColor}44, transparent 55%), ${bgColor}`
      : styleBrief?.background === 'lines'
        ? `repeating-linear-gradient(115deg, ${accentColor}15 0 2px, transparent 2px 30px), ${bgColor}`
        : `radial-gradient(1000px 800px at 25% 10%, ${accentColor}38 0, ${bgColor} 72%)`;

  const gridPosition = `${(frame * 0.8) % 72}px ${(frame * 0.5) % 72}px`;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* 1. Global continuous ambient background */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: stageBackground,
          backgroundSize: styleBrief?.background === 'halftone' ? '22px 22px' : undefined,
          pointerEvents: 'none',
        }}
      />

      {/* 2. Global continuous ambient grid */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${primaryColor}18 1px, transparent 1px), linear-gradient(90deg, ${primaryColor}18 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
          backgroundPosition: gridPosition,
          opacity: 0.35,
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, black 40%, transparent 95%)',
          pointerEvents: 'none',
        }}
      />

      {/* 3. Global subtle floating particles across the entire continuous video */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: 14 }, (_, i) => {
          const x = ((i * 61) % 90 + 5 + Math.sin(frame * 0.01 + i) * 6);
          const y = ((i * 47) % 88 + 6 + Math.cos(frame * 0.012 + i) * 5);
          const size = 3 + (i % 3);
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: i % 2 === 0 ? primaryColor : accentColor,
                opacity: 0.16 + (i % 4) * 0.08,
                boxShadow: `0 0 12px ${accentColor}`,
              }}
            />
          );
        })}
      </div>

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
      <WordCaptions
        captions={captions}
        color={styleProfile?.primary}
        emphasisWords={scenes.flatMap((s) => s.emphasis_words || [])}
      />
    </AbsoluteFill>
  );
};

export { sceneTimelineDuration };
