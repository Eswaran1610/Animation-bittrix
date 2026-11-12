import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ==========================================
// SCENE TIMING & WORD METADATA DEFINITIONS
// ==========================================
interface WordTimestamp {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface SceneConfig {
  scene_number: number;
  role: 'hook' | 'body' | 'cta';
  durationInFrames: number;
  startFrame: number;
  narration: string;
  on_screen_text: string;
  themeColor: string;
  badgeTag: string;
  words: WordTimestamp[];
}

const SCENES: SceneConfig[] = [
  {
    scene_number: 1,
    role: 'hook',
    durationInFrames: 137,
    startFrame: 0,
    narration: 'What powers modern Tata engineering beneath?',
    on_screen_text: 'What Powers Modern Tata Engineering?',
    themeColor: '#a855f7',
    badgeTag: 'ARCHITECTURAL DEEP-DIVE',
    words: [
      { word: 'What', startFrame: 3, endFrame: 10 },
      { word: 'powers', startFrame: 10, endFrame: 22 },
      { word: 'modern', startFrame: 22, endFrame: 32 },
      { word: 'Tata', startFrame: 33, endFrame: 42 },
      { word: 'engineering', startFrame: 42, endFrame: 57 },
      { word: 'beneath?', startFrame: 58, endFrame: 74 },
    ],
  },
  {
    scene_number: 2,
    role: 'body',
    durationInFrames: 137,
    startFrame: 137,
    narration: 'The acti.ev skateboard chassis anchors modular drive.',
    on_screen_text: 'acti.ev Skateboard Chassis Core',
    themeColor: '#06b6d4',
    badgeTag: 'GEN-2 EV ARCHITECTURE',
    words: [
      { word: 'The', startFrame: 3, endFrame: 7 },
      { word: 'acti.ev', startFrame: 8, endFrame: 28 },
      { word: 'skateboard', startFrame: 28, endFrame: 44 },
      { word: 'chassis', startFrame: 44, endFrame: 56 },
      { word: 'anchors', startFrame: 57, endFrame: 67 },
      { word: 'modular', startFrame: 67, endFrame: 80 },
      { word: 'drive.', startFrame: 81, endFrame: 96 },
    ],
  },
  {
    scene_number: 3,
    role: 'body',
    durationInFrames: 137,
    startFrame: 274,
    narration: 'Orthogonal cells boost energy density ten percent.',
    on_screen_text: 'Orthogonal High-Density Cell Packaging',
    themeColor: '#a855f7',
    badgeTag: 'PRISMATIC ENERGY MATRIX',
    words: [
      { word: 'Orthogonal', startFrame: 3, endFrame: 21 },
      { word: 'cells', startFrame: 22, endFrame: 32 },
      { word: 'boost', startFrame: 33, endFrame: 43 },
      { word: 'energy', startFrame: 43, endFrame: 54 },
      { word: 'density', startFrame: 54, endFrame: 67 },
      { word: 'ten', startFrame: 67, endFrame: 74 },
      { word: 'percent.', startFrame: 74, endFrame: 93 },
    ],
  },
  {
    scene_number: 4,
    role: 'body',
    durationInFrames: 137,
    startFrame: 411,
    narration: 'DC fast charging adds hundred-kilometer range rapidly.',
    on_screen_text: 'Rapid DC Fast-Charge Pipeline',
    themeColor: '#06b6d4',
    badgeTag: 'HIGH-VOLTAGE TELEMETRY',
    words: [
      { word: 'DC', startFrame: 3, endFrame: 15 },
      { word: 'fast', startFrame: 16, endFrame: 26 },
      { word: 'charging', startFrame: 27, endFrame: 40 },
      { word: 'adds', startFrame: 40, endFrame: 47 },
      { word: 'hundred-km', startFrame: 48, endFrame: 72 },
      { word: 'range', startFrame: 72, endFrame: 81 },
      { word: 'rapidly.', startFrame: 81, endFrame: 99 },
    ],
  },
  {
    scene_number: 5,
    role: 'body',
    durationInFrames: 137,
    startFrame: 548,
    narration: 'OMEGA-ARC steel delivers five-star crash protection.',
    on_screen_text: 'OMEGA-ARC High-Strength Steel Cage',
    themeColor: '#a855f7',
    badgeTag: 'STRUCTURAL DYNAMICS & G-NCAP',
    words: [
      { word: 'OMEGA-ARC', startFrame: 3, endFrame: 22 },
      { word: 'steel', startFrame: 22, endFrame: 30 },
      { word: 'delivers', startFrame: 30, endFrame: 44 },
      { word: 'five-star', startFrame: 44, endFrame: 59 },
      { word: 'crash', startFrame: 60, endFrame: 68 },
      { word: 'protection.', startFrame: 69, endFrame: 91 },
    ],
  },
  {
    scene_number: 6,
    role: 'body',
    durationInFrames: 137,
    startFrame: 685,
    narration: 'Subfloor twin cylinders protect full boot volume.',
    on_screen_text: 'Patented Twin-Cylinder Subfloor Packaging',
    themeColor: '#06b6d4',
    badgeTag: 'INTELLIGENT PACKAGING',
    words: [
      { word: 'Subfloor', startFrame: 3, endFrame: 20 },
      { word: 'twin', startFrame: 20, endFrame: 27 },
      { word: 'cylinders', startFrame: 27, endFrame: 43 },
      { word: 'protect', startFrame: 43, endFrame: 57 },
      { word: 'full', startFrame: 57, endFrame: 64 },
      { word: 'boot', startFrame: 65, endFrame: 71 },
      { word: 'volume.', startFrame: 71, endFrame: 88 },
    ],
  },
  {
    scene_number: 7,
    role: 'cta',
    durationInFrames: 137,
    startFrame: 822,
    narration: 'Follow Bittrix Technologies for more interesting concepts.',
    on_screen_text: 'Follow Bittrix Technologies',
    themeColor: '#5b1a78',
    badgeTag: 'INNOVATION SPOTLIGHT',
    words: [
      { word: 'Follow', startFrame: 4, endFrame: 20 },
      { word: 'Bittrix', startFrame: 20, endFrame: 42 },
      { word: 'Technologies', startFrame: 43, endFrame: 68 },
      { word: 'for', startFrame: 69, endFrame: 76 },
      { word: 'more', startFrame: 77, endFrame: 86 },
      { word: 'interesting', startFrame: 87, endFrame: 104 },
      { word: 'concepts.', startFrame: 105, endFrame: 125 },
    ],
  },
];

// Helper Easing
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);
const easeOutBack = (u: number) => {
  const s = 1.70158;
  const x = u - 1;
  return x * x * ((s + 1) * x + s) + 1;
};

// ==========================================
// KINETIC CAPTION COMPONENT
// ==========================================
const KineticKaraokeCaption: React.FC<{
  words: WordTimestamp[];
  localFrame: number;
  themeColor: string;
  isLightBg?: boolean;
}> = ({ words, localFrame, themeColor, isLightBg = false }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px 18px',
        maxWidth: 960,
        margin: '0 auto',
        padding: '16px 24px',
        background: isLightBg ? 'rgba(253, 243, 208, 0.85)' : 'rgba(10, 10, 20, 0.72)',
        borderRadius: 24,
        backdropFilter: 'blur(16px)',
        border: `1.5px solid ${themeColor}44`,
        boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 20px ${themeColor}22`,
      }}
    >
      {words.map((item, idx) => {
        const isActive = localFrame >= item.startFrame && localFrame <= item.endFrame;
        const isPast = localFrame > item.endFrame;

        const wordSpring = spring({
          frame: Math.max(0, localFrame - item.startFrame),
          fps: 60,
          config: { damping: 14, stiffness: 220 },
        });

        const scale = isActive
          ? interpolate(wordSpring, [0, 1], [0.92, 1.14])
          : 1.0;

        let textColor = isLightBg ? '#4a1563' : '#94a3b8';
        if (isPast) textColor = isLightBg ? '#1d1a1a' : '#f1f5f9';
        if (isActive) textColor = isLightBg ? '#5b1a78' : '#ffffff';

        return (
          <span
            key={idx}
            style={{
              fontSize: 42,
              fontWeight: 800,
              fontFamily: '"JetBrains Mono", "Segoe UI", system-ui, sans-serif',
              letterSpacing: '-0.02em',
              color: textColor,
              transform: `scale(${scale})`,
              display: 'inline-block',
              transition: 'color 0.12s ease',
              textShadow: isActive
                ? `0 0 24px ${themeColor}, 0 2px 10px rgba(0,0,0,0.8)`
                : isPast
                ? '0 2px 4px rgba(0,0,0,0.5)'
                : 'none',
              borderBottom: isActive
                ? `3px solid ${themeColor}`
                : '3px solid transparent',
              paddingBottom: 2,
            }}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
};

// ==========================================
// SCENE 1: GLASS ISOMETRIC CAD VEHICLE ARENA
// ==========================================
const Scene1Hook: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const rotY = interpolate(frame, [0, 137], [-24, 20]);
  const rotX = interpolate(frame, [0, 137], [22, 16]);
  const scanLine = (frame * 5) % 400;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1200,
      }}
    >
      {/* CAD Floating Grid Plane */}
      <div
        style={{
          position: 'absolute',
          width: 820,
          height: 820,
          borderRadius: 28,
          border: '2px solid rgba(168, 85, 247, 0.45)',
          background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.14) 0%, rgba(10, 6, 24, 0.6) 80%)',
          boxShadow: '0 0 80px rgba(168, 85, 247, 0.25), inset 0 0 60px rgba(168, 85, 247, 0.15)',
          transform: `rotateX(${rotX + 45}deg) rotateZ(${rotY}deg) scale(${introSpring})`,
          transformStyle: 'preserve-3d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Isometric Grid lines */}
        <svg width="780" height="780" style={{ opacity: 0.75 }}>
          <defs>
            <pattern id="isoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(168, 85, 247, 0.22)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="780" height="780" fill="url(#isoGrid)" />
          {/* Laser Scan Line */}
          <line
            x1="0"
            y1={scanLine * 1.95}
            x2="780"
            y2={scanLine * 1.95}
            stroke="#a855f7"
            strokeWidth="3"
            filter="drop-shadow(0 0 8px #c084fc)"
          />
        </svg>

        {/* CAD Vehicle Frame 3D Wireframe */}
        <div
          style={{
            position: 'absolute',
            width: 520,
            height: 320,
            transform: 'translateZ(60px)',
            transformStyle: 'preserve-3d',
          }}
        >
          <svg viewBox="0 0 520 320" width="520" height="320">
            {/* Chassis outline */}
            <path
              d="M 60 220 L 140 220 L 160 170 L 360 170 L 380 220 L 460 220 L 480 180 L 450 110 L 370 70 L 160 70 L 90 120 L 40 180 Z"
              fill="rgba(168, 85, 247, 0.12)"
              stroke="#c084fc"
              strokeWidth="4"
              strokeDasharray="14 6"
              strokeDashoffset={frame * 2}
            />
            {/* Structural Roll-cage ribs */}
            <line x1="160" y1="170" x2="160" y2="70" stroke="#06b6d4" strokeWidth="3" />
            <line x1="260" y1="170" x2="260" y2="70" stroke="#06b6d4" strokeWidth="3" />
            <line x1="360" y1="170" x2="360" y2="70" stroke="#06b6d4" strokeWidth="3" />
            {/* Wheels / Hubs */}
            <circle cx="110" cy="220" r="42" fill="none" stroke="#a855f7" strokeWidth="5" />
            <circle cx="110" cy="220" r="22" fill="#06b6d4" opacity="0.6" />
            <circle cx="410" cy="220" r="42" fill="none" stroke="#a855f7" strokeWidth="5" />
            <circle cx="410" cy="220" r="22" fill="#06b6d4" opacity="0.6" />
            {/* Front powertrain glow */}
            <rect x="80" y="140" width="60" height="40" rx="8" fill="rgba(6, 182, 212, 0.35)" stroke="#06b6d4" strokeWidth="2" />
            <text x="110" y="165" fill="#f8fafc" fontSize="12" fontFamily="monospace" textAnchor="middle">FWD-M</text>
            {/* Rear powertrain glow */}
            <rect x="380" y="140" width="60" height="40" rx="8" fill="rgba(168, 85, 247, 0.35)" stroke="#c084fc" strokeWidth="2" />
            <text x="410" y="165" fill="#f8fafc" fontSize="12" fontFamily="monospace" textAnchor="middle">RWD-M</text>
          </svg>
        </div>
      </div>

      {/* Orbiting Quantum Particles */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (frame * 0.05 + (i * Math.PI) / 3);
        const radius = 380 + Math.sin(frame * 0.08 + i) * 40;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * (radius * 0.55);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: i % 2 === 0 ? '#c084fc' : '#22d3ee',
              boxShadow: `0 0 20px ${i % 2 === 0 ? '#a855f7' : '#06b6d4'}`,
              transform: `translate(${px}px, ${py}px)`,
            }}
          />
        );
      })}

      {/* Telemetry Corner Badges */}
      <div
        style={{
          position: 'absolute',
          top: 360,
          left: 80,
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '12px 20px',
          borderRadius: 12,
          borderLeft: '4px solid #a855f7',
          color: '#cbd5e1',
          fontFamily: 'monospace',
          fontSize: 16,
        }}
      >
        <div style={{ color: '#a855f7', fontWeight: 700 }}>TATA GEN-3 CAD PLATFORM</div>
        <div>SYS: ISOMETRIC SCANNING v3.4</div>
        <div>MESH NODES: 14,890 POLYS</div>
      </div>
    </div>
  );
};

// ==========================================
// SCENE 2: acti.ev SKATEBOARD CHASSIS CORE
// ==========================================
const Scene2Skateboard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const motorSpring = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 12, stiffness: 140 } });
  const railSpring = spring({ frame: Math.max(0, frame - 25), fps, config: { damping: 14, stiffness: 120 } });

  const motorPulse = Math.sin(frame * 0.25) * 8;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D Skateboard Chassis Cutaway View */}
      <div
        style={{
          width: 860,
          height: 680,
          position: 'relative',
          background: 'rgba(11, 19, 43, 0.7)',
          borderRadius: 36,
          border: '2px solid rgba(6, 182, 212, 0.35)',
          boxShadow: '0 20px 80px rgba(0,0,0,0.6), 0 0 50px rgba(6, 182, 212, 0.2)',
          padding: 30,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Technical Header inside Card */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 36,
            right: 36,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'monospace',
            fontSize: 15,
            color: '#38bdf8',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            paddingBottom: 10,
          }}
        >
          <span>MODULAR CHASSIS ARCHITECTURE</span>
          <span>LOW COG: -42mm BELOW AXLE</span>
        </div>

        <svg viewBox="0 0 800 480" width="800" height="480">
          <defs>
            <linearGradient id="batteryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#083344" />
              <stop offset="50%" stopColor="#0e7490" />
              <stop offset="100%" stopColor="#083344" />
            </linearGradient>
            <linearGradient id="railGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Left/Right Frame Rails (Flat Floor Structural Steel) */}
          <rect
            x="140"
            y={120}
            width={520 * railSpring}
            height="32"
            rx="8"
            fill="url(#railGrad)"
            opacity="0.9"
          />
          <rect
            x="140"
            y={320}
            width={520 * railSpring}
            height="32"
            rx="8"
            fill="url(#railGrad)"
            opacity="0.9"
          />

          {/* Central Flat Floor Battery Tray */}
          <rect
            x="180"
            y="168"
            width="440"
            height="136"
            rx="16"
            fill="url(#batteryGrad)"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeDasharray="8 4"
          />
          <text x="400" y="244" fill="#a5f3fc" fontSize="20" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">
            acti.ev FLAT-FLOOR PACK
          </text>
          <text x="400" y="272" fill="#67e8f9" fontSize="14" fontFamily="monospace" textAnchor="middle">
            MONOLITHIC SUB-STRUCTURE
          </text>

          {/* Front Electric Motor Module (Dual Motor Mount) */}
          <g transform={`translate(${80}, ${200}) scale(${motorSpring})`}>
            <rect x="0" y="0" width="80" height="74" rx="12" fill="#1e1b4b" stroke="#a855f7" strokeWidth="3" />
            <circle cx="40" cy="37" r={20 + motorPulse * 0.3} fill="none" stroke="#c084fc" strokeWidth="4" />
            <text x="40" y="42" fill="#f8fafc" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              FRONT E-M
            </text>
          </g>

          {/* Rear Electric Motor Module */}
          <g transform={`translate(${640}, ${200}) scale(${motorSpring})`}>
            <rect x="0" y="0" width="80" height="74" rx="12" fill="#1e1b4b" stroke="#a855f7" strokeWidth="3" />
            <circle cx="40" cy="37" r={20 + motorPulse * 0.3} fill="none" stroke="#c084fc" strokeWidth="4" />
            <text x="40" y="42" fill="#f8fafc" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              REAR E-M
            </text>
          </g>

          {/* Dynamic Laser Bus Connecting Motors to Battery */}
          <path
            d="M 160 237 L 180 237"
            stroke="#22d3ee"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 620 237 L 640 237"
            stroke="#22d3ee"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Drive Axles */}
          <line x1="120" y1="80" x2="120" y2="390" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
          <line x1="680" y1="80" x2="680" y2="390" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />

          {/* Wheels */}
          <rect x="94" y="60" width="52" height="40" rx="8" fill="#334155" stroke="#06b6d4" strokeWidth="3" />
          <rect x="94" y="370" width="52" height="40" rx="8" fill="#334155" stroke="#06b6d4" strokeWidth="3" />
          <rect x="654" y="60" width="52" height="40" rx="8" fill="#334155" stroke="#06b6d4" strokeWidth="3" />
          <rect x="654" y="370" width="52" height="40" rx="8" fill="#334155" stroke="#06b6d4" strokeWidth="3" />
        </svg>

        {/* Real-time Engineering Readout */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            display: 'flex',
            gap: 40,
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '12px 28px',
            borderRadius: 16,
            border: '1px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          <div>
            <span style={{ color: '#94a3b8', fontSize: 13, display: 'block' }}>MOTOR TOPOLOGY</span>
            <span style={{ color: '#38bdf8', fontSize: 20, fontWeight: 700 }}>DUAL PERMANENT MAGNET</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8', fontSize: 13, display: 'block' }}>WEIGHT RATIO</span>
            <span style={{ color: '#a855f7', fontSize: 20, fontWeight: 700 }}>50 : 50 BALANCED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SCENE 3: ORTHOGONAL HIGH-DENSITY CELL PACKAGING
// ==========================================
const Scene3Cells: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const densityPercent = Math.min(10, Math.floor((frame / 60) * 10));

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* HUD High-Density Grid Container */}
      <div
        style={{
          width: 880,
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 32,
          border: '2px solid rgba(168, 85, 247, 0.4)',
          boxShadow: '0 20px 80px rgba(0,0,0,0.7), 0 0 60px rgba(168, 85, 247, 0.25)',
          padding: 36,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
            paddingBottom: 14,
          }}
        >
          <div>
            <div style={{ color: '#c084fc', fontSize: 22, fontWeight: 800 }}>PRISMATIC CELL MATRIX</div>
            <div style={{ color: '#94a3b8', fontSize: 14, fontFamily: 'monospace' }}>ORTHOGONAL HIGH-DENSITY ALIGNMENT</div>
          </div>
          <div
            style={{
              background: 'rgba(168, 85, 247, 0.2)',
              border: '2px solid #a855f7',
              borderRadius: 12,
              padding: '6px 16px',
              color: '#f3e8ff',
              fontSize: 24,
              fontWeight: 800,
              fontFamily: 'monospace',
            }}
          >
            +{densityPercent}% DENSITY
          </div>
        </div>

        {/* Orthogonal Cells Grid with Cyan Busbars */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 14,
            width: 780,
            padding: 20,
            background: 'rgba(2, 6, 23, 0.8)',
            borderRadius: 20,
            border: '1px solid rgba(6, 182, 212, 0.3)',
            position: 'relative',
          }}
        >
          {/* Interconnecting Cyan Busbars overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 20,
              right: 20,
              bottom: 0,
              pointerEvents: 'none',
            }}
          >
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                style={{
                  position: 'absolute',
                  top: 50 + row * 82,
                  left: 10,
                  right: 10,
                  height: 6,
                  background: 'linear-gradient(90deg, #06b6d4, #38bdf8)',
                  boxShadow: '0 0 12px #06b6d4',
                  borderRadius: 3,
                  opacity: seg(frame, 10 + row * 10, 40 + row * 10),
                }}
              />
            ))}
          </div>

          {/* 24 Prismatic Battery Cells */}
          {Array.from({ length: 24 }).map((_, idx) => {
            const cellDelay = idx * 2.2;
            const cellSpring = spring({
              frame: Math.max(0, frame - cellDelay),
              fps,
              config: { damping: 14, stiffness: 180 },
            });
            const isEnergized = frame > cellDelay + 20;

            return (
              <div
                key={idx}
                style={{
                  height: 70,
                  borderRadius: 10,
                  background: isEnergized
                    ? 'linear-gradient(180deg, #3b0764 0%, #1e1b4b 100%)'
                    : 'rgba(30, 41, 59, 0.6)',
                  border: isEnergized
                    ? '2px solid #a855f7'
                    : '1px solid rgba(148, 163, 184, 0.3)',
                  boxShadow: isEnergized ? '0 0 16px rgba(168, 85, 247, 0.4)' : 'none',
                  transform: `scale(${cellSpring})`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: isEnergized ? '#e9d5ff' : '#64748b',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div style={{ fontWeight: 800 }}>C-{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</div>
                <div style={{ fontSize: 9, color: '#38bdf8' }}>3.72V</div>
              </div>
            );
          })}
        </div>

        {/* Bottom Volumetric Efficiency Bar */}
        <div style={{ width: '100%', marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#cbd5e1', marginBottom: 8 }}>
            <span>VOLUMETRIC PACKAGING EFFICIENCY</span>
            <span style={{ color: '#a855f7', fontWeight: 700 }}>92.4% ACTIVE MATERIAL</span>
          </div>
          <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
            <div
              style={{
                width: `${interpolate(frame, [0, 90], [50, 92.4], { extrapolateRight: 'clamp' })}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
                boxShadow: '0 0 14px #a855f7',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SCENE 4: RAPID DC FAST-CHARGE PIPELINE
// ==========================================
const Scene4FastCharge: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const kmProgress = Math.min(
    100,
    Math.round(interpolate(frame, [10, 110], [0, 100], { extrapolateRight: 'clamp' }))
  );
  const kwCurrent = Math.round(
    interpolate(frame, [10, 80], [45, 150], { extrapolateRight: 'clamp' })
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* High-Contrast Digital Charging HUD */}
      <div
        style={{
          width: 860,
          background: 'rgba(10, 15, 30, 0.92)',
          borderRadius: 36,
          border: '2px solid rgba(6, 182, 212, 0.45)',
          boxShadow: '0 25px 90px rgba(0,0,0,0.7), 0 0 80px rgba(6, 182, 212, 0.25)',
          padding: 44,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: 16, letterSpacing: '0.15em', marginBottom: 12 }}>
          HIGH-POWER DC FAST CHARGING BUS
        </div>

        {/* Circular Speedometer / Gauge */}
        <div style={{ position: 'relative', width: 340, height: 340, margin: '20px 0' }}>
          <svg viewBox="0 0 340 340" width="340" height="340">
            {/* Background Track */}
            <circle
              cx="170"
              cy="170"
              r="140"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="20"
              strokeDasharray="660"
              strokeDashoffset="165"
              strokeLinecap="round"
              transform="rotate(135 170 170)"
            />
            {/* Animated Gauge Arc */}
            <circle
              cx="170"
              cy="170"
              r="140"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="20"
              strokeDasharray="660"
              strokeDashoffset={660 - (kmProgress / 100) * 495}
              strokeLinecap="round"
              transform="rotate(135 170 170)"
              filter="drop-shadow(0 0 14px #22d3ee)"
            />
          </svg>

          {/* Center Digital Odometer Readout */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 600 }}>ADDED RANGE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontSize: 88,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: '#f8fafc',
                  textShadow: '0 0 24px #06b6d4',
                }}
              >
                {kmProgress}
              </span>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#38bdf8' }}>KM</span>
            </div>
            <span style={{ fontSize: 14, color: '#4ade80', fontFamily: 'monospace' }}>⚡ 15 MIN INGESTION</span>
          </div>
        </div>

        {/* Telemetry Split Row */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginTop: 10,
          }}
        >
          <div
            style={{
            background: 'rgba(15, 23, 42, 0.75)',
            padding: '16px 20px',
            borderRadius: 16,
            border: '1px solid rgba(6, 182, 212, 0.2)',
          }}
        >
          <span style={{ color: '#94a3b8', fontSize: 13 }}>CHARGE POWER PEAK</span>
          <div style={{ color: '#22d3ee', fontSize: 32, fontWeight: 800, fontFamily: 'monospace' }}>
            {kwCurrent} <span style={{ fontSize: 18 }}>kW</span>
          </div>
        </div>
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            padding: '16px 20px',
            borderRadius: 16,
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}
        >
          <span style={{ color: '#94a3b8', fontSize: 13 }}>CELL THERMAL DELTA</span>
          <div style={{ color: '#c084fc', fontSize: 32, fontWeight: 800, fontFamily: 'monospace' }}>
            +2.4°C <span style={{ fontSize: 16, color: '#4ade80' }}>OPTIMAL</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

// ==========================================
// SCENE 5: OMEGA-ARC HIGH-STRENGTH STEEL CAGE
// ==========================================
const Scene5OmegaArc: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const starsCount = Math.min(5, Math.floor((frame / 18)));
  const impactProgress = seg(frame, 20, 50);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Structural Comparison Split Arena */}
      <div
        style={{
          width: 880,
          background: 'rgba(17, 12, 34, 0.9)',
          borderRadius: 36,
          border: '2px solid rgba(168, 85, 247, 0.4)',
          boxShadow: '0 25px 90px rgba(0,0,0,0.7), 0 0 60px rgba(168, 85, 247, 0.25)',
          padding: 36,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#f3e8ff', fontSize: 24, fontWeight: 800 }}>OMEGA-ARC ARCHITECTURE</div>
            <div style={{ color: '#a855f7', fontSize: 14, fontFamily: 'monospace' }}>
              HIGH-STRENGTH THERMOFORMED STEEL CAGE
            </div>
          </div>
          {/* 5-Star Safety Badge */}
          <div style={{ display: 'flex', gap: 6, background: 'rgba(250, 204, 21, 0.15)', padding: '8px 14px', borderRadius: 14, border: '1px solid #facc15' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 22,
                  color: s <= starsCount ? '#facc15' : 'rgba(250, 204, 21, 0.2)',
                  filter: s <= starsCount ? 'drop-shadow(0 0 8px #facc15)' : 'none',
                  transform: s <= starsCount ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Visual Split Crash/Safety Simulation */}
        <div style={{ width: 780, height: 360, margin: '24px 0', position: 'relative' }}>
          <svg viewBox="0 0 780 360" width="780" height="360">
            {/* Crumple Zone (Deformable front) */}
            <path
              d={`M 40 180 Q ${140 - impactProgress * 40} ${140 + impactProgress * 20} 220 160 L 220 280 L 40 280 Z`}
              fill="rgba(239, 68, 68, 0.25)"
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
            <text x="120" y="240" fill="#fca5a5" fontSize="13" fontFamily="monospace" textAnchor="middle">
              CRUMPLE ZONE
            </text>
            <text x="120" y="260" fill="#f87171" fontSize="11" fontFamily="monospace" textAnchor="middle">
              ENERGY ABSORB
            </text>

            {/* Rigid Occupant Safety Cell (High-Strength OMEGA Cage) */}
            <rect
              x="220"
              y="110"
              width="440"
              height="200"
              rx="18"
              fill="rgba(168, 85, 247, 0.22)"
              stroke="#c084fc"
              strokeWidth="5"
            />
            {/* Internal Safety Ring / Cross-Car Beam */}
            <line x1="360" y1="110" x2="360" y2="310" stroke="#a855f7" strokeWidth="4" />
            <line x1="520" y1="110" x2="520" y2="310" stroke="#a855f7" strokeWidth="4" />
            <line x1="220" y1="210" x2="660" y2="210" stroke="#a855f7" strokeWidth="3" strokeDasharray="10 5" />

            {/* Occupants Safe Zone Indicator */}
            <circle cx="340" cy="200" r="28" fill="#3b0764" stroke="#c084fc" strokeWidth="2" />
            <circle cx="340" cy="188" r="10" fill="#f3e8ff" />
            <path d="M 326 215 Q 340 205 354 215" stroke="#f3e8ff" strokeWidth="3" fill="none" />

            <circle cx="500" cy="200" r="28" fill="#3b0764" stroke="#c084fc" strokeWidth="2" />
            <circle cx="500" cy="188" r="10" fill="#f3e8ff" />
            <path d="M 486 215 Q 500 205 514 215" stroke="#f3e8ff" strokeWidth="3" fill="none" />

            {/* Impact Vector Arrows */}
            <path
              d="M 10 180 L 70 180 M 55 170 L 70 180 L 55 190"
              stroke="#ef4444"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Crash Metrics Bar */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-around',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '14px 20px',
            borderRadius: 16,
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          <div>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>CABIN DEFORMATION</span>
            <div style={{ color: '#4ade80', fontSize: 20, fontWeight: 700 }}>&lt; 2.1% (ZERO INTRUSION)</div>
          </div>
          <div>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>TENSILE STRENGTH</span>
            <div style={{ color: '#c084fc', fontSize: 20, fontWeight: 700 }}>1500 MPa ULTRA-HIGH</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SCENE 6: PATENTED TWIN-CYLINDER SUBFLOOR PACKAGING
// ==========================================
const Scene6SubfloorCylinders: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const bootLift = interpolate(frame, [15, 75], [0, 60], { extrapolateRight: 'clamp' });
  const cylinderReveal = seg(frame, 30, 70);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 880,
          background: 'rgba(10, 18, 36, 0.92)',
          borderRadius: 36,
          border: '2px solid rgba(6, 182, 212, 0.45)',
          boxShadow: '0 25px 90px rgba(0,0,0,0.7), 0 0 60px rgba(6, 182, 212, 0.25)',
          padding: 36,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#38bdf8', fontSize: 24, fontWeight: 800 }}>SUBFLOOR TWIN CYLINDERS</div>
            <div style={{ color: '#94a3b8', fontSize: 14, fontFamily: 'monospace' }}>
              PATENTED DUAL-TANK CNG/H2 PACKAGING
            </div>
          </div>
          <div
            style={{
              background: 'rgba(6, 182, 212, 0.2)',
              border: '1px solid #06b6d4',
              borderRadius: 12,
              padding: '6px 16px',
              color: '#67e8f9',
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            400L FULL BOOT PRESERVED
          </div>
        </div>

        {/* 3D Cutaway Rear Boot Assembly */}
        <div style={{ width: 780, height: 380, margin: '20px 0', position: 'relative' }}>
          <svg viewBox="0 0 780 380" width="780" height="380">
            {/* Trunk Outer Hull */}
            <path
              d="M 120 120 L 660 120 L 620 340 L 160 340 Z"
              fill="rgba(15, 23, 42, 0.85)"
              stroke="#475569"
              strokeWidth="4"
            />

            {/* Lifting Boot Floor Deck */}
            <g transform={`translate(0, -${bootLift})`}>
              <rect x="150" y="210" width="480" height="24" rx="6" fill="#334155" stroke="#06b6d4" strokeWidth="3" />
              <text x="390" y="227" fill="#f8fafc" fontSize="13" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">
                CARGO FLOOR (LIFTS TO ACCESS SUBFLOOR)
              </text>
              {/* Suitcase / Luggage representations to show full space */}
              <rect x="220" y="140" width="130" height="66" rx="10" fill="#0284c7" opacity="0.8" />
              <rect x="380" y="130" width="150" height="76" rx="10" fill="#a855f7" opacity="0.8" />
            </g>

            {/* Nested Subfloor Wells */}
            <rect x="180" y="260" width="420" height="70" rx="12" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="2" strokeDasharray="8 4" />

            {/* Dual Cylinders with Metallic Sheen */}
            <g opacity={cylinderReveal}>
              {/* Cylinder 1 */}
              <rect x="210" y="272" width="160" height="46" rx="23" fill="url(#cylGrad1)" stroke="#38bdf8" strokeWidth="3" />
              {/* Cylinder 2 */}
              <rect x="410" y="272" width="160" height="46" rx="23" fill="url(#cylGrad1)" stroke="#38bdf8" strokeWidth="3" />

              <text x="290" y="301" fill="#e0f2fe" fontSize="13" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                TANK #1 (30L)
              </text>
              <text x="490" y="301" fill="#e0f2fe" fontSize="13" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                TANK #2 (30L)
              </text>
            </g>

            <defs>
              <linearGradient id="cylGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Advantage Callouts */}
        <div style={{ display: 'flex', gap: 24, width: '100%', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '10px 20px', borderRadius: 12, borderLeft: '3px solid #06b6d4', fontSize: 14, color: '#cbd5e1' }}>
            ✓ ZERO CARGO LOSS
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '10px 20px', borderRadius: 12, borderLeft: '3px solid #a855f7', fontSize: 14, color: '#cbd5e1' }}>
            ✓ LOW CENTER OF GRAVITY
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '10px 20px', borderRadius: 12, borderLeft: '3px solid #10b981', fontSize: 14, color: '#cbd5e1' }}>
            ✓ THERMAL RELIEF VALVES
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SCENE 7: EXACT BITTRIX TECHNOLOGIES OUTRO
// Grounded precisely in /home/eswaran/Downloads/bittrix-reel(1).html
// Palette: Royal Purple #5b1a78 & Warm Cream #fdf3d0
// ==========================================
const Scene7BittrixOutro: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const t = frame / fps; // seconds into scene 7 (0 to ~2.28s)
  const CX = 540;
  const CY = 720;
  const R = 250;
  const P = '#5b1a78';
  const BG = '#fdf3d0';
  const D = '#1d1a1a';

  // Hexagon geometry from HTML reference
  const hv = (r: number) =>
    [...Array(6)].map((_, i) => {
      const a = ((-90 + 60 * i) * Math.PI) / 180;
      return [r * Math.cos(a), r * Math.sin(a)];
    });

  const HX = useMemo(() => hv(R), []);
  const CH = useMemo(() => hv(R + 48).map((p) => [p[0] + CX, p[1] + CY]), [CX, CY, R]);
  const NODES = useMemo(() => [5, 1, 3].map((i) => [CX + HX[i][0] * 1.04, CY + HX[i][1] * 1.04]), [CX, CY, HX]);

  // Hexagon bounce & spin
  const hs = easeOutBack(seg(t, 0, 0.7));
  const hexRot = (1 - easeOutCubic(seg(t, 0, 0.8))) * -1.05;

  // Gear scale & rotation
  const gs = easeOutBack(seg(t, 0.6, 1.3));
  const gearRot = t * 2.2;

  // Chain link alpha
  const ca = seg(t, 0.3, 0.6) * (1 - seg(t, 2, 2.45));

  // Wordmark BITTRIX letter staggering
  const letters = 'BITTRIX'.split('');
  const techAlpha = easeOutCubic(seg(t, 1.9, 2.5));
  const underlineWidth = 520 * easeOutCubic(seg(t, 2.1, 2.6));

  // Diagonal Shine sweep
  const sh = seg(t, 2.35, 2.95);
  const shinePos = -400 + (1080 + 800) * sh;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: `radial-gradient(circle at ${CX}px ${CY}px, #fff9e2 0%, ${BG} 80%)`,
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 1080 1920"
        width="1080"
        height="1920"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#5b1a78" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Central Hexagon */}
        <g
          transform={`translate(${CX}, ${CY}) rotate(${(hexRot * 180) / Math.PI}) scale(${hs})`}
        >
          <polygon
            points={HX.map((p) => `${p[0]},${p[1]}`).join(' ')}
            fill={P}
            filter="url(#purpleGlow)"
          />
        </g>

        {/* Spokes + Spoke Nodes */}
        {NODES.map((n, i) => {
          const u = easeOutCubic(seg(t, 0.5 + i * 0.12, 1.0 + i * 0.12));
          const ex = n[0] + (CX - n[0]) * 0.5 * u;
          const ey = n[1] + (CY - n[1]) * 0.5 * u;
          const nodeScale = easeOutBack(seg(t, 0.5 + i * 0.12, 0.9 + i * 0.12)) * (1 + 0.07 * Math.sin(t * 7 + i));

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
                r={36 * nodeScale}
                fill={P}
                stroke="#9a4cc2"
                strokeWidth={7}
              />
            </g>
          );
        })}

        {/* Rolling Chain Links along Hexagon Perimeter */}
        {ca > 0 && (
          <g opacity={ca}>
            {Array.from({ length: 42 }).map((_, k) => {
              const ph = 0.6 * t + 0.25 * t * t;
              const e = ((k / 42 + ph) % 1) * 6;
              const idx = Math.floor(e);
              const f = e - idx;
              const A = CH[idx];
              const B = CH[(idx + 1) % 6];
              const lx = A[0] + (B[0] - A[0]) * f;
              const ly = A[1] + (B[1] - A[1]) * f;
              const angle = Math.atan2(B[1] - A[1], B[0] - A[0]);

              return (
                <g
                  key={k}
                  transform={`translate(${lx}, ${ly}) rotate(${(angle * 180) / Math.PI})`}
                >
                  {k % 2 === 1 ? (
                    <rect
                      x={-9}
                      y={-9}
                      width={18}
                      height={18}
                      rx={6}
                      fill={P}
                    />
                  ) : (
                    <rect
                      x={-21}
                      y={-11}
                      width={42}
                      height={22}
                      rx={11}
                      fill="none"
                      stroke={P}
                      strokeWidth={6}
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* Rotating 12-Tooth Gear with Serif 'B' */}
        <g transform={`translate(${CX}, ${CY}) scale(${gs})`}>
          {/* 12-tooth Gear SVG Path */}
          <g transform={`rotate(${(gearRot * 180) / Math.PI})`}>
            <path
              d={(() => {
                const n = 12;
                const r0 = 100;
                const r1 = 128;
                const w = (Math.PI * 2) / n;
                let pathStr = '';
                for (let k = 0; k < n; k++) {
                  const a = k * w;
                  const pts = [
                    [a, r0],
                    [a + w * 0.15, r1],
                    [a + w * 0.42, r1],
                    [a + w * 0.57, r0],
                  ];
                  pts.forEach((p, pidx) => {
                    const px = p[1] * Math.cos(p[0]);
                    const py = p[1] * Math.sin(p[0]);
                    if (k === 0 && pidx === 0) pathStr += `M ${px} ${py} `;
                    else pathStr += `L ${px} ${py} `;
                  });
                }
                pathStr += 'Z';
                return pathStr;
              })()}
              fill={BG}
            />
          </g>

          {/* Center Royal Purple Circle */}
          <circle cx="0" cy="0" r="76" fill={P} />

          {/* Serif B inside center */}
          <text
            x="0"
            y="6"
            fill={BG}
            fontSize="130"
            fontFamily="Georgia, serif"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            B
          </text>
        </g>
      </svg>

      {/* Wordmark BITTRIX letter-by-letter elastic italic bold */}
      <div
        style={{
          position: 'absolute',
          top: 1070,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        {letters.map((char, i) => {
          const u = easeOutCubic(seg(t, 1.4 + i * 0.07, 1.9 + i * 0.07));
          const offsetX = (1 - u) * -110;

          return (
            <span
              key={i}
              style={{
                fontFamily: '"Arial Black", Impact, Arial, sans-serif',
                fontSize: 148,
                fontStyle: 'italic',
                fontWeight: 900,
                color: P,
                opacity: u,
                transform: `translateX(${offsetX}px)`,
                display: 'inline-block',
                textShadow: '0 4px 18px rgba(91, 26, 120, 0.25)',
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* TECHNOLOGIES Subtitle with expanding letter tracking */}
      <div
        style={{
          position: 'absolute',
          top: 1240,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: techAlpha,
          fontFamily: 'Arial, sans-serif',
          fontSize: 42,
          fontWeight: 600,
          color: D,
          letterSpacing: `${10 + 14 * techAlpha}px`,
        }}
      >
        TECHNOLOGIES
      </div>

      {/* Expanding Purple Underline Bar */}
      <div
        style={{
          position: 'absolute',
          top: 1308,
          left: CX - underlineWidth / 2,
          width: underlineWidth,
          height: 7,
          background: P,
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(91, 26, 120, 0.3)',
        }}
      />

      {/* Diagonal Light Sweep */}
      {sh > 0 && sh < 1 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: shinePos - 140,
            width: 280,
            height: '100%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)',
            transform: 'skewX(-25deg)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// MAIN REMOTION EXPORT COMPONENT
// Living Continuous Cinema Canvas
// ==========================================
export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Active scene calculation
  const activeSceneIndex = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < SCENES.length; i++) {
      if (frame >= acc && frame < acc + SCENES[i].durationInFrames) {
        return i;
      }
      acc += SCENES[i].durationInFrames;
    }
    return SCENES.length - 1;
  }, [frame]);

  const activeScene = SCENES[activeSceneIndex];
  const sceneFrame = frame - activeScene.startFrame;

  // CONTINUOUS VIRTUAL CAMERA (camX, camY, camScale across entire video)
  const camera = useMemo(() => {
    // Continuous subtle camera travel avoiding abrupt scene breaks
    const camX = interpolate(
      frame,
      [0, 137, 274, 411, 548, 685, 822, 959],
      [0, -15, 20, -10, 15, -8, 0, 0],
      { extrapolateRight: 'clamp' }
    );
    const camY = interpolate(
      frame,
      [0, 137, 274, 411, 548, 685, 822, 959],
      [0, 18, -12, 14, -10, 12, 0, 0],
      { extrapolateRight: 'clamp' }
    );
    const camScale = interpolate(
      frame,
      [0, 137, 274, 411, 548, 685, 822, 959],
      [1.0, 1.03, 1.02, 1.04, 1.02, 1.03, 1.0, 1.0],
      { extrapolateRight: 'clamp' }
    );
    return { camX, camY, camScale };
  }, [frame]);

  // Scene Cross-Fade Smooth Transition (no black flash!)
  const isOutro = activeSceneIndex === 6;

  return (
    <AbsoluteFill
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: '#070510',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* GLOBAL PERSISTENT UNIFIED CANVAS */}
      {!isOutro && (
        <AbsoluteFill>
          {/* Deep ambient technical gradient */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(ellipse at 50% 35%, #180b2b 0%, #080312 65%, #020108 100%)',
            }}
          />

          {/* Living Mesh Grid Plane */}
          <div
            style={{
              position: 'absolute',
              width: '200%',
              height: '200%',
              top: '-50%',
              left: '-50%',
              opacity: 0.22,
              backgroundImage: `
                linear-gradient(to right, rgba(168, 85, 247, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              transform: `translate(${camera.camX * 0.4}px, ${(frame * 0.5) % 60}px)`,
            }}
          />

          {/* Ambient Vignette & Top Glow */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 480,
              background: `radial-gradient(circle at 50% 0%, ${activeScene.themeColor}33 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        </AbsoluteFill>
      )}

      {/* VIRTUAL CONTINUOUS CAMERA RIG */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          transform: `translate(${camera.camX}px, ${camera.camY}px) scale(${camera.camScale})`,
          transformOrigin: '50% 45%',
        }}
      >
        {/* Render Specific Active Scene */}
        {activeSceneIndex === 0 && <Scene1Hook frame={sceneFrame} fps={fps} />}
        {activeSceneIndex === 1 && <Scene2Skateboard frame={sceneFrame} fps={fps} />}
        {activeSceneIndex === 2 && <Scene3Cells frame={sceneFrame} fps={fps} />}
        {activeSceneIndex === 3 && <Scene4FastCharge frame={sceneFrame} fps={fps} />}
        {activeSceneIndex === 4 && <Scene5OmegaArc frame={sceneFrame} fps={fps} />}
        {activeSceneIndex === 5 && <Scene6SubfloorCylinders frame={sceneFrame} fps={fps} />}
        {activeSceneIndex === 6 && <Scene7BittrixOutro frame={sceneFrame} fps={fps} />}
      </div>

      {/* TOP HEADER HUD (Scenes 1 to 6) */}
      {!isOutro && (
        <div
          style={{
            position: 'absolute',
            top: 90,
            left: 60,
            right: 60,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            zIndex: 10,
          }}
        >
          {/* Category Pill + Scene Counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 999,
                background: `${activeScene.themeColor}22`,
                border: `1.5px solid ${activeScene.themeColor}66`,
                color: activeScene.themeColor,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: activeScene.themeColor,
                  boxShadow: `0 0 10px ${activeScene.themeColor}`,
                }}
              />
              {activeScene.badgeTag}
            </div>

            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#64748b',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              MODULE {activeScene.scene_number} / 7
            </div>
          </div>

          {/* On Screen Scene Headline */}
          <h1
            style={{
              fontSize: 54,
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
              margin: '8px 0 0 0',
              textShadow: '0 4px 24px rgba(0,0,0,0.8)',
              letterSpacing: '-0.02em',
              maxWidth: 920,
            }}
          >
            {activeScene.on_screen_text}
          </h1>
        </div>
      )}

      {/* SYNCHRONIZED KINETIC KARAOKE CAPTIONS (Anchored at lower-third) */}
      <div
        style={{
          position: 'absolute',
          bottom: isOutro ? 140 : 120,
          left: 40,
          right: 40,
          zIndex: 20,
        }}
      >
        <KineticKaraokeCaption
          words={activeScene.words}
          localFrame={sceneFrame}
          themeColor={activeScene.themeColor}
          isLightBg={isOutro}
        />
      </div>

      {/* GLOBAL PROGRESS TIMELINE BAR (Persistent bottom line) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 6,
          background: 'rgba(255,255,255,0.08)',
          zIndex: 30,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(frame / 959) * 100}%`,
            background: isOutro
              ? '#5b1a78'
              : `linear-gradient(90deg, #a855f7, #06b6d4)`,
            boxShadow: `0 0 12px ${activeScene.themeColor}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}