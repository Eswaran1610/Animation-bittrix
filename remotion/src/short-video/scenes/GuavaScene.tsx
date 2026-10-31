import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticWords } from '../components/KineticWords';
import { SceneFrame } from '../components/SceneFrame';

export const GuavaScene: React.FC<{ accent: string; words: string[] }> = ({ accent, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 125 } });
  const spin = interpolate(frame, [0, 130], [-14, 12]);
  return (
    <SceneFrame accent={accent} eyebrow="03 / THE SURPRISE LEADER">
      <div style={{ position: 'absolute', left: 150, top: 265, width: 780 }}>
        <KineticWords words={words} accent={accent} fontSize={92} />
        <div style={{ marginTop: 34, color: '#ffd8e5', fontSize: 27, lineHeight: 1.35, opacity: reveal }}>Tropical flavor with a serious vitamin C punch.</div>
      </div>
      <div style={{ position: 'absolute', right: 155, top: 140, width: 570, height: 570, borderRadius: '50%', background: `radial-gradient(circle, ${accent}55, transparent 68%)`, opacity: reveal }}>
        <Img src={staticFile('assets/short-video/guava.svg')} width={540} height={540} style={{ objectFit: 'contain', transform: `rotate(${spin}deg) scale(${0.72 + reveal * 0.28})` }} />
        <div style={{ position: 'absolute', right: -40, bottom: 22, padding: '18px 26px', borderRadius: 20, background: '#180f1c', border: `2px solid ${accent}`, color: '#fff', boxShadow: `0 0 28px ${accent}66`, transform: `translateY(${interpolate(reveal, [0, 1], [40, 0])}px)` }}>
          <div style={{ fontSize: 102, lineHeight: 0.9, fontWeight: 900 }}>228</div><div style={{ marginTop: 8, fontSize: 22, color: accent, fontWeight: 900, letterSpacing: 2 }}>MG VITAMIN C</div>
        </div>
      </div>
    </SceneFrame>
  );
};
