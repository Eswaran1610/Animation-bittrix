import React, { useMemo } from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

// ============================================================================
// EXACT BITTRIX TECHNOLOGIES OUTRO COMPONENT
// Grounded 1:1 in /home/eswaran/Downloads/bittrix-reel(1).html
// Colors: Royal Purple #5b1a78, Charcoal #1d1a1a, Warm Cream #fdf3d0
// ============================================================================

const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const eo = (u: number) => 1 - Math.pow(1 - u, 3);
const eb = (u: number) => {
  const s = 1.70158;
  const u1 = u - 1;
  return u1 * u1 * ((s + 1) * u1 + s) + 1;
};

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

export const BittrixOutroExact: React.FC<{
  startFrame?: number;
  durationInFrames?: number;
  callToAction?: string;
  theme?: 'cream' | 'dark';
}> = ({ callToAction = 'Follow for more interesting concepts', theme = 'cream' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.min(3, Math.max(0, frame / fps));

  // Hexagon scale and rotation
  const hs = eb(seg(t, 0, 0.7));
  const hexRot = (1 - eo(seg(t, 0, 0.8))) * -60; // in degrees

  // Rolling chain alpha
  const ca = seg(t, 0.3, 0.6) * (1 - seg(t, 2, 2.45));
  const ph = 0.6 * t + 0.25 * t * t;
  const N = 42;

  // Gear & B scale
  const gs = eb(seg(t, 0.6, 1.3));
  const gearRot = t * 2.2 * (180 / Math.PI);

  // Underline expansion
  const bw = 520 * eo(seg(t, 2.1, 2.6));

  // Light shine sweep
  const sh = seg(t, 2.35, 2.95);
  const shineX = -400 + (1080 + 800) * sh;

  // Background colors
  const isCream = theme === 'cream';
  const bgStart = isCream ? '#fff9e2' : '#14081c';
  const bgEnd = isCream ? '#fdf3d0' : '#08030c';
  const textColor = isCream ? D : '#e2e8f0';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 540px 720px, ${bgStart} 0%, ${bgEnd} 80%)`,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="hexRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7a2ba3" />
            <stop offset="100%" stopColor="#5b1a78" />
          </radialGradient>
        </defs>

        {/* 1. Main Hexagon */}
        <g transform={`translate(${CX}, ${CY}) rotate(${hexRot}) scale(${Math.max(0, hs)})`}>
          <polygon
            points={HX.map((p) => `${p[0]},${p[1]}`).join(' ')}
            fill="url(#hexRadial)"
            filter="drop-shadow(0 0 35px rgba(91, 26, 120, 0.45))"
          />
        </g>

        {/* 2. Spokes and Outer Nodes */}
        {NODES.map((n, i) => {
          const u = eo(seg(t, 0.5 + i * 0.12, 1.0 + i * 0.12));
          const ex = n[0] + (CX - n[0]) * 0.5 * u;
          const ey = n[1] + (CY - n[1]) * 0.5 * u;
          const s = eb(seg(t, 0.5 + i * 0.12, 0.9 + i * 0.12)) * (1 + 0.07 * Math.sin(t * 7 + i));

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
          {/* 12-tooth Gear */}
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
              return <path d={d} fill={isCream ? BG : '#220b33'} stroke="#9a4cc2" strokeWidth={2} />;
            })()}
          </g>

          {/* Central Purple Circle */}
          <circle cx={0} cy={0} r={76} fill={P} filter="drop-shadow(0 0 20px rgba(91, 26, 120, 0.8))" />

          {/* Bold Serif 'B' */}
          <text
            x={0}
            y={8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Georgia, serif"
            fontWeight={700}
            fontSize={130}
            fill={isCream ? BG : '#ffffff'}
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

      {/* 6. Wordmark BITTRIX (Letter by Letter Elastic Stagger) */}
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
          const u = eo(seg(t, 1.4 + i * 0.07, 1.9 + i * 0.07));
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

      {/* 7. Subtitle TECHNOLOGIES (Tracking letter expansion) */}
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
          color: textColor,
          opacity: eo(seg(t, 1.9, 2.5)),
          letterSpacing: `${10 + 16 * eo(seg(t, 1.9, 2.5))}px`,
          textTransform: 'uppercase',
        }}
      >
        TECHNOLOGIES
      </div>

      {/* 8. Call to Action Voice Subtitle Pill */}
      {t >= 2.0 && (
        <div
          style={{
            position: 'absolute',
            top: 1370,
            left: 80,
            right: 80,
            display: 'flex',
            justifyContent: 'center',
            opacity: eo(seg(t, 2.0, 2.5)),
            transform: `translateY(${(1 - eo(seg(t, 2.0, 2.5))) * 20}px)`,
          }}
        >
          <div
            style={{
              padding: '12px 32px',
              borderRadius: 999,
              background: isCream ? 'rgba(91, 26, 120, 0.09)' : 'rgba(122, 43, 163, 0.25)',
              border: `1.5px solid ${P}`,
              color: isCream ? P : '#ffffff',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 2,
              boxShadow: '0 8px 24px rgba(91, 26, 120, 0.2)',
            }}
          >
            {callToAction}
          </div>
        </div>
      )}

      {/* 9. Diagonal Light Shine Sweep */}
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

export default BittrixOutroExact;
