import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ==========================================
// SCENE METADATA & WORD-LEVEL TIMESTAMPS
// ==========================================
interface WordTimestamp {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface SceneData {
  scene_number: number;
  role: string;
  durationInFrames: number;
  duration_sec: number;
  narration: string;
  on_screen_text: string;
  visual_direction: string;
  template: string;
  themeColor: string;
  words: WordTimestamp[];
}

const SCENES: SceneData[] = [
  {
    scene_number: 1,
    role: 'hook',
    durationInFrames: 121,
    duration_sec: 4.03,
    narration: 'Lost in chaotic client messages?',
    on_screen_text: 'Drowning In Client DMs?',
    visual_direction:
      'Dramatic forward camera push through dark cosmic particles into an overwhelmed pulsing alert badge with neon alert pings.',
    template: 'question-hook',
    themeColor: '#f43f5e',
    words: [
      { word: 'Lost', startFrame: 0, endFrame: 14 },
      { word: 'in', startFrame: 14, endFrame: 21 },
      { word: 'chaotic', startFrame: 21, endFrame: 46 },
      { word: 'client', startFrame: 46, endFrame: 68 },
      { word: 'messages?', startFrame: 68, endFrame: 96 },
    ],
  },
  {
    scene_number: 2,
    role: 'body',
    durationInFrames: 121,
    duration_sec: 4.03,
    narration: 'Meet AstroConnect.',
    on_screen_text: 'Structured Astrologer Dashboard',
    visual_direction:
      'Glowing celestial chakra emblem expands into a dark glassmorphic dashboard frame with radial spoke lights.',
    template: 'hero-object',
    themeColor: '#38bdf8',
    words: [
      { word: 'Meet', startFrame: 0, endFrame: 18 },
      { word: 'AstroConnect.', startFrame: 18, endFrame: 72 },
    ],
  },
  {
    scene_number: 3,
    role: 'body',
    durationInFrames: 122,
    duration_sec: 4.07,
    narration: 'Every ticket organizes client birth data.',
    on_screen_text: 'Queued Client Intake Tickets',
    visual_direction:
      'Staggered 3D cascade of dark consultation cards sliding upward into an organized vertical stack.',
    template: 'card-stack',
    themeColor: '#38bdf8',
    words: [
      { word: 'Every', startFrame: 0, endFrame: 16 },
      { word: 'ticket', startFrame: 16, endFrame: 36 },
      { word: 'organizes', startFrame: 36, endFrame: 65 },
      { word: 'client', startFrame: 65, endFrame: 85 },
      { word: 'birth', startFrame: 85, endFrame: 101 },
      { word: 'data.', startFrame: 101, endFrame: 114 },
    ],
  },
  {
    scene_number: 4,
    role: 'body',
    durationInFrames: 130,
    duration_sec: 4.33,
    narration: 'Analyze verified Vedic Kundli charts instantly.',
    on_screen_text: 'Instant Vedic Kundli Analysis',
    visual_direction:
      'Vedic diamond astrological chart draws on screen with glowing neon intersection paths and house glyph indicators.',
    template: 'code-or-ui-stage',
    themeColor: '#f43f5e',
    words: [
      { word: 'Analyze', startFrame: 0, endFrame: 21 },
      { word: 'verified', startFrame: 21, endFrame: 45 },
      { word: 'Vedic', startFrame: 45, endFrame: 60 },
      { word: 'Kundli', startFrame: 60, endFrame: 77 },
      { word: 'charts', startFrame: 77, endFrame: 95 },
      { word: 'instantly.', startFrame: 95, endFrame: 122 },
    ],
  },
  {
    scene_number: 5,
    role: 'body',
    durationInFrames: 121,
    duration_sec: 4.03,
    narration: 'Consult across English, Tamil, and Tanglish.',
    on_screen_text: 'Multilingual Triage Support',
    visual_direction:
      'Split comparison layout showing English consultation stream on the left and Tamil script drafting module on the right.',
    template: 'split-compare',
    themeColor: '#38bdf8',
    words: [
      { word: 'Consult', startFrame: 0, endFrame: 22 },
      { word: 'across', startFrame: 22, endFrame: 40 },
      { word: 'English,', startFrame: 40, endFrame: 62 },
      { word: 'Tamil,', startFrame: 62, endFrame: 77 },
      { word: 'and', startFrame: 77, endFrame: 86 },
      { word: 'Tanglish.', startFrame: 86, endFrame: 111 },
    ],
  },
  {
    scene_number: 6,
    role: 'body',
    durationInFrames: 113,
    duration_sec: 3.77,
    narration: 'Track answers through clear stages.',
    on_screen_text: 'Audited Lifecycle Tracking',
    visual_direction:
      'Horizontal pipeline diagram with glowing nodes illuminating sequentially as progress travels down the timeline.',
    template: 'timeline',
    themeColor: '#38bdf8',
    words: [
      { word: 'Track', startFrame: 0, endFrame: 16 },
      { word: 'answers', startFrame: 16, endFrame: 37 },
      { word: 'through', startFrame: 37, endFrame: 59 },
      { word: 'clear', startFrame: 59, endFrame: 74 },
      { word: 'stages.', startFrame: 74, endFrame: 93 },
    ],
  },
  {
    scene_number: 7,
    role: 'body',
    durationInFrames: 109,
    duration_sec: 3.63,
    narration: 'Resolve queries without missed appointments.',
    on_screen_text: 'Zero Missed Consultations',
    visual_direction:
      'High-impact stat counter punching out from deep obsidian surface surrounded by neon cyan and rose energy rings.',
    template: 'stat-callout',
    themeColor: '#f43f5e',
    words: [
      { word: 'Resolve', startFrame: 0, endFrame: 18 },
      { word: 'queries', startFrame: 18, endFrame: 36 },
      { word: 'without', startFrame: 36, endFrame: 54 },
      { word: 'missed', startFrame: 54, endFrame: 70 },
      { word: 'appointments.', startFrame: 70, endFrame: 101 },
    ],
  },
  {
    scene_number: 8,
    role: 'cta',
    durationInFrames: 132,
    duration_sec: 4.4,
    narration: 'Visit astro-textbased.vercel.app to upgrade today.',
    on_screen_text: 'Upgrade Your Practice Today',
    visual_direction:
      'Cinematic final hero portal with glowing URL container, rotating chakra crest, and pulsing upgrade button.',
    template: 'cta-outro',
    themeColor: '#38bdf8',
    words: [
      { word: 'Visit', startFrame: 0, endFrame: 15 },
      { word: 'astro-textbased.vercel.app', startFrame: 15, endFrame: 83 },
      { word: 'to', startFrame: 83, endFrame: 89 },
      { word: 'upgrade', startFrame: 89, endFrame: 109 },
      { word: 'today.', startFrame: 109, endFrame: 124 },
    ],
  },
];

// Scene start frame offsets
const SCENE_OFFSETS: number[] = [0];
for (let i = 0; i < SCENES.length - 1; i++) {
  SCENE_OFFSETS.push(SCENE_OFFSETS[i] + SCENES[i].durationInFrames);
}

// ==========================================
// KINETIC KARAOKE COMPONENT
// ==========================================
const KaraokeSubtitle: React.FC<{
  words: WordTimestamp[];
  localFrame: number;
  accentColor: string;
}> = ({ words, localFrame, accentColor }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px 16px',
        padding: '16px 32px',
        background: 'rgba(8, 12, 28, 0.78)',
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      {words.map((w, idx) => {
        const isActive = localFrame >= w.startFrame && localFrame <= w.endFrame;
        const isPast = localFrame > w.endFrame;
        return (
          <span
            key={idx}
            style={{
              fontSize: '34px',
              fontWeight: isActive ? 900 : 600,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: isActive ? '#ffffff' : isPast ? '#e2e8f0' : '#64748b',
              transform: isActive ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
              transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              display: 'inline-block',
              textShadow: isActive
                ? `0 0 16px ${accentColor}, 0 0 30px ${accentColor}88`
                : 'none',
              borderBottom: isActive
                ? `3px solid ${accentColor}`
                : '3px solid transparent',
              paddingBottom: '2px',
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// ==========================================
// ASTRO CHAKRA 12-SPOKE WHEEL
// ==========================================
const AstroChakraWheel: React.FC<{
  rotation: number;
  glowColor: string;
  size: number;
}> = ({ rotation, glowColor, size }) => {
  const spokes = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);
  const center = size / 2;
  const radius = size * 0.42;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        filter: `drop-shadow(0 0 18px ${glowColor}66)`,
      }}
    >
      <defs>
        <radialGradient id="chakraCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor="#050713" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer concentric astrological rings */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="url(#chakraCoreGlow)"
        stroke={glowColor}
        strokeWidth="3"
        strokeDasharray="8 4"
      />
      <circle
        cx={center}
        cy={center}
        r={radius * 0.82}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />
      <circle
        cx={center}
        cy={center}
        r={radius * 0.55}
        fill="none"
        stroke={glowColor}
        strokeWidth="2"
      />
      <circle
        cx={center}
        cy={center}
        r={radius * 0.22}
        fill="#0b112c"
        stroke="#ffffff"
        strokeWidth="2.5"
      />

      {/* 12 Vedic Bhavas Spoke lines */}
      {spokes.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x2 = center + Math.cos(rad) * radius;
        const y2 = center + Math.sin(rad) * radius;
        return (
          <g key={i}>
            <line
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke={glowColor}
              strokeWidth="2"
              strokeOpacity="0.8"
            />
            {/* House rim node point */}
            <rect
              x={x2 - 4}
              y={y2 - 4}
              width="8"
              height="8"
              transform={`rotate(45 ${x2} ${y2})`}
              fill="#ffffff"
            />
          </g>
        );
      })}

      {/* Central bindu star */}
      <polygon
        points={`${center},${center - 12} ${center + 3},${center - 3} ${
          center + 12
        },${center} ${center + 3},${center + 3} ${center},${center + 12} ${
          center - 3
        },${center + 3} ${center - 12},${center} ${center - 3},${center - 3}`}
        fill="#ffffff"
      />
    </svg>
  );
};

// ==========================================
// VEDIC KUNDLI DIAMOND CHART (CHART S04)
// ==========================================
const VedicKundliDiamond: React.FC<{
  progress: number;
  accentColor: string;
}> = ({ progress, accentColor }) => {
  const size = 520;
  const pathDash = interpolate(progress, [0, 1], [1800, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        background: 'rgba(11, 15, 38, 0.75)',
        border: `2px solid ${accentColor}88`,
        boxShadow: `0 0 40px ${accentColor}33, inset 0 0 30px rgba(0,0,0,0.8)`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Outer Square & Cross Diagonals */}
        <line
          x1="0"
          y1="0"
          x2={size}
          y2={size}
          stroke={accentColor}
          strokeWidth="2.5"
          strokeDasharray="1800"
          strokeDashoffset={pathDash}
        />
        <line
          x1={size}
          y1="0"
          x2="0"
          y2={size}
          stroke={accentColor}
          strokeWidth="2.5"
          strokeDasharray="1800"
          strokeDashoffset={pathDash}
        />

        {/* Central Inverted Diamond intersecting outer box midpoints */}
        <polygon
          points={`${size / 2},0 ${size},${size / 2} ${size / 2},${size} 0,${
            size / 2
          }`}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
          strokeDasharray="1800"
          strokeDashoffset={pathDash}
        />
      </svg>

      {/* House Identifiers and Planetary Glyphs */}
      <div
        style={{
          position: 'absolute',
          top: '22%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          opacity: progress > 0.4 ? 1 : 0,
        }}
      >
        <div style={{ color: '#ffffff', fontWeight: 900, fontSize: '18px' }}>
          H1 (Tanu)
        </div>
        <div
          style={{
            color: accentColor,
            fontWeight: 700,
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        >
          ☉ Sun 14° Leo
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '24%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          opacity: progress > 0.5 ? 1 : 0,
        }}
      >
        <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '14px' }}>
          H12
        </div>
        <div
          style={{
            color: '#38bdf8',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'monospace',
          }}
        >
          ♃ Jup
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '76%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          opacity: progress > 0.5 ? 1 : 0,
        }}
      >
        <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '14px' }}>
          H2
        </div>
        <div
          style={{
            color: '#38bdf8',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'monospace',
          }}
        >
          ☽ Moon
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '22%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          opacity: progress > 0.6 ? 1 : 0,
        }}
      >
        <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '14px' }}>
          H4
        </div>
        <div
          style={{
            color: accentColor,
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'monospace',
          }}
        >
          ♂ Mars
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '78%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          opacity: progress > 0.6 ? 1 : 0,
        }}
      >
        <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '14px' }}>
          H7
        </div>
        <div
          style={{
            color: '#38bdf8',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'monospace',
          }}
        >
          ♀ Venus
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '50%',
          transform: 'translate(-50%, 50%)',
          textAlign: 'center',
          opacity: progress > 0.7 ? 1 : 0,
        }}
      >
        <div style={{ color: '#ffffff', fontWeight: 900, fontSize: '18px' }}>
          H10 (Karma)
        </div>
        <div
          style={{
            color: accentColor,
            fontWeight: 700,
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        >
          ♄ Saturn 08° Aqu
        </div>
      </div>
    </div>
  );
};

// ==========================================
// BITTRIX TECHNOLOGIES ROYAL PURPLE OUTRO
// ==========================================
const BittrixOutro: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  // Staggered letters for "BITTRIX"
  const letters = ['B', 'I', 'T', 'T', 'R', 'I', 'X'];

  const gearRotate = interpolate(frame, [0, 120], [0, 360]);
  const chainOffset = (frame * 3.5) % 48;

  // Underline expansion spring
  const underlineProgress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  // Light shine sweep
  const sweepPos = interpolate(frame, [25, 75], [-120, 220], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#5b1a78',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 500,
      }}
    >
      {/* Background 6-Point Radial Gradient Hexagon with spoke circles */}
      <svg
        width="900"
        height="900"
        viewBox="0 0 900 900"
        style={{
          position: 'absolute',
          opacity: 0.28,
          transform: `scale(${1 + Math.sin(frame * 0.04) * 0.05}) rotate(${
            frame * 0.15
          }deg)`,
        }}
      >
        <defs>
          <radialGradient
            id="hexRadialGrad"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#9d4edd" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#5b1a78" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 6-point Hexagon polygon */}
        <polygon
          points="450,120 735,285 735,615 450,780 165,615 165,285"
          fill="url(#hexRadialGrad)"
          stroke="#c084fc"
          strokeWidth="3"
        />

        {/* Spoke lines to vertices */}
        {[
          [450, 120],
          [735, 285],
          [735, 615],
          [450, 780],
          [165, 615],
          [165, 285],
        ].map(([x, y], idx) => (
          <g key={idx}>
            <line
              x1="450"
              y1="450"
              x2={x}
              y2={y}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            {/* Spoke circle at each apex */}
            <circle
              cx={x}
              cy={y}
              r="14"
              fill="#5b1a78"
              stroke="#ffffff"
              strokeWidth="3"
            />
            <circle cx={x} cy={y} r="5" fill="#f3e8ff" />
          </g>
        ))}
      </svg>

      {/* Hero Gear & Chain Mechanism */}
      <div
        style={{
          position: 'relative',
          width: '180px',
          height: '180px',
          marginBottom: '32px',
        }}
      >
        {/* Rolling chain link track behind gear */}
        <div
          style={{
            position: 'absolute',
            bottom: '-12px',
            left: '-60px',
            width: '300px',
            height: '24px',
            overflow: 'hidden',
          }}
        >
          <svg
            width="360"
            height="24"
            style={{ transform: `translateX(${-chainOffset}px)` }}
          >
            {Array.from({ length: 14 }).map((_, ci) => (
              <g key={ci} transform={`translate(${ci * 28}, 4)`}>
                <rect
                  x="0"
                  y="0"
                  width="22"
                  height="14"
                  rx="4"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2.5"
                />
                <circle cx="6" cy="7" r="2.5" fill="#ffffff" />
                <circle cx="16" cy="7" r="2.5" fill="#ffffff" />
              </g>
            ))}
          </svg>
        </div>

        {/* 12-Tooth Rotating Gear */}
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          style={{
            transform: `rotate(${gearRotate}deg)`,
            filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.45))',
          }}
        >
          <g transform="translate(90, 90)">
            {/* 12 gear teeth */}
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={i}
                x="-10"
                y="-82"
                width="20"
                height="18"
                rx="3"
                fill="#ffffff"
                transform={`rotate(${i * 30})`}
              />
            ))}
            {/* Main gear wheel body */}
            <circle
              cx="0"
              cy="0"
              r="72"
              fill="#7b2cbf"
              stroke="#ffffff"
              strokeWidth="4"
            />
            <circle
              cx="0"
              cy="0"
              r="52"
              fill="#5b1a78"
              stroke="#c084fc"
              strokeWidth="3"
            />
          </g>
        </svg>

        {/* Serif 'B' centered within gear (stationary or counter-rotated) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: '78px',
            fontWeight: 'bold',
            color: '#ffffff',
            textShadow: '0 4px 16px rgba(0,0,0,0.6)',
            userSelect: 'none',
          }}
        >
          B
        </div>
      </div>

      {/* Staggered Letter Italic Bold BITTRIX */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {letters.map((char, index) => {
          const lSpring = spring({
            frame: frame - index * 2.5,
            fps,
            config: { damping: 14, stiffness: 140 },
          });
          const translateY = interpolate(lSpring, [0, 1], [40, 0]);
          const opacity = interpolate(lSpring, [0, 1], [0, 1]);

          return (
            <span
              key={index}
              style={{
                fontSize: '84px',
                fontWeight: 900,
                fontStyle: 'italic',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#ffffff',
                letterSpacing: '0.12em',
                transform: `translateY(${translateY}px)`,
                opacity,
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              {char}
            </span>
          );
        })}

        {/* Shine Sweep Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${sweepPos}%`,
            width: '60px',
            height: '100%',
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
            transform: 'skewX(-25deg)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Expanding Underline */}
      <div
        style={{
          height: '4px',
          width: '560px',
          backgroundColor: '#c084fc',
          marginTop: '6px',
          marginBottom: '16px',
          transform: `scaleX(${underlineProgress})`,
          transformOrigin: 'center',
          boxShadow: '0 0 12px #c084fc',
        }}
      />

      {/* Tracking TECHNOLOGIES */}
      <div
        style={{
          fontSize: '26px',
          fontWeight: 700,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#e9d5ff',
          letterSpacing: `${interpolate(frame, [15, 80], [0.25, 0.55], {
            extrapolateRight: 'clamp',
          })}em`,
          textTransform: 'uppercase',
          opacity: interpolate(frame, [10, 35], [0, 1], {
            extrapolateLeft: 'clamp',
          }),
        }}
      >
        TECHNOLOGIES
      </div>

      {/* Spoken Narration Outro Text */}
      <div
        style={{
          marginTop: '36px',
          fontSize: '24px',
          fontWeight: 600,
          color: '#ffffff',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '12px 28px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          opacity: interpolate(frame, [30, 50], [0, 1], {
            extrapolateLeft: 'clamp',
          }),
        }}
      >
        Follow Bittrix Technologies for more interesting concepts.
      </div>
    </AbsoluteFill>
  );
};

// ==========================================
// MAIN COMPOSITION COMPONENT
// ==========================================
export default function GeneratedCliVideo() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ------------------------------------------
  // CONTINUOUS LIVING VIRTUAL CAMERA
  // ------------------------------------------
  // Camera pans, pushes and rotates smoothly through the continuous canvas
  const camX = interpolate(
    frame,
    [0, 121, 242, 364, 494, 615, 728, 837, 969],
    [0, -40, 30, -20, 40, -30, 0, 10, 0],
    { extrapolateRight: 'clamp' }
  );

  const camY = interpolate(
    frame,
    [0, 121, 242, 364, 494, 615, 728, 837, 969],
    [0, -25, 15, -10, 20, -15, 0, -20, 0],
    { extrapolateRight: 'clamp' }
  );

  const camScale = interpolate(
    frame,
    [0, 60, 121, 242, 364, 494, 615, 728, 837, 969],
    [1.0, 1.08, 1.03, 1.06, 1.1, 1.02, 1.08, 1.15, 1.05, 1.0],
    { extrapolateRight: 'clamp' }
  );

  // Background Cosmic Coordinate Grid Movement
  const gridOffsetY = (frame * 1.2) % 60;

  // Background cosmic dust points (stable across frames)
  const cosmicDust = useMemo(() => {
    return Array.from({ length: 42 }).map((_, i) => ({
      x: ((i * 137.5) % width) + (i % 5) * 20,
      y: ((i * 269.3) % height) + (i % 3) * 15,
      size: 2 + (i % 4),
      alpha: 0.2 + (i % 5) * 0.15,
      speed: 0.4 + (i % 3) * 0.3,
    }));
  }, [width, height]);

  // Outro triggering condition (~last 85 frames, from frame 884 to 969)
  const isOutroActive = frame >= 884;
  const outroLocalFrame = Math.max(0, frame - 884);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050713',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ------------------------------------------ */}
      {/* PERSISTENT LIVING CANVAS (CAMERA CONTAINER) */}
      {/* ------------------------------------------ */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: `scale(${camScale}) translate(${camX}px, ${camY}px)`,
          transformOrigin: 'center center',
          transition: 'transform 0.05s linear',
        }}
      >
        {/* Subtle Celestial Coordinates Grid */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `radial-gradient(circle, rgba(56, 189, 248, 0.08) 1.5px, transparent 1.5px), linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
            backgroundSize: `60px 60px, 120px 120px`,
            backgroundPosition: `0px ${gridOffsetY}px, 0px 0px`,
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        />

        {/* Ambient Astro Glow Orbs (Soft Cosmic Fields) */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            width: '600px',
            height: '600px',
            background:
              'radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '12%',
            width: '700px',
            height: '700px',
            background:
              'radial-gradient(circle, rgba(56, 189, 248, 0.14) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        {/* Floating Constellation Stars */}
        {cosmicDust.map((pt, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${pt.x}px`,
              top: `${(pt.y - frame * pt.speed + height) % height}px`,
              width: `${pt.size}px`,
              height: `${pt.size}px`,
              backgroundColor: '#ffffff',
              opacity: pt.alpha * (0.6 + Math.sin(frame * 0.1 + idx) * 0.4),
              transform: 'rotate(45deg)',
              boxShadow: `0 0 8px #38bdf8`,
            }}
          />
        ))}

        {/* ========================================== */}
        {/* SCENE 1: HOOK (0 -> 121)                   */}
        {/* "Lost in chaotic client messages?"         */}
        {/* ========================================== */}
        <Sequence
          from={SCENE_OFFSETS[0]}
          durationInFrames={SCENES[0].durationInFrames}
        >
          {(() => {
            const localFrame = frame - SCENE_OFFSETS[0];
            const alertPulse = 1 + Math.sin(localFrame * 0.28) * 0.08;

            // Chaotic incoming notification message pills
            const msg1Progress = spring({
              frame: localFrame - 5,
              fps,
              config: { damping: 12 },
            });
            const msg2Progress = spring({
              frame: localFrame - 20,
              fps,
              config: { damping: 12 },
            });
            const msg3Progress = spring({
              frame: localFrame - 35,
              fps,
              config: { damping: 12 },
            });

            return (
              <AbsoluteFill
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* On Screen Banner */}
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    marginBottom: '40px',
                    textShadow: '0 0 24px rgba(244, 63, 94, 0.6)',
                  }}
                >
                  Drowning In Client DMs?
                </div>

                {/* Overwhelmed Alert Beacon & Chaotic Message Badges */}
                <div
                  style={{
                    position: 'relative',
                    width: '640px',
                    height: '320px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {/* Pulsing Central Red Alert Badge */}
                  <div
                    style={{
                      transform: `scale(${alertPulse})`,
                      padding: '24px 44px',
                      borderRadius: '24px',
                      background: 'rgba(244, 63, 94, 0.18)',
                      border: '2px solid #f43f5e',
                      boxShadow:
                        '0 0 50px rgba(244, 63, 94, 0.5), inset 0 0 20px rgba(244, 63, 94, 0.3)',
                      textAlign: 'center',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: '#f43f5e',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        marginBottom: '6px',
                      }}
                    >
                      ⚠ Unread Consultations
                    </div>
                    <div
                      style={{
                        fontSize: '64px',
                        fontWeight: 900,
                        color: '#ffffff',
                      }}
                    >
                      +148
                    </div>
                  </div>

                  {/* Chaotic Floating Message Chips with angles */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '0px',
                      left: '20px',
                      transform: `translateY(${interpolate(
                        msg1Progress,
                        [0, 1],
                        [60, 0]
                      )}px) rotate(-8deg)`,
                      opacity: msg1Progress,
                      background: 'rgba(15, 23, 42, 0.92)',
                      border: '1px solid rgba(244, 63, 94, 0.6)',
                      borderRadius: '16px',
                      padding: '14px 22px',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#f43f5e',
                        fontWeight: 700,
                      }}
                    >
                      WhatsApp • 03:14 AM
                    </div>
                    <div
                      style={{
                        fontSize: '17px',
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      "Guruji, marriage match compatibility urgent!"
                    </div>
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      transform: `translateY(${interpolate(
                        msg2Progress,
                        [0, 1],
                        [50, 0]
                      )}px) rotate(6deg)`,
                      opacity: msg2Progress,
                      background: 'rgba(15, 23, 42, 0.92)',
                      border: '1px solid rgba(56, 189, 248, 0.6)',
                      borderRadius: '16px',
                      padding: '14px 22px',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#38bdf8',
                        fontWeight: 700,
                      }}
                    >
                      Instagram DM • 04:22 AM
                    </div>
                    <div
                      style={{
                        fontSize: '17px',
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      "Sent birth time details in voice note..."
                    </div>
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      top: '110px',
                      right: '-40px',
                      transform: `scale(${msg3Progress}) rotate(-3deg)`,
                      opacity: msg3Progress,
                      background: 'rgba(244, 63, 94, 0.85)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '14px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                    }}
                  >
                    Missing Birth Place ❌
                  </div>
                </div>

                {/* Subtitle Karaoke */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    width: '100%',
                  }}
                >
                  <KaraokeSubtitle
                    words={SCENES[0].words}
                    localFrame={localFrame}
                    accentColor={SCENES[0].themeColor}
                  />
                </div>
              </AbsoluteFill>
            );
          })()}
        </Sequence>

        {/* ========================================== */}
        {/* SCENE 2: HERO OBJECT (121 -> 242)          */}
        {/* "Meet AstroConnect."                       */}
        {/* ========================================== */}
        <Sequence
          from={SCENE_OFFSETS[1]}
          durationInFrames={SCENES[1].durationInFrames}
        >
          {(() => {
            const localFrame = frame - SCENE_OFFSETS[1];
            const heroEntrance = spring({
              frame: localFrame,
              fps,
              config: { damping: 14, stiffness: 100 },
            });
            const wheelSpin = localFrame * 0.8;

            return (
              <AbsoluteFill
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* On-screen Title */}
                <div
                  style={{
                    fontSize: '44px',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginBottom: '32px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Structured Astrologer Dashboard
                </div>

                {/* Hero AstroConnect Brand & Chakra Core */}
                <div
                  style={{
                    position: 'relative',
                    width: '780px',
                    height: '380px',
                    background: 'rgba(10, 16, 38, 0.82)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '28px',
                    boxShadow:
                      '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.2)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 48px',
                    gap: '40px',
                    transform: `scale(${heroEntrance})`,
                  }}
                >
                  {/* Rotating 12-Spoke Astro Chakra */}
                  <AstroChakraWheel
                    rotation={wheelSpin}
                    glowColor="#38bdf8"
                    size={240}
                  />

                  {/* Brand & Dashboard Stat Teaser */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'inline-block',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '13px',
                        padding: '6px 14px',
                        borderRadius: '100px',
                        letterSpacing: '0.12em',
                        marginBottom: '14px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Astrology OS v2.4
                    </div>
                    <div
                      style={{
                        fontSize: '48px',
                        fontWeight: 900,
                        color: '#ffffff',
                        lineHeight: 1.1,
                        marginBottom: '12px',
                      }}
                    >
                      AstroConnect
                    </div>
                    <div
                      style={{
                        fontSize: '18px',
                        color: '#94a3b8',
                        lineHeight: 1.5,
                      }}
                    >
                      High-throughput consultation triage platform for Vedic
                      astrologers.
                    </div>
                  </div>
                </div>

                {/* Subtitle Karaoke */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    width: '100%',
                  }}
                >
                  <KaraokeSubtitle
                    words={SCENES[1].words}
                    localFrame={localFrame}
                    accentColor={SCENES[1].themeColor}
                  />
                </div>
              </AbsoluteFill>
            );
          })()}
        </Sequence>

        {/* ========================================== */}
        {/* SCENE 3: CARD STACK (242 -> 364)           */}
        {/* "Every ticket organizes client birth data."*/}
        {/* ========================================== */}
        <Sequence
          from={SCENE_OFFSETS[2]}
          durationInFrames={SCENES[2].durationInFrames}
        >
          {(() => {
            const localFrame = frame - SCENE_OFFSETS[2];

            const tickets = [
              {
                id: 'TCK-8921',
                name: 'Karthik Ramanathan',
                dob: '14-Aug-1992',
                tob: '04:15 AM',
                pob: 'Chennai, TN',
                query: 'Saturn Sade Sati Analysis',
                tag: 'VERIFIED INTAKE',
              },
              {
                id: 'TCK-8922',
                name: 'Priya Sundaram',
                dob: '28-Nov-1995',
                tob: '10:42 PM',
                pob: 'Madurai, TN',
                query: 'D-9 Navamsha Marriage Match',
                tag: 'VERIFIED INTAKE',
              },
              {
                id: 'TCK-8923',
                name: 'Ananya Deshmukh',
                dob: '03-Feb-1998',
                tob: '07:20 AM',
                pob: 'Pune, MH',
                query: 'Career Transit in 10th Bhava',
                tag: 'VERIFIED INTAKE',
              },
            ];

            return (
              <AbsoluteFill
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '44px',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginBottom: '36px',
                  }}
                >
                  Queued Client Intake Tickets
                </div>

                {/* Staggered Vertical Card Stack */}
                <div
                  style={{
                    position: 'relative',
                    width: '760px',
                    height: '380px',
                  }}
                >
                  {tickets.map((tck, idx) => {
                    const cardSpring = spring({
                      frame: localFrame - idx * 16,
                      fps,
                      config: { damping: 14, stiffness: 110 },
                    });
                    const translateY = interpolate(
                      cardSpring,
                      [0, 1],
                      [160 + idx * 40, idx * 80]
                    );
                    const scale = interpolate(
                      cardSpring,
                      [0, 1],
                      [0.85, 1 - (tickets.length - 1 - idx) * 0.04]
                    );

                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${translateY}px) scale(${scale})`,
                          background: 'rgba(15, 23, 42, 0.94)',
                          border: '1.5px solid rgba(56, 189, 248, 0.45)',
                          borderRadius: '20px',
                          padding: '20px 32px',
                          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
                          backdropFilter: 'blur(16px)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          opacity: cardSpring,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'center',
                              marginBottom: '6px',
                            }}
                          >
                            <span
                              style={{
                                color: '#38bdf8',
                                fontWeight: 800,
                                fontSize: '13px',
                                fontFamily: 'monospace',
                              }}
                            >
                              {tck.id}
                            </span>
                            <span
                              style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {tck.tag}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '22px',
                              fontWeight: 800,
                              color: '#ffffff',
                            }}
                          >
                            {tck.name}
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#94a3b8',
                              marginTop: '4px',
                            }}
                          >
                            {tck.query}
                          </div>
                        </div>

                        {/* Birth Coordinates Matrix */}
                        <div
                          style={{
                            background: 'rgba(8, 12, 28, 0.8)',
                            padding: '10px 18px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            textAlign: 'right',
                          }}
                        >
                          <div
                            style={{
                              color: '#38bdf8',
                              fontSize: '13px',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                            }}
                          >
                            DOB: {tck.dob}
                          </div>
                          <div
                            style={{
                              color: '#e2e8f0',
                              fontSize: '13px',
                              fontWeight: 600,
                              fontFamily: 'monospace',
                            }}
                          >
                            TOB: {tck.tob}
                          </div>
                          <div
                            style={{
                              color: '#94a3b8',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                            }}
                          >
                            POB: {tck.pob}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtitle Karaoke */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    width: '100%',
                  }}
                >
                  <KaraokeSubtitle
                    words={SCENES[2].words}
                    localFrame={localFrame}
                    accentColor={SCENES[2].themeColor}
                  />
                </div>
              </AbsoluteFill>
            );
          })()}
        </Sequence>

        {/* ========================================== */}
        {/* SCENE 4: VEDIC KUNDLI (364 -> 494)         */}
        {/* "Analyze verified Vedic Kundli charts"     */}
        {/* ========================================== */}
        <Sequence
          from={SCENE_OFFSETS[3]}
          durationInFrames={SCENES[3].durationInFrames}
        >
          {(() => {
            const localFrame = frame - SCENE_OFFSETS[3];
            const drawProgress = interpolate(localFrame, [10, 80], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <AbsoluteFill
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '44px',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginBottom: '24px',
                  }}
                >
                  Instant Vedic Kundli Analysis
                </div>

                <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
                  {/* North Indian Diamond Vedic Kundli Chart */}
                  <VedicKundliDiamond
                    progress={drawProgress}
                    accentColor="#f43f5e"
                  />

                  {/* Planet Transit Telemetry Matrix */}
                  <div
                    style={{
                      width: '320px',
                      background: 'rgba(15, 23, 42, 0.88)',
                      borderRadius: '20px',
                      padding: '24px',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    <div
                      style={{
                        color: '#f43f5e',
                        fontWeight: 800,
                        fontSize: '13px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: '12px',
                      }}
                    >
                      Planetary Dignity Table
                    </div>
                    {[
                      {
                        planet: 'Jupiter (Guru)',
                        state: 'Exalted 9th H',
                        color: '#38bdf8',
                      },
                      {
                        planet: 'Saturn (Shani)',
                        state: 'Own Sign Aqu',
                        color: '#a855f7',
                      },
                      {
                        planet: 'Venus (Shukra)',
                        state: 'Friendly Sign',
                        color: '#38bdf8',
                      },
                      {
                        planet: 'Rahu / Ketu',
                        state: 'Kendra Axis',
                        color: '#f43f5e',
                      },
                    ].map((row, rIdx) => (
                      <div
                        key={rIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '14px',
                        }}
                      >
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>
                          {row.planet}
                        </span>
                        <span
                          style={{
                            color: row.color,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                          }}
                        >
                          {row.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtitle Karaoke */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    width: '100%',
                  }}
                >
                  <KaraokeSubtitle
                    words={SCENES[3].words}
                    localFrame={localFrame}
                    accentColor={SCENES[3].themeColor}
                  />
                </div>
              </AbsoluteFill>
            );
          })()}
        </Sequence>

        {/* ========================================== */}
        {/* SCENE 5: SPLIT COMPARE (494 -> 615)        */}
        {/* "Consult across English, Tamil, Tanglish"  */}
        {/* ========================================== */}
        <Sequence
          from={SCENE_OFFSETS[4]}
          durationInFrames={SCENES[4].durationInFrames}
        >
          {(() => {
            const localFrame = frame - SCENE_OFFSETS[4];
            const slideLeft = spring({
              frame: localFrame - 5,
              fps,
              config: { damping: 14 },
            });
            const slideRight = spring({
              frame: localFrame - 20,
              fps,
              config: { damping: 14 },
            });

            return (
              <AbsoluteFill
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '44px',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginBottom: '32px',
                  }}
                >
                  Multilingual Triage Support
                </div>

                {/* Split Screen Container */}
                <div style={{ display: 'flex', gap: '32px', width: '980px' }}>
                  {/* Left: English Stream */}
                  <div
                    style={{
                      flex: 1,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1.5px solid rgba(56, 189, 248, 0.5)',
                      borderRadius: '24px',
                      padding: '28px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                      transform: `translateX(${interpolate(
                        slideLeft,
                        [0, 1],
                        [-60, 0]
                      )}px)`,
                      opacity: slideLeft,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                      }}
                    >
                      <span
                        style={{
                          background: 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                          fontWeight: 800,
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        INPUT: ENGLISH
                      </span>
                      <span
                        style={{
                          color: '#94a3b8',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                        }}
                      >
                        Source Query
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '18px',
                        color: '#ffffff',
                        fontWeight: 600,
                        lineHeight: 1.6,
                      }}
                    >
                      "Will the upcoming Jupiter transit bring promotion in my
                      software engineering role?"
                    </div>
                  </div>

                  {/* Right: Tamil & Tanglish Synthesis */}
                  <div
                    style={{
                      flex: 1,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1.5px solid rgba(244, 63, 94, 0.5)',
                      borderRadius: '24px',
                      padding: '28px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                      transform: `translateX(${interpolate(
                        slideRight,
                        [0, 1],
                        [60, 0]
                      )}px)`,
                      opacity: slideRight,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                      }}
                    >
                      <span
                        style={{
                          background: 'rgba(244, 63, 94, 0.2)',
                          color: '#f43f5e',
                          fontWeight: 800,
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        OUTPUT: தமிழ் / TANGLISH
                      </span>
                      <span
                        style={{
                          color: '#94a3b8',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                        }}
                      >
                        Auto-Drafted
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '18px',
                        color: '#ffffff',
                        fontWeight: 600,
                        lineHeight: 1.6,
                      }}
                    >
                      "குரு பெயர்ச்சி உங்கள் 10-ஆம் வீட்டைப் பார்ப்பதால் மே மாதத்திற்கு
                      பிறகு promotion நிச்சயம் கிடைக்கும்."
                    </div>
                    <div
                      style={{
                        marginTop: '12px',
                        fontSize: '14px',
                        color: '#38bdf8',
                        fontStyle: 'italic',
                      }}
                    >
                      Tanglish: "Guru peyarchi 10th veetla paarpadhala promotion
                      kandippa irukku."
                    </div>
                  </div>
                </div>

                {/* Subtitle Karaoke */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    width: '100%',
                  }}
                >
                  <KaraokeSubtitle
                    words={SCENES[4].words}
                    localFrame={localFrame}
                    accentColor={SCENES[4].themeColor}
                  />
                </div>
              </AbsoluteFill>
            );
          })()}
        </Sequence>

        {/* ========================================== */}
        {/* SCENE 6: TIMELINE (615 -> 728)             */}
        {/* "Track answers through clear stages."      */}
        {/* ========================================== */}
        <Sequence
          from={SCENE_OFFSETS[5]}
          durationInFrames={SCENES[5].durationInFrames}
        >
          {(() => {
            const localFrame = frame - SCENE_OFFSETS[5];
            const stages = [
              { label: 'Intake', desc: 'Birth verification' },
              { label: 'Kundli Cast', desc: 'D1 & D9 Ephemeris' },
              { label: 'Analysis', desc: 'Bhava balance' },
              { label: 'Drafted', desc: 'Multilingual script' },
              { label: 'Resolved', desc: 'Delivered to client' },
            ];

            const activeStageIndex = Math.min(
              stages.length - 1,
              Math.floor((localFrame / 80) * stages.length)
            );

            return (
              <AbsoluteFill
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '44px',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginBottom: '50px',
                  }}
                >
                  Audited Lifecycle Tracking
                </div>

                {/* Horizontal Pipeline Diagram */}
                <div
                  style={{
                    position: 'relative',
                    width: '940px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Connecting Track Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '28px',
                      left: '40px',
                      right: '40px',
                      height: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: '#38bdf8',
                        width: `${(activeStageIndex / (stages.length - 1)) * 100}%`,
                        boxShadow: '0 0 12px #38bdf8',
                        transition: 'width 0.2s ease-out',
                      }}
                    />
                  </div>

                  {stages.map((stg, sIdx) => {
                    const isDone = sIdx <= activeStageIndex;
                    return (
                      <div
                        key={sIdx}
                        style={{
                          zIndex: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: isDone ? '#38bdf8' : '#0f172a',
                            border: `2px solid ${
                              isDone ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'
                            }`,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: isDone ? '#050713' : '#ffffff',
                            fontWeight: 900,
                            fontSize: '20px',
                            boxShadow: isDone
                              ? '0 0 24px rgba(56, 189, 248, 0.8)'
                              : 'none',
                            transform: isDone ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          {sIdx + 1}
                        </div>
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            color: isDone ? '#ffffff' : '#64748b',
                            marginTop: '16px',
                          }}
                        >
                          {stg.label}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: isDone ? '#94a3b8' : '#475569',
                            marginTop: '4px',
                            maxWidth: '120px',
                          }}
                        >
                          {stg.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtitle Karaoke */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    width: '100%',
                  }}
                >
                  <KaraokeSubtitle
                    words={SCENES[5].words}
                    localFrame={localFrame}
                    accentColor={SCENES[5].themeColor}
                  />
                </div>
              </AbsoluteFill>
            );
          })()}
        </Sequence>

        {/* ========================================== */}
        {/* SCENE 7: STAT CALLOUT (728 -> 837)         */}
        {/* "Resolve queries without missed appts."    */}
        {/* ========================================== */}
        <Sequence
          from={SCENE_OFFSETS[6]}
          durationInFrames={SCENES[6].durationInFrames}
        >
          {(() => {
            const localFrame = frame - SCENE_OFFSETS[6];
            const punchSpring = spring({
              frame: localFrame,
              fps,
              config: { damping: 11, stiffness: 130 },
            });

            return (
              <AbsoluteFill
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '44px',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginBottom: '40px',
                  }}
                >
                  Zero Missed Consultations
                </div>

                {/* Stat punch container with neon rings */}
                <div
                  style={{
                    position: 'relative',
                    width: '740px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '40px',
                    transform: `scale(${punchSpring})`,
                  }}
                >
                  {/* Main Stat Card 1 */}
                  <div
                    style={{
                      flex: 1,
                      background: 'rgba(15, 23, 42, 0.92)',
                      border: '2px solid #f43f5e',
                      borderRadius: '28px',
                      padding: '36px 28px',
                      textAlign: 'center',
                      boxShadow: '0 0 45px rgba(244, 63, 94, 0.4)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '82px',
                        fontWeight: 900,
                        color: '#f43f5e',
                        lineHeight: 1,
                        marginBottom: '12px',
                      }}
                    >
                      0
                    </div>
                    <div
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#ffffff',
                      }}
                    >
                      Missed Queries
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#94a3b8',
                        marginTop: '6px',
                      }}
                    >
                      Real-time queue SLA alerts
                    </div>
                  </div>

                  {/* Main Stat Card 2 */}
                  <div
                    style={{
                      flex: 1,
                      background: 'rgba(15, 23, 42, 0.92)',
                      border: '2px solid #38bdf8',
                      borderRadius: '28px',
                      padding: '36px 28px',
                      textAlign: 'center',
                      boxShadow: '0 0 45px rgba(56, 189, 248, 0.4)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '82px',
                        fontWeight: 900,
                        color: '#38bdf8',
                        lineHeight: 1,
                        marginBottom: '12px',
                      }}
                    >
                      100%
                    </div>
                    <div
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#ffffff',
                      }}
                    >
                      Resolution Rate
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#94a3b8',
                        marginTop: '6px',
                      }}
                    >
                      Every birth chart archived
                    </div>
                  </div>
                </div>

                {/* Subtitle Karaoke */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    width: '100%',
                  }}
                >
                  <KaraokeSubtitle
                    words={SCENES[6].words}
                    localFrame={localFrame}
                    accentColor={SCENES[6].themeColor}
                  />
                </div>
              </AbsoluteFill>
            );
          })()}
        </Sequence>

        {/* ========================================== */}
        {/* SCENE 8: CTA PART 1 (837 -> 884)           */}
        {/* "Visit astro-textbased.vercel.app..."       */}
        {/* ========================================== */}
        <Sequence
          from={SCENE_OFFSETS[7]}
          durationInFrames={SCENES[7].durationInFrames}
        >
          {(() => {
            const localFrame = frame - SCENE_OFFSETS[7];

            // Render URL CTA until frame 884
            if (frame >= 884) {
              return null;
            }

            const ctaSpring = spring({
              frame: localFrame,
              fps,
              config: { damping: 13 },
            });

            return (
              <AbsoluteFill
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '44px',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginBottom: '32px',
                  }}
                >
                  Upgrade Your Practice Today
                </div>

                {/* Glowing URL Container */}
                <div
                  style={{
                    transform: `scale(${ctaSpring})`,
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '2px solid #38bdf8',
                    borderRadius: '30px',
                    padding: '36px 60px',
                    boxShadow: '0 0 60px rgba(56, 189, 248, 0.45)',
                    textAlign: 'center',
                    maxWidth: '820px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '16px',
                      color: '#38bdf8',
                      fontWeight: 800,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      marginBottom: '12px',
                    }}
                  >
                    Official Portal
                  </div>
                  <div
                    style={{
                      fontSize: '42px',
                      fontWeight: 900,
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      letterSpacing: '-0.02em',
                      marginBottom: '24px',
                    }}
                  >
                    astro-textbased.vercel.app
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(90deg, #38bdf8, #f43f5e)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '20px',
                      padding: '14px 38px',
                      borderRadius: '50px',
                      boxShadow: '0 8px 24px rgba(244, 63, 94, 0.5)',
                    }}
                  >
                    Get Started Free →
                  </div>
                </div>

                {/* Subtitle Karaoke */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    width: '100%',
                  }}
                >
                  <KaraokeSubtitle
                    words={SCENES[7].words}
                    localFrame={localFrame}
                    accentColor={SCENES[7].themeColor}
                  />
                </div>
              </AbsoluteFill>
            );
          })()}
        </Sequence>
      </div>

      {/* ========================================== */}
      {/* SCENE 8 PART 2: BITTRIX TECHNOLOGIES OUTRO */}
      {/* (~Last 85 frames, 884 -> 969)              */}
      {/* ========================================== */}
      {isOutroActive && <BittrixOutro frame={outroLocalFrame} fps={fps} />}
    </AbsoluteFill>
  );
}