import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// ==========================================
// SCENE METADATA & WORD TIMESTAMPS
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
    role: "hook",
    durationInFrames: 137,
    narration: "What happens when Nvidia's titan falls?",
    on_screen_text: "What Shook Nvidia's Leadership?",
    visual_direction: "Dramatic low-angle camera push towards a fractured silicon monolith bathed in crimson danger light with drifting ambient ember particles.",
    template: "question-hook",
    themeColor: "#f43f5e",
    words: [
      { word: "What", startFrame: 3, endFrame: 9 },
      { word: "happens", startFrame: 10, endFrame: 23 },
      { word: "when", startFrame: 23, endFrame: 28 },
      { word: "Nvidia's", startFrame: 29, endFrame: 43 },
      { word: "titan", startFrame: 43, endFrame: 53 },
      { word: "falls?", startFrame: 53, endFrame: 72 },
    ]
  },
  {
    scene_number: 2,
    role: "body",
    durationInFrames: 137,
    narration: "Well, Jensen Huang suddenly resigned.",
    on_screen_text: "Jensen Huang Steps Down",
    visual_direction: "High-contrast portrait frame illuminated by dramatic cyan key light with a crimson drop shadow.",
    template: "hero-object",
    themeColor: "#38bdf8",
    words: [
      { word: "Well,", startFrame: 3, endFrame: 16 },
      { word: "Jensen", startFrame: 19, endFrame: 31 },
      { word: "Huang", startFrame: 32, endFrame: 41 },
      { word: "suddenly", startFrame: 42, endFrame: 54 },
      { word: "resigned.", startFrame: 54, endFrame: 73 },
    ]
  },
  {
    scene_number: 3,
    role: "body",
    durationInFrames: 137,
    narration: "Unexpectedly, board scrutiny triggered investigations.",
    on_screen_text: "Inquiry Sparks Sudden Crisis",
    visual_direction: "Dark confidential audit dossier visual with glowing stamp and digital check vectors.",
    template: "fact-card",
    themeColor: "#f43f5e",
    words: [
      { word: "Unexpectedly,", startFrame: 3, endFrame: 32 },
      { word: "board", startFrame: 36, endFrame: 45 },
      { word: "scrutiny", startFrame: 45, endFrame: 56 },
      { word: "triggered", startFrame: 57, endFrame: 67 },
      { word: "investigations.", startFrame: 68, endFrame: 100 },
    ]
  },
  {
    scene_number: 4,
    role: "body",
    durationInFrames: 137,
    narration: "Now, CFO Colette Kress takes charge.",
    on_screen_text: "Interim Chief Takes Helm",
    visual_direction: "Split dual-pillar composition highlighting financial stability on left and executive authority on right.",
    template: "split-compare",
    themeColor: "#38bdf8",
    words: [
      { word: "Now,", startFrame: 3, endFrame: 18 },
      { word: "CFO", startFrame: 23, endFrame: 37 },
      { word: "Colette", startFrame: 37, endFrame: 48 },
      { word: "Kress", startFrame: 48, endFrame: 57 },
      { word: "takes", startFrame: 57, endFrame: 65 },
      { word: "charge.", startFrame: 65, endFrame: 83 },
    ]
  },
  {
    scene_number: 5,
    role: "body",
    durationInFrames: 137,
    narration: "Harvey Jones leads the executive search.",
    on_screen_text: "Independent Chair Leads Search",
    visual_direction: "Branching governance node network linking the Independent Chair to dual talent search pipelines.",
    template: "timeline",
    themeColor: "#38bdf8",
    words: [
      { word: "Harvey", startFrame: 3, endFrame: 14 },
      { word: "Jones", startFrame: 14, endFrame: 27 },
      { word: "leads", startFrame: 27, endFrame: 34 },
      { word: "the", startFrame: 35, endFrame: 37 },
      { word: "executive", startFrame: 37, endFrame: 54 },
      { word: "search.", startFrame: 55, endFrame: 71 },
    ]
  },
  {
    scene_number: 6,
    role: "body",
    durationInFrames: 137,
    narration: "Billions in value hang in balance.",
    on_screen_text: "Markets Demand Total Stability",
    visual_direction: "Dynamic high-tech market ticker HUD with animated radial meter and pulsing alert needle.",
    template: "stat-callout",
    themeColor: "#f43f5e",
    words: [
      { word: "Billions", startFrame: 3, endFrame: 17 },
      { word: "in", startFrame: 18, endFrame: 21 },
      { word: "value", startFrame: 21, endFrame: 32 },
      { word: "hang", startFrame: 32, endFrame: 39 },
      { word: "in", startFrame: 39, endFrame: 42 },
      { word: "balance.", startFrame: 42, endFrame: 61 },
    ]
  },
  {
    scene_number: 7,
    role: "cta",
    durationInFrames: 137,
    narration: "Follow Bittrix Technologies for more interesting concepts.",
    on_screen_text: "BITTRIX TECHNOLOGIES",
    visual_direction: "Signature royal purple geometric hexagon, precision gear, and staggered luxury wordmark outro.",
    template: "cta-outro",
    themeColor: "#5b1a78",
    words: [
      { word: "Follow", startFrame: 3, endFrame: 14 },
      { word: "Bittrix", startFrame: 15, endFrame: 30 },
      { word: "Technologies", startFrame: 31, endFrame: 56 },
      { word: "for", startFrame: 57, endFrame: 66 },
      { word: "more", startFrame: 67, endFrame: 79 },
      { word: "interesting", startFrame: 80, endFrame: 104 },
      { word: "concepts.", startFrame: 105, endFrame: 130 },
    ]
  }
];

// Continuous Camera Path per scene [camX, camY, camScale, rotDeg]
const CAMERA_KEYFRAMES = [
  { x: 0, y: 30, scale: 1.05, rot: -0.6 },    // Scene 1: Low-angle dramatic look up
  { x: -25, y: -10, scale: 1.12, rot: 0.8 },  // Scene 2: Push-in slightly left on hero
  { x: 30, y: 15, scale: 1.08, rot: -0.4 },   // Scene 3: Skew right onto dossier table
  { x: 0, y: -20, scale: 1.02, rot: 0.5 },    // Scene 4: Wide dual-pillar perspective
  { x: -35, y: 25, scale: 1.15, rot: -0.9 },  // Scene 5: Tracking right-down along org nodes
  { x: 20, y: -15, scale: 1.1, rot: 0.6 },    // Scene 6: Tension jitter camera over stock dial
  { x: 0, y: 0, scale: 1.0, rot: 0.0 }        // Scene 7: Centered royal isometric outro
];

export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Determine current active scene and relative local frame
  const { currentSceneIndex, localFrame, sceneStartFrame } = useMemo(() => {
    let accumulated = 0;
    for (let i = 0; i < SCENES.length; i++) {
      const dur = SCENES[i].durationInFrames;
      if (frame < accumulated + dur || i === SCENES.length - 1) {
        return {
          currentSceneIndex: i,
          localFrame: frame - accumulated,
          sceneStartFrame: accumulated,
        };
      }
      accumulated += dur;
    }
    return { currentSceneIndex: 0, localFrame: 0, sceneStartFrame: 0 };
  }, [frame]);

  const activeScene = SCENES[currentSceneIndex];

  // -------------------------------------------------------------
  // CONTINUOUS GLOBAL CAMERA INTERPOLATION (Zero abrupt cuts)
  // -------------------------------------------------------------
  const { camX, camY, camScale, camRot } = useMemo(() => {
    const curCam = CAMERA_KEYFRAMES[currentSceneIndex];
    const nextIndex = Math.min(currentSceneIndex + 1, CAMERA_KEYFRAMES.length - 1);
    const nextCam = CAMERA_KEYFRAMES[nextIndex];

    const transitionProgress = interpolate(
      localFrame,
      [activeScene.durationInFrames - 24, activeScene.durationInFrames],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Natural spring smoothing over transition
    const smoothT = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);

    // Subtle continuous cinematic breathe drift
    const driftX = Math.sin((frame / 60) * 1.5) * 8;
    const driftY = Math.cos((frame / 60) * 1.2) * 6;

    return {
      camX: interpolate(smoothT, [0, 1], [curCam.x, nextCam.x]) + driftX,
      camY: interpolate(smoothT, [0, 1], [curCam.y, nextCam.y]) + driftY,
      camScale: interpolate(smoothT, [0, 1], [curCam.scale, nextCam.scale]),
      camRot: interpolate(smoothT, [0, 1], [curCam.rot, nextCam.rot]),
    };
  }, [currentSceneIndex, localFrame, activeScene.durationInFrames, frame]);

  // Ambient Ember / Silicon particle generation
  const ambientParticles = useMemo(() => {
    return Array.from({ length: 32 }).map((_, i) => {
      const x = (i * 37) % 1080;
      const initialY = (i * 91) % 1920;
      const size = 3 + (i % 5) * 2.5;
      const speed = 0.8 + (i % 4) * 0.45;
      const opacity = 0.25 + (i % 6) * 0.12;
      return { id: i, x, initialY, size, speed, opacity };
    });
  }, []);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#070a12',
        color: '#f8fafc',
        fontFamily: '"JetBrains Mono", "SF Pro Display", -apple-system, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* =========================================================
          GLOBAL LIVING CANVAS LAYER (Never clears to blank/white)
      ========================================================= */}
      <AbsoluteFill
        style={{
          transform: `translate3d(${camX}px, ${camY}px, 0px) scale(${camScale}) rotate(${camRot}deg)`,
          transformOrigin: '50% 50%',
        }}
      >
        {/* Dynamic Deep Cyber Atmosphere Grid */}
        <div
          style={{
            position: 'absolute',
            inset: -400,
            backgroundImage: `
              radial-gradient(circle at 50% 45%, ${
                currentSceneIndex === 6
                  ? 'rgba(91, 26, 120, 0.45)'
                  : activeScene.themeColor === '#f43f5e'
                  ? 'rgba(244, 63, 94, 0.22)'
                  : 'rgba(56, 189, 248, 0.22)'
              } 0%, transparent 68%),
              linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 72px 72px, 72px 72px',
            transform: `perspective(1000px) rotateX(24deg) translateY(${-(frame * 0.9) % 72}px)`,
            opacity: 0.85,
          }}
        />

        {/* Ambient Drifting Silicon Embers */}
        {ambientParticles.map((pt) => {
          const yPos = (pt.initialY - frame * pt.speed * 1.8 + 2400) % 2400 - 240;
          const wobble = Math.sin((frame * 0.05) + pt.id) * 22;
          return (
            <div
              key={pt.id}
              style={{
                position: 'absolute',
                left: pt.x + wobble,
                top: yPos,
                width: pt.size,
                height: pt.size,
                borderRadius: '50%',
                backgroundColor: currentSceneIndex === 6 ? '#fdf3d0' : activeScene.themeColor,
                opacity: pt.opacity,
                filter: `blur(${pt.size > 8 ? 2 : 0}px)`,
                boxShadow: `0 0 12px ${currentSceneIndex === 6 ? '#fdf3d0' : activeScene.themeColor}`,
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {/* Dynamic Silicon Circuit Trace Lines in Background */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.18,
            pointerEvents: 'none',
          }}
        >
          <path
            d="M 120 180 L 120 480 L 320 680 L 760 680 L 920 840 L 920 1480"
            stroke={activeScene.themeColor}
            strokeWidth="3"
            fill="none"
            strokeDasharray="24 16"
            strokeDashoffset={-frame * 1.5}
          />
          <path
            d="M 960 220 L 800 380 L 400 380 L 200 580 L 200 1340 L 440 1580"
            stroke={currentSceneIndex === 6 ? '#5b1a78' : '#38bdf8'}
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="18 12"
            strokeDashoffset={frame * 1.2}
          />
        </svg>

        {/* =====================================================
            TOPIC-SPECIFIC ANIMATED SCENE ARTBOARDS (Continuous)
        ===================================================== */}
        {currentSceneIndex === 0 && <SceneOneFracturedTitan frame={localFrame} fps={fps} />}
        {currentSceneIndex === 1 && <SceneTwoJensenResigns frame={localFrame} fps={fps} />}
        {currentSceneIndex === 2 && <SceneThreeAuditInvestigation frame={localFrame} fps={fps} />}
        {currentSceneIndex === 3 && <SceneFourColetteTakesHelm frame={localFrame} fps={fps} />}
        {currentSceneIndex === 4 && <SceneFiveExecutiveSearchNetwork frame={localFrame} fps={fps} />}
        {currentSceneIndex === 5 && <SceneSixMarketValueBalancing frame={localFrame} fps={fps} />}
        {currentSceneIndex === 6 && <SceneSevenBittrixOutro frame={localFrame} fps={fps} />}
      </AbsoluteFill>

      {/* =========================================================
          HUD METADATA OVERLAY (Non-distracting Tech Framing)
      ========================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 84,
          left: 64,
          right: 64,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 20,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(248, 250, 252, 0.6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          paddingBottom: 20,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: currentSceneIndex === 6 ? '#d97706' : activeScene.themeColor,
              boxShadow: `0 0 10px ${activeScene.themeColor}`,
            }}
          />
          <span style={{ fontWeight: 800, color: '#f8fafc' }}>NVIDIA CORP // INTEL REPORT</span>
        </div>
        <div style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.8 }}>
          SCENE 0{currentSceneIndex + 1} / 07 • {(frame / 60).toFixed(2)}s
        </div>
      </div>

      {/* =========================================================
          KINETIC KARAOKE CAPTIONS (Safe zone y: 1300 - 1520)
      ========================================================= */}
      <div
        style={{
          position: 'absolute',
          bottom: 240,
          left: 60,
          right: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        {/* On-screen Subject Header Badge */}
        <div
          style={{
            display: 'inline-block',
            padding: '8px 24px',
            marginBottom: 20,
            borderRadius: 999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: `1.5px solid ${activeScene.themeColor}55`,
            backdropFilter: 'blur(12px)',
            color: activeScene.themeColor,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            boxShadow: `0 4px 20px ${activeScene.themeColor}22`,
          }}
        >
          {activeScene.on_screen_text}
        </div>

        {/* Word-by-Word Synchronized Karaoke Flow */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px 16px',
            maxWidth: 960,
          }}
        >
          {activeScene.words.map((w, idx) => {
            const isActive = localFrame >= w.startFrame && localFrame <= w.endFrame;
            const hasPassed = localFrame > w.endFrame;

            const wordScale = isActive
              ? spring({
                  frame: localFrame - w.startFrame,
                  fps,
                  config: { damping: 10, stiffness: 220 },
                })
              : 1;

            return (
              <span
                key={`${idx}-${w.word}`}
                style={{
                  display: 'inline-block',
                  fontSize: isActive ? 50 : 42,
                  fontWeight: 900,
                  letterSpacing: '-0.01em',
                  transform: `scale(${isActive ? 1 + wordScale * 0.16 : 1})`,
                  color: isActive
                    ? '#fef08a' // Highlight Yellow (Faceless Shorts Standard)
                    : hasPassed
                    ? '#ffffff'
                    : 'rgba(255, 255, 255, 0.38)',
                  textShadow: isActive
                    ? '0 0 24px rgba(254, 240, 138, 0.8), 0 4px 12px rgba(0, 0, 0, 0.9)'
                    : '0 2px 8px rgba(0, 0, 0, 0.8)',
                  transition: 'all 0.08s ease-out',
                }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </div>

      {/* Progress Line Across Entire Short */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 6,
          width: `${(frame / 959) * 100}%`,
          backgroundColor: currentSceneIndex === 6 ? '#fdf3d0' : activeScene.themeColor,
          boxShadow: `0 0 16px ${currentSceneIndex === 6 ? '#fdf3d0' : activeScene.themeColor}`,
          zIndex: 60,
        }}
      />
    </AbsoluteFill>
  );
}

// =========================================================================
// SCENE 1: FRACTURED SILICON MONOLITH (Question Hook - Literal GPU Die Crack)
// =========================================================================
function SceneOneFracturedTitan({ frame, fps }: { frame: number; fps: number }) {
  const enterSpring = spring({ frame, fps, config: { damping: 13, stiffness: 90 } });
  const crackProgress = interpolate(frame, [25, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const shatterOffset = interpolate(frame, [45, 90], [0, 24], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D Perspective Silicon GPU Die Monolith */}
      <div
        style={{
          position: 'relative',
          width: 580,
          height: 640,
          transform: `perspective(1200px) rotateX(${22 - enterSpring * 6}deg) rotateY(${shatterOffset * 0.2}deg) scale(${enterSpring})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow Halo */}
        <div
          style={{
            position: 'absolute',
            inset: -40,
            borderRadius: 36,
            background: 'radial-gradient(circle, rgba(244, 63, 94, 0.4) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />

        {/* Left Fracturing Half */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 290,
            height: '100%',
            backgroundColor: '#0f172a',
            border: '3px solid #334155',
            borderRight: 'none',
            borderRadius: '24px 0 0 24px',
            transform: `translate3d(${-shatterOffset}px, ${shatterOffset * 0.4}px, 0)`,
            boxShadow: '-16px 24px 50px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
          }}
        >
          {/* Microchip Wire Traces & Gold Core Pins */}
          <div
            style={{
              position: 'absolute',
              inset: 20,
              border: '2px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 12,
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(244, 63, 94, 0.15) 0px, rgba(244, 63, 94, 0.15) 8px, transparent 8px, transparent 16px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: 40,
              fontSize: 64,
              fontWeight: 900,
              color: '#f43f5e',
              letterSpacing: '-0.05em',
            }}
          >
            NV
          </div>
        </div>

        {/* Right Fracturing Half */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 290,
            height: '100%',
            backgroundColor: '#0b1120',
            border: '3px solid #334155',
            borderLeft: 'none',
            borderRadius: '0 24px 24px 0',
            transform: `translate3d(${shatterOffset}px, ${-shatterOffset * 0.5}px, 0)`,
            boxShadow: '16px 24px 50px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 20,
              border: '2px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 12,
              backgroundImage: 'repeating-linear-gradient(-45deg, rgba(56, 189, 248, 0.15) 0px, rgba(56, 189, 248, 0.15) 8px, transparent 8px, transparent 16px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: 10,
              fontSize: 64,
              fontWeight: 900,
              color: '#38bdf8',
              letterSpacing: '-0.05em',
            }}
          >
            IDIA
          </div>
        </div>

        {/* Center Fractured Lightning/Fault Line SVG */}
        <svg
          style={{
            position: 'absolute',
            top: -20,
            left: 270,
            width: 40,
            height: 680,
            zIndex: 10,
          }}
        >
          <path
            d="M 20 0 L 10 120 L 32 240 L 5 360 L 35 480 L 15 600 L 22 680"
            stroke="#f43f5e"
            strokeWidth="5"
            fill="none"
            strokeDasharray="700"
            strokeDashoffset={700 * (1 - crackProgress)}
            style={{ filter: 'drop-shadow(0 0 10px #f43f5e)' }}
          />
        </svg>

        {/* Warning Indicator Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 28px',
            backgroundColor: 'rgba(244, 63, 94, 0.18)',
            border: '2px solid #f43f5e',
            borderRadius: 8,
            color: '#fecdd3',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.15em',
            boxShadow: '0 0 30px rgba(244, 63, 94, 0.3)',
          }}
        >
          <span style={{ animation: 'blink 0.8s infinite' }}>CRITICAL ARCHITECTURE COLLAPSE</span>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SCENE 2: JENSEN HUANG RESIGNATION (Hero Silhouette with Leather Jacket Cue)
// =========================================================================
function SceneTwoJensenResigns({ frame, fps }: { frame: number; fps: number }) {
  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const badgeDrop = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 12, stiffness: 130 } });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* High Contrast Character Cutaway Silhouette Frame */}
      <div
        style={{
          position: 'relative',
          width: 520,
          height: 660,
          borderRadius: 28,
          backgroundColor: '#0c1322',
          border: '2px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden',
          transform: `scale(${enterSpring})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {/* Neon Silhouette Lighting Backdrop */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Character Silhouette: Signature Glasses & Leather Jacket Lapels */}
        <svg
          viewBox="0 0 400 480"
          style={{
            width: 400,
            height: 480,
            zIndex: 5,
            filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.9))',
          }}
        >
          {/* Head & Hair */}
          <path d="M 150 160 C 150 90, 250 90, 250 160 C 250 200, 240 230, 200 230 C 160 230, 150 200, 150 160 Z" fill="#1e293b" />
          {/* Iconic Dark Rimmed Glasses */}
          <rect x="156" y="145" width="38" height="24" rx="4" fill="none" stroke="#38bdf8" strokeWidth="4" />
          <rect x="206" y="145" width="38" height="24" rx="4" fill="none" stroke="#38bdf8" strokeWidth="4" />
          <line x1="194" y1="157" x2="206" y2="157" stroke="#38bdf8" strokeWidth="4" />
          
          {/* Signature Leather Jacket Shoulders & Zipper V-Collar */}
          <path
            d="M 90 480 L 130 260 L 175 250 L 200 320 L 225 250 L 270 260 L 310 480 Z"
            fill="#090d16"
            stroke="#334155"
            strokeWidth="3"
          />
          {/* Cyan Lapel Rim Glow */}
          <path d="M 175 250 L 200 360 L 225 250" fill="none" stroke="#38bdf8" strokeWidth="4" />
          <line x1="200" y1="360" x2="200" y2="480" stroke="#f43f5e" strokeWidth="3" strokeDasharray="6 6" />
        </svg>

        {/* Dropping CEO Resignation Tag Card */}
        <div
          style={{
            position: 'absolute',
            top: 70,
            transform: `translateY(${(1 - badgeDrop) * -120}px) rotate(-6deg)`,
            padding: '14px 32px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            borderRadius: 12,
            fontWeight: 900,
            fontSize: 26,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            boxShadow: '0 16px 36px rgba(220, 38, 38, 0.6)',
            border: '2px solid #fecaca',
            zIndex: 10,
          }}
        >
          [ STATUS: RESIGNED ]
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SCENE 3: AUDIT & INVESTIGATION DOSSIER (Classified Document + Vector Stamp)
// =========================================================================
function SceneThreeAuditInvestigation({ frame, fps }: { frame: number; fps: number }) {
  const enterSpring = spring({ frame, fps, config: { damping: 15, stiffness: 110 } });
  const stampSpring = spring({ frame: Math.max(0, frame - 35), fps, config: { damping: 10, stiffness: 180 } });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Dark Confidential Audit Dossier */}
      <div
        style={{
          position: 'relative',
          width: 580,
          height: 680,
          backgroundColor: '#111827',
          border: '2px solid #374151',
          borderRadius: 20,
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.9)',
          padding: 44,
          transform: `perspective(1000px) rotateX(12deg) scale(${enterSpring})`,
          overflow: 'hidden',
        }}
      >
        {/* Top File Tab */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 44,
            padding: '6px 24px',
            backgroundColor: '#1f2937',
            borderBottom: '2px solid #4b5563',
            fontSize: 16,
            fontWeight: 800,
            color: '#9ca3af',
            letterSpacing: '0.15em',
          }}
        >
          SEC // BOARD COMPLIANCE DOC #8841-B
        </div>

        {/* Dossier Lines & Redacted Code Blocks */}
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ height: 16, width: '70%', backgroundColor: '#1f2937', borderRadius: 4 }} />
          <div style={{ height: 16, width: '90%', backgroundColor: '#1f2937', borderRadius: 4 }} />
          <div style={{ height: 16, width: '45%', backgroundColor: '#f43f5e', opacity: 0.8, borderRadius: 4 }} />

          {/* Audit Verification Vector Items */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: "Executive Governance Quorum", pass: false },
              { label: "Autonomous Supply Allocation", pass: false },
              { label: "Internal Audit Review Protocol", pass: true }
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  backgroundColor: 'rgba(31, 41, 55, 0.6)',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span style={{ fontSize: 18, color: '#e5e7eb', fontWeight: 600 }}>{item.label}</span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: item.pass ? '#22c55e' : '#f43f5e',
                  }}
                >
                  {item.pass ? "VERIFIED" : "FLAGGED"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Glowing Red Investigation Stamp */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 40,
            padding: '16px 36px',
            border: '6px solid #ef4444',
            borderRadius: 16,
            color: '#ef4444',
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: '0.2em',
            transform: `scale(${stampSpring}) rotate(-16deg)`,
            opacity: stampSpring,
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.6)',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            textShadow: '0 0 12px rgba(239, 68, 68, 0.8)',
          }}
        >
          INVESTIGATION
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SCENE 4: COLETTE KRESS STEPS UP (Dual-Pillar Split Compare)
// =========================================================================
function SceneFourColetteTakesHelm({ frame, fps }: { frame: number; fps: number }) {
  const pillarLeft = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const pillarRight = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 14, stiffness: 100 } });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: '0 60px',
      }}
    >
      {/* Left Pillar: Financial Discipline / CFO Command */}
      <div
        style={{
          flex: 1,
          height: 640,
          backgroundColor: '#0c1322',
          border: '2px solid #38bdf8',
          borderRadius: 24,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transform: `translateY(${(1 - pillarLeft) * 80}px)`,
          opacity: pillarLeft,
          boxShadow: '0 20px 60px rgba(56, 189, 248, 0.2)',
        }}
      >
        <div>
          <div style={{ color: '#38bdf8', fontSize: 18, fontWeight: 800, letterSpacing: '0.15em' }}>
            FINANCIAL PILLAR
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#f8fafc', marginTop: 12 }}>
            COLETTE KRESS
          </div>
          <div style={{ fontSize: 20, color: '#94a3b8', marginTop: 4 }}>Chief Financial Officer</div>
        </div>

        {/* Dynamic Financial Balance Bar Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 16, color: '#cbd5e1' }}>Capital Reserves: $42B+</div>
          <div style={{ width: '100%', height: 14, backgroundColor: '#1e293b', borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ width: '92%', height: '100%', backgroundColor: '#38bdf8' }} />
          </div>
          <div style={{ fontSize: 16, color: '#cbd5e1' }}>Gross Margin Health: 75%</div>
          <div style={{ width: '100%', height: 14, backgroundColor: '#1e293b', borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ width: '75%', height: '100%', backgroundColor: '#34d399' }} />
          </div>
        </div>

        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid #38bdf8',
            borderRadius: 12,
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 18,
            color: '#e0f2fe',
          }}
        >
          INTERIM CHIEF EXECUTIVE
        </div>
      </div>

      {/* Right Pillar: Operational Continuity */}
      <div
        style={{
          flex: 1,
          height: 640,
          backgroundColor: '#0c1322',
          border: '2px solid #a855f7',
          borderRadius: 24,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transform: `translateY(${(1 - pillarRight) * 80}px)`,
          opacity: pillarRight,
          boxShadow: '0 20px 60px rgba(168, 85, 247, 0.2)',
        }}
      >
        <div>
          <div style={{ color: '#a855f7', fontSize: 18, fontWeight: 800, letterSpacing: '0.15em' }}>
            OPERATIONAL PILLAR
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#f8fafc', marginTop: 12 }}>
            GLOBAL SUPPLY
          </div>
          <div style={{ fontSize: 20, color: '#94a3b8', marginTop: 4 }}>Foundry Allotments</div>
        </div>

        {/* Server & Chip Architecture Load Vectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 16, color: '#cbd5e1' }}>TSMC 3nm Allocation</div>
          <div style={{ width: '100%', height: 14, backgroundColor: '#1e293b', borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ width: '98%', height: '100%', backgroundColor: '#a855f7' }} />
          </div>
          <div style={{ fontSize: 16, color: '#cbd5e1' }}>Blackwell Ultra Pipeline</div>
          <div style={{ width: '100%', height: 14, backgroundColor: '#1e293b', borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ width: '84%', height: '100%', backgroundColor: '#60a5fa' }} />
          </div>
        </div>

        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid #a855f7',
            borderRadius: 12,
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 18,
            color: '#f3e8ff',
          }}
        >
          FAB CONTINUITY SECURED
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SCENE 5: EXECUTIVE TALENT SEARCH NETWORK (Harvey Jones Governance DAG)
// =========================================================================
function SceneFiveExecutiveSearchNetwork({ frame, fps }: { frame: number; fps: number }) {
  const rootSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const branchSpring = spring({ frame: Math.max(0, frame - 25), fps, config: { damping: 12, stiffness: 120 } });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Node Network Map Container */}
      <div style={{ position: 'relative', width: 720, height: 680 }}>
        {/* Top Central Node: Harvey Jones */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: `translateX(-50%) scale(${rootSpring})`,
            width: 380,
            padding: '24px 28px',
            backgroundColor: '#0f172a',
            border: '2px solid #38bdf8',
            borderRadius: 20,
            textAlign: 'center',
            boxShadow: '0 16px 40px rgba(56, 189, 248, 0.3)',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 16, color: '#38bdf8', fontWeight: 800, letterSpacing: '0.15em' }}>
            INDEPENDENT LEAD DIRECTOR
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', marginTop: 8 }}>
            HARVEY C. JONES
          </div>
          <div style={{ fontSize: 16, color: '#94a3b8', marginTop: 4 }}>Committee Search Chair</div>
        </div>

        {/* Branching SVG Connector Lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
          <path
            d="M 360 170 L 360 300 L 160 380"
            stroke="#38bdf8"
            strokeWidth="4"
            fill="none"
            strokeDasharray="400"
            strokeDashoffset={400 * (1 - branchSpring)}
          />
          <path
            d="M 360 170 L 360 300 L 560 380"
            stroke="#f43f5e"
            strokeWidth="4"
            fill="none"
            strokeDasharray="400"
            strokeDashoffset={400 * (1 - branchSpring)}
          />
        </svg>

        {/* Left Sub-Node: Internal Bench Candidates */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 20,
            width: 320,
            padding: '20px',
            backgroundColor: '#0c1322',
            border: '2px solid #38bdf8',
            borderRadius: 16,
            transform: `scale(${branchSpring})`,
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 14, color: '#38bdf8', fontWeight: 800 }}>INTERNAL PIPELINE</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginTop: 6 }}>VP & SVP Roster</div>
          <div style={{ fontSize: 16, color: '#94a3b8', marginTop: 8 }}>Software & GPU Architecture Leads</div>
        </div>

        {/* Right Sub-Node: External Tech Titan Search */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            right: 20,
            width: 320,
            padding: '20px',
            backgroundColor: '#0c1322',
            border: '2px solid #f43f5e',
            borderRadius: 16,
            transform: `scale(${branchSpring})`,
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 14, color: '#f43f5e', fontWeight: 800 }}>EXTERNAL RECRUIT</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginTop: 6 }}>Global Tech Giants</div>
          <div style={{ fontSize: 16, color: '#94a3b8', marginTop: 8 }}>Tier-1 Hyperscaler Execs</div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SCENE 6: BILLIONS IN VALUE AT STAKE (Radial Meter & Market Ticker HUD)
// =========================================================================
function SceneSixMarketValueBalancing({ frame, fps }: { frame: number; fps: number }) {
  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  
  // Oscillating Needle representing market volatility
  const needleAngle = interpolate(
    Math.sin(frame * 0.15) * Math.cos(frame * 0.08),
    [-1, 1],
    [-42, 42]
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 580,
          height: 640,
          backgroundColor: '#0f172a',
          border: '2px solid rgba(244, 63, 94, 0.5)',
          borderRadius: 24,
          padding: 36,
          boxShadow: '0 24px 80px rgba(244, 63, 94, 0.25)',
          transform: `scale(${enterSpring})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: '#f43f5e', fontWeight: 800, letterSpacing: '0.2em' }}>
            MARKET CAPITALIZATION AT RISK
          </div>
          <div style={{ fontSize: 54, fontWeight: 900, color: '#ffffff', marginTop: 8 }}>
            $3,200,000,000,000
          </div>
        </div>

        {/* Dynamic High-Tech Radial Market Dial */}
        <div style={{ position: 'relative', width: 340, height: 220, overflow: 'hidden' }}>
          <svg viewBox="0 0 340 220" style={{ width: '100%', height: '100%' }}>
            {/* Background Arc */}
            <path
              d="M 40 190 A 130 130 0 0 1 300 190"
              fill="none"
              stroke="#1e293b"
              strokeWidth="28"
              strokeLinecap="round"
            />
            {/* Warning Arc Segment */}
            <path
              d="M 170 60 A 130 130 0 0 1 300 190"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="28"
              strokeLinecap="round"
              strokeDasharray="220"
              strokeDashoffset="30"
            />
            {/* Safe Arc Segment */}
            <path
              d="M 40 190 A 130 130 0 0 1 170 60"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="28"
              strokeLinecap="round"
            />
          </svg>

          {/* Pivoting Needle */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              width: 6,
              height: 120,
              backgroundColor: '#f8fafc',
              borderRadius: 3,
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) rotate(${needleAngle}deg)`,
              boxShadow: '0 0 16px rgba(255, 255, 255, 0.9)',
              transition: 'transform 0.05s linear',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: '50%',
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#f43f5e',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 12px #f43f5e',
            }}
          />
        </div>

        {/* Real-Time Market Volatility Feed */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 24px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid #f43f5e',
            borderRadius: 14,
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          <span style={{ color: '#fecdd3' }}>VOLATILITY INDEX: HIGH</span>
          <span style={{ color: '#f43f5e' }}>DELTA: ±8.4%</span>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SCENE 7: BITTRIX TECHNOLOGIES OUTRO (Exact Royal Purple UI Spec)
// Grounded in: /home/eswaran/Downloads/bittrix-reel(1).html
// Colors: Royal Purple #5b1a78, Warm Cream #fdf3d0
// =========================================================================
function SceneSevenBittrixOutro({ frame, fps }: { frame: number; fps: number }) {
  const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const gearRotation = (frame * 1.8) % 360;
  const sweepProgress = interpolate(frame, [25, 95], [-100, 200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Staggered letter reveal for BITTRIX
  const brandLetters = "BITTRIX".split("");

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Royal Purple Outro Card */}
      <div
        style={{
          position: 'relative',
          width: 640,
          height: 680,
          backgroundColor: '#3b0d52',
          backgroundImage: 'radial-gradient(circle at 50% 40%, #5b1a78 0%, #250635 100%)',
          border: '3px solid #fdf3d0',
          borderRadius: 36,
          boxShadow: '0 30px 100px rgba(91, 26, 120, 0.6), 0 0 50px rgba(253, 243, 208, 0.2)',
          padding: 44,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${enterSpring})`,
          overflow: 'hidden',
        }}
      >
        {/* Diagonal Light Sweep Effect */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            bottom: -200,
            left: `${sweepProgress}%`,
            width: 140,
            background: 'linear-gradient(90deg, transparent, rgba(253, 243, 208, 0.25), transparent)',
            transform: 'rotate(25deg)',
            pointerEvents: 'none',
          }}
        />

        {/* 6-Point Radial Hexagon with 12-Tooth Mechanical Gear */}
        <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 28 }}>
          {/* Animated 6-Point Radial Hexagon SVG */}
          <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <polygon
              points="100,10 180,55 180,145 100,190 20,145 20,55"
              fill="none"
              stroke="#fdf3d0"
              strokeWidth="4"
              opacity="0.8"
            />
            {/* Spoke Circles at Vertices */}
            {[[100, 10], [180, 55], [180, 145], [100, 190], [20, 145], [20, 55]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="6" fill="#fdf3d0" />
            ))}
          </svg>

          {/* Rotating 12-Tooth Precision Gear with Serif 'B' */}
          <div
            style={{
              position: 'absolute',
              inset: 25,
              borderRadius: '50%',
              border: '4px dashed #fdf3d0',
              transform: `rotate(${gearRotation}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Cinzel", Georgia, serif',
              fontSize: 68,
              fontWeight: 900,
              color: '#fdf3d0',
              textShadow: '0 0 20px rgba(253, 243, 208, 0.8)',
            }}
          >
            B
          </div>
        </div>

        {/* Staggered Elastic Bold "BITTRIX" Wordmark */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {brandLetters.map((char, index) => {
            const letterSpring = spring({
              frame: Math.max(0, frame - 10 - index * 3),
              fps,
              config: { damping: 10, stiffness: 140 },
            });
            return (
              <span
                key={index}
                style={{
                  fontSize: 58,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  color: '#fdf3d0',
                  letterSpacing: '0.04em',
                  transform: `scale(${letterSpring}) translateY(${(1 - letterSpring) * 20}px)`,
                  textShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* Tracking "TECHNOLOGIES" Subtitle */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.36em',
            color: '#fdf3d0',
            opacity: 0.9,
            marginTop: 4,
          }}
        >
          TECHNOLOGIES
        </div>

        {/* Expanding Royal Underline Bar */}
        <div
          style={{
            marginTop: 18,
            width: interpolate(frame, [30, 80], [0, 280], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            height: 4,
            backgroundColor: '#fdf3d0',
            borderRadius: 2,
            boxShadow: '0 0 12px #fdf3d0',
          }}
        />

        {/* Call-to-Action Spoken Target Card */}
        <div
          style={{
            marginTop: 28,
            padding: '12px 32px',
            backgroundColor: 'rgba(253, 243, 208, 0.15)',
            border: '1.5px solid #fdf3d0',
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: '#fdf3d0',
            textTransform: 'uppercase',
          }}
        >
          Follow For More Concepts
        </div>
      </div>
    </div>
  );
}