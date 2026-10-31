import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticWords } from '../components/KineticWords';
import { SceneFrame } from '../components/SceneFrame';

export const HookScene: React.FC<{ accent: string; words: string[] }> = ({ accent, words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SceneFrame accent={accent} eyebrow="THE NUTRITION SHOWDOWN">
      <div style={{ position: 'absolute', left: 120, top: 275, width: 930 }}>
        <KineticWords words={words} accent={accent} />
        <div style={{ marginTop: 34, color: '#b8c7d9', fontSize: 28, letterSpacing: 2, opacity: spring({ frame: frame - 18, fps, config: { damping: 18 } }) }}>
          One quick visual comparison.
        </div>
      </div>
      <div style={{ position: 'absolute', right: 140, top: 230, display: 'flex', gap: 22, alignItems: 'flex-end' }}>
        {['apple.svg', 'orange.svg', 'guava.svg'].map((asset, index) => {
          const pop = spring({ frame: frame - index * 8, fps, config: { damping: 13, stiffness: 130 } });
          return <Img key={asset} src={staticFile(`assets/short-video/${asset}`)} width={230} height={230} style={{ objectFit: 'contain', opacity: pop, transform: `translateY(${interpolate(pop, [0, 1], [100, 0])}px) rotate(${(index - 1) * 10 * pop}deg) scale(${0.75 + pop * 0.25})` }} />;
        })}
      </div>
    </SceneFrame>
  );
};
