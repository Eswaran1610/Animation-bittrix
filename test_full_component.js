const fs = require("fs");
const { tsxValidator } = require("./backend/dist/modules/production/tsxValidator.js");

const code = `import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ============================================================================
// TIMELINE DEFINITIONS & WORD TIMINGS
// ============================================================================

interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

const SCENE_1_WORDS: WordTiming[] = [
  { word: "Hash", startFrame: 3, endFrame: 11 },
  { word: "functions", startFrame: 12, endFrame: 27 },
  { word: "transform", startFrame: 27, endFrame: 47 },
  { word: "search", startFrame: 47, endFrame: 57 },
  { word: "keys", startFrame: 57, endFrame: 71 },
  { word: "into", startFrame: 75, endFrame: 81 },
  { word: "deterministic", startFrame: 81, endFrame: 103 },
  { word: "memory", startFrame: 104, endFrame: 116 },
  { word: "offsets", startFrame: 116, endFrame: 132 },
  { word: "within", startFrame: 133, endFrame: 143 },
  { word: "bucket", startFrame: 143, endFrame: 153 },
  { word: "arrays", startFrame: 154, endFrame: 170 },
];

const SCENE_2_WORDS: WordTiming[] = [
  { word: "Chained", startFrame: 3, endFrame: 11 },
  { word: "pointers", startFrame: 11, endFrame: 28 },
  { word: "or", startFrame: 33, endFrame: 37 },
  { word: "linear", startFrame: 38, endFrame: 50 },
  { word: "probing", startFrame: 51, endFrame: 63 },
  { word: "resolve", startFrame: 64, endFrame: 74 },
  { word: "collisions", startFrame: 74, endFrame: 92 },
  { word: "to", startFrame: 98, endFrame: 102 },
  { word: "verify", startFrame: 102, endFrame: 120 },
  { word: "matching", startFrame: 126, endFrame: 139 },
  { word: "key", startFrame: 139, endFrame: 144 },
  { word: "nodes", startFrame: 144, endFrame: 159 },
];

const SCENE_3_WORDS: WordTiming[] = [
  { word: "Accelerate", startFrame: 3, endFrame: 22 },
  { word: "your", startFrame: 22, endFrame: 28 },
  { word: "engineering", startFrame: 28, endFrame: 46 },
  { word: "with", startFrame: 51, endFrame: 56 },
  { word: "Bittrix", startFrame: 59, endFrame: 70 },
  { word: "Technologies", startFrame: 71, endFrame: 95 },
];

// Helper Easing
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
const easeOutBack = (u: number) => {
  const s = 1.70158;
  const u1 = u - 1;
  return u1 * u1 * ((s + 1) * u1 + s) + 1;
};

// Deterministic Pseudo-Random Generator
function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ============================================================================
// SUB-COMPONENT: KINETIC KARAOKE CAPTIONS
// ============================================================================
const KineticCaptions: React.FC<{
  words: WordTiming[];
  localFrame: number;
  accentColor?: string;
  bottom?: number;
}> = ({ words, localFrame, accentColor = '#22c55e', bottom = 400 }) => {
  const activeIdx = words.findIndex(
    (w) => localFrame >= w.startFrame && localFrame <= w.endFrame
  );
  const lastSpokenIdx = words.reduce(
    (acc, w, i) => (localFrame >= w.startFrame ? i : acc),
    -1
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom,
        left: 60,
        right: 60,
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontWeight: 800,
        fontSize: words.length > 10 ? 44 : 50,
        lineHeight: 1.3,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        textShadow: '0 4px 28px rgba(0,0,0,0.9)',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {words.map((w, i) => {
        const isActive = i === activeIdx;
        const isSpoken = i <= lastSpokenIdx;
        const color = isActive
          ? accentColor
          : isSpoken
          ? '#FFFFFF'
          : 'rgba(255, 255, 255, 0.38)';

        return (
          <React.Fragment key={i}>
            <span
              style={{
                display: 'inline-block',
                color,
                textShadow: isActive
                  ? \`0 0 24px \${accentColor}dd, 0 0 10px \${accentColor}aa\`
                  : undefined,
                transform: isActive ? 'scale(1.08) translateY(-4px)' : 'none',
                transition: 'transform 0.08s ease, color 0.08s ease',
              }}
            >
              {w.word}
            </span>
            {i < words.length - 1 ? ' ' : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: EXACT BITTRIX OUTRO CANVAS
// ============================================================================
const BittrixOutro: React.FC<{ localFrame: number; fps: number }> = ({
  localFrame,
  fps,
}) => {
  const t = Math.min(4.3, Math.max(0, localFrame / fps));

  const CX = 540;
  const CY = 740;
  const R = 230;
  const P = '#5b1a78';
  const BG_CREAM = '#fdf3d0';

  const hv = (r: number): [number, number][] =>
    [...Array(6)].map((_, i) => {
      const a = ((-90 + 60 * i) * Math.PI) / 180;
      return [r * Math.cos(a), r * Math.sin(a)];
    });

  const HX = hv(R);
  const CH = hv(R + 44).map((p) => [p[0] + CX, p[1] + CY]);
  const NODES = [5, 1, 3].map((i) => [
    CX + HX[i][0] * 1.04,
    CY + HX[i][1] * 1.04,
  ]);

  const hs = easeOutBack(seg(t, 0, 0.7));
  const hexRot = (1 - easeOutCubic(seg(t, 0, 0.8))) * -60;

  const ca = seg(t, 0.3, 0.6) * (1 - seg(t, 2.2, 2.7));
  const ph = 0.6 * t + 0.25 * t * t;
  const N = 42;

  const gs = easeOutBack(seg(t, 0.6, 1.3));
  const gearRot = t * 2.2 * (180 / Math.PI);

  const bw = 540 * easeOutCubic(seg(t, 2.0, 2.5));
  const sh = seg(t, 2.25, 2.85);
  const shineX = -400 + (1080 + 800) * sh;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 540px 740px, #1a0624 0%, #0a0210 85%)',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <radialGradient id="hexRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8d32bd" />
            <stop offset="100%" stopColor="#5b1a78" />
          </radialGradient>
        </defs>

        {/* 1. Main Hexagon */}
        <g
          transform={\`translate(\${CX}, \${CY}) rotate(\${hexRot}) scale(\${Math.max(
            0,
            hs
          )})\`}
        >
          <polygon
            points={HX.map((p) => \`\${p[0]},\${p[1]}\`).join(' ')}
            fill="url(#hexRadial)"
            filter="drop-shadow(0 0 40px rgba(141, 50, 189, 0.5))"
          />
        </g>

        {/* 2. Spokes and Outer Nodes */}
        {NODES.map((n, i) => {
          const u = easeOutCubic(seg(t, 0.5 + i * 0.12, 1.0 + i * 0.12));
          const ex = n[0] + (CX - n[0]) * 0.5 * u;
          const ey = n[1] + (CY - n[1]) * 0.5 * u;
          const s =
            easeOutBack(seg(t, 0.5 + i * 0.12, 0.9 + i * 0.12)) *
            (1 + 0.07 * Math.sin(t * 7 + i));

          return (
            <g key={i}>
              <line
                x1={n[0]}
                y1={n[1]}
                x2={ex}
                y2={ey}
                stroke={P}
                strokeWidth={9}
                strokeLinecap="round"
              />
              <circle
                cx={n[0]}
                cy={n[1]}
                r={Math.max(0, 34 * s)}
                fill={P}
                stroke="#c084fc"
                strokeWidth={7}
                filter="drop-shadow(0 0 18px rgba(192, 132, 252, 0.7))"
              />
            </g>
          );
        })}

        {/* 3. Rolling Chain Track */}
        {ca > 0 && (
          <g opacity={ca}>
            {[...Array(N)].map((_, k) => {
              const e = (((k / N + ph) % 1) + 1) % 1 * 6;
              const idx = Math.floor(e);
              const f = e - idx;
              const A = CH[idx];
              const B = CH[(idx + 1) % 6];
              const px = A[0] + (B[0] - A[0]) * f;
              const py = A[1] + (B[1] - A[1]) * f;
              const angle = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
              const isFilled = k % 2 === 1;

              return (
                <g key={k} transform={\`translate(\${px}, \${py}) rotate(\${angle})\`}>
                  {isFilled ? (
                    <rect x={-8} y={-8} width={16} height={16} rx={5} fill={P} />
                  ) : (
                    <rect
                      x={-20}
                      y={-10}
                      width={40}
                      height={20}
                      rx={10}
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth={5}
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* 4. Gear + Central B */}
        <g
          transform={\`translate(\${CX}, \${CY}) scale(\${Math.max(0, gs)})\`}
        >
          {/* 12-tooth Gear */}
          <g transform={\`rotate(\${gearRot})\`}>
            {(() => {
              const n = 12;
              const w = (Math.PI * 2) / n;
              const r0 = 95;
              const r1 = 122;
              let d = '';
              for (let k = 0; k < n; k++) {
                const a = k * w;
                const pts = [
                  [a, r0],
                  [a + w * 0.15, r1],
                  [a + w * 0.42, r1],
                  [a + w * 0.57, r0],
                ];
                pts.forEach((pt, pIdx) => {
                  const px = pt[1] * Math.cos(pt[0]);
                  const py = pt[1] * Math.sin(pt[0]);
                  d += (k === 0 && pIdx === 0 ? 'M ' : 'L ') + \`\${px} \${py} \`;
                });
              }
              d += 'Z';
              return (
                <path
                  d={d}
                  fill="#2b0a3d"
                  stroke="#c084fc"
                  strokeWidth={2.5}
                />
              );
            })()}
          </g>

          {/* Central Purple Circle */}
          <circle
            cx={0}
            cy={0}
            r={72}
            fill={P}
            filter="drop-shadow(0 0 25px rgba(91, 26, 120, 0.9))"
          />

          {/* Bold Serif 'B' */}
          <text
            x={0}
            y={8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Georgia, serif"
            fontWeight={700}
            fontSize={124}
            fill={BG_CREAM}
          >
            B
          </text>
        </g>

        {/* 5. Expanding Purple Underline Bar */}
        {bw > 0 && (
          <rect
            x={CX - bw / 2}
            y={1290}
            width={bw}
            height={8}
            rx={4}
            fill="#a855f7"
            filter="drop-shadow(0 0 12px rgba(168, 85, 247, 0.9))"
          />
        )}
      </svg>

      {/* 6. Wordmark BITTRIX */}
      <div
        style={{
          position: 'absolute',
          top: 1040,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          fontFamily: 'Arial Black, Impact, sans-serif',
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 156,
          color: '#ffffff',
          textShadow: '0 8px 32px rgba(141, 50, 189, 0.6)',
        }}
      >
        {'BITTRIX'.split('').map((letter, i) => {
          const u = easeOutCubic(seg(t, 1.3 + i * 0.06, 1.8 + i * 0.06));
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: u,
                transform: \`translateX(\${(1 - u) * -90}px)\`,
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* 7. Subtitle TECHNOLOGIES */}
      <div
        style={{
          position: 'absolute',
          top: 1215,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 38,
          color: '#e9d5ff',
          opacity: easeOutCubic(seg(t, 1.8, 2.3)),
          letterSpacing: \`\${10 + 14 * easeOutCubic(seg(t, 1.8, 2.3))}px\`,
          textTransform: 'uppercase',
        }}
      >
        TECHNOLOGIES
      </div>

      {/* 8. Call to Action Pill */}
      {t >= 2.0 && (
        <div
          style={{
            position: 'absolute',
            top: 1335,
            left: 80,
            right: 80,
            display: 'flex',
            justifyContent: 'center',
            opacity: easeOutCubic(seg(t, 2.0, 2.5)),
            transform: \`translateY(\${(1 - easeOutCubic(seg(t, 2.0, 2.5))) * 18}px)\`,
          }}
        >
          <div
            style={{
              padding: '14px 36px',
              borderRadius: 999,
              background: 'rgba(91, 26, 120, 0.45)',
              border: '2px solid #a855f7',
              color: '#fdf3d0',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 2,
              boxShadow: '0 8px 30px rgba(168, 85, 247, 0.3)',
            }}
          >
            ACCELERATE YOUR ENGINEERING
          </div>
        </div>
      )}

      {/* 9. Diagonal Light Shine Sweep */}
      {sh > 0 && sh < 1 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: \`linear-gradient(115deg, transparent \${shineX - 180}px, rgba(255, 255, 255, 0.6) \${shineX}px, transparent \${shineX + 180}px)\`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// MAIN BESPOKE REMOTION COMPONENT
// ============================================================================
export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene Boundaries
  const SCENE_1_END = 174;
  const SCENE_2_END = 337;
  const TOTAL_FRAMES = 466;

  // Master Virtual Camera Coordinate Interpolation
  const camX = interpolate(
    frame,
    [0, 80, 160, 180, 260, 330, 345, 466],
    [0, -15, -35, 10, 0, -10, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camY = interpolate(
    frame,
    [0, 80, 160, 180, 260, 330, 345, 466],
    [0, -10, -25, 15, 0, 10, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camScale = interpolate(
    frame,
    [0, 80, 160, 174, 190, 260, 330, 345, 466],
    [1.0, 1.04, 1.06, 1.14, 1.0, 1.03, 1.05, 1.0, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camRot = interpolate(
    frame,
    [0, 160, 174, 190, 320, 337, 350, 466],
    [0, -0.6, 1.2, 0, -0.8, 1.5, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Background Particles
  const particles = useMemo(() => {
    return [...Array(32)].map((_, i) => ({
      x: pseudoRandom(i * 3 + 1) * 1080,
      y: pseudoRandom(i * 5 + 2) * 1920,
      size: 2 + pseudoRandom(i * 7 + 3) * 3.5,
      speed: 0.3 + pseudoRandom(i * 11 + 4) * 0.7,
      baseAlpha: 0.15 + pseudoRandom(i * 13 + 5) * 0.35,
    }));
  }, []);

  // Continuous Particle Drift
  const particleShift = frame * 1.2;

  // Scene 1 Local Frame & Springs
  const s1LocalFrame = frame;
  const s1EnterSpring = spring({ frame: s1LocalFrame, fps, config: { damping: 14, stiffness: 100 } });
  const s1ExitSpring = spring({ frame: s1LocalFrame - 162, fps, config: { damping: 16, stiffness: 120 } });
  const s1Opacity = interpolate(s1LocalFrame, [160, 174], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Scene 2 Local Frame & Springs
  const s2LocalFrame = frame - SCENE_1_END;
  const s2EnterSpring = spring({ frame: s2LocalFrame, fps, config: { damping: 14, stiffness: 110 } });
  const s2ExitSpring = spring({ frame: s2LocalFrame - 150, fps, config: { damping: 16, stiffness: 120 } });
  const s2Opacity = interpolate(frame, [166, 176, 326, 337], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Scene 3 Local Frame & Springs
  const s3LocalFrame = frame - SCENE_2_END;
  const s3EnterSpring = spring({ frame: s3LocalFrame, fps, config: { damping: 15, stiffness: 90 } });
  const s3Opacity = interpolate(frame, [330, 342], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Scene 1 Interactive States
  const s1HashProgress = interpolate(s1LocalFrame, [25, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s1SlotLocked = s1LocalFrame >= 81;
  const s1LockSpring = spring({ frame: s1LocalFrame - 81, fps, config: { damping: 10, stiffness: 150 } });

  // Scene 2 Interactive States
  const s2CollisionProgress = interpolate(s2LocalFrame, [10, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s2ResolutionActive = s2LocalFrame >= 72;
  const s2ResolveSpring = spring({ frame: s2LocalFrame - 72, fps, config: { damping: 12, stiffness: 130 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#070b14',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ================================================================== */}
      {/* MASTER CONTINUOUS VIRTUAL CAMERA CONTAINER */}
      {/* ================================================================== */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: \`translate3d(\${camX}px, \${camY}px, 0px) scale(\${camScale}) rotate(\${camRot}deg)\`,
          transformOrigin: '540px 960px',
        }}
      >
        {/* SHARED LIVING ATMOSPHERE: TECH GRID & PARTICLES */}
        <div
          style={{
            position: 'absolute',
            inset: -200,
            backgroundImage: \`
              linear-gradient(to right, rgba(34, 197, 94, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(34, 197, 94, 0.05) 1px, transparent 1px)
            \`,
            backgroundSize: '64px 64px',
            transform: \`translateY(\${(frame * 0.4) % 64}px)\`,
            opacity: frame < 337 ? 0.75 : 0.15,
            transition: 'opacity 0.6s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Floating Data Constellation */}
        {particles.map((p, idx) => {
          const py = (p.y + particleShift * p.speed) % 2120 - 100;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: p.x,
                top: py,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: frame < 337 ? '#22c55e' : '#a855f7',
                opacity: p.baseAlpha,
                boxShadow: \`0 0 \${p.size * 2}px \${frame < 337 ? '#22c55e' : '#a855f7'}\`,
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {/* Ambient Radial Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 45%, transparent 40%, rgba(5, 8, 15, 0.88) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* ================================================================== */}
        {/* SCENE 1: HASH FUNCTION & BUCKET ARRAYS (0 - 174 frames) */}
        {/* ================================================================== */}
        {frame < SCENE_1_END + 14 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: s1Opacity,
              transform: \`translateY(\${(1 - s1EnterSpring) * 60 + s1ExitSpring * -50}px)\`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 140,
            }}
          >
            {/* Top Category Badge & Hero Header */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 22px',
                borderRadius: 999,
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                fontSize: 16,
                fontWeight: 700,
                color: '#22c55e',
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 16,
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.2)',
              }}
            >
              <span style={{ fontSize: 18 }}>⚡</span> KEY-TO-INDEX MAPPING
            </div>

            <h1
              style={{
                fontSize: 54,
                fontWeight: 900,
                letterSpacing: -1,
                textAlign: 'center',
                margin: '0 0 10px 0',
                background: 'linear-gradient(180deg, #ffffff 30%, #a7f3d0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Deterministic Memory Offsets
            </h1>

            <p
              style={{
                fontSize: 22,
                color: '#94a3b8',
                margin: '0 0 32px 0',
                letterSpacing: 0.5,
              }}
            >
              Hash(key) &rarr; Uniform Index Array Alignment
            </p>

            {/* MANDATORY VISUAL 1: HASH PIPELINE & BUCKET MEMORY TABLE */}
            <div
              style={{
                width: 960,
                height: 720,
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(16px)',
                borderRadius: 28,
                border: '1.5px solid rgba(34, 197, 94, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(34, 197, 94, 0.15)',
                position: 'relative',
                overflow: 'hidden',
                padding: '28px 36px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Header Telemetry Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  paddingBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span style={{ fontSize: 16, fontFamily: 'monospace', color: '#64748b', marginLeft: 10 }}>
                    hash_engine.v1.sys
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontFamily: 'monospace',
                    color: '#22c55e',
                    background: 'rgba(34, 197, 94, 0.1)',
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                >
                  OFFSET: 0x10A0 (INDEX [5])
                </div>
              </div>

              {/* Upper Stage: Search Key passing into Hash Function */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 20,
                  marginTop: 10,
                }}
              >
                {/* Search Key Input Card */}
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(30, 41, 59, 0.8)',
                    borderRadius: 18,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', marginBottom: 6 }}>
                    INPUT SEARCH KEY
                  </div>
                  <div style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                    "session_token"
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Length: 13 bytes | ASCII</div>
                </div>

                {/* Animated Arrow / Laser Connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 }}>
                  <div
                    style={{
                      height: 4,
                      width: '100%',
                      background: \`linear-gradient(90deg, #38bdf8, #22c55e)\`,
                      boxShadow: '0 0 12px #22c55e',
                    }}
                  />
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#22c55e', marginTop: 4 }}>
                    PASS
                  </span>
                </div>

                {/* Mathematical Hash Operator */}
                <div
                  style={{
                    flex: 1.3,
                    background: 'rgba(22, 101, 52, 0.2)',
                    borderRadius: 18,
                    border: '1.5px solid rgba(34, 197, 94, 0.5)',
                    padding: '16px 20px',
                    boxShadow: '0 0 25px rgba(34, 197, 94, 0.15)',
                  }}
                >
                  <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, color: '#4ade80', marginBottom: 6 }}>
                    HASH FUNCTION
                  </div>
                  <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 700, color: '#ffffff' }}>
                    Murmur3("key") &rarr; 0x8F3D7B55
                  </div>
                  <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#86efac', marginTop: 6 }}>
                    index = 0x8F3D7B55 % 8 = <strong style={{ color: '#22c55e', fontSize: 18 }}>5</strong>
                  </div>
                </div>
              </div>

              {/* Lower Stage: 8-Slot Memory Bucket Array */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', letterSpacing: 1 }}>
                    BUCKET MEMORY ARRAY (CAPACITY: 8)
                  </div>
                  <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#64748b' }}>
                    BASE POINTER: 0x1000
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                    const isTarget = idx === 5;
                    const isOccupied = idx === 1 || idx === 3 || idx === 5 || idx === 7;
                    const targetGlow = isTarget && s1SlotLocked;

                    return (
                      <div
                        key={idx}
                        style={{
                          height: 150,
                          borderRadius: 14,
                          background: targetGlow
                            ? 'rgba(34, 197, 94, 0.28)'
                            : isOccupied
                            ? 'rgba(30, 41, 59, 0.6)'
                            : 'rgba(15, 23, 42, 0.5)',
                          border: targetGlow
                            ? \`2.5px solid #22c55e\`
                            : isOccupied
                            ? '1px solid rgba(255, 255, 255, 0.15)'
                            : '1px dashed rgba(255, 255, 255, 0.08)',
                          boxShadow: targetGlow
                            ? \`0 0 \${20 * s1LockSpring}px rgba(34, 197, 94, 0.8), inset 0 0 15px rgba(34, 197, 94, 0.4)\`
                            : undefined,
                          transform: targetGlow ? \`scale(\${1 + 0.06 * s1LockSpring})\` : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '10px 8px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: targetGlow ? '#22c55e' : '#94a3b8',
                            }}
                          >
                            [{idx}]
                          </span>
                          <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b' }}>
                            +{(idx * 32).toString(16)}
                          </span>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          {isTarget ? (
                            <div
                              style={{
                                fontSize: 13,
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                color: '#ffffff',
                                background: '#16a34a',
                                padding: '4px 0',
                                borderRadius: 6,
                              }}
                            >
                              TARGET
                            </div>
                          ) : isOccupied ? (
                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
                              PTR &rarr;
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>
                              NULL
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: 10,
                            fontFamily: 'monospace',
                            color: targetGlow ? '#86efac' : '#475569',
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          0x{(0x1000 + idx * 32).toString(16)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Telemetry Verification Pill */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 12,
                  padding: '12px 20px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: s1SlotLocked ? '#22c55e' : '#f59e0b',
                      boxShadow: \`0 0 10px \${s1SlotLocked ? '#22c55e' : '#f59e0b'}\`,
                    }}
                  />
                  <span style={{ fontSize: 14, fontFamily: 'monospace', color: '#cbd5e1' }}>
                    {s1SlotLocked
                      ? 'DETERMINISTIC OFFSET LOCATED: bucket_array[5] @ 0x10A0'
                      : 'EVALUATING ARITHMETIC MEMORY PROJECTION...'}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                  TIME: O(1) CONSTANT
                </div>
              </div>
            </div>

            {/* Karaoke Captions Scene 1 */}
            <KineticCaptions
              words={SCENE_1_WORDS}
              localFrame={s1LocalFrame}
              accentColor="#22c55e"
              bottom={400}
            />
          </div>
        )}

        {/* ================================================================== */}
        {/* SCENE 2: COLLISION RESOLUTION MECHANICS (174 - 337 frames) */}
        {/* ================================================================== */}
        {frame >= SCENE_1_END - 12 && frame < SCENE_2_END + 14 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: s2Opacity,
              transform: \`translateY(\${(1 - s2EnterSpring) * 60 + s2ExitSpring * -50}px)\`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 140,
            }}
          >
            {/* Top Category Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 22px',
                borderRadius: 999,
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                fontSize: 16,
                fontWeight: 700,
                color: '#eab308',
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 16,
                boxShadow: '0 4px 20px rgba(234, 179, 8, 0.2)',
              }}
            >
              <span style={{ fontSize: 18 }}>🛡️</span> COLLISION RESOLUTION
            </div>

            <h1
              style={{
                fontSize: 54,
                fontWeight: 900,
                letterSpacing: -1,
                textAlign: 'center',
                margin: '0 0 10px 0',
                background: 'linear-gradient(180deg, #ffffff 30%, #fde047 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Chained Pointers &amp; Linear Probing
            </h1>

            <p
              style={{
                fontSize: 22,
                color: '#94a3b8',
                margin: '0 0 32px 0',
                letterSpacing: 0.5,
              }}
            >
              Resolving identical bucket indices to locate target key nodes
            </p>

            {/* MANDATORY VISUAL 2 & 3: DUAL ARCHITECTURE COMPARISON */}
            <div
              style={{
                width: 980,
                height: 720,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
              }}
            >
              {/* Left Column: Chained Pointers (Separate Chaining) */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 24,
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.1)',
                  padding: '24px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', letterSpacing: 0.5 }}>
                      CHAINED POINTERS
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'monospace',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        padding: '3px 8px',
                        borderRadius: 6,
                      }}
                    >
                      LINKED LIST
                    </span>
                  </div>

                  <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px 0', lineHeight: 1.4 }}>
                    Bucket points to dynamic head node. Successive keys traverse next pointers.
                  </p>

                  {/* Chained Nodes Diagram */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Bucket Slot 3 */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 14, fontFamily: 'monospace', color: '#cbd5e1' }}>Bucket[3] Head</span>
                      <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                        &rarr; ptr: 0x8240
                      </span>
                    </div>

                    {/* Node 1 */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1.5px solid rgba(56, 189, 248, 0.4)',
                        boxShadow: '0 4px 15px rgba(56, 189, 248, 0.15)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                        <span>NODE @ 0x8240</span>
                        <span style={{ color: '#ef4444' }}>Key Mis-match</span>
                      </div>
                      <div style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700, color: '#f1f5f9', marginTop: 4 }}>
                        Key: "auth_token" &rarr; Next: 0x8260
                      </div>
                    </div>

                    {/* Node 2: MATCH */}
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: s2ResolutionActive ? 'rgba(34, 197, 94, 0.25)' : 'rgba(15, 23, 42, 0.9)',
                        border: s2ResolutionActive ? '2px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: s2ResolutionActive ? '0 0 25px rgba(34, 197, 94, 0.4)' : undefined,
                        transform: s2ResolutionActive ? \`scale(\${1 + 0.04 * s2ResolveSpring})\` : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: s2ResolutionActive ? '#86efac' : '#64748b' }}>
                        <span>NODE @ 0x8260</span>
                        <span style={{ color: '#22c55e', fontWeight: 700 }}>MATCH VERIFIED!</span>
                      </div>
                      <div style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                        Key: "admin_id" &rarr; Value: 9401
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Metric */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    color: '#94a3b8',
                  }}
                >
                  Complexity: O(1 + &alpha;) | Dynamic Resizing
                </div>
              </div>

              {/* Right Column: Linear Probing (Open Addressing) */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 24,
                  border: '1.5px solid rgba(234, 179, 8, 0.35)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(234, 179, 8, 0.1)',
                  padding: '24px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#eab308', letterSpacing: 0.5 }}>
                      LINEAR PROBING
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'monospace',
                        background: 'rgba(234, 179, 8, 0.15)',
                        color: '#eab308',
                        padding: '3px 8px',
                        borderRadius: 6,
                      }}
                    >
                      OPEN ADDRESSING
                    </span>
                  </div>

                  <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px 0', lineHeight: 1.4 }}>
                    Sequential probe steps test contiguous slots until matching key or empty slot.
                  </p>

                  {/* Linear Probe Array Diagram */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Slot 3 */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1.5px solid rgba(239, 68, 68, 0.4)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#fca5a5' }}>
                          STEP 0: (h(k) + 0) % N
                        </div>
                        <div style={{ fontSize: 15, fontFamily: 'monospace', fontWeight: 700, color: '#ffffff' }}>
                          Index [3]: OCCUPIED
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>COLLISION</span>
                    </div>

                    {/* Step Probe Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
                      <div style={{ width: 2, height: 16, background: '#eab308' }} />
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#eab308' }}>
                        probe +1 step &rarr;
                      </span>
                    </div>

                    {/* Slot 4 */}
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: s2ResolutionActive ? 'rgba(34, 197, 94, 0.25)' : 'rgba(30, 41, 59, 0.8)',
                        border: s2ResolutionActive ? '2px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: s2ResolutionActive ? '0 0 25px rgba(34, 197, 94, 0.4)' : undefined,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: s2ResolutionActive ? '#86efac' : '#94a3b8' }}>
                          STEP 1: (h(k) + 1) % N
                        </div>
                        <div style={{ fontSize: 15, fontFamily: 'monospace', fontWeight: 700, color: '#ffffff' }}>
                          Index [4]: KEY MATCH!
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 800 }}>VERIFIED</span>
                    </div>
                  </div>
                </div>

                {/* VISUAL 3: CACHE LOCALITY HUD MATRIX */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
                    <span>CPU CACHE LOCALITY</span>
                    <strong style={{ color: '#22c55e' }}>99.2% CONTIGUOUS</strong>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 3,
                      marginTop: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: '99%',
                        height: '100%',
                        background: 'linear-gradient(90deg, #eab308, #22c55e)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Karaoke Captions Scene 2 */}
            <KineticCaptions
              words={SCENE_2_WORDS}
              localFrame={s2LocalFrame}
              accentColor="#22c55e"
              bottom={400}
            />
          </div>
        )}

        {/* ================================================================== */}
        {/* SCENE 3: EXACT BITTRIX OUTRO ANIMATION (337 - 466 frames) */}
        {/* ================================================================== */}
        {frame >= SCENE_2_END - 8 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: s3Opacity,
              transform: \`scale(\${0.96 + 0.04 * s3EnterSpring})\`,
            }}
          >
            <BittrixOutro localFrame={s3LocalFrame} fps={fps} />

            {/* Karaoke Captions Scene 3 */}
            <KineticCaptions
              words={SCENE_3_WORDS}
              localFrame={s3LocalFrame}
              accentColor="#c084fc"
              bottom={400}
            />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
`;

tsxValidator.validate(code).then(r => {
  console.log("Full Component Validation Result:", JSON.stringify(r, null, 2));
  if (!r.valid) {
    process.exit(1);
  }
});
