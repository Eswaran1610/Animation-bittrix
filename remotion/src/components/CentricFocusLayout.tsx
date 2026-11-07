import React, { useMemo } from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Img } from 'remotion';
import { MotionSceneData } from '../data/types';
import { assetSource } from '../assetSource';

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

export const CentricFocusLayout: React.FC<{ sceneData: MotionSceneData }> = ({ sceneData }) => {
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

  // 3. Continuous Idle Parallax & Orbital Physics
  const idleFloatY = Math.sin(frame * 0.06) * 10;
  const orbitAngle = (frame * 0.035) % (2 * Math.PI);
  const bgDriftX = interpolate(frame, [0, durationInFrames || 300], [0, 30], clamp);
  const corePulse = 1 + Math.sin(frame * 0.08) * 0.06;

  // 4. Staggered Satellites & Kinetic Words
  const satellites = ['Security', 'Scale', 'Speed', 'Sync'];
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
        backgroundColor: '#170c04',
      }}
    >
      {/* LAYER 0: BACKGROUND (Grid + Amber Neon Orbs + Continuous Drift) */}
      <div 
        style={{
          position: 'absolute',
          inset: -40,
          backgroundImage: `
            linear-gradient(rgba(245, 158, 11, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 158, 11, 0.08) 1px, transparent 1px)
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
          left: '15%', 
          width: 550, 
          height: 550, 
          borderRadius: '50%', 
          backgroundColor: 'rgba(245, 158, 11, 0.16)', 
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
          border: '1px solid rgba(245, 158, 11, 0.3)',
          backgroundColor: 'rgba(28, 18, 10, 0.82)',
          backdropFilter: 'blur(32px)',
          borderRadius: 44,
          padding: '48px 40px',
          boxShadow: `0 ${30 + idleFloatY * 1.5}px 80px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(245, 158, 11, 0.18)`,
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
            color: '#fbbf24', 
            fontWeight: 900, 
            fontSize: '2.1rem', 
            letterSpacing: '0.12em', 
            textTransform: 'uppercase', 
            marginBottom: '1.2rem', 
            filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))',
            textAlign: 'center'
          }}
        >
          {sceneData.title || "CORE FOCUS"}
        </h2>

        {/* LAYER 2: CENTRIC ORBITAL HUB WITH STAGGERED SATELLITES */}
        <div style={{ position: 'relative', width: 340, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
          {/* Rotating Dashed Orbital Ring */}
          <div 
            style={{
              position: 'absolute',
              width: 290,
              height: 240,
              borderRadius: '50%',
              border: '2px dashed rgba(245, 158, 11, 0.35)',
              transform: `rotate(${frame * 0.3}deg)`,
            }}
          />

          {/* Central Pulsing Core */}
          <div
            style={{
              width: 145,
              height: 145,
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.22)',
              border: '3px solid #fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 45px rgba(245, 158, 11, 0.45)',
              zIndex: 10,
              overflow: 'hidden',
              transform: `scale(${corePulse})`,
            }}
          >
            {sceneData.visualAssets && sceneData.visualAssets.length > 0 ? (
              <Img
                src={assetSource(sceneData.visualAssets[0].url)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ color: '#fef3c7', fontWeight: 900, fontSize: '1.25rem', textAlign: 'center' }}>
                CORE
              </div>
            )}
          </div>

          {/* Orbiting Satellites */}
          {satellites.map((sat, i) => {
            const satSpring = spring({
              frame: Math.max(0, frame - (10 + i * 4)),
              fps,
              config: { mass: 0.4, stiffness: 180, damping: 12 },
            });
            const angle = orbitAngle + (i * (2 * Math.PI / satellites.length));
            const x = Math.cos(angle) * 135;
            const y = Math.sin(angle) * 110;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  transform: `translate(${x}px, ${y}px) scale(${satSpring})`,
                  padding: '7px 16px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid rgba(251, 191, 36, 0.5)',
                  color: '#fbbf24',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                  zIndex: 20,
                  whiteSpace: 'nowrap',
                  opacity: satSpring
                }}
              >
                {sat}
              </div>
            );
          })}
        </div>

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
                  color: isWordActive ? '#fbbf24' : hasAppeared ? '#ffffff' : 'rgba(255, 255, 255, 0.22)',
                  transform: `scale(${isWordActive ? 1.18 : 1.0})`,
                  textShadow: isWordActive 
                    ? '0 0 25px rgba(251, 191, 36, 0.95), 0 0 50px rgba(251, 191, 36, 0.6)' 
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
