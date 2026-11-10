import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ============================================================================
// DATA & INTERFACES
// ============================================================================

export interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

export interface SceneConfig {
  scene_number: number;
  role: string;
  durationInFrames: number;
  duration_sec: number;
  narration: string;
  on_screen_text: string;
  visual_direction: string;
  template: string;
  themeColor: string;
  words: WordTiming[];
}

const SCENES: SceneConfig[] = [
  {
    scene_number: 1,
    role: "hook",
    durationInFrames: 137,
    duration_sec: 4.57,
    narration: "Why do NVIDIA chips power AI?",
    on_screen_text: "Why Do NVIDIA GPUs Dominate AI?",
    visual_direction: "Vertical layout with massive centered typographic question in bold white and bright red, surrounded by framing vector brackets and pulsating line grid.",
    template: "question-hook",
    themeColor: "#ef4444",
    words: [
      { word: "Why", startFrame: 0, endFrame: 1 },
      { word: "do", startFrame: 0, endFrame: 1 },
      { word: "NVIDIA", startFrame: 0, endFrame: 1 },
      { word: "chips", startFrame: 0, endFrame: 1 },
      { word: "power", startFrame: 0, endFrame: 1 },
      { word: "AI", startFrame: 0, endFrame: 1 }
    ]
  },
  {
    scene_number: 2,
    role: "body",
    durationInFrames: 137,
    duration_sec: 4.57,
    narration: "Blackwell unites two massive silicon dies.",
    on_screen_text: "Blackwell B200 Breaks Silicon Limits",
    visual_direction: "Central split-package graphic highlighting twin silicon slabs bordered by high-contrast memory stacks and verified semiconductor wafer imagery.",
    template: "product-showcase",
    themeColor: "#ef4444",
    words: [
      { word: "Blackwell", startFrame: 0, endFrame: 1 },
      { word: "unites", startFrame: 0, endFrame: 1 },
      { word: "two", startFrame: 0, endFrame: 1 },
      { word: "massive", startFrame: 0, endFrame: 1 },
      { word: "silicon", startFrame: 0, endFrame: 1 },
      { word: "dies", startFrame: 0, endFrame: 1 }
    ]
  },
  {
    scene_number: 3,
    role: "body",
    durationInFrames: 137,
    duration_sec: 4.57,
    narration: "Ten terabytes per second connect them.",
    on_screen_text: "Dual Die Versus Monolithic Design",
    visual_direction: "Split-screen comparison: Left side portrays the solitary monolithic Hopper H100 die; right side portrays Blackwell's paired dies tied by the blazing NV-HBI bus.",
    template: "split-compare",
    themeColor: "#ef4444",
    words: [
      { word: "Ten", startFrame: 0, endFrame: 1 },
      { word: "terabytes", startFrame: 0, endFrame: 1 },
      { word: "per", startFrame: 0, endFrame: 1 },
      { word: "second", startFrame: 0, endFrame: 1 },
      { word: "connect", startFrame: 0, endFrame: 1 },
      { word: "them", startFrame: 0, endFrame: 1 }
    ]
  },
  {
    scene_number: 4,
    role: "body",
    durationInFrames: 137,
    duration_sec: 4.57,
    narration: "Two hundred eight billion raw transistors.",
    on_screen_text: "Two Hundred Eight Billion Transistors",
    visual_direction: "Giant cinematic monospace metric counter dominating the center of the frame, accompanied by an animated microscopic silicon gate mesh.",
    template: "stat-callout",
    themeColor: "#ef4444",
    words: [
      { word: "Two", startFrame: 0, endFrame: 1 },
      { word: "hundred", startFrame: 0, endFrame: 1 },
      { word: "eight", startFrame: 0, endFrame: 1 },
      { word: "billion", startFrame: 0, endFrame: 1 },
      { word: "raw", startFrame: 0, endFrame: 1 },
      { word: "transistors", startFrame: 0, endFrame: 1 }
    ]
  },
  {
    scene_number: 5,
    role: "body",
    durationInFrames: 137,
    duration_sec: 4.57,
    narration: "Native four bit math doubles speed.",
    on_screen_text: "Native FP4 Tensor Core Math",
    visual_direction: "Data stage displaying 8-bit versus 4-bit matrix cell compression with glowing green-to-red mathematical precision indicators.",
    template: "fact-card",
    themeColor: "#ef4444",
    words: [
      { word: "Native", startFrame: 0, endFrame: 1 },
      { word: "four", startFrame: 0, endFrame: 1 },
      { word: "bit", startFrame: 0, endFrame: 1 },
      { word: "math", startFrame: 0, endFrame: 1 },
      { word: "doubles", startFrame: 0, endFrame: 1 },
      { word: "speed", startFrame: 0, endFrame: 1 }
    ]
  },
  {
    scene_number: 6,
    role: "body",
    durationInFrames: 137,
    duration_sec: 4.57,
    narration: "Liquid cooled racks form one supercomputer.",
    on_screen_text: "Liquid Cooled Rack Scale Superclusters",
    visual_direction: "Staggered isometric server blade stack connected by liquid-cooling manifolds and glowing high-speed NVLink copper backplane traces.",
    template: "hero-object",
    themeColor: "#ef4444",
    words: [
      { word: "Liquid", startFrame: 0, endFrame: 1 },
      { word: "cooled", startFrame: 0, endFrame: 1 },
      { word: "racks", startFrame: 0, endFrame: 1 },
      { word: "form", startFrame: 0, endFrame: 1 },
      { word: "one", startFrame: 0, endFrame: 1 },
      { word: "supercomputer", startFrame: 0, endFrame: 1 }
    ]
  },
  {
    scene_number: 7,
    role: "cta",
    durationInFrames: 137,
    duration_sec: 4.57,
    narration: "Subscribe to master next generation silicon.",
    on_screen_text: "Subscribe For Next Generation Tech",
    visual_direction: "High-impact kinetic typography finale with pulsing neon red perimeter, bold subscribe callout button, and glowing tech line accents.",
    template: "cta-outro",
    themeColor: "#ef4444",
    words: [
      { word: "Subscribe", startFrame: 0, endFrame: 1 },
      { word: "to", startFrame: 0, endFrame: 1 },
      { word: "master", startFrame: 0, endFrame: 1 },
      { word: "next", startFrame: 0, endFrame: 1 },
      { word: "generation", startFrame: 0, endFrame: 1 },
      { word: "silicon", startFrame: 0, endFrame: 1 }
    ]
  }
];

// Canvas coordinates for continuous virtual camera interpolation
const SCENE_CANVAS_COORDS = [
  { x: 0, y: 0, scale: 1.0 },
  { x: 1080, y: 0, scale: 1.0 },
  { x: 1080, y: 1920, scale: 1.0 },
  { x: 0, y: 1920, scale: 1.0 },
  { x: -1080, y: 1920, scale: 1.0 },
  { x: -1080, y: 0, scale: 1.0 },
  { x: 0, y: 3840, scale: 1.0 },
];

// Helper easing
const clampVal = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const segRel = (t: number, a: number, b: number) => clampVal((t - a) / (b - a));
const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
const easeOutBack = (u: number) => {
  const s = 1.70158;
  const u1 = u - 1;
  return u1 * u1 * ((s + 1) * u1 + s) + 1;
};

// ============================================================================
// COMPONENT: KINETIC KARAOKE CAPTION
// ============================================================================
const KineticKaraokeCaption: React.FC<{
  scene: SceneConfig;
  currentSceneFrame: number;
}> = ({ scene, currentSceneFrame }) => {
  const words = scene.words || [];
  if (words.length === 0) return null;

  const totalFrames = scene.durationInFrames;
  const wordDuration = totalFrames / Math.max(1, words.length);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 110,
        left: 60,
        right: 60,
        zIndex: 100,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: '16px 28px',
        backgroundColor: 'rgba(8, 11, 18, 0.88)',
        borderRadius: 20,
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), inset 0 0 15px rgba(239, 68, 68, 0.15)',
      }}
    >
      {words.map((w, idx) => {
        const start = w.startFrame > 0 ? w.startFrame : Math.floor(idx * wordDuration);
        const end = w.endFrame > start ? w.endFrame : Math.floor((idx + 1) * wordDuration);
        const isActive = currentSceneFrame >= start && currentSceneFrame <= end;
        const isPast = currentSceneFrame > end;

        return (
          <span
            key={idx}
            style={{
              fontSize: 32,
              fontWeight: 800,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.01em',
              transition: 'all 0.1s ease',
              color: isActive ? '#ffffff' : isPast ? '#f1f5f9' : '#64748b',
              backgroundColor: isActive ? '#ef4444' : 'transparent',
              padding: isActive ? '4px 12px' : '4px 2px',
              borderRadius: 8,
              transform: isActive ? 'scale(1.08)' : 'scale(1.0)',
              boxShadow: isActive ? '0 0 20px rgba(239, 68, 68, 0.8)' : 'none',
              display: 'inline-block',
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// ============================================================================
// COMPONENT: EXACT BITTRIX OUTRO
// ============================================================================
const BittrixOutroExactView: React.FC<{
  currentSceneFrame: number;
  durationInFrames: number;
  fps: number;
}> = ({ currentSceneFrame, durationInFrames, fps }) => {
  // Normalize frame progress to standard 3-second choreography curve
  const t = Math.min(3, Math.max(0, (currentSceneFrame / durationInFrames) * 3));

  const CX = 540;
  const CY = 720;
  const R = 250;
  const P = '#5b1a78';
  const D = '#1d1a1a';
  const BG = '#fdf3d0';

  const hv = (r: number): [number, number][] =>
    [...Array(6)].map((_, i) => {
      const a = ((-90 + 60 * i) * Math.PI) / 180;
      return [r * Math.cos(a), r * Math.sin(a)];
    });

  const HX = hv(R);
  const CH = hv(R + 48).map((p) => [p[0] + CX, p[1] + CY]);
  const NODES = [5, 1, 3].map((i) => [CX + HX[i][0] * 1.04, CY + HX[i][1] * 1.04]);

  // 1. Hexagon scale and rotation
  const hs = easeOutBack(segRel(t, 0, 0.7));
  const hexRot = (1 - easeOutCubic(segRel(t, 0, 0.8))) * -60;

  // 2. Rolling chain track alpha
  const ca = segRel(t, 0.3, 0.6) * (1 - segRel(t, 2, 2.45));
  const ph = 0.6 * t + 0.25 * t * t;
  const N = 42;

  // 3. Gear & B scale
  const gs = easeOutBack(segRel(t, 0.6, 1.3));
  const gearRot = t * 2.2 * (180 / Math.PI);

  // 4. Underline expansion
  const bw = 520 * easeOutCubic(segRel(t, 2.1, 2.6));

  // 5. Light shine sweep
  const sh = segRel(t, 2.35, 2.95);
  const shineX = -400 + (1080 + 800) * sh;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 540px 720px, #fff9e2 0%, #fdf3d0 80%)',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="hexRadialExact" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7a2ba3" />
            <stop offset="100%" stopColor="#5b1a78" />
          </radialGradient>
        </defs>

        {/* 1. Main Hexagon */}
        <g transform={`translate(${CX}, ${CY}) rotate(${hexRot}) scale(${Math.max(0, hs)})`}>
          <polygon
            points={HX.map((p) => `${p[0]},${p[1]}`).join(' ')}
            fill="url(#hexRadialExact)"
            filter="drop-shadow(0 0 35px rgba(91, 26, 120, 0.45))"
          />
        </g>

        {/* 2. Spokes and Outer Nodes */}
        {NODES.map((n, i) => {
          const u = easeOutCubic(segRel(t, 0.5 + i * 0.12, 1.0 + i * 0.12));
          const ex = n[0] + (CX - n[0]) * 0.5 * u;
          const ey = n[1] + (CY - n[1]) * 0.5 * u;
          const s = easeOutBack(segRel(t, 0.5 + i * 0.12, 0.9 + i * 0.12)) * (1 + 0.07 * Math.sin(t * 7 + i));

          return (
            <g key={i}>
              <line x1={n[0]} y1={n[1]} x2={ex} y2={ey} stroke={P} strokeWidth={9} strokeLinecap="round" />
              <circle
                cx={n[0]}
                cy={n[1]}
                r={Math.max(0, 36 * s)}
                fill={P}
                stroke="#9a4cc2"
                strokeWidth={7}
                filter="drop-shadow(0 0 15px rgba(154, 76, 194, 0.6))"
              />
            </g>
          );
        })}

        {/* 3. Rolling Chain Track */}
        {ca > 0 && (
          <g opacity={ca}>
            {[...Array(N)].map((_, k) => {
              const e = ((k / N + ph) % 1) * 6;
              const idx = Math.floor(e);
              const f = e - idx;
              const A = CH[idx];
              const B = CH[(idx + 1) % 6];
              const px = A[0] + (B[0] - A[0]) * f;
              const py = A[1] + (B[1] - A[1]) * f;
              const angle = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
              const isFilled = k % 2 === 1;

              return (
                <g key={k} transform={`translate(${px}, ${py}) rotate(${angle})`}>
                  {isFilled ? (
                    <rect x={-9} y={-9} width={18} height={18} rx={6} fill={P} />
                  ) : (
                    <rect x={-21} y={-11} width={42} height={22} rx={11} fill="none" stroke={P} strokeWidth={6} />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* 4. Gear + Central B */}
        <g transform={`translate(${CX}, ${CY}) scale(${Math.max(0, gs)})`}>
          <g transform={`rotate(${gearRot})`}>
            {(() => {
              const n = 12;
              const w = (Math.PI * 2) / n;
              const r0 = 100;
              const r1 = 128;
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
                  d += (k === 0 && pIdx === 0 ? 'M ' : 'L ') + `${px} ${py} `;
                });
              }
              d += 'Z';
              return <path d={d} fill={BG} stroke="#9a4cc2" strokeWidth={2} />;
            })()}
          </g>

          <circle cx={0} cy={0} r={76} fill={P} filter="drop-shadow(0 0 20px rgba(91, 26, 120, 0.8))" />

          <text
            x={0}
            y={8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Georgia, serif"
            fontWeight={700}
            fontSize={130}
            fill={BG}
          >
            B
          </text>
        </g>

        {/* 5. Expanding Purple Underline Bar */}
        {bw > 0 && (
          <rect
            x={CX - bw / 2}
            y={1316}
            width={bw}
            height={7}
            rx={3.5}
            fill={P}
            filter="drop-shadow(0 0 10px rgba(91, 26, 120, 0.8))"
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
          fontFamily: 'Arial Black, Impact, Arial, sans-serif',
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 168,
          color: P,
          textShadow: '0 8px 30px rgba(91, 26, 120, 0.4)',
        }}
      >
        {'BITTRIX'.split('').map((letter, i) => {
          const u = easeOutCubic(segRel(t, 1.4 + i * 0.07, 1.9 + i * 0.07));
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: u,
                transform: `translateX(${(1 - u) * -110}px)`,
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
          top: 1230,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 600,
          fontSize: 46,
          color: D,
          opacity: easeOutCubic(segRel(t, 1.9, 2.5)),
          letterSpacing: `${10 + 16 * easeOutCubic(segRel(t, 1.9, 2.5))}px`,
          textTransform: 'uppercase',
        }}
      >
        TECHNOLOGIES
      </div>

      {/* 8. Spoken Outro Callout Pill */}
      {t >= 2.0 && (
        <div
          style={{
            position: 'absolute',
            top: 1370,
            left: 60,
            right: 60,
            display: 'flex',
            justifyContent: 'center',
            opacity: easeOutCubic(segRel(t, 2.0, 2.5)),
            transform: `translateY(${(1 - easeOutCubic(segRel(t, 2.0, 2.5))) * 20}px)`,
          }}
        >
          <div
            style={{
              padding: '14px 36px',
              borderRadius: 999,
              background: 'rgba(91, 26, 120, 0.1)',
              border: `1.5px solid ${P}`,
              color: P,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 1.5,
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(91, 26, 120, 0.2)',
            }}
          >
            Follow Bittrix Technologies for more interesting concepts.
          </div>
        </div>
      )}

      {/* 9. Light Shine Sweep */}
      {sh > 0 && sh < 1 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(115deg, transparent ${shineX - 160}px, rgba(255, 255, 255, 0.5) ${shineX}px, transparent ${shineX + 160}px)`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: SCENE 1 - HOOK VIEW
// ============================================================================
const Scene1HookView: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const enterProgress = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const pulse = Math.sin((frame / 60) * Math.PI * 2) * 0.5 + 0.5;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#07090e',
        overflow: 'hidden',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background Circuit Grid */}
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
        <defs>
          <pattern id="grid1" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.3" />
            <circle cx="60" cy="60" r="1.5" fill="#ef4444" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#grid1)" />
      </svg>

      {/* Technical Framing Brackets */}
      <div
        style={{
          position: 'absolute',
          inset: 40,
          border: '1px solid rgba(239, 68, 68, 0.2)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', top: -2, left: -2, width: 36, height: 36, borderTop: '4px solid #ef4444', borderLeft: '4px solid #ef4444' }} />
        <div style={{ position: 'absolute', top: -2, right: -2, width: 36, height: 36, borderTop: '4px solid #ef4444', borderRight: '4px solid #ef4444' }} />
        <div style={{ position: 'absolute', bottom: -2, left: -2, width: 36, height: 36, borderBottom: '4px solid #ef4444', borderLeft: '4px solid #ef4444' }} />
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 36, height: 36, borderBottom: '4px solid #ef4444', borderRight: '4px solid #ef4444' }} />
      </div>

      {/* Top Header Telemetry */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 70,
          right: 70,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 14,
          letterSpacing: '0.2em',
          color: '#ef4444',
          textTransform: 'uppercase',
          borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
          paddingBottom: 12,
        }}
      >
        <span>SYS.AI_ACCELERATION_ANALYSIS</span>
        <span>STATUS: CRITICAL</span>
      </div>

      {/* Main Massive Kinetic Question */}
      <div
        style={{
          position: 'absolute',
          top: 220,
          left: 60,
          right: 60,
          textAlign: 'center',
          transform: `scale(${enterProgress})`,
          opacity: enterProgress,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#94a3b8',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Why Do
        </div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 950,
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            color: '#ef4444',
            textShadow: `0 0 ${30 + pulse * 25}px rgba(239, 68, 68, 0.8)`,
            textTransform: 'uppercase',
          }}
        >
          NVIDIA GPUs
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: '0.02em',
            color: '#ffffff',
            marginTop: 12,
            textTransform: 'uppercase',
          }}
        >
          Dominate AI?
        </div>
      </div>

      {/* Centerpiece: High-Density GPU Architecture Silicon Graphic */}
      <div
        style={{
          position: 'absolute',
          top: 660,
          left: 100,
          right: 100,
          height: 600,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <svg width="880" height="600" viewBox="0 0 880 600">
          <defs>
            <linearGradient id="gpuPackageGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="smGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Outer Heat Spreader Substrate */}
          <rect
            x="40"
            y="30"
            width="800"
            height="540"
            rx="20"
            fill="url(#gpuPackageGrad)"
            stroke="#ef4444"
            strokeWidth="3"
            filter="drop-shadow(0 0 25px rgba(239, 68, 68, 0.3))"
          />

          {/* Golden Substrate Corner Markers */}
          <polygon points="40,30 80,30 40,70" fill="#f59e0b" />
          <polygon points="840,30 800,30 840,70" fill="#f59e0b" />
          <polygon points="40,570 80,570 40,530" fill="#f59e0b" />
          <polygon points="840,570 800,570 840,530" fill="#f59e0b" />

          {/* Streaming Multiprocessors (SM) Matrix (4 rows of 8 SM units) */}
          {[...Array(4)].map((_, row) =>
            [...Array(8)].map((_, col) => {
              const x = 90 + col * 86;
              const y = 80 + row * 90;
              const activeCore = (row * 8 + col + Math.floor(frame * 0.4)) % 5 === 0;

              return (
                <g key={`sm-${row}-${col}`}>
                  <rect
                    x={x}
                    y={y}
                    width="74"
                    height="76"
                    rx="6"
                    fill="url(#smGrad)"
                    stroke={activeCore ? '#ef4444' : '#475569'}
                    strokeWidth={activeCore ? 2 : 1}
                  />
                  <line x1={x + 37} y1={y + 8} x2={x + 37} y2={y + 68} stroke={activeCore ? '#ef4444' : '#334155'} strokeWidth="1" strokeDasharray="3 3" />
                  <text
                    x={x + 37}
                    y={y + 44}
                    textAnchor="middle"
                    fill={activeCore ? '#ef4444' : '#64748b'}
                    fontSize="11"
                    fontFamily="ui-monospace, monospace"
                    fontWeight="700"
                  >
                    SM
                  </text>
                </g>
              );
            })
          )}

          {/* Center Ultra-Wide High-Speed Bus Bar */}
          <rect x="90" y="460" width="700" height="70" rx="10" fill="#090d16" stroke="#ef4444" strokeWidth="2" />
          <text x="440" y="502" textAnchor="middle" fill="#ef4444" fontSize="18" fontFamily="ui-monospace, monospace" fontWeight="900" letterSpacing="6">
            10 TB/s COHERENT MEMORY FABRIC
          </text>
        </svg>
      </div>

      {/* Bottom Technical Badges */}
      <div
        style={{
          position: 'absolute',
          top: 1300,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div style={{ flex: 1, padding: '16px 20px', backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 14, borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>ARCHITECTURE</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', marginTop: 4 }}>BLACKWELL B200</div>
        </div>
        <div style={{ flex: 1, padding: '16px 20px', backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 14, borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>PROCESS DENSITY</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', marginTop: 4 }}>208 BILLION XISTORS</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: SCENE 2 - PRODUCT SHOWCASE (TWIN DIES)
// ============================================================================
const Scene2ProductShowcaseView: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const enterProgress = spring({ frame, fps, config: { damping: 15, stiffness: 85 } });
  const scanY = (frame * 12) % 650;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#07090e',
        overflow: 'hidden',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Circuit Background */}
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
        <defs>
          <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="40" y2="40" stroke="#ef4444" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#grid2)" />
      </svg>

      {/* Header */}
      <div style={{ position: 'absolute', top: 90, left: 60, right: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontFamily: 'ui-monospace, monospace', color: '#ef4444', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          MULTI-CHIP MODULE BREAKTHROUGH
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 950, margin: '8px 0 0 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
          Blackwell B200 Breaks Silicon Limits
        </h2>
      </div>

      {/* Central Graphic: Dual Silicon Slabs Co-Packaged */}
      <div
        style={{
          position: 'absolute',
          top: 360,
          left: 60,
          right: 60,
          height: 800,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${enterProgress})`,
        }}
      >
        <svg width="960" height="740" viewBox="0 0 960 740">
          <defs>
            <linearGradient id="dieGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
            <linearGradient id="hbmGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(239, 68, 68, 0.6)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Substrate Base Plate */}
          <rect x="50" y="30" width="860" height="680" rx="18" fill="#0b0f19" stroke="#334155" strokeWidth="3" />

          {/* Left HBM3e Memory Stacks (4 units) */}
          {[...Array(4)].map((_, i) => (
            <g key={`hbm-l-${i}`}>
              <rect x="75" y={80 + i * 145} width="85" height="115" rx="8" fill="url(#hbmGrad)" stroke="#60a5fa" strokeWidth="2" />
              <text x="117" y={145 + i * 145} textAnchor="middle" fill="#ffffff" fontSize="13" fontFamily="ui-monospace, monospace" fontWeight="800">
                HBM3e
              </text>
            </g>
          ))}

          {/* Right HBM3e Memory Stacks (4 units) */}
          {[...Array(4)].map((_, i) => (
            <g key={`hbm-r-${i}`}>
              <rect x="800" y={80 + i * 145} width="85" height="115" rx="8" fill="url(#hbmGrad)" stroke="#60a5fa" strokeWidth="2" />
              <text x="842" y={145 + i * 145} textAnchor="middle" fill="#ffffff" fontSize="13" fontFamily="ui-monospace, monospace" fontWeight="800">
                HBM3e
              </text>
            </g>
          ))}

          {/* DIE 0 (Left Silicon Slab) */}
          <rect x="190" y="80" width="270" height="550" rx="12" fill="url(#dieGrad)" stroke="#ef4444" strokeWidth="3" filter="drop-shadow(0 0 20px rgba(239, 68, 68, 0.4))" />
          <text x="325" y="140" textAnchor="middle" fill="#ef4444" fontSize="20" fontFamily="ui-monospace, monospace" fontWeight="900" letterSpacing="2">
            DIE 0 (TSMC 4NP)
          </text>
          <text x="325" y="170" textAnchor="middle" fill="#94a3b8" fontSize="14" fontFamily="ui-monospace, monospace">
            104 BILLION TRANSISTORS
          </text>

          {/* DIE 1 (Right Silicon Slab) */}
          <rect x="500" y="80" width="270" height="550" rx="12" fill="url(#dieGrad)" stroke="#ef4444" strokeWidth="3" filter="drop-shadow(0 0 20px rgba(239, 68, 68, 0.4))" />
          <text x="635" y="140" textAnchor="middle" fill="#ef4444" fontSize="20" fontFamily="ui-monospace, monospace" fontWeight="900" letterSpacing="2">
            DIE 1 (TSMC 4NP)
          </text>
          <text x="635" y="170" textAnchor="middle" fill="#94a3b8" fontSize="14" fontFamily="ui-monospace, monospace">
            104 BILLION TRANSISTORS
          </text>

          {/* Central NV-HBI Bridge Interconnect */}
          <rect x="460" y="120" width="40" height="470" rx="6" fill="#ef4444" opacity="0.85" filter="drop-shadow(0 0 15px rgba(239, 68, 68, 0.9))" />
          {[...Array(14)].map((_, i) => (
            <line key={`bridge-${i}`} x1="462" y1={140 + i * 32} x2="498" y2={140 + i * 32} stroke="#ffffff" strokeWidth="2" strokeDasharray="4 2" />
          ))}

          {/* Laser Scanning Bar */}
          <rect x="180" y={70 + scanY} width="600" height="14" fill="url(#scanGrad)" />
        </svg>
      </div>

      {/* Bottom Explainer Callout */}
      <div
        style={{
          position: 'absolute',
          top: 1220,
          left: 80,
          right: 80,
          padding: '20px 28px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 16,
          border: '1px solid rgba(239, 68, 68, 0.4)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>
          858 mm² + 858 mm² = 1,716 mm² ACTIVE SILICON
        </div>
        <div style={{ fontSize: 16, color: '#94a3b8', marginTop: 6, fontFamily: 'ui-monospace, monospace' }}>
          Connected by high-density CoWoS-L silicon interposer at 10 TB/s
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: SCENE 3 - SPLIT COMPARE (MONOLITHIC VS DUAL DIE)
// ============================================================================
const Scene3SplitCompareView: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const enterProgress = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const busPulse = (frame * 16) % 240;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#07090e',
        overflow: 'hidden',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Banner */}
      <div style={{ position: 'absolute', top: 90, left: 60, right: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontFamily: 'ui-monospace, monospace', color: '#ef4444', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          ARCHITECTURAL REVOLUTION
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 950, margin: '8px 0 0 0', textTransform: 'uppercase' }}>
          Dual Die Versus Monolithic Design
        </h2>
      </div>

      {/* Split Comparison Cards */}
      <div
        style={{
          position: 'absolute',
          top: 260,
          left: 60,
          right: 60,
          display: 'flex',
          gap: 24,
          transform: `scale(${enterProgress})`,
        }}
      >
        {/* Left Side: Monolithic Hopper H100 */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderRadius: 20,
            border: '2px solid rgba(245, 158, 11, 0.4)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ padding: '6px 16px', borderRadius: 20, backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: 14, fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>
            HOPPER H100
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 14, color: '#f8fafc' }}>
            Single Monolithic Die
          </div>

          {/* SVG Monolithic Graphic */}
          <svg width="340" height="340" viewBox="0 0 340 340" style={{ marginTop: 20 }}>
            <rect x="40" y="40" width="260" height="260" rx="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
            <line x1="40" y1="170" x2="300" y2="170" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
            <line x1="170" y1="40" x2="170" y2="300" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
            <text x="170" y="165" textAnchor="middle" fill="#f59e0b" fontSize="16" fontFamily="ui-monospace, monospace" fontWeight="900">
              814 mm²
            </text>
            <text x="170" y="190" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="ui-monospace, monospace">
              RETICLE LIMIT
            </text>
          </svg>

          <div style={{ width: '100%', marginTop: 20, borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: 16 }}>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>Transistor Count:</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#f59e0b' }}>80 Billion</div>
            <div style={{ fontSize: 14, color: '#ef4444', marginTop: 10, fontWeight: 700 }}>
              ⚠ Physical Scaling Wall Reached
            </div>
          </div>
        </div>

        {/* Right Side: Blackwell B200 Dual Die */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderRadius: 20,
            border: '2px solid rgba(239, 68, 68, 0.8)',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ padding: '6px 16px', borderRadius: 20, backgroundColor: 'rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: 14, fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>
            BLACKWELL B200
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 14, color: '#f8fafc' }}>
            Twin Co-Packaged Dies
          </div>

          {/* SVG Dual Die Graphic */}
          <svg width="340" height="340" viewBox="0 0 340 340" style={{ marginTop: 20 }}>
            {/* Die A */}
            <rect x="25" y="40" width="130" height="260" rx="8" fill="#1e293b" stroke="#ef4444" strokeWidth="2.5" />
            <text x="90" y="175" textAnchor="middle" fill="#ef4444" fontSize="13" fontFamily="ui-monospace, monospace" fontWeight="800">
              DIE 0
            </text>

            {/* Die B */}
            <rect x="185" y="40" width="130" height="260" rx="8" fill="#1e293b" stroke="#ef4444" strokeWidth="2.5" />
            <text x="250" y="175" textAnchor="middle" fill="#ef4444" fontSize="13" fontFamily="ui-monospace, monospace" fontWeight="800">
              DIE 1
            </text>

            {/* Glowing NV-HBI Bus in between */}
            <rect x="157" y="60" width="26" height="220" rx="4" fill="#ef4444" opacity="0.9" filter="drop-shadow(0 0 10px #ef4444)" />
            <line x1="170" y1="70" x2="170" y2="270" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 4" />
          </svg>

          <div style={{ width: '100%', marginTop: 20, borderTop: '1px solid rgba(239, 68, 68, 0.3)', paddingTop: 16 }}>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>Transistor Count:</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#ef4444' }}>208 Billion</div>
            <div style={{ fontSize: 14, color: '#22c55e', marginTop: 10, fontWeight: 700 }}>
              ✓ 10 TB/s NV-HBI Coherent Interconnect
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Metric Callout Bar */}
      <div
        style={{
          position: 'absolute',
          top: 1140,
          left: 60,
          right: 60,
          padding: '24px 32px',
          backgroundColor: '#0f172a',
          borderRadius: 20,
          border: '1px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>INTERCONNECT SPEED</div>
          <div style={{ fontSize: 40, fontWeight: 950, color: '#ef4444' }}>10 TB/s</div>
        </div>
        <div style={{ width: 1, height: 50, backgroundColor: 'rgba(239, 68, 68, 0.3)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>CACHE COHERENCY</div>
          <div style={{ fontSize: 40, fontWeight: 950, color: '#ffffff' }}>0.0 μs LATENCY</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: SCENE 4 - STAT CALLOUT (208 BILLION TRANSISTORS)
// ============================================================================
const Scene4StatCalloutView: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const enterProgress = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });
  const rawNumber = Math.floor(interpolate(frame, [0, 80], [0, 208], { extrapolateRight: 'clamp' }));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#07090e',
        overflow: 'hidden',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background Silicon Gate Mesh */}
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        <defs>
          <pattern id="gateMesh" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="80" height="80" fill="none" stroke="#ef4444" strokeWidth="0.8" />
            <line x1="40" y1="0" x2="40" y2="80" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="40" x2="80" y2="40" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#gateMesh)" />
      </svg>

      {/* Top Banner */}
      <div style={{ position: 'absolute', top: 90, left: 60, right: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontFamily: 'ui-monospace, monospace', color: '#ef4444', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          SEMICONDUCTOR DENSITY SCALE
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 950, margin: '8px 0 0 0', textTransform: 'uppercase' }}>
          Two Hundred Eight Billion Transistors
        </h2>
      </div>

      {/* Giant Monospace Animated Metric Counter */}
      <div
        style={{
          position: 'absolute',
          top: 360,
          left: 60,
          right: 60,
          textAlign: 'center',
          transform: `scale(${enterProgress})`,
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 950,
            fontFamily: 'ui-monospace, monospace',
            lineHeight: 0.95,
            color: '#ef4444',
            textShadow: '0 0 40px rgba(239, 68, 68, 0.75)',
            letterSpacing: '-0.03em',
          }}
        >
          {rawNumber}B
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '0.25em',
            color: '#ffffff',
            textTransform: 'uppercase',
            marginTop: 16,
          }}
        >
          RAW SILICON TRANSISTORS
        </div>
      </div>

      {/* Microscopic Gate Structure Diagram */}
      <div
        style={{
          position: 'absolute',
          top: 660,
          left: 80,
          right: 80,
          height: 480,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <svg width="920" height="420" viewBox="0 0 920 420">
          <defs>
            <linearGradient id="gateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>

          {/* Substrate Base */}
          <rect x="60" y="300" width="800" height="80" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <text x="460" y="348" textAnchor="middle" fill="#64748b" fontSize="16" fontFamily="ui-monospace, monospace" fontWeight="800">
            TSMC 4NP SILICON SUBSTRATE (3nm CLASS GATE PITCH)
          </text>

          {/* Nanosheet Fins (3 Gates) */}
          {[...Array(3)].map((_, i) => {
            const gx = 160 + i * 240;
            return (
              <g key={`gate-${i}`}>
                {/* Source Pillar */}
                <rect x={gx} y="140" width="45" height="160" rx="6" fill="#3b82f6" />
                <text x={gx + 22} y="220" textAnchor="middle" fill="#ffffff" fontSize="12" fontFamily="ui-monospace, monospace">
                  SRC
                </text>

                {/* Gate Fin */}
                <rect x={gx + 60} y="80" width="60" height="220" rx="8" fill="url(#gateGrad)" filter="drop-shadow(0 0 15px rgba(239, 68, 68, 0.6))" />
                <text x={gx + 90} y="195" textAnchor="middle" fill="#ffffff" fontSize="14" fontFamily="ui-monospace, monospace" fontWeight="900">
                  GATE
                </text>

                {/* Drain Pillar */}
                <rect x={gx + 135} y="140" width="45" height="160" rx="6" fill="#10b981" />
                <text x={gx + 157} y="220" textAnchor="middle" fill="#ffffff" fontSize="12" fontFamily="ui-monospace, monospace">
                  DRN
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Specification Footers */}
      <div
        style={{
          position: 'absolute',
          top: 1180,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ flex: 1, padding: 18, backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>LITHOGRAPHY</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444', marginTop: 4 }}>4NP CUSTOM TSMC</div>
        </div>
        <div style={{ flex: 1, padding: 18, backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>GATE DENSITY</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', marginTop: 4 }}>121 MTr / mm²</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: SCENE 5 - FACT CARD (NATIVE FP4 MATH)
// ============================================================================
const Scene5FactCardView: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const enterProgress = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const animOffset = (frame * 3) % 20;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#07090e',
        overflow: 'hidden',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Banner */}
      <div style={{ position: 'absolute', top: 90, left: 60, right: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontFamily: 'ui-monospace, monospace', color: '#ef4444', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          QUANTIZATION ENGINE GEN 2
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 950, margin: '8px 0 0 0', textTransform: 'uppercase' }}>
          Native FP4 Tensor Core Math
        </h2>
      </div>

      {/* Side-by-Side Floating-Point Bit Registers */}
      <div
        style={{
          position: 'absolute',
          top: 260,
          left: 60,
          right: 60,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          transform: `scale(${enterProgress})`,
        }}
      >
        {/* FP8 Register Container */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', padding: 24, borderRadius: 18, border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#94a3b8' }}>FP8 PRECISION (8 BITS)</span>
            <span style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>1 SIGN | 4 EXPONENT | 3 MANTISSA</span>
          </div>
          {/* 8 Bit Blocks */}
          <div style={{ display: 'flex', gap: 10 }}>
            {['S', 'E3', 'E2', 'E1', 'E0', 'M2', 'M1', 'M0'].map((bit, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: 60,
                  borderRadius: 8,
                  backgroundColor: idx === 0 ? '#3b82f6' : idx < 5 ? '#f59e0b' : '#10b981',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: 18,
                  fontWeight: 900,
                  fontFamily: 'ui-monospace, monospace',
                  color: '#ffffff',
                }}
              >
                {bit}
              </div>
            ))}
          </div>
        </div>

        {/* Compression Arrow Divider */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
          <div style={{ height: 2, flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.3)' }} />
          <div style={{ padding: '8px 24px', borderRadius: 20, backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 900, fontSize: 16 }}>
            2X COMPUTE DENSITY COMPRESSION ↓
          </div>
          <div style={{ height: 2, flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.3)' }} />
        </div>

        {/* FP4 Register Container */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', padding: 24, borderRadius: 18, border: '2px solid #ef4444', boxShadow: '0 0 25px rgba(239, 68, 68, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 950, color: '#ef4444' }}>NATIVE FP4 PRECISION (4 BITS)</span>
            <span style={{ fontSize: 14, color: '#ef4444', fontFamily: 'ui-monospace, monospace', fontWeight: 800 }}>1 SIGN | 2 EXPONENT | 1 MANTISSA</span>
          </div>
          {/* 4 Bit Blocks (Double Width) */}
          <div style={{ display: 'flex', gap: 14 }}>
            {['S', 'E1', 'E0', 'M0'].map((bit, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: 72,
                  borderRadius: 10,
                  backgroundColor: idx === 0 ? '#3b82f6' : idx < 3 ? '#f59e0b' : '#ef4444',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: 24,
                  fontWeight: 950,
                  fontFamily: 'ui-monospace, monospace',
                  color: '#ffffff',
                  boxShadow: idx === 3 ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'none',
                }}
              >
                {bit}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dual Highlights Stage */}
      <div
        style={{
          position: 'absolute',
          top: 980,
          left: 60,
          right: 60,
          display: 'flex',
          gap: 20,
        }}
      >
        <div style={{ flex: 1, padding: 24, backgroundColor: '#0f172a', borderRadius: 16, border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>INFERENCE SPEED</div>
          <div style={{ fontSize: 48, fontWeight: 950, color: '#ef4444', marginTop: 4 }}>2X FASTER</div>
          <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 6 }}>Doubles Tensor Core throughput per clock</div>
        </div>
        <div style={{ flex: 1, padding: 24, backgroundColor: '#0f172a', borderRadius: 16, border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>MODEL CAPACITY</div>
          <div style={{ fontSize: 48, fontWeight: 950, color: '#22c55e', marginTop: 4 }}>4X MEMORY</div>
          <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 6 }}>Fits 27 Trillion parameter models in rack</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: SCENE 6 - HERO OBJECT (LIQUID COOLED RACK SUPERCOMPUTERS)
// ============================================================================
const Scene6HeroObjectView: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const enterProgress = spring({ frame, fps, config: { damping: 14, stiffness: 85 } });
  const coolantFlow = (frame * 5) % 120;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#07090e',
        overflow: 'hidden',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Banner */}
      <div style={{ position: 'absolute', top: 90, left: 60, right: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontFamily: 'ui-monospace, monospace', color: '#ef4444', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          DATA-CENTER SCALE COHESION
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 950, margin: '8px 0 0 0', textTransform: 'uppercase' }}>
          Liquid Cooled Rack Scale Superclusters
        </h2>
      </div>

      {/* 2.5D Isometric NVL72 Rack Graphic */}
      <div
        style={{
          position: 'absolute',
          top: 260,
          left: 60,
          right: 60,
          height: 820,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${enterProgress})`,
        }}
      >
        <svg width="960" height="780" viewBox="0 0 960 780">
          <defs>
            <linearGradient id="coolantGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* NVL72 Giant Server Rack Outline */}
          <rect x="240" y="30" width="480" height="720" rx="16" fill="#090d16" stroke="#334155" strokeWidth="3" />

          {/* Staggered Server Blades (Compute Trays) */}
          {[...Array(9)].map((_, i) => (
            <g key={`tray-${i}`}>
              <rect x="270" y={60 + i * 72} width="420" height="54" rx="8" fill="url(#bladeGrad)" stroke="#475569" strokeWidth="1.5" />
              <circle cx="295" cy={87 + i * 72} r="5" fill="#22c55e" />
              <circle cx="315" cy={87 + i * 72} r="5" fill="#ef4444" />
              <text x="345" y={92 + i * 72} fill="#cbd5e1" fontSize="13" fontFamily="ui-monospace, monospace" fontWeight="700">
                BLADE ${i + 1}: 8x B200 DUAL DIES
              </text>
            </g>
          ))}

          {/* Liquid Cooling Manifold Tubes (Left and Right) */}
          <rect x="180" y="50" width="30" height="680" rx="15" fill="url(#coolantGrad)" filter="drop-shadow(0 0 15px rgba(6, 182, 212, 0.7))" />
          <rect x="750" y="50" width="30" height="680" rx="15" fill="url(#coolantGrad)" filter="drop-shadow(0 0 15px rgba(6, 182, 212, 0.7))" />

          {/* Flowing Coolant Pulses */}
          <circle cx="195" cy={70 + (coolantFlow * 5.5)} r="8" fill="#ffffff" />
          <circle cx="765" cy={70 + (coolantFlow * 5.5)} r="8" fill="#ffffff" />

          {/* Manifold Connecting Pipes into Blades */}
          {[...Array(9)].map((_, i) => (
            <g key={`pipes-${i}`}>
              <line x1="210" y1={87 + i * 72} x2="270" y2={87 + i * 72} stroke="#06b6d4" strokeWidth="4" />
              <line x1="690" y1={87 + i * 72} x2="750" y2={87 + i * 72} stroke="#06b6d4" strokeWidth="4" />
            </g>
          ))}
        </svg>
      </div>

      {/* Cluster Scale Metrics */}
      <div
        style={{
          position: 'absolute',
          top: 1140,
          left: 60,
          right: 60,
          display: 'flex',
          gap: 16,
        }}
      >
        <div style={{ flex: 1, padding: 18, backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: 16, border: '1px solid #06b6d4', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#06b6d4', fontFamily: 'ui-monospace, monospace' }}>NVLINK 5 FABRIC</div>
          <div style={{ fontSize: 32, fontWeight: 950, color: '#ffffff', marginTop: 4 }}>130 TB/s</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>All 72 GPUs connected as one</div>
        </div>
        <div style={{ flex: 1, padding: 18, backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: 16, border: '1px solid #ef4444', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#ef4444', fontFamily: 'ui-monospace, monospace' }}>COMPUTE CAPACITY</div>
          <div style={{ fontSize: 32, fontWeight: 950, color: '#ef4444', marginTop: 4 }}>1.4 EXAFLOPS</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Supercomputer in a single rack</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN VIDEO COMPONENT
// ============================================================================
export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 137 frames per scene, 7 scenes = 959 frames total
  const SCENE_DURATION = 137;
  const currentSceneIndex = Math.min(6, Math.floor(frame / SCENE_DURATION));
  const currentSceneFrame = frame % SCENE_DURATION;
  const currentScene = SCENES[currentSceneIndex];

  // Virtual Camera Interpolation across the 2D Living Canvas
  const nextSceneIndex = Math.min(6, currentSceneIndex + 1);
  const transitionWindow = 24; // last 24 frames of scene
  const transitionStart = SCENE_DURATION - transitionWindow;

  const currentCoords = SCENE_CANVAS_COORDS[currentSceneIndex];
  const nextCoords = SCENE_CANVAS_COORDS[nextSceneIndex];

  let camX = currentCoords.x;
  let camY = currentCoords.y;
  let camScale = currentCoords.scale;

  if (currentSceneFrame >= transitionStart && currentSceneIndex < 6) {
    const tProgress = easeOutCubic(segRel(currentSceneFrame, transitionStart, SCENE_DURATION));
    camX = interpolate(tProgress, [0, 1], [currentCoords.x, nextCoords.x]);
    camY = interpolate(tProgress, [0, 1], [currentCoords.y, nextCoords.y]);
    camScale = interpolate(tProgress, [0, 1], [currentCoords.scale, nextCoords.scale]);
  } else {
    // Subtle cinematic camera drift within scene
    const drift = Math.sin((currentSceneFrame / SCENE_DURATION) * Math.PI) * 0.02;
    camScale = currentCoords.scale + drift;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#07090e', overflow: 'hidden' }}>
      {/* Living Canvas World with Virtual Camera Transform */}
      <div
        style={{
          position: 'absolute',
          width: 1080,
          height: 1920,
          transformOrigin: '540px 960px',
          transform: `scale(${camScale}) translate(${-camX}px, ${-camY}px)`,
          willChange: 'transform',
        }}
      >
        {/* Scene 1: Hook */}
        <div style={{ position: 'absolute', left: SCENE_CANVAS_COORDS[0].x, top: SCENE_CANVAS_COORDS[0].y, width: 1080, height: 1920 }}>
          <Scene1HookView frame={currentSceneIndex === 0 ? currentSceneFrame : 0} fps={fps} />
        </div>

        {/* Scene 2: Product Showcase */}
        <div style={{ position: 'absolute', left: SCENE_CANVAS_COORDS[1].x, top: SCENE_CANVAS_COORDS[1].y, width: 1080, height: 1920 }}>
          <Scene2ProductShowcaseView frame={currentSceneIndex === 1 ? currentSceneFrame : 0} fps={fps} />
        </div>

        {/* Scene 3: Split Compare */}
        <div style={{ position: 'absolute', left: SCENE_CANVAS_COORDS[2].x, top: SCENE_CANVAS_COORDS[2].y, width: 1080, height: 1920 }}>
          <Scene3SplitCompareView frame={currentSceneIndex === 2 ? currentSceneFrame : 0} fps={fps} />
        </div>

        {/* Scene 4: Stat Callout */}
        <div style={{ position: 'absolute', left: SCENE_CANVAS_COORDS[3].x, top: SCENE_CANVAS_COORDS[3].y, width: 1080, height: 1920 }}>
          <Scene4StatCalloutView frame={currentSceneIndex === 3 ? currentSceneFrame : 0} fps={fps} />
        </div>

        {/* Scene 5: Fact Card */}
        <div style={{ position: 'absolute', left: SCENE_CANVAS_COORDS[4].x, top: SCENE_CANVAS_COORDS[4].y, width: 1080, height: 1920 }}>
          <Scene5FactCardView frame={currentSceneIndex === 4 ? currentSceneFrame : 0} fps={fps} />
        </div>

        {/* Scene 6: Hero Object */}
        <div style={{ position: 'absolute', left: SCENE_CANVAS_COORDS[5].x, top: SCENE_CANVAS_COORDS[5].y, width: 1080, height: 1920 }}>
          <Scene6HeroObjectView frame={currentSceneIndex === 5 ? currentSceneFrame : 0} fps={fps} />
        </div>

        {/* Scene 7: Exact Bittrix Technologies Outro */}
        <div style={{ position: 'absolute', left: SCENE_CANVAS_COORDS[6].x, top: SCENE_CANVAS_COORDS[6].y, width: 1080, height: 1920 }}>
          <BittrixOutroExactView currentSceneFrame={currentSceneIndex === 6 ? currentSceneFrame : 0} durationInFrames={SCENE_DURATION} fps={fps} />
        </div>
      </div>

      {/* Synchronized Kinetic Karaoke Captions (Active for scenes 1 to 6) */}
      {currentSceneIndex < 6 && (
        <KineticKaraokeCaption
          scene={currentScene}
          currentSceneFrame={currentSceneFrame}
        />
      )}
    </AbsoluteFill>
  );
}
