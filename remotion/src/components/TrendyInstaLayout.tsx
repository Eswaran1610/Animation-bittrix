import React, { useMemo } from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Img } from 'remotion';
import { MotionSceneData } from '../data/types';
import { assetSource } from '../assetSource';

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

export const TrendyInstaLayout: React.FC<{ sceneData: MotionSceneData }> = ({ sceneData }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. INSTANTANEOUS VELOCITY & MOTION BLUR MATH
  // ─────────────────────────────────────────────────────────────────────────────
  const cardSpringConfig = { mass: 0.8, stiffness: 120, damping: 12 };
  
  // Staggered card entrance starting at Frame 6
  const cardEntranceFrame = Math.max(0, frame - 6);
  const currentPos = spring({ frame: cardEntranceFrame, fps, config: cardSpringConfig });
  const prevPos = spring({ frame: Math.max(0, cardEntranceFrame - 1), fps, config: cardSpringConfig });
  const velocity = Math.abs(currentPos - prevPos) * fps;
  const motionBlurPx = Math.min(18, velocity * 0.45);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ORGANIC MOVEMENT TRIAD (Anticipation ➔ Overshoot ➔ Elastic Settle)
  // ─────────────────────────────────────────────────────────────────────────────
  // Anticipation dip: slight scale pullback between frames 0-6 before launching
  const anticipationScale = frame < 6 
    ? interpolate(frame, [0, 4, 6], [1.0, 0.94, 0.96], clamp)
    : 1.0;
  
  // Spring handles Overshoot & Elastic Settle from Frame 6 onward
  const cardScale = frame < 6 ? anticipationScale : currentPos;
  const cardTranslateY = interpolate(currentPos, [0, 1], [60, 0], clamp);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. CONTINUOUS IDLE PARALLAX & AMBIENT DRIFT (Never Static)
  // ─────────────────────────────────────────────────────────────────────────────
  const idleFloatY = Math.sin(frame * 0.06) * 10;
  const idleRotate = Math.sin(frame * 0.04) * 2.2;
  const bgDriftY = interpolate(frame, [0, durationInFrames || 300], [0, -35], clamp);
  const orbPulse = 1 + Math.sin(frame * 0.05) * 0.12;

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. TEMPORAL STAGGERING: FOREGROUND 3D ASSET (Frame 14)
  // ─────────────────────────────────────────────────────────────────────────────
  const assetSpring = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { mass: 0.6, stiffness: 140, damping: 11 },
  });
  const assetTiltX = Math.sin(frame * 0.05) * 6;
  const assetTiltY = Math.cos(frame * 0.04) * 8;

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. TEMPORAL STAGGERING: TITLE (Frame 20) & KINETIC TYPOGRAPHY (Frame 26+)
  // ─────────────────────────────────────────────────────────────────────────────
  const titleSpring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { mass: 0.5, stiffness: 150, damping: 14 },
  });

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
        backgroundColor: '#020617',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          LAYER 0: BACKGROUND (Alive at Frame 0: Grid + Neon Glow Orbs + Parallax)
         ───────────────────────────────────────────────────────────────────── */}
      <div 
        style={{
          position: 'absolute',
          inset: -40,
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          transform: `translateY(${bgDriftY}px)`,
          zIndex: 0,
        }}
      />

      {/* Pulsing Radial Neon Glow Orbs */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '18%', 
          left: '12%', 
          width: 550, 
          height: 550, 
          borderRadius: '50%', 
          backgroundColor: 'rgba(59, 130, 246, 0.16)', 
          filter: 'blur(130px)', 
          transform: `scale(${orbPulse})`,
          zIndex: 1 
        }} 
      />
      <div 
        style={{ 
          position: 'absolute', 
          bottom: '15%', 
          right: '10%', 
          width: 500, 
          height: 500, 
          borderRadius: '50%', 
          backgroundColor: 'rgba(168, 85, 247, 0.14)', 
          filter: 'blur(120px)', 
          transform: `scale(${2 - orbPulse})`,
          zIndex: 1 
        }} 
      />

      {/* ─────────────────────────────────────────────────────────────────────
          LAYER 1: MIDGROUND GLASS CONTAINER CARD (Pops at Frame 6 with Velocity Blur)
         ───────────────────────────────────────────────────────────────────── */}
      <div 
        style={{ 
          transform: `translateY(${cardTranslateY + idleFloatY}px) scale(${cardScale})`, 
          filter: `blur(${motionBlurPx}px)`, 
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(32px)',
          borderRadius: 44,
          padding: '48px 40px',
          boxShadow: `0 ${30 + idleFloatY * 1.5}px 80px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(59, 130, 246, 0.18)`,
          maxWidth: 920,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          position: 'relative'
        }}
      >
        {/* Layer 1 Accent Glow Rim */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            right: '15%',
            height: 2,
            background: 'linear-gradient(90deg, transparent, #60a5fa, transparent)',
            opacity: 0.8
          }}
        />

        {/* ───────────────────────────────────────────────────────────────────
            LAYER 2: TITLE HEADER (Reveals at Frame 20)
           ─────────────────────────────────────────────────────────────────── */}
        <h2 
          style={{ 
            color: '#60a5fa', 
            fontWeight: 900, 
            fontSize: '2.1rem', 
            letterSpacing: '0.12em', 
            textTransform: 'uppercase', 
            marginBottom: '1.2rem', 
            filter: 'drop-shadow(0 0 20px rgba(96, 165, 250, 0.5))',
            transform: `scale(${titleSpring})`,
            opacity: titleSpring,
            textAlign: 'center'
          }}
        >
          {sceneData.title || "ARCHITECTURE LAYER"}
        </h2>

        {/* ───────────────────────────────────────────────────────────────────
            LAYER 3: FOREGROUND 3D ASSET (Tilts in at Frame 14 with Continuous Idle)
           ─────────────────────────────────────────────────────────────────── */}
        {sceneData.visualAssets && sceneData.visualAssets.length > 0 && (
          <div 
            style={{ 
              margin: '2rem 0', 
              position: 'relative',
              perspective: 1200,
              transform: `scale(${assetSpring}) rotate(${idleRotate}deg)`,
              opacity: assetSpring,
            }}
          >
            {/* Dynamic Halo Glow behind Asset */}
            <div 
              style={{ 
                position: 'absolute', 
                inset: -15, 
                backgroundColor: 'rgba(59, 130, 246, 0.28)', 
                borderRadius: '2rem', 
                filter: 'blur(28px)',
                transform: `scale(${1 + Math.sin(frame * 0.08) * 0.08})`
              }} 
            />
            <div
              style={{
                transform: `rotateX(${assetTiltX}deg) rotateY(${assetTiltY}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.1s ease-out'
              }}
            >
              <Img 
                src={assetSource(sceneData.visualAssets[0].url)} 
                style={{ 
                  width: 200, 
                  height: 200, 
                  objectFit: 'cover', 
                  borderRadius: '1.75rem', 
                  border: '2px solid rgba(148, 163, 184, 0.4)', 
                  position: 'relative', 
                  zIndex: 20, 
                  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)'
                }}
              />
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            LAYER 4: KINETIC TYPOGRAPHY (Staggered Neon Spotlight Sweep Frame 26+)
           ─────────────────────────────────────────────────────────────────── */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            gap: '12px 16px', 
            padding: '0 1rem', 
            marginTop: '1.2rem',
            zIndex: 30,
            maxWidth: 820
          }}
        >
          {words.map((word, idx) => {
            const wordStartFrame = kineticStartFrame + idx * 7; 
            const isWordActive = frame >= wordStartFrame && frame < wordStartFrame + 9;
            const hasAppeared = frame >= wordStartFrame;

            // Subtle scale bounce on active word
            const wordScale = isWordActive ? 1.18 : 1.0;

            return (
              <span
                key={idx}
                style={{
                  fontSize: '2.35rem',
                  fontWeight: 800,
                  color: isWordActive ? '#38bdf8' : hasAppeared ? '#ffffff' : 'rgba(255, 255, 255, 0.22)',
                  transform: `scale(${wordScale})`,
                  textShadow: isWordActive 
                    ? '0 0 25px rgba(56, 189, 248, 0.95), 0 0 50px rgba(56, 189, 248, 0.6)' 
                    : hasAppeared 
                      ? '0 2px 10px rgba(0,0,0,0.5)' 
                      : 'none',
                  display: 'inline-block',
                  transition: 'color 0.12s ease, transform 0.12s ease, text-shadow 0.12s ease',
                  letterSpacing: '-0.01em'
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
