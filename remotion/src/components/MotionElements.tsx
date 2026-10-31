import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { springPresets } from '../theme';

/** Shared typography only; scene geometry is supplied by AGY visual blueprints. */
export const KineticTitle: React.FC<{
  title: string;
  badge?: string;
  subtitle?: string;
  color?: string;
  delayFrames?: number;
}> = ({ title, badge, subtitle, color = '#38bdf8', delayFrames = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame: frame - delayFrames, fps, config: springPresets.snappy });
  const subtitleSpring = spring({ frame: frame - delayFrames - 8, fps, config: springPresets.soft });
  const underlineWidth = interpolate(frame - delayFrames, [10, 40], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return <div style={{ textAlign: 'center', zIndex: 10, maxWidth: '1100px', padding: '0 20px' }}>
    {badge && <div style={{ fontSize: '18px', fontWeight: 700, color, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '14px', opacity: Math.min(1, Math.max(0, (frame - delayFrames) / 15)) }}>{badge}</div>}
    <h1 style={{ fontSize: '90px', fontWeight: 900, color: '#fff', lineHeight: 1.05, margin: 0, transform: `scale(${titleSpring}) translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`, textShadow: `0 10px 40px rgba(0,0,0,.8), 0 0 30px ${color}40` }}>{title}</h1>
    <div style={{ margin: '16px auto 0', height: '4px', width: `${underlineWidth}%`, maxWidth: '300px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, borderRadius: '2px', boxShadow: `0 0 16px ${color}` }} />
    {subtitle && <p style={{ fontSize: '48px', color: '#94a3b8', marginTop: '20px', lineHeight: 1.25, transform: `scale(${subtitleSpring}) translateY(${interpolate(subtitleSpring, [0, 1], [20, 0])}px)`, opacity: Math.min(1, Math.max(0, subtitleSpring)) }}>{subtitle}</p>}
  </div>;
};

export const KineticTakeawayList: React.FC<{ items: string[]; color?: string }> = ({ items, color = '#38bdf8' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px', maxWidth: '850px', width: '100%', zIndex: 10 }}>
    {items.map((item, idx) => {
      const entrance = spring({ frame: frame - (idx * 10 + 10), fps, config: springPresets.snappy });
      const sweep = interpolate(frame - idx * 10, [0, 24], [-100, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return <div key={`${item}-${idx}`} style={{ opacity: entrance, transform: `translateY(${interpolate(entrance, [0, 1], [30, 0])}px)`, display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0', width: '100%', borderBottom: `1px solid ${color}55`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: idx % 2 ? '2px' : '50%', background: `linear-gradient(135deg, ${color}, transparent)`, boxShadow: `0 0 14px ${color}`, transform: `rotate(${idx * 45 + frame * 0.7}deg)`, flexShrink: 0 }} />
        <span style={{ fontSize: '44px', color: '#f8fafc', fontWeight: 600, letterSpacing: '.5px', textShadow: `0 0 18px ${color}55` }}>{item}</span>
        <div style={{ position: 'absolute', left: `${sweep}%`, bottom: 0, width: '30%', height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 12px ${color}` }} />
      </div>;
    })}
  </div>;
};
