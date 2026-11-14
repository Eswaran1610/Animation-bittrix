import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

// ============================================================================
// DATA & SCENE TIMINGS (MEASURED TIMESTAMPS)
// ============================================================================
interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface SceneData {
  scene_number: number;
  role: string;
  durationInFrames: number;
  startFrameGlobal: number;
  narration: string;
  on_screen_text: string;
  themeColor: string;
  words: WordTiming[];
}

const SCENES: SceneData[] = [
  {
    scene_number: 1,
    role: "hook",
    durationInFrames: 95,
    startFrameGlobal: 0,
    narration: "Does AI actually think like you?",
    on_screen_text: "Does AI Actually Think?",
    themeColor: "#f43f5e",
    words: [
      { word: "Does", startFrame: 3, endFrame: 9 },
      { word: "AI", startFrame: 10, endFrame: 19 },
      { word: "actually", startFrame: 19, endFrame: 33 },
      { word: "think", startFrame: 33, endFrame: 41 },
      { word: "like", startFrame: 41, endFrame: 47 },
      { word: "you?", startFrame: 47, endFrame: 56 }
    ]
  },
  {
    scene_number: 2,
    role: "body",
    durationInFrames: 134,
    startFrameGlobal: 95,
    narration: "No. It chops text into tokens.",
    on_screen_text: "Words Turn Into Tokens",
    themeColor: "#38bdf8",
    words: [
      { word: "No.", startFrame: 3, endFrame: 18 },
      { word: "It", startFrame: 44, endFrame: 49 },
      { word: "chops", startFrame: 50, endFrame: 59 },
      { word: "text", startFrame: 59, endFrame: 69 },
      { word: "into", startFrame: 69, endFrame: 74 },
      { word: "tokens.", startFrame: 75, endFrame: 96 }
    ]
  },
  {
    scene_number: 3,
    role: "body",
    durationInFrames: 131,
    startFrameGlobal: 229,
    narration: "Deep networks calculate mathematical probabilities.",
    on_screen_text: "Calculating Next Word Odds",
    themeColor: "#38bdf8",
    words: [
      { word: "Deep", startFrame: 3, endFrame: 12 },
      { word: "networks", startFrame: 12, endFrame: 26 },
      { word: "calculate", startFrame: 27, endFrame: 43 },
      { word: "mathematical", startFrame: 44, endFrame: 63 },
      { word: "probabilities.", startFrame: 64, endFrame: 93 }
    ]
  },
  {
    scene_number: 4,
    role: "body",
    durationInFrames: 103,
    startFrameGlobal: 360,
    narration: "Top ranked words are picked sequentially.",
    on_screen_text: "Picking The Top Probability",
    themeColor: "#f43f5e",
    words: [
      { word: "Top", startFrame: 3, endFrame: 11 },
      { word: "ranked", startFrame: 11, endFrame: 19 },
      { word: "words", startFrame: 20, endFrame: 29 },
      { word: "are", startFrame: 29, endFrame: 33 },
      { word: "picked", startFrame: 33, endFrame: 41 },
      { word: "sequentially.", startFrame: 41, endFrame: 65 }
    ]
  },
  {
    scene_number: 5,
    role: "body",
    durationInFrames: 105,
    startFrameGlobal: 463,
    narration: "Trillions of web lines trained weights.",
    on_screen_text: "Trillions Of Training Patterns",
    themeColor: "#38bdf8",
    words: [
      { word: "Trillions", startFrame: 3, endFrame: 18 },
      { word: "of", startFrame: 18, endFrame: 21 },
      { word: "web", startFrame: 22, endFrame: 29 },
      { word: "lines", startFrame: 29, endFrame: 40 },
      { word: "trained", startFrame: 41, endFrame: 50 },
      { word: "weights.", startFrame: 50, endFrame: 66 }
    ]
  },
  {
    scene_number: 6,
    role: "body",
    durationInFrames: 112,
    startFrameGlobal: 568,
    narration: "Human feedback aligns helpful answers.",
    on_screen_text: "Aligned With Human Guidance",
    themeColor: "#f43f5e",
    words: [
      { word: "Human", startFrame: 3, endFrame: 14 },
      { word: "feedback", startFrame: 15, endFrame: 30 },
      { word: "aligns", startFrame: 30, endFrame: 41 },
      { word: "helpful", startFrame: 42, endFrame: 54 },
      { word: "answers.", startFrame: 54, endFrame: 74 }
    ]
  },
  {
    scene_number: 7,
    role: "cta",
    durationInFrames: 140,
    startFrameGlobal: 680,
    narration: "Follow Bittrix Technologies for more interesting concepts.",
    on_screen_text: "Follow Bittrix Technologies",
    themeColor: "#5b1a78",
    words: [
      { word: "Follow", startFrame: 5, endFrame: 18 },
      { word: "Bittrix", startFrame: 19, endFrame: 36 },
      { word: "Technologies", startFrame: 37, endFrame: 58 },
      { word: "for", startFrame: 59, endFrame: 68 },
      { word: "more", startFrame: 69, endFrame: 82 },
      { word: "interesting", startFrame: 83, endFrame: 105 },
      { word: "concepts.", startFrame: 106, endFrame: 132 }
    ]
  }
];

// ============================================================================
// CONTINUOUS BACKGROUND CANVAS WITH DYNAMIC GRID & ATMOSPHERIC GLOW
// ============================================================================
const LivingCanvas: React.FC<{ frame: number; currentTheme: string }> = ({ frame, currentTheme }) => {
  // Drift oscillations
  const gridOffsetY = (frame * 1.5) % 80;
  const gridOffsetX = Math.sin(frame * 0.02) * 20;

  // Subtle ambient hue shift
  const isOutro = frame >= 680;
  const bgGradient = isOutro
    ? `radial-gradient(circle at 50% 38%, rgba(91, 26, 120, 0.45) 0%, rgba(14, 4, 22, 0.98) 75%, #05010a 100%)`
    : `radial-gradient(circle at 50% 40%, rgba(15, 23, 42, 0.95) 0%, rgba(3, 7, 18, 0.98) 70%, #010409 100%)`;

  return (
    <AbsoluteFill style={{ background: '#020408', overflow: 'hidden', zIndex: 0 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgGradient,
          transition: 'background 0.5s ease',
        }}
      />

      {/* Cyber Grid Lines */}
      <svg
        width="1080"
        height="1920"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isOutro ? 0.08 : 0.15,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <pattern
            id="livingGrid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${gridOffsetX}, ${gridOffsetY})`}
          >
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#livingGrid)" />
      </svg>

      {/* Atmospheric dynamic spotlight beam */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: 540 - 450 + Math.sin(frame * 0.025) * 60,
          width: 900,
          height: 1200,
          background: `radial-gradient(ellipse at 50% 30%, ${currentTheme}25 0%, transparent 70%)`,
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// KINETIC KARAOKE CAPTIONS
// ============================================================================
const KineticCaptions: React.FC<{
  scene: SceneData;
  sceneFrame: number;
}> = ({ scene, sceneFrame }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 240,
        left: 0,
        width: 1080,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 60px',
        gap: '14px 16px',
        zIndex: 50,
      }}
    >
      {scene.words.map((w, idx) => {
        const isActive = sceneFrame >= w.startFrame && sceneFrame <= w.endFrame;
        const isPast = sceneFrame > w.endFrame;

        const wordScale = isActive ? 1.18 : 1.0;
        const wordGlow = isActive
          ? `0 0 25px ${scene.themeColor}, 0 0 50px ${scene.themeColor}88`
          : 'none';

        const textColor = isActive
          ? '#ffffff'
          : isPast
          ? '#e2e8f0'
          : 'rgba(255, 255, 255, 0.45)';

        const bgPill = isActive
          ? `linear-gradient(135deg, ${scene.themeColor}44, ${scene.themeColor}88)`
          : 'transparent';

        return (
          <span
            key={idx}
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              fontSize: 52,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: textColor,
              textShadow: wordGlow,
              transform: `scale(${wordScale}) translateY(${isActive ? -4 : 0}px)`,
              transition: 'transform 0.08s ease, color 0.08s ease',
              padding: '6px 14px',
              borderRadius: 14,
              background: bgPill,
              border: isActive ? `1.5px solid ${scene.themeColor}` : '1.5px solid transparent',
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
// SCENE 1: THE HUMAN HOOK VS NEURAL LATTICE
// ============================================================================
const Scene1Hook: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const popSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const pulse = Math.sin(frame * 0.12) * 6;

  // Synapse line animation
  const dashOffset = Math.max(0, 400 - frame * 8);

  return (
    <div style={{ position: 'relative', width: 1080, height: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* Category Pill Tag */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1.5px solid #f43f5e',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#f43f5e',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          transform: `scale(${popSpring})`,
        }}
      >
        Biological Mind vs Silicon
      </div>

      <svg width="680" height="780" viewBox="0 0 680 780" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="headGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
          <filter id="bloom">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Cranium Glow */}
        <circle cx="340" cy="350" r="240" fill="url(#headGlow)" />

        {/* Stylized Human Profile Silhouette Outline */}
        <path
          d="M 220 580 C 200 520 200 460 210 400 C 215 350 230 300 260 250 C 300 180 370 160 440 180 C 510 200 540 260 550 320 C 555 350 545 375 530 395 C 520 408 530 425 545 440 C 560 455 570 470 560 495 C 545 530 500 550 490 590 Z"
          fill="rgba(15, 23, 42, 0.75)"
          stroke="#f43f5e"
          strokeWidth="3.5"
          filter="url(#bloom)"
        />

        {/* Animated Cybernetic Neural Lattice inside Brain */}
        {/* Nodes */}
        {[
          { cx: 340, cy: 260, r: 8, label: 'MEM' },
          { cx: 420, cy: 270, r: 10, label: 'LOGIC' },
          { cx: 380, cy: 330, r: 12, label: 'CTX' },
          { cx: 460, cy: 350, r: 7, label: 'ATTN' },
          { cx: 320, cy: 380, r: 9, label: 'SYN' },
          { cx: 400, cy: 420, r: 11, label: 'VAL' },
          { cx: 470, cy: 450, r: 8, label: 'OUT' },
        ].map((node, i) => (
          <g key={i}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r + (i % 2 === 0 ? pulse * 0.4 : -pulse * 0.3)}
              fill="#f43f5e"
              filter="url(#bloom)"
            />
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r * 2.2}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            <text
              x={node.cx + 14}
              y={node.cy + 5}
              fill="#cbd5e1"
              fontSize="16"
              fontWeight="700"
              fontFamily="monospace"
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* Laser Synapse Axon Connectors */}
        <g stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="300" strokeDashoffset={dashOffset}>
          <line x1="340" y1="260" x2="420" y2="270" />
          <line x1="420" y1="270" x2="460" y2="350" />
          <line x1="340" y1="260" x2="380" y2="330" />
          <line x1="380" y1="330" x2="320" y2="380" />
          <line x1="380" y1="330" x2="400" y2="420" />
          <line x1="400" y1="420" x2="470" y2="450" />
          <line x1="460" y1="350" x2="400" y2="420" />
        </g>
      </svg>

      {/* Floating Query Warning */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          background: 'rgba(15, 23, 42, 0.9)',
          border: '2px solid rgba(244, 63, 94, 0.6)',
          borderRadius: 20,
          padding: '16px 36px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          textAlign: 'center',
        }}
      >
        <span style={{ color: '#94a3b8', fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>
          QUERY: "IS CONSCIOUSNESS COMPUTED?"
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// SCENE 2: TOKEN CHOPPING JIGSAW DATA BLOCKS
// ============================================================================
const Scene2Tokens: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const chopTime = Math.max(0, frame - 30);
  const chopSpring = spring({ frame: chopTime, fps, config: { damping: 12, stiffness: 160 } });

  const tokens = [
    { word: 'TRANS', id: '2048', color: '#38bdf8', vector: '[+0.82, -0.14, +0.65]' },
    { word: 'FORM', id: '4190', color: '#818cf8', vector: '[-0.45, +0.92, -0.11]' },
    { word: 'ERS', id: '1092', color: '#f43f5e', vector: '[+0.33, +0.57, +0.78]' },
  ];

  return (
    <div style={{ position: 'relative', width: 1080, height: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Category Pill Tag */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1.5px solid #38bdf8',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#38bdf8',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}
      >
        Byte-Pair Tokenizer Engine
      </div>

      {/* Raw String Input Banner */}
      <div
        style={{
          width: 760,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '2px dashed rgba(148, 163, 184, 0.5)',
          borderRadius: 18,
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 40,
        }}
      >
        <span style={{ color: '#94a3b8', fontSize: 24, fontWeight: 700 }}>RAW INPUT TEXT:</span>
        <span style={{ color: '#f8fafc', fontSize: 34, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '4px' }}>
          "TRANSFORMERS"
        </span>
      </div>

      {/* Laser Split Blade line */}
      <div
        style={{
          width: 820,
          height: 3,
          background: 'linear-gradient(90deg, transparent, #38bdf8, #f43f5e, transparent)',
          boxShadow: '0 0 20px #38bdf8',
          marginBottom: 50,
          opacity: interpolate(frame, [25, 35, 60], [0, 1, 0.4]),
        }}
      />

      {/* Jigsaw Split Token Cards */}
      <div style={{ display: 'flex', gap: 24, perspective: 1000 }}>
        {tokens.map((t, idx) => {
          const separation = (idx - 1) * 35 * chopSpring;
          const rotateZ = (idx - 1) * 6 * chopSpring;
          const elevateY = Math.abs(idx - 1) * -15 * chopSpring;

          return (
            <div
              key={idx}
              style={{
                width: 250,
                background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                border: `2.5px solid ${t.color}`,
                borderRadius: 22,
                padding: '24px 18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: `0 25px 50px rgba(0,0,0,0.7), 0 0 30px ${t.color}33`,
                transform: `translateX(${separation}px) translateY(${elevateY}px) rotateZ(${rotateZ}deg)`,
              }}
            >
              <div
                style={{
                  background: `${t.color}22`,
                  border: `1px solid ${t.color}`,
                  borderRadius: 10,
                  padding: '4px 12px',
                  color: t.color,
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  marginBottom: 16,
                }}
              >
                TOKEN ID #{t.id}
              </div>

              <div
                style={{
                  color: '#ffffff',
                  fontSize: 48,
                  fontWeight: 900,
                  letterSpacing: '2px',
                  marginBottom: 16,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {t.word}
              </div>

              {/* High Dimensional Vector Tensor */}
              <div
                style={{
                  background: 'rgba(2, 6, 23, 0.8)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: '#64748b', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>768-D EMBED</div>
                <div style={{ color: '#38bdf8', fontSize: 15, fontFamily: 'monospace', fontWeight: 600 }}>
                  {t.vector}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// SCENE 3: MATHEMATICAL PROBABILITY & SOFTMAX DISTRIBUTION
// ============================================================================
const Scene3Probabilities: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const bars = [
    { word: 'predicting', prob: 84.7, color: '#38bdf8', isWinner: true },
    { word: 'thinking', prob: 9.4, color: '#64748b', isWinner: false },
    { word: 'dreaming', prob: 4.1, color: '#475569', isWinner: false },
    { word: 'feeling', prob: 1.8, color: '#334155', isWinner: false },
  ];

  const mathSpring = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 15, stiffness: 100 } });

  return (
    <div style={{ position: 'relative', width: 1080, height: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Category Pill Tag */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1.5px solid #38bdf8',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#38bdf8',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}
      >
        Softmax Output Distribution
      </div>

      {/* Softmax Formula Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 18,
          padding: '16px 36px',
          marginBottom: 44,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ color: '#38bdf8', fontSize: 26, fontWeight: 800, fontFamily: 'monospace' }}>
          P(W_next | Context) = e^(z_i) / Σ e^(z_j)
        </span>
      </div>

      {/* Dynamic Probability Bar Chart */}
      <div style={{ width: 840, display: 'flex', flexDirection: 'column', gap: 26 }}>
        {bars.map((bar, idx) => {
          const animatedWidth = interpolate(mathSpring, [0, 1], [40, (bar.prob / 100) * 600]);
          const currentCount = (bar.prob * mathSpring).toFixed(1);

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              {/* Word Label */}
              <div
                style={{
                  width: 200,
                  textAlign: 'right',
                  color: bar.isWinner ? '#ffffff' : '#94a3b8',
                  fontSize: 28,
                  fontWeight: bar.isWinner ? 900 : 600,
                  fontFamily: 'monospace',
                }}
              >
                "{bar.word}"
              </div>

              {/* Bar Fill Track */}
              <div
                style={{
                  flex: 1,
                  height: 52,
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  padding: 4,
                  border: bar.isWinner ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
                  boxShadow: bar.isWinner ? '0 0 25px rgba(56, 189, 248, 0.35)' : 'none',
                }}
              >
                <div
                  style={{
                    width: animatedWidth,
                    height: '100%',
                    background: bar.isWinner
                      ? 'linear-gradient(90deg, #0284c7, #38bdf8)'
                      : bar.color,
                    borderRadius: 10,
                    transition: 'width 0.1s ease-out',
                  }}
                />
              </div>

              {/* Percentage Badge */}
              <div
                style={{
                  width: 130,
                  fontSize: 26,
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: bar.isWinner ? '#38bdf8' : '#64748b',
                }}
              >
                {currentCount}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// SCENE 4: SEQUENTIAL ATTENTION & WORD GENERATOR PIPELINE
// ============================================================================
const Scene4SequentialPicker: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const steps = [
    { step: 1, title: 'Query · Key Dot Product', state: 'COMPLETE', time: 10 },
    { step: 2, title: 'Multi-Head Attention Weights', state: 'MATCHED', time: 30 },
    { step: 3, title: 'Sequential Auto-Regressive Step', state: 'SAMPLING', time: 55 },
  ];

  return (
    <div style={{ position: 'relative', width: 1080, height: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Category Pill Tag */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1.5px solid #f43f5e',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#f43f5e',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}
      >
        Sequential Generation Loop
      </div>

      {/* Sequential Timeline Conveyor Tape */}
      <div
        style={{
          width: 860,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '2px solid #334155',
          borderRadius: 24,
          padding: '30px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          marginBottom: 40,
        }}
      >
        <div style={{ color: '#94a3b8', fontSize: 20, fontWeight: 700, marginBottom: 20, letterSpacing: '2px' }}>
          TAPE POSITION: T + 1
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', padding: '16px 26px', borderRadius: 14, color: '#e2e8f0', fontSize: 26, fontWeight: 800 }}>
            The
          </div>
          <div style={{ color: '#64748b', fontSize: 28, fontWeight: 900 }}>→</div>
          <div style={{ background: '#1e293b', padding: '16px 26px', borderRadius: 14, color: '#e2e8f0', fontSize: 26, fontWeight: 800 }}>
            Model
          </div>
          <div style={{ color: '#64748b', fontSize: 28, fontWeight: 900 }}>→</div>
          <div style={{ background: '#1e293b', padding: '16px 26px', borderRadius: 14, color: '#e2e8f0', fontSize: 26, fontWeight: 800 }}>
            Selects
          </div>
          <div style={{ color: '#f43f5e', fontSize: 32, fontWeight: 900 }}>→</div>
          
          {/* Target Picked Word Blooming */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f43f5e, #be123c)',
              padding: '18px 32px',
              borderRadius: 16,
              color: '#ffffff',
              fontSize: 30,
              fontWeight: 900,
              boxShadow: '0 0 35px #f43f5e',
              transform: `scale(${spring({ frame: Math.max(0, frame - 40), fps, config: { damping: 12, stiffness: 140 } })})`,
            }}
          >
            NEXT
          </div>
        </div>
      </div>

      {/* Pipeline Stage Cards */}
      <div style={{ width: 860, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {steps.map((st, i) => {
          const isReached = frame >= st.time;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isReached ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.4)',
                border: isReached ? '1.5px solid #f43f5e' : '1px solid #1e293b',
                borderRadius: 16,
                padding: '18px 28px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: isReached ? '#f43f5e' : '#334155',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  {st.step}
                </span>
                <span style={{ color: isReached ? '#f8fafc' : '#64748b', fontSize: 24, fontWeight: 700 }}>
                  {st.title}
                </span>
              </div>
              <span
                style={{
                  color: isReached ? '#38bdf8' : '#475569',
                  fontFamily: 'monospace',
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                {st.state}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// SCENE 5: TRILLION-WEIGHT NEURAL TENSOR MATRIX
// ============================================================================
const Scene5WeightsMatrix: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const pulseScale = 1 + Math.sin(frame * 0.1) * 0.03;

  return (
    <div style={{ position: 'relative', width: 1080, height: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Category Pill Tag */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1.5px solid #38bdf8',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#38bdf8',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}
      >
        Deep Training Topography
      </div>

      {/* Multidimensional Weights Grid */}
      <svg width="780" height="520" viewBox="0 0 780 520" style={{ transform: `scale(${pulseScale})` }}>
        <defs>
          <linearGradient id="weightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>

        {/* Matrix Nodes Grid 6x4 */}
        {Array.from({ length: 6 }).map((_, col) =>
          Array.from({ length: 4 }).map((_, row) => {
            const cx = 100 + col * 115;
            const cy = 70 + row * 115;
            return (
              <g key={`${col}-${row}`}>
                {/* Synaptic interconnect wires */}
                {col < 5 && (
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx + 115}
                    y2={cy + (row % 2 === 0 ? 30 : -30)}
                    stroke="rgba(56, 189, 248, 0.25)"
                    strokeWidth="1.5"
                  />
                )}
                {row < 3 && (
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx}
                    y2={cy + 115}
                    stroke="rgba(129, 140, 248, 0.2)"
                    strokeWidth="1.5"
                  />
                )}
                <circle cx={cx} cy={cy} r="14" fill="#0f172a" stroke="url(#weightGrad)" strokeWidth="3" />
                <circle cx={cx} cy={cy} r="5" fill="#38bdf8" />
              </g>
            );
          })
        )}
      </svg>

      {/* Parameter Count Highlight Banner */}
      <div
        style={{
          width: 820,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          border: '2px solid #38bdf8',
          borderRadius: 20,
          padding: '24px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div>
          <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 700, letterSpacing: '2px' }}>DATASET SCALE</div>
          <div style={{ color: '#ffffff', fontSize: 36, fontWeight: 900, fontFamily: 'monospace' }}>
            15+ TRILLION TOKENS
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 700, letterSpacing: '2px' }}>PARAMETERS</div>
          <div style={{ color: '#38bdf8', fontSize: 36, fontWeight: 900, fontFamily: 'monospace' }}>
            1.8T WEIGHTS
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SCENE 6: HUMAN RLHF FEEDBACK ALIGNMENT
// ============================================================================
const Scene6Alignment: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const alignSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });

  return (
    <div style={{ position: 'relative', width: 1080, height: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Category Pill Tag */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1.5px solid #f43f5e',
          borderRadius: 999,
          padding: '10px 28px',
          color: '#f43f5e',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}
      >
        RLHF Human Feedback Steering
      </div>

      {/* Split Comparison Cards */}
      <div style={{ display: 'flex', gap: 30, width: 880 }}>
        {/* Raw Output Card (Red Chaos) */}
        <div
          style={{
            flex: 1,
            background: 'rgba(20, 10, 15, 0.9)',
            border: '2px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 22,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
          }}
        >
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.2)',
              color: '#f43f5e',
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 800,
              marginBottom: 20,
            }}
          >
            RAW FOUNDATION MODEL
          </div>
          <div style={{ color: '#fda4af', fontSize: 20, fontFamily: 'monospace', lineHeight: 1.5, textAlign: 'center' }}>
            "Hallucinates facts, chaotic web biases, unconstrained outputs..."
          </div>
          <div style={{ marginTop: 24, fontSize: 36 }}>❌</div>
        </div>

        {/* Aligned Output Card (Emerald / Blue Clarity) */}
        <div
          style={{
            flex: 1,
            background: 'rgba(10, 25, 25, 0.9)',
            border: '2px solid #10b981',
            borderRadius: 22,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 20px 40px rgba(16, 185, 129, 0.25)',
            transform: `scale(${alignSpring})`,
          }}
        >
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 800,
              marginBottom: 20,
            }}
          >
            RLHF ALIGNED AGENT
          </div>
          <div style={{ color: '#a7f3d0', fontSize: 20, fontFamily: 'monospace', lineHeight: 1.5, textAlign: 'center' }}>
            "Structured clarity, verified citations, helpful instructions..."
          </div>
          <div style={{ marginTop: 24, fontSize: 36 }}>✅</div>
        </div>
      </div>

      {/* Human Evaluator Thumbs-Up Metric */}
      <div
        style={{
          marginTop: 40,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1.5px solid #38bdf8',
          borderRadius: 999,
          padding: '14px 34px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ fontSize: 26 }}>👍</span>
        <span style={{ color: '#f8fafc', fontSize: 22, fontWeight: 800 }}>
          REWARD MODEL SCORE: <span style={{ color: '#38bdf8' }}>+0.982 ACCURACY</span>
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// SCENE 7: BITTRIX TECHNOLOGIES OUTRO (EXACT ROYAL PURPLE & WARM CREAM UI)
// ============================================================================
const Scene7BittrixOutro: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const outroSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const gearRotation = frame * 1.8;
  const chainScroll = (frame * 5) % 120;

  // Staggered letters for BITTRIX
  const brandLetters = ['B', 'I', 'T', 'T', 'R', 'I', 'X'];

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer 6-Point Radial Gradient Hexagon */}
      <div style={{ position: 'relative', width: 440, height: 440, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width="440" height="440" viewBox="0 0 440 440" style={{ position: 'absolute' }}>
          <defs>
            <radialGradient id="hexGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5b1a78" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#3d1052" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1a0424" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 6-point Polygon Hexagon */}
          <polygon
            points="220,20 393,120 393,320 220,420 47,320 47,120"
            fill="url(#hexGrad)"
            stroke="#fdf3d0"
            strokeWidth="3.5"
            strokeOpacity="0.75"
          />

          {/* Spoke circles at vertices */}
          {[
            [220, 20],
            [393, 120],
            [393, 320],
            [220, 420],
            [47, 320],
            [47, 120],
          ].map(([vx, vy], i) => (
            <circle key={i} cx={vx} cy={vy} r="8" fill="#fdf3d0" stroke="#5b1a78" strokeWidth="2.5" />
          ))}
        </svg>

        {/* 12-Tooth Rotating Gear with Serif 'B' */}
        <div
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            style={{
              position: 'absolute',
              transform: `rotate(${gearRotation}deg)`,
            }}
          >
            {/* 12-tooth Gear Path */}
            <g fill="#fdf3d0">
              {Array.from({ length: 12 }).map((_, i) => (
                <rect
                  key={i}
                  x="100"
                  y="6"
                  width="20"
                  height="26"
                  rx="4"
                  transform={`rotate(${i * 30} 110 110)`}
                />
              ))}
              <circle cx="110" cy="110" r="88" fill="#5b1a78" stroke="#fdf3d0" strokeWidth="6" />
            </g>
          </svg>

          {/* Serif 'B' in Center */}
          <span
            style={{
              position: 'relative',
              color: '#fdf3d0',
              fontFamily: '"Cinzel", "Georgia", "Times New Roman", serif',
              fontSize: 104,
              fontWeight: 900,
              textShadow: '0 0 20px #fdf3d088',
              zIndex: 10,
              userSelect: 'none',
            }}
          >
            B
          </span>
        </div>
      </div>

      {/* Staggered Elastic Italic Bold "BITTRIX" Wordmark */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 48,
          marginBottom: 10,
        }}
      >
        {brandLetters.map((char, index) => {
          const letterDelay = index * 3;
          const letterSpring = spring({
            frame: Math.max(0, frame - letterDelay),
            fps,
            config: { damping: 10, stiffness: 140 },
          });

          return (
            <span
              key={index}
              style={{
                fontFamily: '"Montserrat", "Inter", sans-serif',
                fontStyle: 'italic',
                fontWeight: 900,
                fontSize: 82,
                color: '#fdf3d0',
                letterSpacing: '4px',
                textShadow: '0 0 25px rgba(253, 243, 208, 0.45)',
                transform: `scale(${letterSpring}) translateY(${(1 - letterSpring) * 30}px)`,
                display: 'inline-block',
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* Expanding Royal Purple Underline Bar with Diagonal Light Sweep */}
      <div
        style={{
          position: 'relative',
          width: 520 * outroSpring,
          height: 5,
          background: '#5b1a78',
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, #fdf3d0, transparent)',
            transform: `translateX(${interpolate(frame % 90, [0, 90], [-520, 520])}px)`,
          }}
        />
      </div>

      {/* Tracking "TECHNOLOGIES" Subtitle */}
      <div
        style={{
          color: '#fdf3d0',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '14px',
          textTransform: 'uppercase',
          fontFamily: '"Inter", sans-serif',
          opacity: outroSpring,
          transform: `scale(${outroSpring})`,
          marginBottom: 35,
        }}
      >
        TECHNOLOGIES
      </div>

      {/* Rolling Chain Link Track in Footer */}
      <svg width="600" height="40" viewBox="0 0 600 40" style={{ overflow: 'hidden' }}>
        <g transform={`translate(-${chainScroll}, 0)`}>
          {Array.from({ length: 18 }).map((_, i) => (
            <g key={i} transform={`translate(${i * 45}, 10)`}>
              <rect x="0" y="0" width="34" height="18" rx="9" fill="none" stroke="#fdf3d0" strokeWidth="2.5" opacity="0.6" />
              <circle cx="17" cy="9" r="3.5" fill="#5b1a78" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

// ============================================================================
// MAIN ROOT VIDEO COMPONENT: LIVING CONTINUOUS CINEMA
// ============================================================================
export default function GeneratedCliVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find active scene based on global frame
  const currentScene = useMemo(() => {
    let acc = 0;
    for (const sc of SCENES) {
      if (frame >= acc && frame < acc + sc.durationInFrames) {
        return sc;
      }
      acc += sc.durationInFrames;
    }
    return SCENES[SCENES.length - 1];
  }, [frame]);

  const sceneFrame = frame - currentScene.startFrameGlobal;

  // CONTINUOUS CAMERA: Smooth virtual camera pans across continuous visual coordinates
  const camX = interpolate(
    frame,
    [0, 95, 229, 360, 463, 568, 680, 820],
    [0, 15, -20, 10, -15, 0, 0, 0],
    { extrapolateRight: 'clamp' }
  );

  const camY = interpolate(
    frame,
    [0, 95, 229, 360, 463, 568, 680, 820],
    [0, -10, 15, -15, 10, 0, 0, 0],
    { extrapolateRight: 'clamp' }
  );

  const camScale = interpolate(
    frame,
    [0, 95, 229, 360, 463, 568, 680, 820],
    [1.0, 1.03, 0.98, 1.02, 0.99, 1.0, 1.05, 1.0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: '#030712',
        overflow: 'hidden',
      }}
    >
      {/* Living Atmospheric Unified Canvas */}
      <LivingCanvas frame={frame} currentTheme={currentScene.themeColor} />

      {/* Camera Space Container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          transform: `translate3d(${camX}px, ${camY}px, 0) scale(${camScale})`,
          transformOrigin: '50% 45%',
        }}
      >
        {/* Dynamic Scene Stage (Progressive Continuous Disclosure) */}
        <div style={{ position: 'absolute', top: 180, left: 0, width: 1080, height: 1200 }}>
          {currentScene.scene_number === 1 && <Scene1Hook frame={sceneFrame} fps={fps} />}
          {currentScene.scene_number === 2 && <Scene2Tokens frame={sceneFrame} fps={fps} />}
          {currentScene.scene_number === 3 && <Scene3Probabilities frame={sceneFrame} fps={fps} />}
          {currentScene.scene_number === 4 && <Scene4SequentialPicker frame={sceneFrame} fps={fps} />}
          {currentScene.scene_number === 5 && <Scene5WeightsMatrix frame={sceneFrame} fps={fps} />}
          {currentScene.scene_number === 6 && <Scene6Alignment frame={sceneFrame} fps={fps} />}
          {currentScene.scene_number === 7 && <Scene7BittrixOutro frame={sceneFrame} fps={fps} />}
        </div>
      </div>

      {/* Kinetic Word-by-Word Karaoke Subtitles */}
      <KineticCaptions scene={currentScene} sceneFrame={sceneFrame} />
    </AbsoluteFill>
  );
}