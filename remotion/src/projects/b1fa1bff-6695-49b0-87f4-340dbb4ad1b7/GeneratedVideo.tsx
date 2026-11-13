import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// ==========================================
// SCENE DATA & WORD-LEVEL KARAOKE TIMINGS
// ==========================================
interface Word {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface SceneData {
  scene_number: number;
  role: string;
  durationInFrames: number;
  narration: string;
  on_screen_text: string;
  themeColor: string;
  words: Word[];
}

const SCENES: SceneData[] = [
  {
    scene_number: 1,
    role: "hook",
    durationInFrames: 137,
    narration: "What controls everything that moves?",
    on_screen_text: "What Controls Every Moving Object?",
    themeColor: "#f43f5e",
    words: [
      { word: "What", startFrame: 0, endFrame: 12 },
      { word: "controls", startFrame: 12, endFrame: 36 },
      { word: "everything", startFrame: 36, endFrame: 67 },
      { word: "that", startFrame: 67, endFrame: 79 },
      { word: "moves?", startFrame: 79, endFrame: 94 }
    ]
  },
  {
    scene_number: 2,
    role: "body",
    durationInFrames: 137,
    narration: "First: inertia keeps moving objects gliding.",
    on_screen_text: "First Law: The Inertia Secret",
    themeColor: "#38bdf8",
    words: [
      { word: "First:", startFrame: 0, endFrame: 16 },
      { word: "inertia", startFrame: 16, endFrame: 37 },
      { word: "keeps", startFrame: 37, endFrame: 53 },
      { word: "moving", startFrame: 53, endFrame: 71 },
      { word: "objects", startFrame: 71, endFrame: 93 },
      { word: "gliding.", startFrame: 93, endFrame: 115 }
    ]
  },
  {
    scene_number: 3,
    role: "body",
    durationInFrames: 137,
    narration: "Unless friction pushes back.",
    on_screen_text: "Friction Breaks The Endless Drift",
    themeColor: "#f43f5e",
    words: [
      { word: "Unless", startFrame: 0, endFrame: 20 },
      { word: "friction", startFrame: 20, endFrame: 47 },
      { word: "pushes", startFrame: 47, endFrame: 67 },
      { word: "back.", startFrame: 67, endFrame: 80 }
    ]
  },
  {
    scene_number: 4,
    role: "body",
    durationInFrames: 137,
    narration: "Second: force equals mass times acceleration.",
    on_screen_text: "Second Law: Force Equals Acceleration",
    themeColor: "#38bdf8",
    words: [
      { word: "Second:", startFrame: 0, endFrame: 19 },
      { word: "force", startFrame: 19, endFrame: 35 },
      { word: "equals", startFrame: 35, endFrame: 54 },
      { word: "mass", startFrame: 54, endFrame: 66 },
      { word: "times", startFrame: 66, endFrame: 82 },
      { word: "acceleration.", startFrame: 82, endFrame: 120 }
    ]
  },
  {
    scene_number: 5,
    role: "body",
    durationInFrames: 137,
    narration: "Heavier objects demand greater force.",
    on_screen_text: "Heavier Mass Demands Greater Force",
    themeColor: "#f43f5e",
    words: [
      { word: "Heavier", startFrame: 0, endFrame: 21 },
      { word: "objects", startFrame: 21, endFrame: 42 },
      { word: "demand", startFrame: 42, endFrame: 61 },
      { word: "greater", startFrame: 61, endFrame: 82 },
      { word: "force.", startFrame: 82, endFrame: 97 }
    ]
  },
  {
    scene_number: 6,
    role: "body",
    durationInFrames: 137,
    narration: "Third: every action triggers equal reaction.",
    on_screen_text: "Third Law: Action Meets Reaction",
    themeColor: "#38bdf8",
    words: [
      { word: "Third:", startFrame: 0, endFrame: 15 },
      { word: "every", startFrame: 15, endFrame: 30 },
      { word: "action", startFrame: 30, endFrame: 48 },
      { word: "triggers", startFrame: 48, endFrame: 73 },
      { word: "equal", startFrame: 73, endFrame: 88 },
      { word: "reaction.", startFrame: 88, endFrame: 112 }
    ]
  },
  {
    scene_number: 7,
    role: "cta",
    durationInFrames: 137,
    narration: "Follow Bittrix Technologies for more interesting concepts.",
    on_screen_text: "Bittrix Technologies",
    themeColor: "#5b1a78",
    words: [
      { word: "Follow", startFrame: 0, endFrame: 16 },
      { word: "Bittrix", startFrame: 16, endFrame: 38 },
      { word: "Technologies", startFrame: 38, endFrame: 66 },
      { word: "for", startFrame: 66, endFrame: 76 },
      { word: "more", startFrame: 76, endFrame: 88 },
      { word: "interesting", startFrame: 88, endFrame: 112 },
      { word: "concepts.", startFrame: 112, endFrame: 134 }
    ]
  }
];

// Helper: Pseudo-random generator for particle consistency
function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Determine current active scene
  const sceneDuration = 137;
  const currentSceneIdx = Math.min(Math.floor(frame / sceneDuration), SCENES.length - 1);
  const currentScene = SCENES[currentSceneIdx];
  const sceneFrame = frame % sceneDuration;

  // ==========================================
  // CONTINUOUS LIVING CAMERA
  // ==========================================
  // Interpolate camera position, scale, and subtle roll continuously across the entire 959 frames
  const camX = interpolate(
    frame,
    [0, 137, 274, 411, 548, 685, 822, 959],
    [0, -25, 45, -30, 20, -10, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camY = interpolate(
    frame,
    [0, 137, 274, 411, 548, 685, 822, 959],
    [0, -35, 20, 40, -15, 60, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camScale = interpolate(
    frame,
    [0, 137, 274, 411, 548, 685, 822, 959],
    [1.0, 1.06, 1.12, 1.18, 1.08, 1.15, 1.0, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camRotate = interpolate(
    frame,
    [0, 137, 274, 411, 548, 685, 822, 959],
    [0, -0.6, 0.8, -1.2, 0.5, -0.4, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Background Cosmic Drift Particles
  const cosmicParticles = useMemo(() => {
    return Array.from({ length: 48 }).map((_, i) => ({
      x: pseudoRandom(i * 1.34) * 1080,
      baseY: pseudoRandom(i * 2.71) * 1920,
      size: 2 + pseudoRandom(i * 4.19) * 4.5,
      speed: 0.4 + pseudoRandom(i * 3.82) * 1.2,
      opacity: 0.25 + pseudoRandom(i * 5.11) * 0.55
    }));
  }, []);

  return (
    <AbsoluteFill
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: '#05070e',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#ffffff'
      }}
    >
      {/* ========================================================= */}
      {/* GLOBAL AMBIENT LAYER: LIVING SPACETIME GRID & COSMIC MESH */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            currentSceneIdx === 6
              ? 'radial-gradient(circle at 50% 45%, #2a083b 0%, #12031a 60%, #08010c 100%)'
              : 'radial-gradient(circle at 50% 40%, #0d1a2d 0%, #070c17 55%, #03060a 100%)',
          transition: 'background 0.5s ease-out'
        }}
      />

      {/* Moving Spacetime Grid */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          opacity: currentSceneIdx === 6 ? 0.15 : 0.28,
          transform: `translate(${camX * 0.3}px, ${camY * 0.3}px)`
        }}
        width="1080"
        height="1920"
      >
        <defs>
          <pattern id="gridPattern" width="120" height="120" patternUnits="userSpaceOnUse">
            <path
              d="M 120 0 L 0 0 0 120"
              fill="none"
              stroke={currentSceneIdx === 6 ? '#a855f7' : '#38bdf8'}
              strokeWidth="1.2"
              strokeDasharray="4 6"
            />
          </pattern>
          <radialGradient id="warpHole" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#05070e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#gridPattern)"
          style={{
            transform: `translateY(${(frame * 0.8) % 120}px)`
          }}
        />
      </svg>

      {/* Floating Cosmic Physics Dust Particles */}
      {cosmicParticles.map((p, idx) => {
        const currentY = (p.baseY + frame * p.speed * 2) % 1920;
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: p.x,
              top: currentY,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: currentSceneIdx === 6 ? '#fdf3d0' : '#38bdf8',
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px ${currentSceneIdx === 6 ? '#c084fc' : '#38bdf8'}`,
              pointerEvents: 'none'
            }}
          />
        );
      })}

      {/* Ambient Telemetry HUD Corners */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 60,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontSize: 14,
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          fontWeight: 700
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: currentScene.themeColor,
              boxShadow: `0 0 10px ${currentScene.themeColor}`
            }}
          />
          <span>NEWTONIAN KINEMATICS ENGINE // 60 FPS</span>
        </div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          FRAME: {frame.toString().padStart(4, '0')} / 0959 // SEC: {(frame / 60).toFixed(2)}s
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 70,
          right: 60,
          fontSize: 13,
          letterSpacing: '0.16em',
          color: currentScene.themeColor,
          fontWeight: 800,
          background: 'rgba(255,255,255,0.05)',
          padding: '6px 16px',
          borderRadius: 20,
          border: `1px solid ${currentScene.themeColor}55`,
          backdropFilter: 'blur(10px)'
        }}
      >
        {currentScene.role.toUpperCase()} // SCENE 0{currentScene.scene_number}
      </div>

      {/* ========================================================= */}
      {/* VIRTUAL CAMERA WRAPPER */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${camX}px, ${camY}px) scale(${camScale}) rotate(${camRotate}deg)`,
          transformOrigin: '540px 960px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {/* ===================================================== */}
        {/* SCENE 1: THE COSMIC HOOK (WHAT CONTROLS MOTION?) */}
        {/* ===================================================== */}
        {currentSceneIdx === 0 && (
          <div
            style={{
              position: 'absolute',
              width: 1000,
              height: 1200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Overhead Dramatic Key Light Cone */}
            <div
              style={{
                position: 'absolute',
                top: -150,
                width: 700,
                height: 900,
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(244, 63, 94, 0.35) 0%, rgba(56, 189, 248, 0.15) 45%, rgba(0,0,0,0) 80%)',
                filter: 'blur(30px)',
                pointerEvents: 'none'
              }}
            />

            {/* Pulsing Spacetime Gravity Singularity Core */}
            <svg width="700" height="700" viewBox="0 0 700 700" style={{ overflow: 'visible' }}>
              <defs>
                <filter id="neonGlowRose" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="12" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Warped Coordinate Rings */}
              {[120, 200, 280, 360].map((radius, i) => {
                const ringPulse = Math.sin((sceneFrame * 0.08) + i * 1.2) * 15;
                const rotation = (sceneFrame * (i % 2 === 0 ? 0.6 : -0.8)) + i * 45;
                return (
                  <g key={i} transform={`rotate(${rotation} 350 350)`}>
                    <circle
                      cx="350"
                      cy="350"
                      r={radius + ringPulse}
                      fill="none"
                      stroke={i % 2 === 0 ? '#f43f5e' : '#38bdf8'}
                      strokeWidth={i === 1 ? '3' : '1.5'}
                      strokeDasharray={i === 0 ? '8 14' : i === 2 ? '20 15 5 15' : '12 8'}
                      opacity={0.35 + (i * 0.15)}
                    />
                    {/* Orbital Vector Tangent Indicators */}
                    <circle
                      cx={350 + radius + ringPulse}
                      cy="350"
                      r="6"
                      fill={i % 2 === 0 ? '#f43f5e' : '#38bdf8'}
                      filter="url(#neonGlowRose)"
                    />
                  </g>
                );
              })}

              {/* Center Giant Neon Holographic Question Mark */}
              <text
                x="350"
                y="390"
                textAnchor="middle"
                fontSize="180"
                fontWeight="900"
                fontFamily="Georgia, serif"
                fill="#f43f5e"
                filter="url(#neonGlowRose)"
                style={{
                  transform: `scale(${1 + Math.sin(sceneFrame * 0.12) * 0.05})`,
                  transformOrigin: '350px 350px'
                }}
              >
                ?
              </text>

              {/* Floating Vector Calculus Symbols */}
              <g opacity="0.65" fontSize="22" fontWeight="700" fill="#38bdf8">
                <text x="180" y="240">d²x / dt²</text>
                <text x="470" y="220">Σ F = m·a</text>
                <text x="160" y="480">v(t) = const</text>
                <text x="460" y="500">Δp / Δt</text>
              </g>
            </svg>

            {/* Glowing Topic Banner */}
            <div
              style={{
                marginTop: 40,
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1.5px solid #f43f5e',
                borderRadius: 18,
                padding: '14px 38px',
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#fff',
                boxShadow: '0 0 30px rgba(244, 63, 94, 0.3)'
              }}
            >
              FUNDAMENTAL LAWS OF MOTION
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* SCENE 2: FIRST LAW: INERTIA (THE GLIDING SPACE PROBE) */}
        {/* ===================================================== */}
        {currentSceneIdx === 1 && (
          <div
            style={{
              position: 'absolute',
              width: 1000,
              height: 1200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Infinite Trajectory Laser Line */}
            <svg width="1000" height="200" style={{ position: 'absolute', top: 500 }}>
              <line
                x1="0"
                y1="100"
                x2="1000"
                y2="100"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeDasharray="20 12"
              />
              <line
                x1="0"
                y1="100"
                x2="1000"
                y2="100"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.9"
              />
              {/* Distance Ticks */}
              {[150, 350, 550, 750, 950].map((pos, idx) => (
                <g key={idx} transform={`translate(${pos}, 100)`}>
                  <line x1="0" y1="-15" x2="0" y2="15" stroke="#38bdf8" strokeWidth="2" />
                  <text x="0" y="38" fill="#38bdf8" fontSize="14" fontWeight="700" textAnchor="middle">
                    +{(idx + 1) * 25}k KM
                  </text>
                </g>
              ))}
            </svg>

            {/* Co-moving Detailed Deep-Space Scientific Probe */}
            <div
              style={{
                position: 'relative',
                transform: `translateX(${-180 + (sceneFrame * 2.8)}px) translateY(${Math.sin(sceneFrame * 0.05) * 8}px)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <svg width="480" height="320" viewBox="0 0 480 320" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="solarPanelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="50%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                  <linearGradient id="hullTitanium" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="50%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                </defs>

                {/* Left Solar Array Wing */}
                <g transform="translate(40, 90)">
                  <rect width="130" height="70" rx="4" fill="url(#solarPanelGrad)" stroke="#38bdf8" strokeWidth="2" />
                  {/* Grid photovoltaic lines */}
                  <line x1="43" y1="0" x2="43" y2="70" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                  <line x1="86" y1="0" x2="86" y2="70" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                  <line x1="0" y1="35" x2="130" y2="35" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                  <rect x="130" y="28" width="20" height="14" fill="#64748b" />
                </g>

                {/* Right Solar Array Wing */}
                <g transform="translate(310, 90)">
                  <rect width="130" height="70" rx="4" fill="url(#solarPanelGrad)" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="43" y1="0" x2="43" y2="70" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                  <line x1="86" y1="0" x2="86" y2="70" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                  <line x1="0" y1="35" x2="130" y2="35" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                  <rect x="-20" y="28" width="20" height="14" fill="#64748b" />
                </g>

                {/* Central Titanium Probe Hull */}
                <polygon
                  points="210,70 270,70 295,125 270,180 210,180 185,125"
                  fill="url(#hullTitanium)"
                  stroke="#cbd5e1"
                  strokeWidth="3"
                />

                {/* Dish Antenna */}
                <path
                  d="M 215,65 Q 240,40 265,65"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="5"
                />
                <line x1="240" y1="52" x2="240" y2="30" stroke="#38bdf8" strokeWidth="3" />
                <circle cx="240" cy="27" r="4" fill="#38bdf8" />

                {/* Attitude Thrusters (Idle / Inactive to show zero external force) */}
                <rect x="230" y="180" width="20" height="18" fill="#334155" rx="2" />
                <polygon points="225,198 255,198 250,180 230,180" fill="#475569" />

                {/* Flashing Navigation Beacon */}
                <circle
                  cx="240"
                  cy="125"
                  r="7"
                  fill="#38bdf8"
                  style={{
                    opacity: (sceneFrame % 30 < 15) ? 1 : 0.3,
                    filter: 'drop-shadow(0 0 8px #38bdf8)'
                  }}
                />
              </svg>

              {/* Physics HUD Overlay Badge */}
              <div
                style={{
                  display: 'flex',
                  gap: 20,
                  marginTop: -40,
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1.5px solid #38bdf8',
                  borderRadius: 14,
                  padding: '10px 24px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.3)'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em' }}>NET FORCE (ΣF)</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>0.00 N</div>
                </div>
                <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em' }}>VELOCITY (v)</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#38bdf8' }}>CONSTANT (NO STOP)</div>
                </div>
              </div>
            </div>

            {/* Law Header */}
            <div
              style={{
                position: 'absolute',
                top: 280,
                fontSize: 32,
                fontWeight: 900,
                color: '#38bdf8',
                letterSpacing: '0.15em',
                textTransform: 'uppercase'
              }}
            >
              1ST LAW: PRINCIPLE OF INERTIA
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* SCENE 3: FRICTION OPPOSING FORCE & ATOMIC INTERFACE */}
        {/* ===================================================== */}
        {currentSceneIdx === 2 && (
          <div
            style={{
              position: 'absolute',
              width: 1000,
              height: 1200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 260,
                fontSize: 32,
                fontWeight: 900,
                color: '#f43f5e',
                letterSpacing: '0.15em',
                textTransform: 'uppercase'
              }}
            >
              COUNTER-FORCE: MICRO-FRICTION
            </div>

            {/* Split Comparison Interface Box */}
            <div
              style={{
                width: 900,
                height: 520,
                background: 'rgba(15, 23, 42, 0.75)',
                border: '2px solid #f43f5e55',
                borderRadius: 20,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 0 40px rgba(244, 63, 94, 0.25)'
              }}
            >
              {/* Sliding Heavy Block */}
              {(() => {
                const blockProgress = interpolate(sceneFrame, [0, 80], [100, 480], {
                  extrapolateRight: 'clamp'
                });
                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: blockProgress,
                      top: 130,
                      width: 220,
                      height: 140,
                      background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                      border: '3px solid #cbd5e1',
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8' }}>MOVING OBJECT</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>m = 50 kg</div>
                    {/* Velocity arrow pointing right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <span style={{ fontSize: 13, color: '#38bdf8', fontWeight: 700 }}>SPEED →</span>
                      <div
                        style={{
                          width: interpolate(sceneFrame, [0, 80], [60, 10], { extrapolateRight: 'clamp' }),
                          height: 4,
                          background: '#38bdf8'
                        }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Microscopic Rough Surface Interface (Teeth / Asperities) */}
              <svg
                width="900"
                height="120"
                style={{ position: 'absolute', bottom: 130, left: 0 }}
              >
                {/* Asperities jagged path */}
                <path
                  d="M 0 30 
                     L 40 10 L 70 35 L 110 5 L 150 38 L 190 12 L 230 40 L 270 8 L 310 35 
                     L 350 15 L 390 42 L 430 10 L 470 38 L 510 5 L 550 40 L 590 12 L 630 38 
                     L 670 15 L 710 40 L 750 8 L 790 35 L 830 12 L 870 38 L 900 20 
                     L 900 120 L 0 120 Z"
                  fill="#1e293b"
                  stroke="#f43f5e"
                  strokeWidth="3"
                />
              </svg>

              {/* Dynamic Friction Sparks & Counter Vector Arrow */}
              {sceneFrame > 20 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 420,
                    top: 250,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {/* Huge Opposing Crimson Arrow */}
                  <svg width="260" height="90" viewBox="0 0 260 90">
                    <defs>
                      <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="2" refY="5" orient="auto">
                        <path d="M 10 0 L 0 5 L 10 10 z" fill="#f43f5e" />
                      </marker>
                    </defs>
                    <line
                      x1="240"
                      y1="45"
                      x2="30"
                      y2="45"
                      stroke="#f43f5e"
                      strokeWidth="8"
                      markerEnd="url(#arrowRed)"
                    />
                    <text x="140" y="30" fill="#f43f5e" fontSize="22" fontWeight="900" textAnchor="middle">
                      ← FRICTION (F_f)
                    </text>
                  </svg>
                </div>
              )}

              {/* Spark Particles */}
              {sceneFrame > 20 &&
                Array.from({ length: 12 }).map((_, i) => {
                  const sparkX = 460 + Math.sin(i * 1.5 + sceneFrame * 0.4) * 50;
                  const sparkY = 265 - (sceneFrame * 2 + i * 5) % 45;
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: sparkX,
                        top: sparkY,
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: '#facc15',
                        boxShadow: '0 0 10px #f43f5e'
                      }}
                    />
                  );
                })}

              {/* Bottom Surface Label */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 40,
                  width: '100%',
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  color: '#94a3b8'
                }}
              >
                MICROSCOPIC SURFACE ASYMMETRY RESISTS MOTION
              </div>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* SCENE 4: SECOND LAW: F = m · a HIGH-TECH HUD CARD   */}
        {/* ===================================================== */}
        {currentSceneIdx === 3 && (
          <div
            style={{
              position: 'absolute',
              width: 1000,
              height: 1200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Tech Equation Hologram Container */}
            <div
              style={{
                width: 880,
                background: 'rgba(13, 23, 42, 0.85)',
                border: '2px solid #38bdf8',
                borderRadius: 24,
                padding: '48px 40px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 0 60px rgba(56, 189, 248, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {/* Corner Sci-Fi Bracket Reticles */}
              <div style={{ position: 'absolute', top: 12, left: 16, fontSize: 18, color: '#38bdf8', fontWeight: 900 }}>┌</div>
              <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 18, color: '#38bdf8', fontWeight: 900 }}>┐</div>
              <div style={{ position: 'absolute', bottom: 12, left: 16, fontSize: 18, color: '#38bdf8', fontWeight: 900 }}>└</div>
              <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 18, color: '#38bdf8', fontWeight: 900 }}>┘</div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#94a3b8',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginBottom: 20
                }}
              >
                NEWTON'S SECOND LAW OF MOTION
              </div>

              {/* GIANT FORMULA DISPLAY WITH LITERAL WORD-TIMED ACTIVATION */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 28,
                  fontSize: 100,
                  fontWeight: 900,
                  fontFamily: 'Courier New, monospace',
                  margin: '20px 0'
                }}
              >
                {/* F */}
                <div
                  style={{
                    color: sceneFrame >= 19 ? '#38bdf8' : '#64748b',
                    transform: sceneFrame >= 19 && sceneFrame <= 35 ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.15s ease-out',
                    textShadow: sceneFrame >= 19 ? '0 0 35px #38bdf8' : 'none'
                  }}
                >
                  F
                </div>
                <div style={{ color: '#cbd5e1' }}>=</div>
                {/* m */}
                <div
                  style={{
                    color: sceneFrame >= 54 ? '#facc15' : '#64748b',
                    transform: sceneFrame >= 54 && sceneFrame <= 66 ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.15s ease-out',
                    textShadow: sceneFrame >= 54 ? '0 0 35px #facc15' : 'none'
                  }}
                >
                  m
                </div>
                <div style={{ color: '#cbd5e1' }}>·</div>
                {/* a */}
                <div
                  style={{
                    color: sceneFrame >= 82 ? '#f43f5e' : '#64748b',
                    transform: sceneFrame >= 82 ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.15s ease-out',
                    textShadow: sceneFrame >= 82 ? '0 0 35px #f43f5e' : 'none'
                  }}
                >
                  a
                </div>
              </div>

              {/* Sub-explanations */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '90%',
                  marginTop: 20,
                  paddingTop: 24,
                  borderTop: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#38bdf8', fontWeight: 800 }}>FORCE (NEWTONS)</div>
                  <div style={{ fontSize: 16, color: '#e2e8f0', marginTop: 4 }}>Applied Effort</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#facc15', fontWeight: 800 }}>MASS (KG)</div>
                  <div style={{ fontSize: 16, color: '#e2e8f0', marginTop: 4 }}>Inertial Resistance</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#f43f5e', fontWeight: 800 }}>ACCEL (M/S²)</div>
                  <div style={{ fontSize: 16, color: '#e2e8f0', marginTop: 4 }}>Rate of Speed Gain</div>
                </div>
              </div>

              {/* Interactive Telemetry Calculation Readout */}
              <div
                style={{
                  marginTop: 34,
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '16px 24px',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 700 }}>LIVE SIMULATION:</span>
                <span style={{ fontSize: 18, color: '#38bdf8', fontWeight: 900, fontFamily: 'monospace' }}>
                  F = 250 kg × 9.80 m/s² = 2,450 N
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* SCENE 5: MASS CONTRAST: HEAVY VS LIGHT ACCELERATION  */}
        {/* ===================================================== */}
        {currentSceneIdx === 4 && (
          <div
            style={{
              position: 'absolute',
              width: 1000,
              height: 1200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 250,
                fontSize: 32,
                fontWeight: 900,
                color: '#f43f5e',
                letterSpacing: '0.14em',
                textTransform: 'uppercase'
              }}
            >
              MASS VS ACCELERATION RESPONSE
            </div>

            {/* Split Comparison Tracks */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 50,
                width: 900
              }}
            >
              {/* TRACK 1: HEAVY MASS (HIGH INERTIAL RESISTANCE) */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '2px solid #f43f5e88',
                  borderRadius: 20,
                  padding: 24,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#f43f5e' }}>HEAVY MASS (m = 1000 kg)</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1' }}>REQ. FORCE: 10,000 N</span>
                </div>

                {/* Track Line */}
                <div style={{ width: '100%', height: 80, position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: 10, width: '100%', height: 4, background: '#475569' }} />

                  {/* Heavy Steel Block (Slow crawl) */}
                  {(() => {
                    const crawl = interpolate(sceneFrame, [0, 137], [20, 110]);
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: crawl,
                          bottom: 14,
                          width: 120,
                          height: 70,
                          background: 'linear-gradient(180deg, #475569 0%, #1e293b 100%)',
                          border: '3px solid #f43f5e',
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#fca5a5' }}>STEEL VAULT</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>1000 KG</div>
                      </div>
                    );
                  })()}

                  {/* Struggling Hydraulic Piston */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      bottom: 26,
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#f43f5e'
                    }}
                  >
                    ACTUATOR STRAIN ◄
                  </div>
                </div>

                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 10, fontWeight: 700 }}>
                  ACCELERATION: 1.0 m/s² (SLUGGISH INERTIA)
                </div>
              </div>

              {/* TRACK 2: LIGHT MASS (RAPID ACCELERATION) */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '2px solid #38bdf888',
                  borderRadius: 20,
                  padding: 24,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>LIGHT MASS (m = 10 kg)</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1' }}>SAME FORCE: 10,000 N</span>
                </div>

                {/* Track Line */}
                <div style={{ width: '100%', height: 80, position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: 10, width: '100%', height: 4, background: '#475569' }} />

                  {/* Sleek Carbon Capsule Rocketing */}
                  {(() => {
                    const rocketDash = interpolate(sceneFrame, [0, 80], [20, 680], {
                      extrapolateRight: 'clamp'
                    });
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: rocketDash,
                          bottom: 14,
                          width: 80,
                          height: 50,
                          background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                          border: '2px solid #fff',
                          borderRadius: '25px 8px 8px 25px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 25px #38bdf8'
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#000' }}>10 KG</div>
                      </div>
                    );
                  })()}

                  {/* Speed streak lines */}
                  {sceneFrame > 15 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 100,
                        bottom: 30,
                        width: 450,
                        height: 2,
                        background: 'linear-gradient(90deg, transparent 0%, #38bdf8 100%)',
                        opacity: 0.7
                      }}
                    />
                  )}
                </div>

                <div style={{ fontSize: 13, color: '#38bdf8', marginTop: 10, fontWeight: 700 }}>
                  ACCELERATION: 100.0 m/s² (100X FASTER SPRINT!)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* SCENE 6: THIRD LAW: ACTION & REACTION (ROCKET LAUNCH) */}
        {/* ===================================================== */}
        {currentSceneIdx === 5 && (
          <div
            style={{
              position: 'absolute',
              width: 1000,
              height: 1200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Ascending Aerospace Rocket Multi-Stage Rig */}
            {(() => {
              const launchLift = interpolate(sceneFrame, [0, 137], [100, -180]);
              return (
                <div
                  style={{
                    position: 'relative',
                    transform: `translateY(${launchLift}px)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Upward Reaction Force Vector */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginBottom: 10
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '2px solid #38bdf8',
                        borderRadius: 20,
                        padding: '6px 20px',
                        fontSize: 16,
                        fontWeight: 900,
                        color: '#38bdf8'
                      }}
                    >
                      ▲ REACTION: UPWARD THRUST (+F)
                    </div>
                  </div>

                  {/* Detailed Rocket Vector Graphics */}
                  <svg width="260" height="420" viewBox="0 0 260 420">
                    <defs>
                      <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#e2e8f0" />
                        <stop offset="50%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                      </linearGradient>
                      <linearGradient id="exhaustFlame" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="30%" stopColor="#facc15" />
                        <stop offset="70%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>

                    {/* Aerodynamic Nose Cone */}
                    <polygon points="130,20 165,90 95,90" fill="#f43f5e" />

                    {/* Avionics & Fuel Fuselage */}
                    <rect x="95" y="90" width="70" height="180" fill="url(#rocketBody)" stroke="#475569" strokeWidth="2" />
                    {/* Staging interstage rings */}
                    <line x1="95" y1="140" x2="165" y2="140" stroke="#0f172a" strokeWidth="4" />
                    <line x1="95" y1="210" x2="165" y2="210" stroke="#0f172a" strokeWidth="4" />

                    {/* Grid Stabilizer Fins */}
                    <polygon points="95,240 50,285 95,275" fill="#f43f5e" />
                    <polygon points="165,240 210,285 165,275" fill="#f43f5e" />

                    {/* Dual Engine Bells */}
                    <polygon points="105,270 125,270 128,295 102,295" fill="#334155" />
                    <polygon points="135,270 155,270 158,295 132,295" fill="#334155" />

                    {/* Downward Mach Diamond Exhaust Plume */}
                    <path
                      d={`M 100 295 
                          Q 130 310 160 295 
                          L ${150 + Math.sin(sceneFrame * 0.8) * 8} ${400 + Math.cos(sceneFrame) * 15}
                          L 130 420 
                          L ${110 - Math.sin(sceneFrame * 0.8) * 8} ${400 + Math.cos(sceneFrame) * 15} Z`}
                      fill="url(#exhaustFlame)"
                      filter="drop-shadow(0 0 16px #f43f5e)"
                    />
                  </svg>

                  {/* Downward Action Force Vector */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginTop: 10
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(244, 63, 94, 0.2)',
                        border: '2px solid #f43f5e',
                        borderRadius: 20,
                        padding: '6px 20px',
                        fontSize: 16,
                        fontWeight: 900,
                        color: '#f43f5e'
                      }}
                    >
                      ▼ ACTION: DOWNWARD EXHAUST (-F)
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Law Header */}
            <div
              style={{
                position: 'absolute',
                bottom: 240,
                fontSize: 28,
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '0.12em',
                background: 'rgba(0,0,0,0.6)',
                padding: '10px 30px',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              | F_ACTION | = | F_REACTION |
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* SCENE 7: EXACT BITTRIX TECHNOLOGIES ROYAL PURPLE OUTRO */}
        {/* ===================================================== */}
        {currentSceneIdx === 6 && (
          <div
            style={{
              position: 'absolute',
              width: 1000,
              height: 1200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Outro Master Emblem Container */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {/* 1. Animated 6-Point Radial Gradient Hexagon with Spoke Circles */}
              <svg width="440" height="440" viewBox="0 0 440 440" style={{ overflow: 'visible' }}>
                <defs>
                  <radialGradient id="hexRadial" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8b2fc9" stopOpacity="0.9" />
                    <stop offset="65%" stopColor="#5b1a78" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#250633" stopOpacity="0.2" />
                  </radialGradient>
                  <filter id="royalGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Rotating 6-Point Hexagon Mesh */}
                <g transform={`rotate(${sceneFrame * 0.4} 220 220)`}>
                  <polygon
                    points="220,40 375,130 375,310 220,400 65,310 65,130"
                    fill="url(#hexRadial)"
                    stroke="#fdf3d0"
                    strokeWidth="3.5"
                    strokeDasharray="14 8"
                    filter="url(#royalGlow)"
                  />

                  {/* 6 Spoke Circles at Vertices */}
                  {[
                    [220, 40],
                    [375, 130],
                    [375, 310],
                    [220, 400],
                    [65, 310],
                    [65, 130]
                  ].map(([vx, vy], i) => (
                    <circle
                      key={i}
                      cx={vx}
                      cy={vy}
                      r="10"
                      fill="#fdf3d0"
                      stroke="#5b1a78"
                      strokeWidth="3"
                    />
                  ))}
                </g>

                {/* 2. Rolling Chain Link Track */}
                <circle
                  cx="220"
                  cy="220"
                  r="135"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="6"
                  strokeDasharray="12 10"
                  style={{
                    transform: `rotate(${-sceneFrame * 0.8}deg)`,
                    transformOrigin: '220px 220px'
                  }}
                />

                {/* 3. Rotating 12-Tooth Gear with Serif 'B' */}
                <g
                  style={{
                    transform: `rotate(${sceneFrame * 1.2}deg)`,
                    transformOrigin: '220px 220px'
                  }}
                >
                  {/* 12-tooth Gear Path */}
                  {Array.from({ length: 12 }).map((_, toothIdx) => {
                    const angle = (toothIdx * 360) / 12;
                    return (
                      <rect
                        key={toothIdx}
                        x="208"
                        y="105"
                        width="24"
                        height="30"
                        rx="4"
                        fill="#fdf3d0"
                        transform={`rotate(${angle} 220 220)`}
                      />
                    );
                  })}
                  <circle cx="220" cy="220" r="95" fill="#5b1a78" stroke="#fdf3d0" strokeWidth="4" />
                </g>

                {/* Center Serif 'B' Letter */}
                <text
                  x="220"
                  y="255"
                  textAnchor="middle"
                  fontSize="105"
                  fontWeight="900"
                  fontFamily="Georgia, serif"
                  fill="#fdf3d0"
                  style={{
                    filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.7))'
                  }}
                >
                  B
                </text>
              </svg>

              {/* 4. Staggered Letter Elastic Italic Bold "BITTRIX" Wordmark */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 30,
                  fontSize: 78,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '0.06em',
                  color: '#fdf3d0',
                  textShadow: '0 0 35px rgba(253, 243, 208, 0.45)'
                }}
              >
                {['B', 'I', 'T', 'T', 'R', 'I', 'X'].map((letter, i) => {
                  const letterSpring = spring({
                    frame: Math.max(0, sceneFrame - (i * 3)),
                    fps: 60,
                    config: { damping: 12, stiffness: 140 }
                  });
                  return (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        transform: `scale(${letterSpring}) translateY(${(1 - letterSpring) * 30}px)`
                      }}
                    >
                      {letter}
                    </span>
                  );
                })}
              </div>

              {/* 5. Tracking "TECHNOLOGIES" Subtitle */}
              {(() => {
                const subTracking = interpolate(sceneFrame, [15, 60], [0.1, 0.42], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp'
                });
                return (
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      letterSpacing: `${subTracking}em`,
                      color: '#e9d5ff',
                      textTransform: 'uppercase',
                      marginTop: 10
                    }}
                  >
                    TECHNOLOGIES
                  </div>
                );
              })()}

              {/* 6. Expanding Royal Purple Underline Bar & Diagonal Light Sweep */}
              <div
                style={{
                  position: 'relative',
                  width: interpolate(sceneFrame, [10, 50], [0, 480], { extrapolateRight: 'clamp' }),
                  height: 6,
                  background: 'linear-gradient(90deg, #5b1a78, #c084fc, #5b1a78)',
                  borderRadius: 3,
                  marginTop: 22,
                  overflow: 'hidden'
                }}
              >
                {/* Diagonal Light Sweep */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: interpolate(sceneFrame, [20, 80], [-80, 500]),
                    width: 60,
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
                    opacity: 0.9
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SYNCHRONIZED KINETIC KARAOKE CAPTIONS (PHONE SAFE ZONE) */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          bottom: 220,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            maxWidth: 960,
            background: 'rgba(7, 10, 19, 0.88)',
            border: `1.5px solid ${currentScene.themeColor}88`,
            borderRadius: 28,
            padding: '24px 36px',
            backdropFilter: 'blur(20px)',
            boxShadow: `0 15px 45px rgba(0, 0, 0, 0.7), 0 0 30px ${currentScene.themeColor}33`,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px 16px'
          }}
        >
          {currentScene.words.map((w, idx) => {
            const isActive = sceneFrame >= w.startFrame && sceneFrame <= w.endFrame;
            const isPast = sceneFrame > w.endFrame;

            return (
              <span
                key={idx}
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  display: 'inline-block',
                  color: isActive
                    ? '#facc15'
                    : isPast
                    ? '#ffffff'
                    : 'rgba(255,255,255,0.45)',
                  transform: isActive ? 'scale(1.18)' : 'scale(1.0)',
                  transition: 'transform 0.1s ease-out, color 0.1s ease-out',
                  textShadow: isActive
                    ? '0 0 25px #facc15, 0 0 45px #f59e0b'
                    : isPast
                    ? '0 2px 10px rgba(0,0,0,0.8)'
                    : 'none'
                }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}