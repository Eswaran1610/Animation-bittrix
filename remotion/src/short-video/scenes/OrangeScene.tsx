import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticWords } from '../components/KineticWords';
import { SceneFrame } from '../components/SceneFrame';

export const OrangeScene: React.FC<{ accent: string; words: string[] }> = ({ accent, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stat = spring({ frame: frame - 24, fps, config: { damping: 15, stiffness: 100 } });
  const photoX = interpolate(frame, [0, 130], [35, -55]);
  const photoScale = interpolate(frame, [0, 130], [1.04, 1.16]);
  return (
    <SceneFrame accent={accent} eyebrow="02 / CITRUS SIGNAL">
      <div style={{ position: 'absolute', left: 110, top: 190, width: 1020, height: 690, overflow: 'hidden', borderRadius: 32, border: `3px solid ${accent}99`, boxShadow: `0 30px 80px ${accent}22` }}>
        <Img src={staticFile('assets/3311b5df-aac8-4499-9e72-0098f32f146c_scene_302.jpg')} width={1000} height={680} style={{ objectFit: 'cover', transform: `translateX(${photoX}px) scale(${photoScale})` }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${accent}aa, transparent 65%)` }} />
      </div>
      <div style={{ position: 'absolute', right: 120, top: 300, width: 650 }}>
        <KineticWords words={words} accent={accent} fontSize={86} />
        <div style={{ marginTop: 38, display: 'flex', alignItems: 'baseline', gap: 16, color: '#fff', opacity: stat, transform: `translateY(${interpolate(stat, [0, 1], [50, 0])}px)` }}>
          <span style={{ fontSize: 112, fontWeight: 900 }}>53</span><span style={{ fontSize: 30, fontWeight: 800, color: accent }}>MG VITAMIN C</span>
        </div>
      </div>
    </SceneFrame>
  );
};
