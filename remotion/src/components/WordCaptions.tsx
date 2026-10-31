import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CaptionWord } from '../data/sceneTypes';
import { springPresets } from '../theme';

export const WordCaptions: React.FC<{
  captions?: CaptionWord[];
  color?: string;
}> = ({ captions, color = '#38bdf8' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!captions?.length) return null;

  const activeIndex = captions.findIndex((caption) => frame >= caption.startFrame && frame < caption.endFrame);
  if (activeIndex < 0) return null;

  const active = captions[activeIndex];
  const visibleStart = Math.max(0, activeIndex - 2);
  const visibleEnd = Math.min(captions.length, activeIndex + 3);
  const visible = captions.slice(visibleStart, visibleEnd);
  const activeProgress = spring({
    frame: frame - active.startFrame,
    fps,
    config: springPresets.snappy,
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 100,
        right: 100,
        bottom: 28,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 12,
          maxWidth: 1500,
          padding: '12px 24px',
          borderRadius: 14,
          backgroundColor: 'rgba(3, 7, 18, 0.86)',
          border: `1px solid ${color}77`,
          boxShadow: `0 8px 30px rgba(0,0,0,.35), 0 0 24px ${color}22`,
        }}
      >
        {visible.map((caption, index) => {
          const isActive = visibleStart + index === activeIndex;
          const emphasis = isActive ? interpolate(activeProgress, [0, 1], [0.92, 1.08], { extrapolateRight: 'clamp' }) : 1;
          return (
            <span
              key={`${caption.startFrame}-${caption.word}`}
              style={{
                color: isActive ? '#fff' : '#cbd5e1',
                fontSize: isActive ? 48 : 40,
                fontWeight: isActive ? 800 : 600,
                lineHeight: 1.15,
                transform: `scale(${emphasis})`,
                textShadow: isActive ? `0 0 18px ${color}` : 'none',
              }}
            >
              {caption.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
