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
// TIMELINE METADATA & WORD-LEVEL KARAOKE TIMINGS
// ============================================================================
const SCENE_1_WORDS = [
  { word: 'The', startFrame: 3, endFrame: 7 },
  { word: 'algorithm', startFrame: 8, endFrame: 24 },
  { word: 'hashes', startFrame: 25, endFrame: 39 },
  { word: 'the', startFrame: 39, endFrame: 42 },
  { word: 'search', startFrame: 42, endFrame: 53 },
  { word: 'key', startFrame: 53, endFrame: 61 },
  { word: 'to', startFrame: 62, endFrame: 66 },
  { word: 'compute', startFrame: 66, endFrame: 79 },
  { word: 'a', startFrame: 80, endFrame: 81 },
  { word: 'direct', startFrame: 82, endFrame: 95 },
  { word: 'memory', startFrame: 95, endFrame: 106 },
  { word: 'bucket', startFrame: 106, endFrame: 116 },
  { word: 'offset', startFrame: 116, endFrame: 132 },
];

const SCENE_2_WORDS = [
  { word: 'Pointer', startFrame: 5, endFrame: 14 },
  { word: 'dereferencing', startFrame: 14, endFrame: 37 },
  { word: 'resolves', startFrame: 38, endFrame: 52 },
  { word: 'collisions', startFrame: 53, endFrame: 69 },
  { word: 'along', startFrame: 69, endFrame: 79 },
  { word: 'the', startFrame: 80, endFrame: 83 },
  { word: 'bucket', startFrame: 83, endFrame: 92 },
  { word: 'chain', startFrame: 92, endFrame: 102 },
  { word: 'to', startFrame: 105, endFrame: 109 },
  { word: 'retrieve', startFrame: 109, endFrame: 126 },
  { word: 'the', startFrame: 126, endFrame: 129 },
  { word: 'stored', startFrame: 129, endFrame: 140 },
  { word: 'value', startFrame: 140, endFrame: 153 },
];

const SCENE_3_WORDS = [
  { word: 'Accelerate', startFrame: 3, endFrame: 22 },
  { word: 'your', startFrame: 22, endFrame: 28 },
  { word: 'engineering', startFrame: 28, endFrame: 46 },
  { word: 'with', startFrame: 51, endFrame: 56 },
  { word: 'Bittrix', startFrame: 59, endFrame: 70 },
  { word: 'Technologies', startFrame: 71, endFrame: 95 },
];

// ============================================================================
// CONTINUOUS AMBIENT BACKGROUND & LIVING GRID
// ============================================================================
function AmbientCanvas({ frame }: { frame: number }) {
  const gridOffsetY = (frame * 1.8) % 60;
  const gridOffsetX = (frame * 0.9) % 60;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#05070d',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Dynamic Deep Spatial Glows */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -150,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.16) 0%, transparent 70%)',
          filter: 'blur(90px)',
          transform: `translate(${Math.sin(frame * 0.02) * 50}px, ${Math.cos(frame * 0.015) * 50}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 250,
          right: -200,
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 68%)',
          filter: 'blur(100px)',
          transform: `translate(${Math.cos(frame * 0.025) * 60}px, ${Math.sin(frame * 0.02) * 40}px)`,
        }}
      />

      {/* Cyber Grid Pattern */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.22,
        }}
      >
        <defs>
          <pattern
            id="livingGrid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${gridOffsetX}, ${gridOffsetY})`}
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="#22c55e"
              strokeWidth="0.8"
              strokeOpacity="0.35"
            />
            <circle cx="0" cy="0" r="1.5" fill="#22c55e" fillOpacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#livingGrid)" />
      </svg>

      {/* Drifting Memory Data Packets */}
      {Array.from({ length: 18 }).map((_, i) => {
        const seed = i * 73.19;
        const speed = 1.2 + (i % 4) * 0.45;
        const posX = (seed * 19) % 1080;
        const startY = (seed * 37) % 1920;
        const curY = (startY + frame * speed) % 1920;
        const opacity = interpolate(
          Math.sin(frame * 0.05 + i),
          [-1, 1],
          [0.15, 0.65]
        );
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: posX,
              top: curY,
              width: (i % 2 === 0 ? 3 : 5),
              height: (i % 2 === 0 ? 12 : 24),
              borderRadius: 3,
              backgroundColor: i % 3 === 0 ? '#10b981' : '#22c55e',
              boxShadow: '0 0 10px #22c55e',
              opacity,
            }}
          />
        );
      })}

      {/* Scanline Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3, 7, 18, 0.82) 100%)',
        }}
      />
    </AbsoluteFill>
  );
}

// ============================================================================
// ZERO-OFFSET KINETIC KARAOKE CAPTIONS
// ============================================================================
function KineticCaptions({
  words,
  localFrame,
  themeColor = '#22c55e',
}: {
  words: Array<{ word: string; startFrame: number; endFrame: number }>;
  localFrame: number;
  themeColor?: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 410,
        left: 60,
        right: 60,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px 16px',
        padding: '20px 28px',
        backgroundColor: 'rgba(8, 14, 26, 0.78)',
        borderRadius: 24,
        border: '1px solid rgba(34, 197, 94, 0.25)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        zIndex: 50,
      }}
    >
      {words.map((item, idx) => {
        const isActive = localFrame >= item.startFrame && localFrame <= item.endFrame;
        const isPast = localFrame > item.endFrame;

        const wordSpring = spring({
          frame: localFrame - item.startFrame,
          fps: 30,
          config: { damping: 12, stiffness: 220 },
        });

        const scale = isActive
          ? interpolate(wordSpring, [0, 1], [1, 1.22])
          : 1;

        const textColor = isActive
          ? '#ffffff'
          : isPast
          ? 'rgba(255, 255, 255, 0.92)'
          : 'rgba(156, 163, 175, 0.55)';

        const bgPill = isActive
          ? `linear-gradient(135deg, ${themeColor}, #16a34a)`
          : 'transparent';

        const glow = isActive
          ? `0 0 24px ${themeColor}, 0 2px 10px rgba(0,0,0,0.5)`
          : 'none';

        return (
          <span
            key={idx}
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: textColor,
              transform: `scale(${scale})`,
              display: 'inline-block',
              padding: isActive ? '4px 14px' : '4px 4px',
              borderRadius: 12,
              background: bgPill,
              boxShadow: glow,
              transition: 'all 0.08s ease-out',
            }}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
}

// ============================================================================
// SCENE 1: HASH FUNCTION & DIRECT BUCKET INDEXING
// ============================================================================
function Scene1Content({ localFrame }: { localFrame: number }) {
  const { fps } = useVideoConfig();

  // Entrance spring
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 140 },
  });

  // Key hashing phase: frame 25 to 70
  const hashComputeProgress = interpolate(localFrame, [20, 65], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const selectedBucket = 3; // Index target
  const isBucketSelected = localFrame >= 85;

  const bucketSpring = spring({
    frame: Math.max(0, localFrame - 85),
    fps,
    config: { damping: 11, stiffness: 180 },
  });

  // Pseudo-hash generation cycling
  const hashHex = useMemo(() => {
    if (localFrame < 22) return '0x00000000';
    if (localFrame >= 65) return '0xA8F439D3';
    const rand = Math.floor((localFrame * 9384729) % 0xffffffff).toString(16).toUpperCase();
    return `0x${rand.padStart(8, '0')}`;
  }, [localFrame]);

  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${interpolate(enterSpring, [0, 1], [60, 0])}px) scale(${interpolate(enterSpring, [0, 1], [0.94, 1])})`,
        opacity: interpolate(enterSpring, [0, 1], [0, 1]),
      }}
    >
      {/* Title HUD Header */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(34, 197, 94, 0.25)',
          paddingBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              boxShadow: '0 0 12px #22c55e',
            }}
          />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 22,
              fontWeight: 700,
              color: '#86efac',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            SYS::HASH_MAP::LOOKUP
          </span>
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 20,
            color: '#6ee7b7',
            background: 'rgba(34, 197, 94, 0.12)',
            padding: '6px 16px',
            borderRadius: 8,
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          O(1) DIRECT ACCESS
        </div>
      </div>

      {/* MAIN CONTAINER: KEY -> HASH FUNCTION -> BUCKET ARRAY */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 60,
          right: 60,
          height: 980,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        {/* Step 1 Card: Key String Input */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            border: '2px solid rgba(34, 197, 94, 0.4)',
            borderRadius: 20,
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontFamily: 'JetBrains Mono, monospace',
                color: '#94a3b8',
                marginBottom: 6,
              }}
            >
              SEARCH KEY INPUT (STRING)
            </div>
            <div
              style={{
                fontSize: 38,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 800,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ color: '#22c55e' }}>&quot;user_session_token&quot;</span>
            </div>
          </div>
          <div
            style={{
              padding: '10px 18px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              borderRadius: 12,
              border: '1px solid #22c55e',
              color: '#4ade80',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            LEN: 18 B
          </div>
        </div>

        {/* Hashing Pulse / Compute Stage */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            position: 'relative',
          }}
        >
          {/* Laser connector line */}
          <div
            style={{
              width: 4,
              height: 48,
              backgroundColor: '#22c55e',
              boxShadow: '0 0 16px #22c55e',
            }}
          />
        </div>

        {/* Hash Function Processor Engine */}
        <div
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 78, 59, 0.35))',
            border: '2px solid #10b981',
            borderRadius: 22,
            padding: '26px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 22,
                fontWeight: 800,
                color: '#6ee7b7',
              }}
            >
              HASH ENGINE: MurmurHash3_x64
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 20,
                color: '#34d399',
              }}
            >
              {Math.min(100, Math.floor(hashComputeProgress))}% EXECUTED
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              padding: '16px 24px',
              borderRadius: 14,
              border: '1px solid rgba(52, 211, 153, 0.3)',
            }}
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, color: '#e2e8f0' }}>
              digest = {hashHex}
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 24,
                fontWeight: 700,
                color: '#22c55e',
              }}
            >
              index = digest % 8 = <strong style={{ fontSize: 32, color: '#fef08a' }}>{localFrame >= 65 ? '3' : '?'}</strong>
            </span>
          </div>
        </div>

        {/* Laser down into bucket memory bank */}
        <div
          style={{
            width: 4,
            height: 32,
            backgroundColor: localFrame >= 70 ? '#22c55e' : 'rgba(255,255,255,0.2)',
            boxShadow: localFrame >= 70 ? '0 0 16px #22c55e' : 'none',
          }}
        />

        {/* Step 3: Array of 8 Memory Buckets */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'rgba(10, 15, 29, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 22,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 8,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 18,
                color: '#94a3b8',
                letterSpacing: '0.05em',
              }}
            >
              RAM ADDRESS RANGE: 0x7FFF0040 - 0x7FFF0080
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 18,
                color: '#4ade80',
              }}
            >
              TARGET: BUCKET[3]
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
            }}
          >
            {Array.from({ length: 8 }).map((_, bIdx) => {
              const isTarget = bIdx === selectedBucket && isBucketSelected;
              const scale = isTarget ? interpolate(bucketSpring, [0, 1], [1, 1.08]) : 1;
              const bg = isTarget
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.45), rgba(5, 150, 105, 0.75))'
                : 'rgba(255, 255, 255, 0.04)';
              const border = isTarget ? '2px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.08)';
              const glow = isTarget ? '0 0 25px rgba(74, 222, 128, 0.5)' : 'none';

              return (
                <div
                  key={bIdx}
                  style={{
                    padding: '16px 12px',
                    borderRadius: 14,
                    background: bg,
                    border,
                    boxShadow: glow,
                    transform: `scale(${scale})`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 16,
                      color: isTarget ? '#ffffff' : '#94a3b8',
                      fontWeight: isTarget ? 800 : 500,
                    }}
                  >
                    SLOT [{bIdx}]
                  </div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 20,
                      fontWeight: 800,
                      color: isTarget ? '#fef08a' : '#cbd5e1',
                    }}
                  >
                    {isTarget ? 'PTR 0x8C' : bIdx % 2 === 0 ? 'NULL' : 'PTR 0x1A'}
                  </div>
                  {isTarget && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        right: -8,
                        backgroundColor: '#22c55e',
                        color: '#000',
                        fontSize: 11,
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontFamily: 'sans-serif',
                      }}
                    >
                      HIT
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 2: POINTER DEREFERENCING & COLLISION RESOLUTION CHAIN
// ============================================================================
function Scene2Content({ localFrame }: { localFrame: number }) {
  const { fps } = useVideoConfig();

  // Entrance spring
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 140 },
  });

  // Pointer traversal stages:
  // Node 1 (Key mismatch): frames 15 - 55
  // Traverse to Node 2 (Match!): frames 56 - 95
  // Value extraction: frames 96 - 150
  const isTraversing = localFrame >= 50;
  const isMatchFound = localFrame >= 80;
  const isValueExtracted = localFrame >= 115;

  const matchSpring = spring({
    frame: Math.max(0, localFrame - 80),
    fps,
    config: { damping: 12, stiffness: 190 },
  });

  const extractSpring = spring({
    frame: Math.max(0, localFrame - 115),
    fps,
    config: { damping: 10, stiffness: 160 },
  });

  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${interpolate(enterSpring, [0, 1], [60, 0])}px) scale(${interpolate(enterSpring, [0, 1], [0.94, 1])})`,
        opacity: interpolate(enterSpring, [0, 1], [0, 1]),
      }}
    >
      {/* Header HUD */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(34, 197, 94, 0.25)',
          paddingBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: '#eab308',
              boxShadow: '0 0 12px #eab308',
            }}
          />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 22,
              fontWeight: 700,
              color: '#fef08a',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            COLLISION RESOLUTION :: SEPARATE CHAINING
          </span>
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 20,
            color: '#86efac',
            background: 'rgba(34, 197, 94, 0.12)',
            padding: '6px 16px',
            borderRadius: 8,
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          BUCKET[3] LINKED LIST
        </div>
      </div>

      {/* Main Visual: Bucket Head -> Node 0 (Mismatch) -> Node 1 (Target Hit!) */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 60,
          right: 60,
          height: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Bucket Origin Box */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            border: '2px solid rgba(34, 197, 94, 0.5)',
            borderRadius: 18,
            padding: '18px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                background: '#22c55e',
                color: '#000',
                fontWeight: 900,
                fontSize: 16,
                padding: '4px 12px',
                borderRadius: 8,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              BUCKET[3]
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, color: '#f1f5f9' }}>
              Head Pointer: <strong style={{ color: '#4ade80' }}>*0x7FFF0058</strong>
            </span>
          </div>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 18,
              color: '#94a3b8',
            }}
          >
            DEREFERENCE -&gt;
          </span>
        </div>

        {/* Dynamic Pointer Arrow Line */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: 4,
              height: 36,
              background: 'linear-gradient(to bottom, #22c55e, #38bdf8)',
              boxShadow: '0 0 12px #38bdf8',
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '12px solid #38bdf8',
            }}
          />
        </div>

        {/* Node 1: Key Mismatch (Hash Collision) */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'rgba(23, 23, 37, 0.88)',
            border: localFrame < 50 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 18,
            padding: '20px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            opacity: localFrame > 60 ? 0.6 : 1,
            transform: localFrame < 50 ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 16,
                color: '#cbd5e1',
              }}
            >
              NODE @ 0x7FFF0058 (COLLISION)
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 15,
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '3px 10px',
                borderRadius: 6,
              }}
            >
              KEY MISMATCH: &quot;auth_cache_v1&quot;
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 20,
              color: '#94a3b8',
            }}
          >
            <span>Key: &quot;auth_cache_v1&quot;</span>
            <span>next -&gt; <strong style={{ color: '#38bdf8' }}>0x7FFF0190</strong></span>
          </div>
        </div>

        {/* Pointer Arrow traversing to next node */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: 4,
              height: 36,
              backgroundColor: isTraversing ? '#22c55e' : 'rgba(255,255,255,0.2)',
              boxShadow: isTraversing ? '0 0 16px #22c55e' : 'none',
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: `12px solid ${isTraversing ? '#22c55e' : 'rgba(255,255,255,0.2)'}`,
            }}
          />
        </div>

        {/* Node 2: Exact Key Match! */}
        <div
          style={{
            width: '100%',
            backgroundColor: isMatchFound
              ? 'rgba(6, 78, 59, 0.5)'
              : 'rgba(15, 23, 42, 0.88)',
            border: isMatchFound ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20,
            padding: '24px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transform: isMatchFound ? `scale(${interpolate(matchSpring, [0, 1], [1, 1.04])})` : 'scale(1)',
            boxShadow: isMatchFound ? '0 0 40px rgba(34, 197, 94, 0.35)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 17,
                color: '#86efac',
                fontWeight: 700,
              }}
            >
              NODE @ 0x7FFF0190
            </span>
            {isMatchFound && (
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 16,
                  color: '#ffffff',
                  background: '#16a34a',
                  padding: '4px 12px',
                  borderRadius: 8,
                  fontWeight: 800,
                }}
              >
                EXACT KEY MATCH ✓
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 24,
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            Key: &quot;user_session_token&quot;
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 18,
              color: '#94a3b8',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Payload Offset: +16 B</span>
            <span>next: NULL</span>
          </div>
        </div>

        {/* Value Extraction Callout Card */}
        {isValueExtracted && (
          <div
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.4))',
              border: '2px solid #4ade80',
              borderRadius: 20,
              padding: '24px 30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 12px 35px rgba(34, 197, 94, 0.4)',
              transform: `scale(${interpolate(extractSpring, [0, 1], [0.85, 1])})`,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 16,
                  color: '#fef08a',
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                PAYLOAD VALUE RETRIEVED
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 32,
                  fontWeight: 800,
                  color: '#ffffff',
                }}
              >
                {'{ uid: 94821, role: &quot;ADMIN&quot; }'}
              </div>
            </div>
            <div
              style={{
                backgroundColor: '#22c55e',
                color: '#000000',
                padding: '12px 20px',
                borderRadius: 14,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              SUCCESS
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 3: EXACT BITTRIX TECHNOLOGIES ROYAL PURPLE (#5b1a78) OUTRO
// ============================================================================
function Scene3BittrixOutro({ localFrame }: { localFrame: number }) {
  const { fps } = useVideoConfig();

  // Entrance spring
  const enterSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 130 },
  });

  // Gear rotation (12 teeth)
  const gearRotation = localFrame * 2.2;
  // Rolling chain movement
  const chainOffset = (localFrame * 5) % 80;

  // Diagonal light sweep
  const sweepPos = interpolate(localFrame, [35, 75], [-400, 1200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Underline expand
  const underlineWidth = interpolate(localFrame, [45, 80], [0, 680], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bittrixLetters = ['B', 'I', 'T', 'T', 'R', 'I', 'X'];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1b0625',
        overflow: 'hidden',
        transform: `scale(${interpolate(enterSpring, [0, 1], [0.92, 1])})`,
        opacity: interpolate(enterSpring, [0, 1], [0, 1]),
      }}
    >
      {/* 6-Point Radial Gradient Hexagon with Spoke Circles */}
      <svg
        width="1080"
        height="1920"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <radialGradient id="royalPurpleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7a22a3" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#5b1a78" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#1b0625" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="purpleSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#5b1a78" />
          </linearGradient>
        </defs>

        {/* Ambient Radial Backdrop */}
        <circle cx="540" cy="740" r="580" fill="url(#royalPurpleGlow)" />

        {/* 6-Point Hexagon Perimeter & Spokes */}
        <g transform="translate(540, 740)">
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 60 * Math.PI) / 180;
            const rOuter = 320;
            const x = Math.cos(angle) * rOuter;
            const y = Math.sin(angle) * rOuter;
            return (
              <g key={i}>
                {/* Spoke Line */}
                <line
                  x1="0"
                  y1="0"
                  x2={x}
                  y2={y}
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeOpacity="0.45"
                  strokeDasharray="6 6"
                />
                {/* Spoke Orbit Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="16"
                  fill="#5b1a78"
                  stroke="#d8b4fe"
                  strokeWidth="3"
                  filter="drop-shadow(0 0 10px #c084fc)"
                />
                <circle cx={x} cy={y} r="6" fill="#f3e8ff" />
              </g>
            );
          })}

          {/* Hexagon Outline */}
          <polygon
            points={Array.from({ length: 6 })
              .map((_, i) => {
                const angle = (i * 60 * Math.PI) / 180;
                return `${Math.cos(angle) * 320},${Math.sin(angle) * 320}`;
              })
              .join(' ')}
            fill="none"
            stroke="#c084fc"
            strokeWidth="3.5"
            strokeOpacity="0.6"
          />
        </g>
      </svg>

      {/* Rolling Chain Link Track (Horizontal beneath / behind icon) */}
      <div
        style={{
          position: 'absolute',
          top: 730,
          left: 0,
          width: 1080,
          height: 20,
          display: 'flex',
          gap: 20,
          transform: `translateX(-${chainOffset}px)`,
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: 26 }).map((_, cIdx) => (
          <div
            key={cIdx}
            style={{
              width: 44,
              height: 18,
              borderRadius: 9,
              border: '3px solid #d8b4fe',
              backgroundColor: 'transparent',
            }}
          />
        ))}
      </div>

      {/* Rotating 12-Tooth Industrial Gear with Serif 'B' */}
      <div
        style={{
          position: 'absolute',
          top: 560,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 360,
          height: 360,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Gear Teeth SVG */}
        <svg
          width="340"
          height="340"
          viewBox="-170 -170 340 340"
          style={{
            position: 'absolute',
            transform: `rotate(${gearRotation}deg)`,
            filter: 'drop-shadow(0 0 24px rgba(192, 132, 252, 0.6))',
          }}
        >
          {/* 12 Teeth */}
          {Array.from({ length: 12 }).map((_, t) => {
            const rot = t * 30;
            return (
              <rect
                key={t}
                x="-14"
                y="-155"
                width="28"
                height="32"
                rx="6"
                fill="#a855f7"
                stroke="#f3e8ff"
                strokeWidth="2"
                transform={`rotate(${rot})`}
              />
            );
          })}
          {/* Main Gear Outer Ring */}
          <circle r="136" fill="#5b1a78" stroke="#d8b4fe" strokeWidth="6" />
          <circle r="105" fill="#3b0f52" stroke="#a855f7" strokeWidth="4" />
        </svg>

        {/* Serif 'B' Centerpiece */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 148,
            fontWeight: 900,
            color: '#ffffff',
            textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 35px #e9d5ff',
            transform: 'translateY(-6px)',
          }}
        >
          B
        </div>
      </div>

      {/* Staggered Letter Italic Bold "BITTRIX" */}
      <div
        style={{
          position: 'absolute',
          top: 980,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {bittrixLetters.map((char, i) => {
          const letterDelay = 20 + i * 3.5;
          const letterSpring = spring({
            frame: Math.max(0, localFrame - letterDelay),
            fps,
            config: { damping: 11, stiffness: 180 },
          });

          return (
            <span
              key={i}
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 82,
                fontWeight: 900,
                fontStyle: 'italic',
                color: '#ffffff',
                letterSpacing: '0.04em',
                transform: `scale(${interpolate(letterSpring, [0, 1], [0.3, 1])}) translateY(${interpolate(
                  letterSpring,
                  [0, 1],
                  [40, 0]
                )}px)`,
                opacity: interpolate(letterSpring, [0, 1], [0, 1]),
                textShadow: '0 0 30px rgba(192, 132, 252, 0.7), 0 4px 14px rgba(0,0,0,0.6)',
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* Tracking "TECHNOLOGIES" */}
      <div
        style={{
          position: 'absolute',
          top: 1090,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: `${interpolate(localFrame, [30, 90], [0.28, 0.44], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}em`,
          color: '#e9d5ff',
          opacity: interpolate(localFrame, [35, 55], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        TECHNOLOGIES
      </div>

      {/* Royal Purple Underline & Diagonal Light Sweep */}
      <div
        style={{
          position: 'absolute',
          top: 1145,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 6,
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: underlineWidth,
            height: '100%',
            backgroundColor: '#c084fc',
            boxShadow: '0 0 18px #d8b4fe, 0 0 35px #a855f7',
            borderRadius: 3,
            position: 'relative',
          }}
        >
          {/* Diagonal Sweep Flash */}
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: sweepPos,
              width: 140,
              height: 30,
              background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
              transform: 'skewX(-25deg)',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ============================================================================
// MAIN COMPOSITION EXPORT: GeneratedCliVideo
// ============================================================================
export default function GeneratedCliVideo() {
  const frame = useCurrentFrame();

  // Continuous Master Virtual Camera:
  // Scene 1: frame 0 -> 137 (cam zooms gently into hash logic)
  // Scene 2: frame 137 -> 294 (cam pans down to trace linked-list pointers)
  // Scene 3: frame 294 -> 423 (cam transitions seamlessly into royal purple outro)
  const camScale = interpolate(
    frame,
    [0, 120, 137, 270, 294, 420],
    [1.0, 1.05, 1.0, 1.06, 0.98, 1.02],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camY = interpolate(
    frame,
    [0, 137, 160, 294, 320, 423],
    [0, -10, 0, -15, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: '#05070d',
        overflow: 'hidden',
      }}
    >
      {/* Living background canvas persistent across all scenes */}
      <AmbientCanvas frame={frame} />

      {/* Master Virtual Camera Viewport */}
      <AbsoluteFill
        style={{
          transform: `translateY(${camY}px) scale(${camScale})`,
          transformOrigin: '50% 45%',
        }}
      >
        {/* ================================================================
            SCENE 1: HOOK - Hash Key to Direct Bucket Offset
            Duration: 137 frames (0 to 137)
        ================================================================ */}
        <Sequence from={0} durationInFrames={137}>
          <Scene1Content localFrame={frame} />
          <KineticCaptions
            words={SCENE_1_WORDS}
            localFrame={frame}
            themeColor="#22c55e"
          />
        </Sequence>

        {/* ================================================================
            SCENE 2: BODY - Pointer Dereferencing & Collision Resolution
            Duration: 157 frames (137 to 294)
        ================================================================ */}
        <Sequence from={137} durationInFrames={157}>
          <Scene2Content localFrame={frame - 137} />
          <KineticCaptions
            words={SCENE_2_WORDS}
            localFrame={frame - 137}
            themeColor="#10b981"
          />
        </Sequence>

        {/* ================================================================
            SCENE 3: CTA - Bittrix Technologies Royal Purple Outro
            Duration: 129 frames (294 to 423)
        ================================================================ */}
        <Sequence from={294} durationInFrames={129}>
          <Scene3BittrixOutro localFrame={frame - 294} />
          <KineticCaptions
            words={SCENE_3_WORDS}
            localFrame={frame - 294}
            themeColor="#a855f7"
          />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}