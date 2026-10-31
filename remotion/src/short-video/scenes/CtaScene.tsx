import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticWords } from '../components/KineticWords';
import { SceneFrame } from '../components/SceneFrame';

export const CtaScene: React.FC<{ accent: string; words: string[] }> = ({ accent, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 18, stiffness: 105 } });
  return (
    <SceneFrame accent={accent} eyebrow="YOUR SNACK BOWL / YOUR CALL">
      <div style={{ position: 'absolute', top: 205, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}><KineticWords words={words} accent={accent} fontSize={96} /></div>
      <div style={{ position: 'absolute', top: 410, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 34, alignItems: 'center' }}>
        {['apple.svg', 'orange.svg', 'guava.svg'].map((asset, index) => {
          const pop = spring({ frame: frame - 18 - index * 8, fps, config: { damping: 13, stiffness: 120 } });
          return <Img key={asset} src={staticFile(`assets/short-video/${asset}`)} width={180} height={180} style={{ objectFit: 'contain', opacity: pop, transform: `translateY(${interpolate(pop, [0, 1], [80, 0])}px) rotate(${(index - 1) * 9}deg) scale(${0.75 + pop * 0.25})` }} />;
        })}
      </div>
      <div style={{ position: 'absolute', top: 710, left: 0, right: 0, textAlign: 'center', color: '#b8c7d9', fontSize: 28, letterSpacing: 2, opacity: reveal }}>Save this trio. Try the comparison.</div>
    </SceneFrame>
  );
};
