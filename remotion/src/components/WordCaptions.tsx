import React from 'react';
import { useCurrentFrame } from 'remotion';
import { CaptionWord } from '../data/sceneTypes';

export const WordCaptions: React.FC<{
  captions?: CaptionWord[];
  color?: string;
  emphasisWords?: string[];
}> = ({ captions, color = '#22d3ee', emphasisWords = [] }) => {
  const frame = useCurrentFrame();
  if (!captions?.length) return null;

  const activeIndex = captions.findIndex((caption) => frame >= caption.startFrame && frame < caption.endFrame);
  if (activeIndex < 0) return null;

  // Show a rolling window of words without jumping size or reflowing
  const visibleStart = Math.max(0, activeIndex - 3);
  const visibleEnd = Math.min(captions.length, activeIndex + 4);
  const visible = captions.slice(visibleStart, visibleEnd);
  const normSet = new Set(emphasisWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')));

  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        bottom: 110,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          maxWidth: 920,
          padding: '20px 36px',
          borderRadius: 26,
          backgroundColor: 'rgba(7, 16, 24, 0.78)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
        }}
      >
        {visible.map((caption, index) => {
          const isActive = visibleStart + index === activeIndex;
          const clean = caption.word.toLowerCase().replace(/[^a-z0-9]/g, '');
          const isEmphasized = normSet.has(clean);
          return (
            <span
              key={`${caption.startFrame}-${caption.word}-${index}`}
              style={{
                color: isActive || isEmphasized ? color : '#9fb3c4',
                fontSize: 48,
                fontWeight: isActive || isEmphasized ? 800 : 600,
                lineHeight: 1.25,
                transform: isEmphasized ? 'scale(1.06)' : 'none',
                display: 'inline-block',
                textShadow: isActive || isEmphasized ? `0 0 16px ${color}88` : 'none',
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
