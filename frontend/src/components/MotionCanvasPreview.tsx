import React, { useEffect, useRef } from 'react';
// @ts-ignore
import '@motion-canvas/player';

interface MotionCanvasPreviewProps {
  src?: string;
  autoPlay?: boolean;
  loop?: boolean;
  width?: string | number;
  height?: string | number;
}

export const MotionCanvasPreview: React.FC<MotionCanvasPreviewProps> = ({
  src,
  autoPlay = true,
  loop = true,
  width = '100%',
  height = '100%',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const player = document.createElement('motion-canvas-player') as HTMLElement;
    if (src) {
      player.setAttribute('src', src);
    }
    if (autoPlay) {
      player.setAttribute('auto', '');
    }
    if (loop) {
      player.setAttribute('loop', '');
    }
    player.style.width = '100%';
    player.style.height = '100%';
    player.style.display = 'block';
    containerRef.current.appendChild(player);
  }, [src, autoPlay, loop]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080c14',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    />
  );
};
