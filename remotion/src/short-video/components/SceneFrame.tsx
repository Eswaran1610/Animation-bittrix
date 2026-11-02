import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { shortVideoPalettes, ShortVideoPalette } from '../designTokens';
import { shortVideoFont } from '../theme';

export const SceneFrame: React.FC<{
  accent: string;
  eyebrow: string;
  palette?: ShortVideoPalette;
  totalScenes?: number;
  children: React.ReactNode;
}> = ({ accent, palette = 'cool', children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const colors = shortVideoPalettes[palette];
  const exit = interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.08], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: `linear-gradient(145deg, ${colors.bg}, ${colors.bg2})`, color: colors.text, fontFamily: shortVideoFont, opacity: exit, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: -80, transform: `scale(${drift})`, background: `radial-gradient(circle at 80% 20%, ${accent}33, transparent 30%), radial-gradient(circle at 15% 78%, ${colors.accent}22, transparent 34%)` }} />
    {children}
  </AbsoluteFill>;
};
