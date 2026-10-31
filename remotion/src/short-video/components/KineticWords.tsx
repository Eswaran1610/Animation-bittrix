import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { shortVideoMotion, shortVideoType } from '../designTokens';
import { shortVideoFont } from '../theme';

export const KineticWords: React.FC<{
  words: string[];
  accent: string;
  fontSize?: number;
}> = ({ words, accent, fontSize = shortVideoType.headline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'baseline' }}>
      {words.map((word, index) => {
        const reveal = spring({ frame: frame - index * 7, fps, config: shortVideoMotion.pop });
        const y = interpolate(reveal, [0, 1], [70, 0]);
        return (
          <span
            key={`${word}-${index}`}
            style={{
              color: index % 2 === 0 ? '#f8fafc' : accent,
              fontFamily: shortVideoFont,
              fontSize,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 0.92,
              opacity: reveal,
              transform: `translateY(${y}px) scale(${0.86 + reveal * 0.14})`,
              textShadow: `0 18px 48px ${accent}55`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
