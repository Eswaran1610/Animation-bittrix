import React, { useMemo } from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Img } from 'remotion';
import { MotionSceneData } from '../data/types';
import { assetSource } from '../assetSource';

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

export const HorizontalFlowLayout: React.FC<{ sceneData: MotionSceneData }> = ({ sceneData }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // 1. Instantaneous Velocity & Motion Blur Math
  const cardSpringConfig = { mass: 0.8, stiffness: 120, damping: 12 };
  const cardEntranceFrame = Math.max(0, frame - 6);
  const currentPos = spring({ frame: cardEntranceFrame, fps, config: cardSpringConfig });
  const prevPos = spring({ frame: Math.max(0, cardEntranceFrame - 1), fps, config: cardSpringConfig });
  const velocity = Math.abs(currentPos - prevPos) * fps;
  const motionBlurPx = Math.min(18, velocity * 0.45);

  // 2. Organic Movement Triad (Anticipation ➔ Overshoot ➔ Elastic Settle)
  const anticipationScale = frame < 6 
    ? interpolate(frame, [0, 4, 6], [1.0, 0.94, 0.96], clamp)
    : 1.0;
  const cardScale = frame < 6 ? anticipationScale : currentPos;
  const cardTranslateY = interpolate(currentPos, [0, 1], [60, 0], clamp);

  // 3. Continuous Idle Parallax & Drift
  const idleFloatY = Math.sin(frame * 0.06) * 10;
  const idleRotate = Math.sin(frame * 0.04) * 2.0;
  const bgDriftX = interpolate(frame, [0, durationInFrames || 300], [0, -30], clamp);
  const arrowPulse = 1 + Math.sin(frame * 0.12) * 0.2;

  // 4. Staggered Timeline Steps & Kinetic Words
  const steps = ['Step 01: Ingest', 'Step 02: Process', 'Step 03: Deliver'];
  const words = useMemo(() => (sceneData.narrationText || '').split(' '), [sceneData.narrationText]);
  const kineticStartFrame = 26;

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '60px', 
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#021a12',
      }}
    >
      {/* LAYER 0: BACKGROUND (Grid + Emerald Neon Orbs + Continuous Drift) */}
      <div 
        style={{
          position: 'absolute',
          inset: -40,
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          transform: `translateX(${bgDriftX}px)`,
          zIndex: 0,
        }}
      />
      <div 
        style={{ 
          position: 'absolute', 
          top: '20%', 
          left: '10%', 
          width: 550, 
          height: 550, 
          borderRadius: '50%', 
          backgroundColor: 'rgba(16, 185, 129, 0.16)', 
          filter: 'blur(130px)', 
          transform: `scale(${1 + Math.sin(frame * 0.05) * 0.12})`,
          zIndex: 1 
        }} 
      />

      {/* LAYER 1: MIDGROUND GLASS CONTAINER CARD */}
      <div 
        style={{ 
          transform: `translateY(${cardTranslateY + idleFloatY}px) scale(${cardScale})`, 
          filter: `blur(${motionBlurPx}px)`, 
          border: '1px solid rgba(16, 185, 129, 0.3)',
          backgroundColor: 'rgba(6, 30, 24, 0.78)',
          backdropFilter: 'blur(32px)',
          borderRadius: 44,
          padding: '48px 40px',
          boxShadow: `0 ${30 + idleFloatY * 1.5}px 80px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.18)`,
          maxWidth: 960,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          position: 'relative'
        }}
      >
        <h2 
          style={{ 
            color: '#34d399', 
            fontWeight: 900, 
            fontSize: '2.1rem', 
            letterSpacing: '0.12em', 
            textTransform: 'uppercase', 
            marginBottom: '1.2rem', 
            filter: 'drop-shadow(0 0 20px rgba(52, 211, 153, 0.5))',
            textAlign: 'center'
          }}
        >
          {sceneData.title || "SEQUENTIAL FLOW"}
        </h2>

        {/* LAYER 2: STAGGERED HORIZONTAL FLOW TIMELINE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', margin: '1.8rem 0', width: '100%' }}>
          {steps.map((label, i) => {
            const stepSpring = spring({
              frame: Math.max(0, frame - (12 + i * 6)),
              fps,
              config: { mass: 0.5, stiffness: 150, damping: 13 },
            });

            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(16, 185, 129, 0.16)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    color: '#f0fdf4',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    transform: `scale(${stepSpring}) translateY(${Math.sin((frame + i * 20) * 0.08) * 5}px)`,
                    opacity: stepSpring
                  }}
                >
                  {label}
                </div>
                {i < steps.length - 1 && (
                  <div style={{ color: '#10b981', fontSize: '1.6rem', transform: `scale(${arrowPulse})`, fontWeight: 'bold' }}>
                    →
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* LAYER 3: FOREGROUND ASSET WITH IDLE PERSPECTIVE */}
        {sceneData.visualAssets && sceneData.visualAssets.length > 0 && (
          <div style={{ margin: '1rem 0', position: 'relative', transform: `rotate(${idleRotate}deg)` }}>
            <Img 
              src={assetSource(sceneData.visualAssets[0].url)} 
              style={{ width: 170, height: 170, objectFit: 'cover', borderRadius: '1.5rem', border: '2px solid rgba(52, 211, 153, 0.45)', position: 'relative', zIndex: 10, boxShadow: '0 15px 35px rgba(0,0,0,0.5)' }}
            />
          </div>
        )}

        {/* LAYER 4: KINETIC TYPOGRAPHY SPOTLIGHT */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 16px', padding: '0 1rem', marginTop: '1.2rem', maxWidth: 840 }}>
          {words.map((word, idx) => {
            const wordStartFrame = kineticStartFrame + idx * 7; 
            const isWordActive = frame >= wordStartFrame && frame < wordStartFrame + 9;
            const hasAppeared = frame >= wordStartFrame;

            return (
              <span
                key={idx}
                style={{
                  fontSize: '2.35rem',
                  fontWeight: 800,
                  color: isWordActive ? '#34d399' : hasAppeared ? '#ffffff' : 'rgba(255, 255, 255, 0.22)',
                  transform: `scale(${isWordActive ? 1.18 : 1.0})`,
                  textShadow: isWordActive 
                    ? '0 0 25px rgba(52, 211, 153, 0.95), 0 0 50px rgba(52, 211, 153, 0.6)' 
                    : hasAppeared ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
                  display: 'inline-block',
                  transition: 'color 0.12s ease, transform 0.12s ease'
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
