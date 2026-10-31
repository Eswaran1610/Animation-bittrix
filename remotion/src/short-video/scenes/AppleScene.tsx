import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticWords } from '../components/KineticWords';
import { SceneFrame } from '../components/SceneFrame';

export const AppleScene: React.FC<{ accent: string; words: string[] }> = ({ accent, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 17, stiffness: 105 } });
  const orbit = interpolate(frame, [0, 130], [0, 360]);
  return (
    <SceneFrame accent={accent} eyebrow="01 / CRISP + BRIGHT">
      <div style={{ position: 'absolute', left: 130, top: 265, width: 820 }}>
        <KineticWords words={words} accent={accent} fontSize={96} />
        <div style={{ marginTop: 35, display: 'inline-flex', padding: '14px 22px', border: `2px solid ${accent}`, borderRadius: 999, color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: 2, opacity: reveal, transform: `translateX(${interpolate(reveal, [0, 1], [-30, 0])}px)` }}>SOLUBLE PECTIN INSIDE</div>
      </div>
      <div style={{ position: 'absolute', right: 180, top: 150, width: 520, height: 520, border: `2px solid ${accent}66`, borderRadius: '50%', transform: `rotate(${orbit}deg) scale(${0.86 + reveal * 0.14})`, opacity: reveal }}>
        <div style={{ position: 'absolute', top: -16, left: '50%', width: 32, height: 32, borderRadius: '50%', background: accent, boxShadow: `0 0 28px ${accent}` }} />
        <Img src={staticFile('assets/short-video/apple.svg')} width={460} height={460} style={{ position: 'absolute', top: 30, left: 30, objectFit: 'contain', transform: `rotate(${-orbit * 0.45}deg) scale(${1 + interpolate(frame, [0, 130], [0, 0.1])})` }} />
      </div>
    </SceneFrame>
  );
};
