import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { shortVideoPalettes, shortVideoSafeArea, ShortVideoPalette } from '../designTokens';
import { shortVideoFont } from '../theme';

export const SceneFrame: React.FC<{
  accent: string;
  eyebrow: string;
  palette?: ShortVideoPalette;
  totalScenes?: number;
  children: React.ReactNode;
}> = ({ accent, eyebrow, palette = 'cool', totalScenes = 1, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const colors = shortVideoPalettes[palette];
  const progress = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exit = interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.08], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: `linear-gradient(145deg, ${colors.bg}, ${colors.bg2})`, color: colors.text, fontFamily: shortVideoFont, opacity: exit, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: -80, transform: `scale(${drift})`, background: `radial-gradient(circle at 80% 20%, ${accent}33, transparent 30%), radial-gradient(circle at 15% 78%, ${colors.accent}22, transparent 34%)` }} />
    <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`, backgroundSize: '72px 72px', transform: `translateY(${(frame * -0.25) % 72}px)` }} />
    {children}
    <div style={{ position: 'absolute', left: shortVideoSafeArea.left, right: shortVideoSafeArea.right, bottom: shortVideoSafeArea.bottom + 40, height: 6, borderRadius: 99, background: `${accent}33`, overflow: 'hidden' }}><div style={{ height: '100%', width: `${progress}%`, background: accent, boxShadow: `0 0 16px ${accent}` }} /></div>
  </AbsoluteFill>;
};
