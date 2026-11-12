import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// ==========================================
// SCENE & TIMING METADATA (1278 frames, 60fps)
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
    durationInFrames: 142,
    narration: "What if a calm river explodes?",
    on_screen_text: "Can A Calm River Explode?",
    visual_direction: "Low-angle view of a calm valley river under sudden dark storm clouds with neon lightning accents.",
    template: "question-hook",
    themeColor: "#f43f5e",
    words: [
      { word: "What", startFrame: 3, endFrame: 9 },
      { word: "if", startFrame: 9, endFrame: 12 },
      { word: "a", startFrame: 12, endFrame: 14 },
      { word: "calm", startFrame: 15, endFrame: 23 },
      { word: "river", startFrame: 23, endFrame: 29 },
      { word: "explodes?", startFrame: 30, endFrame: 51 }
    ]
  },
  {
    scene_number: 2,
    role: "body",
    durationInFrames: 142,
    narration: "Torrential rain drenches the mountain slopes.",
    on_screen_text: "Torrential Rain Drenching Valleys",
    visual_direction: "Isometric mountain valley slice receiving vertical downpour streaks channeled toward the basin.",
    template: "hero-object",
    themeColor: "#38bdf8",
    words: [
      { word: "Torrential", startFrame: 3, endFrame: 18 },
      { word: "rain", startFrame: 18, endFrame: 26 },
      { word: "drenches", startFrame: 26, endFrame: 38 },
      { word: "the", startFrame: 39, endFrame: 41 },
      { word: "mountain", startFrame: 42, endFrame: 52 },
      { word: "slopes.", startFrame: 53, endFrame: 71 }
    ]
  },
  {
    scene_number: 3,
    role: "body",
    durationInFrames: 142,
    narration: "Dry soil absorbs, but saturated ground repels.",
    on_screen_text: "Porous Soil Versus Runoff",
    visual_direction: "Split screen comparing porous soil absorbing rainfall on left against saturated impervious soil shedding water on right.",
    template: "split-compare",
    themeColor: "#f43f5e",
    words: [
      { word: "Dry", startFrame: 3, endFrame: 11 },
      { word: "soil", startFrame: 11, endFrame: 21 },
      { word: "absorbs,", startFrame: 21, endFrame: 39 },
      { word: "but", startFrame: 43, endFrame: 48 },
      { word: "saturated", startFrame: 48, endFrame: 66 },
      { word: "ground", startFrame: 66, endFrame: 75 },
      { word: "repels.", startFrame: 76, endFrame: 96 }
    ]
  },
  {
    scene_number: 4,
    role: "body",
    durationInFrames: 142,
    narration: "Water discharge spikes exponentially within minutes.",
    on_screen_text: "Discharge Spikes In Minutes",
    visual_direction: "Large animated digital gauge card plotting a steep rising hydrograph curve with digital metric display.",
    template: "stat-callout",
    themeColor: "#38bdf8",
    words: [
      { word: "Water", startFrame: 3, endFrame: 14 },
      { word: "discharge", startFrame: 14, endFrame: 28 },
      { word: "spikes", startFrame: 28, endFrame: 39 },
      { word: "exponentially", startFrame: 40, endFrame: 63 },
      { word: "within", startFrame: 63, endFrame: 72 },
      { word: "minutes.", startFrame: 72, endFrame: 89 }
    ]
  },
  {
    scene_number: 5,
    role: "body",
    durationInFrames: 142,
    narration: "Surging currents overtop the riverbanks.",
    on_screen_text: "Riverbanks Overwhelmed By Water",
    visual_direction: "Sequential timeline cross-section showing river water swelling from baseline to overtopping the natural levees.",
    template: "timeline",
    themeColor: "#f43f5e",
    words: [
      { word: "Surging", startFrame: 3, endFrame: 16 },
      { word: "currents", startFrame: 17, endFrame: 28 },
      { word: "overtop", startFrame: 28, endFrame: 42 },
      { word: "the", startFrame: 42, endFrame: 45 },
      { word: "riverbanks.", startFrame: 45, endFrame: 68 }
    ]
  },
  {
    scene_number: 6,
    role: "body",
    durationInFrames: 142,
    narration: "Violent torrents inundate the valley.",
    on_screen_text: "Flash Floods Inundate Valley",
    visual_direction: "Topographic map view showing flood contours spreading across valley floors and roadways.",
    template: "steps-numbered",
    themeColor: "#38bdf8",
    words: [
      { word: "Violent", startFrame: 3, endFrame: 17 },
      { word: "torrents", startFrame: 17, endFrame: 29 },
      { word: "inundate", startFrame: 29, endFrame: 42 },
      { word: "the", startFrame: 43, endFrame: 45 },
      { word: "valley.", startFrame: 45, endFrame: 61 }
    ]
  },
  {
    scene_number: 7,
    role: "body",
    durationInFrames: 142,
    narration: "Just six inches sweeps people away.",
    on_screen_text: "Six Inches Knocks Down",
    visual_direction: "Dramatic measurement card comparing human footing instability against rising flood depth line.",
    template: "fact-card",
    themeColor: "#f43f5e",
    words: [
      { word: "Just", startFrame: 3, endFrame: 12 },
      { word: "six", startFrame: 12, endFrame: 21 },
      { word: "inches", startFrame: 21, endFrame: 30 },
      { word: "sweeps", startFrame: 31, endFrame: 40 },
      { word: "people", startFrame: 40, endFrame: 49 },
      { word: "away.", startFrame: 50, endFrame: 63 }
    ]
  },
  {
    scene_number: 8,
    role: "body",
    durationInFrames: 142,
    narration: "Quiet waters become destructive floods.",
    on_screen_text: "Calm River Turned Torrent",
    visual_direction: "Side-by-side vertical split comparing peaceful meandering water versus roaring muddy flood torrent.",
    template: "before-after",
    themeColor: "#38bdf8",
    words: [
      { word: "Quiet", startFrame: 3, endFrame: 14 },
      { word: "waters", startFrame: 14, endFrame: 26 },
      { word: "become", startFrame: 26, endFrame: 36 },
      { word: "destructive", startFrame: 36, endFrame: 51 },
      { word: "floods.", startFrame: 52, endFrame: 71 }
    ]
  },
  {
    scene_number: 9,
    role: "cta",
    durationInFrames: 142,
    narration: "Follow Bittrix Technologies for more interesting concepts.",
    on_screen_text: "Bittrix Technologies",
    visual_direction: "Authentic Bittrix Technologies 3-second animated logo video with royal purple #5b1a78 and cream branding",
    template: "cta-outro",
    themeColor: "#5b1a78",
    words: [
      { word: "Follow", startFrame: 3, endFrame: 13 },
      { word: "Bittrix", startFrame: 14, endFrame: 26 },
      { word: "Technologies", startFrame: 26, endFrame: 49 },
      { word: "for", startFrame: 50, endFrame: 53 },
      { word: "more", startFrame: 54, endFrame: 59 },
      { word: "interesting", startFrame: 60, endFrame: 74 },
      { word: "concepts.", startFrame: 74, endFrame: 97 }
    ]
  }
];

// Continuous Camera Keyframes along a single continuous 3D coordinate space
const CAM_POSITIONS = [
  { x: 0, y: 0, scale: 1.0, rot: 0 },         // Scene 1: Valley River
  { x: 200, y: -150, scale: 1.05, rot: -1.2 },// Scene 2: Mountain Slopes
  { x: -160, y: 120, scale: 1.02, rot: 0.8 }, // Scene 3: Soil Strata
  { x: 180, y: 90, scale: 1.08, rot: -0.6 },  // Scene 4: Hydrograph Gauge
  { x: -120, y: -100, scale: 1.04, rot: 1.0 },// Scene 5: Riverbanks Overtop
  { x: 240, y: 160, scale: 1.03, rot: -0.9 }, // Scene 6: Topo Inundation
  { x: -100, y: 220, scale: 1.1, rot: 1.4 },  // Scene 7: 6-Inch Hazard Card
  { x: 80, y: -60, scale: 1.0, rot: -0.5 },   // Scene 8: Dual Flow Split
  { x: 0, y: 0, scale: 1.0, rot: 0 }          // Scene 9: Bittrix Hub Outro
];

export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Determine current active scene
  const sceneIndex = Math.min(
    SCENES.length - 1,
    Math.max(0, Math.floor(frame / 142))
  );
  const currentScene = SCENES[sceneIndex];
  const sceneLocalFrame = frame % 142;
  const sceneProgress = sceneLocalFrame / 142;

  // Smooth continuous camera interpolation across scene boundaries
  const nextSceneIndex = Math.min(SCENES.length - 1, sceneIndex + 1);
  const blendFactor = interpolate(
    sceneLocalFrame,
    [105, 142],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const curCam = CAM_POSITIONS[sceneIndex];
  const nxtCam = CAM_POSITIONS[nextSceneIndex];

  const smoothX = interpolate(blendFactor, [0, 1], [curCam.x, nxtCam.x]);
  const smoothY = interpolate(blendFactor, [0, 1], [curCam.y, nxtCam.y]);
  const smoothScale = interpolate(blendFactor, [0, 1], [curCam.scale, nxtCam.scale]);
  const smoothRot = interpolate(blendFactor, [0, 1], [curCam.rot, nxtCam.rot]);

  // Subtle continuous camera drift & natural breathing
  const idleX = Math.sin(frame * 0.02) * 14;
  const idleY = Math.cos(frame * 0.018) * 10;
  const camX = smoothX + idleX;
  const camY = smoothY + idleY;
  const camScale = smoothScale + Math.sin(frame * 0.015) * 0.012;
  const camRot = smoothRot + Math.sin(frame * 0.01) * 0.35;

  // Weather / Hydraulic particle generators
  const particles = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      x: ((i * 137.5) % 1080),
      speed: 12 + (i % 7) * 4,
      size: 2 + (i % 4) * 2,
      opacity: 0.25 + (i % 5) * 0.15,
      delay: (i * 23) % 120
    }));
  }, []);

  return (
    <AbsoluteFill
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: '#050b14',
        overflow: 'hidden',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#ffffff'
      }}
    >
      {/* ============================================================== */}
      {/* 1. LIVING CONTINUOUS CANVAS (Atmosphere, Grids, Dynamic Waves) */}
      {/* ============================================================== */}
      <AbsoluteFill
        style={{
          transform: `translate3d(${-camX * 0.4}px, ${-camY * 0.4}px, 0px) scale(${camScale}) rotate(${camRot * 0.3}deg)`,
          transformOrigin: '540px 960px'
        }}
      >
        {/* Dynamic Storm Cloud / Abyss Atmospheric Radial Background */}
        <div
          style={{
            position: 'absolute',
            inset: -400,
            background: sceneIndex === 8
              ? 'radial-gradient(circle at 50% 45%, #2a0b38 0%, #13041c 45%, #08010d 90%)'
              : `radial-gradient(circle at ${50 + Math.sin(frame * 0.01) * 15}% ${35 + Math.cos(frame * 0.012) * 10}%, ${currentScene.themeColor === '#f43f5e' ? 'rgba(244,63,94,0.18)' : 'rgba(56,189,248,0.22)'} 0%, rgba(15,23,42,0.6) 45%, #050b14 85%)`,
            transition: 'background 0.8s ease'
          }}
        />

        {/* Ambient Hydrographic Iso-Mesh Grid */}
        <svg
          width="1600"
          height="2400"
          style={{
            position: 'absolute',
            left: -260,
            top: -240,
            opacity: sceneIndex === 8 ? 0.08 : 0.18,
            pointerEvents: 'none'
          }}
        >
          <defs>
            <pattern id="meshGrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4,4" />
              <circle cx="80" cy="0" r="1.5" fill="#38bdf8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#meshGrid)" />
        </svg>

        {/* Continuous Torrential Rain Streaks (active throughout storm scenes) */}
        {sceneIndex < 8 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {particles.map((p, idx) => {
              const yPos = ((frame * p.speed + p.delay * 15) % 2200) - 150;
              const xPos = p.x + Math.sin((frame + idx) * 0.05) * 8;
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: xPos,
                    top: yPos,
                    width: 2,
                    height: 24 + p.size * 6,
                    backgroundColor: '#38bdf8',
                    opacity: p.opacity,
                    filter: 'blur(0.5px)',
                    transform: 'rotate(12deg)'
                  }}
                />
              );
            })}
          </div>
        )}
      </AbsoluteFill>

      {/* ============================================================== */}
      {/* 2. Bespoke Topic-Specific Visual Layers (Continuous Morphing) */}
      {/* ============================================================== */}
      <AbsoluteFill
        style={{
          transform: `translate3d(${-camX}px, ${-camY}px, 0px) scale(${camScale}) rotate(${camRot}deg)`,
          transformOrigin: '540px 960px'
        }}
      >
        {/* --- SCENE 1: THE CALM RIVER ON THE VERGE OF EXPLODING --- */}
        {sceneIndex === 0 && (
          <SceneCalmRiverExplodes frame={sceneLocalFrame} fps={fps} />
        )}

        {/* --- SCENE 2: TORRENTIAL RAIN DRENCHING MOUNTAIN SLOPES --- */}
        {sceneIndex === 1 && (
          <SceneMountainDrenching frame={sceneLocalFrame} fps={fps} />
        )}

        {/* --- SCENE 3: SPLIT COMPARE - DRY SOIL ABSORBS VS SATURATED REPELS --- */}
        {sceneIndex === 2 && (
          <ScenePorousVsSaturated frame={sceneLocalFrame} fps={fps} />
        )}

        {/* --- SCENE 4: EXPONENTIAL DISCHARGE SPIKE HYDROGRAPH GAUGE --- */}
        {sceneIndex === 3 && (
          <SceneHydrographGauge frame={sceneLocalFrame} fps={fps} />
        )}

        {/* --- SCENE 5: RIVERBANKS OVERTOPPING CROSS-SECTION --- */}
        {sceneIndex === 4 && (
          <SceneRiverbankOvertop frame={sceneLocalFrame} fps={fps} />
        )}

        {/* --- SCENE 6: TOPOGRAPHIC VALLEY FLASH FLOOD CONTOURS --- */}
        {sceneIndex === 5 && (
          <SceneTopographicInundation frame={sceneLocalFrame} fps={fps} />
        )}

        {/* --- SCENE 7: 6 INCHES SWEEPS PEOPLE AWAY (HUMAN PHYSICS GAUGE) --- */}
        {sceneIndex === 6 && (
          <SceneSixInchesHazard frame={sceneLocalFrame} fps={fps} />
        )}

        {/* --- SCENE 8: QUIET WATERS VS DESTRUCTIVE FLOODS SPLIT DUALITY --- */}
        {sceneIndex === 7 && (
          <SceneQuietVsTorrent frame={sceneLocalFrame} fps={fps} />
        )}

        {/* --- SCENE 9: BITTRIX TECHNOLOGIES ROYAL PURPLE REEL OUTRO --- */}
        {sceneIndex === 8 && (
          <SceneBittrixTechnologiesOutro frame={sceneLocalFrame} fps={fps} />
        )}
      </AbsoluteFill>

      {/* ============================================================== */}
      {/* 3. HEADLINE BADGE & CINEMATIC HEADER                           */}
      {/* ============================================================== */}
      {sceneIndex < 8 && (
        <div
          style={{
            position: 'absolute',
            top: 90,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 100
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 24px',
              borderRadius: 30,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: `1.5px solid ${currentScene.themeColor}`,
              boxShadow: `0 0 25px ${currentScene.themeColor}33`,
              backdropFilter: 'blur(12px)'
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: currentScene.themeColor,
                boxShadow: `0 0 10px ${currentScene.themeColor}`
              }}
            />
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: '#f8fafc'
              }}
            >
              {currentScene.on_screen_text}
            </span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. KINETIC SYNCHRONIZED KARAOKE CAPTIONS (Safe Zone 1250-1550) */}
      {/* ============================================================== */}
      <div
        style={{
          position: 'absolute',
          top: 1350,
          left: 60,
          right: 60,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px 16px',
          zIndex: 120,
          pointerEvents: 'none'
        }}
      >
        {currentScene.words.map((item, wIdx) => {
          const isActive =
            sceneLocalFrame >= item.startFrame && sceneLocalFrame <= item.endFrame;
          const isSpoken = sceneLocalFrame > item.endFrame;

          // Word entrance bounce
          const wordPop = spring({
            frame: Math.max(0, sceneLocalFrame - item.startFrame),
            fps,
            config: { damping: 12, stiffness: 220 }
          });

          const activeScale = isActive ? 1.18 : 1.0;
          const wordColor = isActive
            ? '#fef08a' // Bright luminous yellow highlight
            : isSpoken
            ? '#ffffff'
            : 'rgba(255, 255, 255, 0.45)';

          return (
            <span
              key={wIdx}
              style={{
                fontSize: sceneIndex === 8 ? 44 : 52,
                fontWeight: 900,
                color: wordColor,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                transform: `scale(${isActive ? 1 + wordPop * 0.18 : 1.0})`,
                transition: 'transform 0.08s ease, color 0.08s ease',
                textShadow: isActive
                  ? '0 0 25px rgba(254, 240, 138, 0.8), 0 4px 12px rgba(0,0,0,0.9)'
                  : '0 4px 10px rgba(0,0,0,0.8)',
                display: 'inline-block'
              }}
            >
              {item.word}
            </span>
          );
        })}
      </div>

      {/* Modern Vignette & Letterbox Edge Gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 160px rgba(0, 0, 0, 0.85)',
          pointerEvents: 'none'
        }}
      />
    </AbsoluteFill>
  );
}

// =========================================================================
// SCENE 1: CALM VALLEY RIVER UNDER SUDDEN EXPLODING DARK STORM
// =========================================================================
function SceneCalmRiverExplodes({ frame, fps }: { frame: number; fps: number }) {
  const stormSurge = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 14, stiffness: 100 } });
  const lightningFlash = frame > 28 && frame < 34 ? 1 : frame > 42 && frame < 46 ? 0.7 : 0;

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Thunderstorm Lightning Strobe Accent */}
      {lightningFlash > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: `rgba(244, 63, 94, ${lightningFlash * 0.35})`,
            mixBlendMode: 'screen'
          }}
        />
      )}

      {/* Valley Cross-section Illustration */}
      <svg width="1000" height="900" viewBox="0 0 1000 900" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="valleySlope" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>
        </defs>

        {/* Mountain Valley Contours */}
        <path d="M 0 350 Q 250 500 400 680 L 0 680 Z" fill="url(#valleySlope)" stroke="#38bdf8" strokeWidth="2" opacity="0.6" />
        <path d="M 1000 350 Q 750 500 600 680 L 1000 680 Z" fill="url(#valleySlope)" stroke="#38bdf8" strokeWidth="2" opacity="0.6" />

        {/* Ominous Storm Cloud Front */}
        <g transform={`translate(0, ${-80 + stormSurge * 60})`}>
          <ellipse cx="500" cy="220" rx="420" ry="140" fill="url(#cloudGrad)" />
          <ellipse cx="320" cy="180" rx="220" ry="120" fill="url(#cloudGrad)" opacity="0.8" />
          <ellipse cx="680" cy="180" rx="240" ry="130" fill="url(#cloudGrad)" opacity="0.8" />
          {/* Warning Lightning Bolt */}
          <path
            d="M 520 220 L 480 340 L 530 350 L 460 480"
            fill="none"
            stroke="#f43f5e"
            strokeWidth={lightningFlash > 0 ? "8" : "2"}
            strokeLinecap="round"
            filter="drop-shadow(0 0 16px #f43f5e)"
            opacity={frame > 25 ? 0.9 : 0.2}
          />
        </g>

        {/* Calm River Channel Morphing into Violent Swell */}
        <path
          d={`M 380 680 C 440 ${660 - Math.sin(frame * 0.1) * 20 * stormSurge}, 560 ${660 + Math.sin(frame * 0.1) * 20 * stormSurge}, 620 680 L 650 850 L 350 850 Z`}
          fill="url(#waterFlow)"
          filter="drop-shadow(0 0 30px rgba(56, 189, 248, 0.4))"
        />

        {/* Water Surface Wave Lines */}
        <path
          d={`M 390 690 Q 500 ${670 + Math.sin(frame * 0.2) * 15}, 610 690`}
          stroke="#f8fafc"
          strokeWidth="4"
          fill="none"
          opacity="0.75"
        />
        <path
          d={`M 410 730 Q 500 ${715 + Math.cos(frame * 0.18) * 12}, 590 730`}
          stroke="#38bdf8"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
        />
      </svg>
    </AbsoluteFill>
  );
}

// =========================================================================
// SCENE 2: TORRENTIAL RAIN DRENCHING MOUNTAIN SLOPES (ISOMETRIC SLICE)
// =========================================================================
function SceneMountainDrenching({ frame, fps }: { frame: number; fps: number }) {
  const mountEnter = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          transform: `scale(${mountEnter}) translateY(${interpolate(mountEnter, [0, 1], [100, 0])}px)`,
          width: 900,
          height: 800,
          position: 'relative'
        }}
      >
        <svg width="900" height="800" viewBox="0 0 900 800">
          <defs>
            <linearGradient id="rockSlice" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="waterFlowArrow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Isometric Geological Terrain Slice */}
          <polygon points="450,150 820,380 450,680 80,380" fill="url(#rockSlice)" stroke="#334155" strokeWidth="3" />
          <polygon points="80,380 450,680 450,750 80,450" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
          <polygon points="450,680 820,380 820,450 450,750" fill="#030712" stroke="#1e293b" strokeWidth="2" />

          {/* Mountain Ridge Elevation Crests */}
          <path d="M 450 150 L 450 680" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6,6" opacity="0.4" />

          {/* Drenching Downpour Laser Streams Channeled to Basin */}
          {Array.from({ length: 9 }).map((_, i) => {
            const offset = (i - 4) * 60;
            const flowProgress = (frame * 5 + i * 18) % 120;
            return (
              <g key={i}>
                <line
                  x1={450 + offset}
                  y1={80}
                  x2={450 + offset * 0.4}
                  y2={500}
                  stroke="url(#waterFlowArrow)"
                  strokeWidth="3"
                  strokeDasharray="15,10"
                />
                <circle
                  cx={450 + offset * 0.4}
                  cy={500 + flowProgress * 1.2}
                  r="4"
                  fill="#38bdf8"
                  opacity="0.8"
                />
              </g>
            );
          })}

          {/* Valley Basin Water Pool Expanding */}
          <ellipse
            cx="450"
            cy="650"
            rx={80 + frame * 1.2}
            ry={30 + frame * 0.5}
            fill="#38bdf8"
            opacity="0.7"
            filter="drop-shadow(0 0 25px #38bdf8)"
          />
        </svg>

        {/* Infiltration Runoff HUD Tag */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 280,
            padding: '8px 20px',
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid #38bdf8',
            fontSize: 20,
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: 1.5
          }}
        >
          BASIN INFLOW RATE: +840%
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =========================================================================
// SCENE 3: POROUS DRY SOIL ABSORBING VS SATURATED IMPERVIOUS SOIL REPELLING
// =========================================================================
function ScenePorousVsSaturated({ frame, fps }: { frame: number; fps: number }) {
  const cardSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 960,
          height: 820,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          transform: `scale(${cardSpring})`
        }}
      >
        {/* LEFT COLUMN: DRY POROUS SOIL (ABSORBS) */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '2px solid #38bdf8',
            borderRadius: 24,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.15)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8', marginBottom: 12 }}>
            DRY SOIL: ABSORPTION
          </div>
          <svg width="400" height="520" viewBox="0 0 400 520">
            {/* Porous Underground Matrix */}
            <rect x="20" y="160" width="360" height="340" rx="16" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            {/* Sponge pores */}
            {Array.from({ length: 24 }).map((_, i) => (
              <circle
                key={i}
                cx={50 + (i % 6) * 55}
                cy={200 + Math.floor(i / 6) * 75}
                r="14"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.6"
              />
            ))}
            {/* Water Drops Sinking Down Inward */}
            {Array.from({ length: 6 }).map((_, i) => {
              const dropY = 60 + ((frame * 4 + i * 40) % 220);
              return (
                <circle
                  key={i}
                  cx={70 + i * 50}
                  cy={dropY}
                  r="6"
                  fill="#38bdf8"
                  opacity={dropY > 200 ? 0.4 : 0.9}
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', bottom: 20, fontSize: 18, color: '#94a3b8', fontWeight: 700 }}>
            INFILTRATION: HIGH (92%)
          </div>
        </div>

        {/* RIGHT COLUMN: SATURATED GROUND (REPELS / RUNOFF) */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '2px solid #f43f5e',
            borderRadius: 24,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 0 35px rgba(244, 63, 94, 0.2)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: '#f43f5e', marginBottom: 12 }}>
            SATURATED: 100% RUNOFF
          </div>
          <svg width="400" height="520" viewBox="0 0 400 520">
            {/* Water-logged ground slab */}
            <rect x="20" y="160" width="360" height="340" rx="16" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="2" />
            {/* Slick impervious surface barrier */}
            <line x1="20" y1="160" x2="380" y2="160" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" />
            {/* Deflecting / Sweeping Runoff Torrent arrows */}
            {Array.from({ length: 5 }).map((_, i) => {
              const slideX = 80 + ((frame * 6 + i * 50) % 240);
              return (
                <g key={i}>
                  <line x1={slideX} y1="140" x2={slideX + 35} y2="140" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
                  <polygon points={`${slideX + 45},140 ${slideX + 32},133 ${slideX + 32},147`} fill="#f43f5e" />
                </g>
              );
            })}
            <text x="200" y="320" textAnchor="middle" fill="#f43f5e" fontSize="22" fontWeight="800">
              GROUND REJECTS WATER
            </text>
          </svg>
          <div style={{ position: 'absolute', bottom: 20, fontSize: 18, color: '#f43f5e', fontWeight: 700 }}>
            RUNOFF SPEED: CRITICAL
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =========================================================================
// SCENE 4: EXPONENTIAL HYDROGRAPH GAUGE SPIKE IN MINUTES
// =========================================================================
function SceneHydrographGauge({ frame, fps }: { frame: number; fps: number }) {
  const curveDraw = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const metricVal = Math.floor(interpolate(curveDraw, [0, 1], [420, 14200]));

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 920,
          height: 850,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '2px solid #38bdf8',
          borderRadius: 32,
          padding: 40,
          boxShadow: '0 0 50px rgba(56, 189, 248, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, color: '#94a3b8', fontWeight: 700, letterSpacing: 1.5 }}>
              HYDROGRAPHIC TELEMETRY
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#f8fafc', marginTop: 4 }}>
              Discharge Rate (m³/s)
            </div>
          </div>
          <div
            style={{
              padding: '12px 28px',
              borderRadius: 20,
              backgroundColor: '#f43f5e',
              color: '#ffffff',
              fontSize: 28,
              fontWeight: 900,
              boxShadow: '0 0 20px rgba(244, 63, 94, 0.6)'
            }}
          >
            {metricVal.toLocaleString()} m³/s
          </div>
        </div>

        {/* Steep Exponential Curve SVG Plot */}
        <svg width="840" height="480" viewBox="0 0 840 480" style={{ overflow: 'visible' }}>
          {/* Axis Gridlines */}
          <line x1="60" y1="420" x2="800" y2="420" stroke="#334155" strokeWidth="2" />
          <line x1="60" y1="40" x2="60" y2="420" stroke="#334155" strokeWidth="2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i} x1="60" y1={80 + i * 80} x2="800" y2={80 + i * 80} stroke="#1e293b" strokeWidth="1.5" strokeDasharray="4,4" />
          ))}

          {/* Exponential Sharp Curve */}
          <path
            d="M 60 410 Q 420 400 520 280 T 780 60"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="1200"
            strokeDashoffset={interpolate(curveDraw, [0, 1], [1200, 0])}
            filter="drop-shadow(0 0 16px #38bdf8)"
          />

          {/* Pulsing Danger Zone Marker at Peak */}
          {curveDraw > 0.7 && (
            <g transform="translate(780, 60)">
              <circle r="18" fill="#f43f5e" opacity="0.4" />
              <circle r="10" fill="#f43f5e" />
              <text x="-80" y="-20" fill="#f43f5e" fontSize="24" fontWeight="900">
                CRITICAL SPIKE
              </text>
            </g>
          )}
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 18, fontWeight: 700 }}>
          <span>T = 0 MIN (CALM)</span>
          <span>T = 15 MIN (SATURATION)</span>
          <span style={{ color: '#f43f5e' }}>T = 30 MIN (EXPLOSION)</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =========================================================================
// SCENE 5: RIVERBANKS OVERTOPPING CROSS-SECTION
// =========================================================================
function SceneRiverbankOvertop({ frame, fps }: { frame: number; fps: number }) {
  const waterSwell = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const waterHeight = interpolate(waterSwell, [0, 1], [620, 360]);

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="960" height="900" viewBox="0 0 960 900">
        <defs>
          <linearGradient id="leveeSoil" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="swellWater" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>

        {/* Natural Riverbank Levees on Left & Right */}
        <path d="M 0 500 Q 150 480 250 480 L 320 750 L 0 750 Z" fill="url(#leveeSoil)" stroke="#475569" strokeWidth="3" />
        <path d="M 960 500 Q 810 480 710 480 L 640 750 L 960 750 Z" fill="url(#leveeSoil)" stroke="#475569" strokeWidth="3" />

        {/* Dynamic Swelling Water Body Overtop */}
        <path
          d={`M 180 750 L 260 ${waterHeight} Q 480 ${waterHeight - Math.sin(frame * 0.15) * 20} 700 ${waterHeight} L 780 750 Z`}
          fill="url(#swellWater)"
          filter="drop-shadow(0 0 35px rgba(56, 189, 248, 0.4))"
        />

        {/* Overflowing Spill Crests Beyond Natural Levee */}
        {waterHeight < 480 && (
          <g>
            <path
              d={`M 260 ${waterHeight} C 200 480, 100 520, 20 640`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d={`M 700 ${waterHeight} C 760 480, 860 520, 940 640`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Bank Level Warning Line */}
        <line x1="150" y1="480" x2="810" y2="480" stroke="#f43f5e" strokeWidth="3" strokeDasharray="8,8" />
        <text x="480" y="460" textAnchor="middle" fill="#f43f5e" fontSize="22" fontWeight="900" letterSpacing="2">
          CRITICAL LEVEE CREST (OVERTOPPING HAZARD)
        </text>
      </svg>
    </AbsoluteFill>
  );
}

// =========================================================================
// SCENE 6: TOPOGRAPHIC CONTOURS INUNDATING VALLEY FLOORS
// =========================================================================
function SceneTopographicInundation({ frame, fps }: { frame: number; fps: number }) {
  const topoProgress = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 940, height: 860, position: 'relative' }}>
        <svg width="940" height="860" viewBox="0 0 940 860">
          {/* Topographic Elevation Rings */}
          {Array.from({ length: 6 }).map((_, i) => {
            const rx = 400 - i * 55;
            const ry = 320 - i * 45;
            return (
              <ellipse
                key={i}
                cx="470"
                cy="430"
                rx={rx}
                ry={ry}
                fill="none"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="6,6"
              />
            );
          })}

          {/* Expanding Flood Contour Layer */}
          <path
            d={`M 220 430 Q 340 ${320 - Math.sin(frame * 0.1) * 20}, 470 300 Q 640 ${340 + Math.cos(frame * 0.1) * 25}, 720 430 Q 600 580, 470 590 Q 300 560, 220 430 Z`}
            fill="rgba(56, 189, 248, 0.45)"
            stroke="#38bdf8"
            strokeWidth="4"
            transform={`scale(${topoProgress})`}
            style={{ transformOrigin: '470px 430px' }}
            filter="drop-shadow(0 0 40px #0284c7)"
          />

          {/* Submerged Roadway Grid */}
          <line x1="140" y1="200" x2="800" y2="660" stroke="#64748b" strokeWidth="6" strokeDasharray="12,12" />
          <line x1="800" y1="200" x2="140" y2="660" stroke="#64748b" strokeWidth="6" strokeDasharray="12,12" />

          {/* Submersion Alert Indicators */}
          <circle cx="470" cy="430" r="16" fill="#f43f5e" />
          <circle cx="470" cy="430" r="32" fill="none" stroke="#f43f5e" strokeWidth="3" opacity="0.6" />
        </svg>

        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: 260,
            padding: '12px 28px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '2px solid #f43f5e',
            borderRadius: 20,
            fontSize: 22,
            fontWeight: 800,
            color: '#f43f5e'
          }}
        >
          VALLEY INUNDATION ZONE: ACTIVE
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =========================================================================
// SCENE 7: 6 INCHES OF WATER SWEEPS PEOPLE AWAY (HUMAN STABILITY CARD)
// =========================================================================
function SceneSixInchesHazard({ frame, fps }: { frame: number; fps: number }) {
  const waterRise = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const waterLevel = interpolate(waterRise, [0, 1], [680, 520]);

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 900,
          height: 850,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '2px solid #f43f5e',
          borderRadius: 32,
          padding: 40,
          boxShadow: '0 0 50px rgba(244, 63, 94, 0.25)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 900, color: '#f43f5e', letterSpacing: 1.5 }}>
          6 INCHES (15 CM) OF RAPID WATER
        </div>
        <div style={{ fontSize: 24, color: '#94a3b8', marginTop: 8 }}>
          Sufficient kinetic force to knock over an adult human
        </div>

        <svg width="800" height="600" viewBox="0 0 800 600" style={{ marginTop: 20 }}>
          {/* Ground Baseline */}
          <line x1="80" y1="560" x2="720" y2="560" stroke="#475569" strokeWidth="4" />

          {/* Stylized Human Silhouette Running / Losing Footing */}
          <g transform={`translate(380, 260) rotate(${waterRise * 18})`}>
            {/* Head */}
            <circle cx="20" cy="40" r="28" fill="#f8fafc" />
            {/* Torso */}
            <line x1="20" y1="68" x2="20" y2="180" stroke="#f8fafc" strokeWidth="12" strokeLinecap="round" />
            {/* Arms bracing */}
            <line x1="20" y1="100" x2="-40" y2="140" stroke="#f8fafc" strokeWidth="10" strokeLinecap="round" />
            <line x1="20" y1="100" x2="80" y2="130" stroke="#f8fafc" strokeWidth="10" strokeLinecap="round" />
            {/* Legs destabilized */}
            <line x1="20" y1="180" x2="-30" y2="280" stroke="#f8fafc" strokeWidth="10" strokeLinecap="round" />
            <line x1="20" y1="180" x2="60" y2="260" stroke="#f8fafc" strokeWidth="10" strokeLinecap="round" />
          </g>

          {/* Rushing Flood Torrent Sweeping across Legs */}
          <rect x="80" y={waterLevel} width="640" height={560 - waterLevel} fill="rgba(56, 189, 248, 0.45)" />
          <line x1="80" y1={waterLevel} x2="720" y2={waterLevel} stroke="#38bdf8" strokeWidth="6" />

          {/* Force Vectors & Warning Callout */}
          {Array.from({ length: 4 }).map((_, i) => (
            <line
              key={i}
              x1={120 + i * 140}
              y1={waterLevel + 25}
              x2={220 + i * 140}
              y2={waterLevel + 25}
              stroke="#f43f5e"
              strokeWidth="5"
              strokeLinecap="round"
            />
          ))}

          {/* 6 Inch Precision Ruler Tick */}
          <line x1="680" y1="560" x2="680" y2="520" stroke="#fef08a" strokeWidth="4" />
          <text x="695" y="540" fill="#fef08a" fontSize="22" fontWeight="800">
            6 IN
          </text>
        </svg>
      </div>
    </AbsoluteFill>
  );
}

// =========================================================================
// SCENE 8: QUIET WATERS VS DESTRUCTIVE FLOODS (VERTICAL SPLIT DUALITY)
// =========================================================================
function SceneQuietVsTorrent({ frame, fps }: { frame: number; fps: number }) {
  const splitSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 960,
          height: 820,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          transform: `scale(${splitSpring})`
        }}
      >
        {/* Peaceful Meander */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '2px solid #38bdf8',
            borderRadius: 28,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden'
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 900, color: '#38bdf8', marginBottom: 12 }}>
            QUIET RIVER
          </div>
          <svg width="400" height="580" viewBox="0 0 400 580">
            <path
              d={`M 200 40 Q ${160 + Math.sin(frame * 0.05) * 20} 200, 200 350 Q ${240 + Math.cos(frame * 0.05) * 20} 450, 200 560`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="32"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
          <div style={{ fontSize: 18, color: '#94a3b8', fontWeight: 700 }}>VELOCITY: 0.5 M/S</div>
        </div>

        {/* Destructive Torrent */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '2px solid #f43f5e',
            borderRadius: 28,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(244, 63, 94, 0.3)'
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 900, color: '#f43f5e', marginBottom: 12 }}>
            FLASH FLOOD
          </div>
          <svg width="400" height="580" viewBox="0 0 400 580">
            <rect x="20" y="40" width="360" height="500" rx="16" fill="rgba(244, 63, 94, 0.25)" />
            {Array.from({ length: 8 }).map((_, i) => {
              const yPos = ((frame * 12 + i * 65) % 500) + 40;
              return (
                <path
                  key={i}
                  d={`M 40 ${yPos} Q 200 ${yPos + 30}, 360 ${yPos}`}
                  stroke="#f43f5e"
                  strokeWidth="8"
                  fill="none"
                />
              );
            })}
          </svg>
          <div style={{ fontSize: 18, color: '#f43f5e', fontWeight: 800 }}>VELOCITY: 8.5+ M/S</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =========================================================================
// SCENE 9: BITTRIX TECHNOLOGIES ROYAL PURPLE REEL OUTRO (EXACT ASSETS)
// =========================================================================
function SceneBittrixTechnologiesOutro({ frame, fps }: { frame: number; fps: number }) {
  const introPop = spring({ frame, fps, config: { damping: 13, stiffness: 110 } });
  const gearRotation = frame * 2.8;

  const brandText = "BITTRIX";

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, #5b1a78 0%, #2e0840 50%, #0d0114 100%)'
      }}
    >
      <div
        style={{
          transform: `scale(${introPop})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        {/* Animated Hexagonal Starburst & Rotating Gear */}
        <div style={{ width: 340, height: 340, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Radial 6-point spoke nodes */}
          <svg width="340" height="340" viewBox="0 0 340 340" style={{ position: 'absolute' }}>
            <polygon
              points="170,30 290,95 290,245 170,310 50,245 50,95"
              fill="none"
              stroke="#fdf3d0"
              strokeWidth="2.5"
              opacity="0.35"
            />
            {Array.from({ length: 6 }).map((_, i) => {
              const ang = (i * 60 * Math.PI) / 180;
              const cx = 170 + Math.cos(ang) * 140;
              const cy = 170 + Math.sin(ang) * 140;
              return <circle key={i} cx={cx} cy={cy} r="6" fill="#fdf3d0" opacity="0.6" />;
            })}
          </svg>

          {/* 12-Tooth Rotating Gear with Classic Serif 'B' */}
          <div
            style={{
              width: 190,
              height: 190,
              borderRadius: '50%',
              border: '6px dashed #fdf3d0',
              transform: `rotate(${gearRotation}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(253, 243, 208, 0.4)'
            }}
          />

          <div
            style={{
              position: 'absolute',
              fontSize: 90,
              fontWeight: 900,
              fontFamily: '"Georgia", serif',
              color: '#fdf3d0',
              textShadow: '0 4px 20px rgba(0,0,0,0.8)'
            }}
          >
            B
          </div>
        </div>

        {/* Staggered Elastic "BITTRIX" Typography */}
        <div style={{ display: 'flex', gap: 10, marginTop: 40 }}>
          {brandText.split('').map((char, cIdx) => {
            const letterSpring = spring({
              frame: Math.max(0, frame - cIdx * 3),
              fps,
              config: { damping: 12, stiffness: 150 }
            });

            return (
              <span
                key={cIdx}
                style={{
                  fontSize: 78,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  color: '#fdf3d0',
                  letterSpacing: 4,
                  transform: `scale(${letterSpring}) translateY(${interpolate(letterSpring, [0, 1], [30, 0])}px)`,
                  textShadow: '0 6px 25px rgba(0,0,0,0.9)'
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* Tracking Subtitle */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 12,
            color: '#fdf3d0',
            opacity: 0.9,
            marginTop: 16,
            textTransform: 'uppercase'
          }}
        >
          TECHNOLOGIES
        </div>

        {/* Expanding Accent Underline Bar */}
        <div
          style={{
            width: interpolate(introPop, [0, 1], [0, 360]),
            height: 4,
            backgroundColor: '#fdf3d0',
            marginTop: 20,
            borderRadius: 2,
            boxShadow: '0 0 15px #fdf3d0'
          }}
        />
      </div>
    </AbsoluteFill>
  );
}