import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ==========================================
// SCENE & NARRATION DATA SPECIFICATIONS
// ==========================================
interface WordTimestamp {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface SceneData {
  scene_number: number;
  durationInFrames: number;
  role: string;
  on_screen_text: string;
  themeColor: string;
  words: WordTimestamp[];
}

const SCENES: SceneData[] = [
  {
    scene_number: 1,
    durationInFrames: 137,
    role: "hook",
    on_screen_text: "Can A Thief Outrun Police?",
    themeColor: "#f43f5e",
    words: [
      { word: "Can", startFrame: 3, endFrame: 8 },
      { word: "a", startFrame: 9, endFrame: 10 },
      { word: "bank", startFrame: 11, endFrame: 18 },
      { word: "thief", startFrame: 18, endFrame: 25 },
      { word: "outrun", startFrame: 26, endFrame: 35 },
      { word: "police?", startFrame: 36, endFrame: 53 },
    ],
  },
  {
    scene_number: 2,
    durationInFrames: 137,
    role: "body",
    on_screen_text: "Silent Alarms Alert Instantly",
    themeColor: "#38bdf8",
    words: [
      { word: "Silent", startFrame: 3, endFrame: 17 },
      { word: "alarms", startFrame: 17, endFrame: 27 },
      { word: "alert", startFrame: 28, endFrame: 37 },
      { word: "dispatch", startFrame: 37, endFrame: 53 },
      { word: "within", startFrame: 53, endFrame: 61 },
      { word: "seconds.", startFrame: 61, endFrame: 82 },
    ],
  },
  {
    scene_number: 3,
    durationInFrames: 137,
    role: "body",
    on_screen_text: "GPS Darts Tag Vehicles",
    themeColor: "#f43f5e",
    words: [
      { word: "Cruisers", startFrame: 3, endFrame: 17 },
      { word: "launch", startFrame: 17, endFrame: 26 },
      { word: "predictive", startFrame: 26, endFrame: 40 },
      { word: "GPS", startFrame: 41, endFrame: 57 },
      { word: "tracking", startFrame: 57, endFrame: 69 },
      { word: "darts.", startFrame: 69, endFrame: 85 },
    ],
  },
  {
    scene_number: 4,
    durationInFrames: 137,
    role: "body",
    on_screen_text: "Perimeter Rings Seal Streets",
    themeColor: "#38bdf8",
    words: [
      { word: "Units", startFrame: 3, endFrame: 15 },
      { word: "seal", startFrame: 16, endFrame: 24 },
      { word: "escape", startFrame: 24, endFrame: 35 },
      { word: "routes", startFrame: 36, endFrame: 46 },
      { word: "with", startFrame: 46, endFrame: 50 },
      { word: "tactical", startFrame: 50, endFrame: 65 },
      { word: "perimeters.", startFrame: 65, endFrame: 88 },
    ],
  },
  {
    scene_number: 5,
    durationInFrames: 137,
    role: "body",
    on_screen_text: "Containment Beats Pursuit",
    themeColor: "#f43f5e",
    words: [
      { word: "Traps", startFrame: 3, endFrame: 14 },
      { word: "close", startFrame: 15, endFrame: 25 },
      { word: "every", startFrame: 25, endFrame: 32 },
      { word: "street", startFrame: 33, endFrame: 41 },
      { word: "ahead", startFrame: 41, endFrame: 49 },
      { word: "safely.", startFrame: 50, endFrame: 68 },
    ],
  },
  {
    scene_number: 6,
    durationInFrames: 137,
    role: "body",
    on_screen_text: "Every Escape Route Closes",
    themeColor: "#f43f5e",
    words: [
      { word: "Cornered", startFrame: 3, endFrame: 15 },
      { word: "suspects", startFrame: 15, endFrame: 33 },
      { word: "have", startFrame: 33, endFrame: 37 },
      { word: "nowhere", startFrame: 38, endFrame: 48 },
      { word: "left", startFrame: 48, endFrame: 57 },
      { word: "to", startFrame: 57, endFrame: 60 },
      { word: "run.", startFrame: 60, endFrame: 73 },
    ],
  },
  {
    scene_number: 7,
    durationInFrames: 137,
    role: "cta",
    on_screen_text: "Follow Bittrix Technologies",
    themeColor: "#5b1a78",
    words: [
      { word: "Follow", startFrame: 3, endFrame: 14 },
      { word: "Bittrix", startFrame: 15, endFrame: 27 },
      { word: "Technologies", startFrame: 28, endFrame: 46 },
      { word: "for", startFrame: 47, endFrame: 52 },
      { word: "more", startFrame: 53, endFrame: 60 },
      { word: "interesting", startFrame: 61, endFrame: 76 },
      { word: "concepts.", startFrame: 77, endFrame: 105 },
    ],
  },
];

// Calculate cumulative frame offsets
const SCENE_OFFSETS: number[] = [];
let acc = 0;
SCENES.forEach((sc) => {
  SCENE_OFFSETS.push(acc);
  acc += sc.durationInFrames;
});

// Helper math for Bittrix outro geometry
const BITTRIX_CX = 540;
const BITTRIX_CY = 720;
const BITTRIX_R = 250;
const hv = (r: number) =>
  [...Array(6)].map((_, i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    return [r * Math.cos(a), r * Math.sin(a)] as [number, number];
  });
const HX = hv(BITTRIX_R);
const CH = hv(BITTRIX_R + 48).map((p) => [p[0] + BITTRIX_CX, p[1] + BITTRIX_CY] as [number, number]);
const NODES = [5, 1, 3].map((i) => [BITTRIX_CX + HX[i][0] * 1.04, BITTRIX_CY + HX[i][1] * 1.04] as [number, number]);

// Build 12-tooth gear SVG path string
const buildGearPath = (r0: number, r1: number, n: number) => {
  const w = (Math.PI * 2) / n;
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = k * w;
    const pts = [
      [a, r0],
      [a + w * 0.15, r1],
      [a + w * 0.42, r1],
      [a + w * 0.57, r0],
    ];
    pts.forEach((p, idx) => {
      const px = p[1] * Math.cos(p[0]);
      const py = p[1] * Math.sin(p[0]);
      if (k === 0 && idx === 0) {
        d += `M ${px} ${py} `;
      } else {
        d += `L ${px} ${py} `;
      }
    });
  }
  return d + 'Z';
};
const GEAR_PATH_D = buildGearPath(100, 128, 12);

export default function GeneratedCliVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find active scene index and scene-local frame
  const currentSceneIndex = useMemo(() => {
    for (let i = SCENES.length - 1; i >= 0; i--) {
      if (frame >= SCENE_OFFSETS[i]) return i;
    }
    return 0;
  }, [frame]);

  const activeScene = SCENES[currentSceneIndex];
  const sceneStartFrame = SCENE_OFFSETS[currentSceneIndex];
  const sceneFrame = frame - sceneStartFrame;

  // ----------------------------------------------------
  // CONTINUOUS 3D-SPACE CAMERA ENGINE
  // ----------------------------------------------------
  // Smoothly glides across scenes so the canvas stays continuous
  const cameraTransforms = useMemo(() => {
    // Camera coordinates per scene [x, y, scale, rotZ]
    const camKeyframes = [
      { x: 0, y: 0, s: 1.0, r: 0 },         // Scene 1: Vault center
      { x: -60, y: 30, s: 1.06, r: -1.2 },  // Scene 2: Radar command sweep
      { x: 50, y: -40, s: 1.12, r: 1.4 },   // Scene 3: Cruiser schematic
      { x: 0, y: 50, s: 0.98, r: -0.8 },    // Scene 4: Top-down perimeter matrix
      { x: -40, y: -20, s: 1.04, r: 1.0 },  // Scene 5: Dual split vectors
      { x: 20, y: 30, s: 1.15, r: -1.5 },   // Scene 6: Red containment clamp
      { x: 0, y: 0, s: 1.0, r: 0 },         // Scene 7: Royal purple outro
    ];

    const currentKey = camKeyframes[currentSceneIndex];
    const nextKey = camKeyframes[Math.min(currentSceneIndex + 1, camKeyframes.length - 1)];

    // Interpolate during the transition phase of the scene
    const progress = interpolate(
      sceneFrame,
      [0, activeScene.durationInFrames],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Subtle organic drift
    const driftX = Math.sin(frame * 0.03) * 12;
    const driftY = Math.cos(frame * 0.025) * 10;
    const driftR = Math.sin(frame * 0.02) * 0.4;

    const camX = interpolate(progress, [0, 1], [currentKey.x, nextKey.x]) + driftX;
    const camY = interpolate(progress, [0, 1], [currentKey.y, nextKey.y]) + driftY;
    const camScale = interpolate(progress, [0, 1], [currentKey.s, nextKey.s * 1.02]);
    const camRot = interpolate(progress, [0, 1], [currentKey.r, nextKey.r]) + driftR;

    return { camX, camY, camScale, camRot };
  }, [frame, currentSceneIndex, sceneFrame, activeScene.durationInFrames]);

  // Outro transition blending (Scenes 1-6 are dark cyber-tactical; Scene 7 is warm cream & purple)
  const isOutro = currentSceneIndex === 6;
  const outroEnterSpring = spring({
    frame: Math.max(0, frame - SCENE_OFFSETS[6]),
    fps,
    config: { damping: 16, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: '#070a12',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ====================================================
          LAYER 0: GLOBAL CONTINUOUS LIVING CANVAS
          ==================================================== */}
      <AbsoluteFill
        style={{
          transform: `translate3d(${cameraTransforms.camX * 0.3}px, ${cameraTransforms.camY * 0.3}px, 0) scale(${cameraTransforms.camScale})`,
          transformOrigin: '540px 960px',
        }}
      >
        {/* Deep ambient tactical lighting gradients */}
        <div
          style={{
            position: 'absolute',
            width: 1600,
            height: 1600,
            top: -200,
            left: -260,
            background: 'radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.22) 0%, rgba(15, 23, 42, 0) 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 1400,
            height: 1400,
            bottom: -100,
            right: -200,
            background: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.15) 0%, rgba(2, 6, 23, 0) 75%)',
            pointerEvents: 'none',
          }}
        />

        {/* Tactical dynamic isometric / orthographic grid */}
        <svg
          style={{
            position: 'absolute',
            width: 1080,
            height: 1920,
            opacity: 0.18,
          }}
        >
          <defs>
            <pattern
              id="tacticalGrid"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <circle cx="0" cy="0" r="2.5" fill="#38bdf8" />
            </pattern>
          </defs>
          <rect width="1080" height="1920" fill="url(#tacticalGrid)" />
        </svg>

        {/* Ambient floating telemetry dust / radar particles */}
        {[...Array(24)].map((_, i) => {
          const pY = ((i * 85 + frame * (0.8 + (i % 3) * 0.4)) % 2100) - 100;
          const pX = (i * 137) % 1080;
          const pOpacity = 0.2 + (Math.sin(frame * 0.05 + i) + 1) * 0.2;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: pX,
                top: pY,
                width: i % 4 === 0 ? 6 : 3,
                height: i % 4 === 0 ? 6 : 3,
                borderRadius: '50%',
                backgroundColor: i % 2 === 0 ? '#38bdf8' : '#f43f5e',
                opacity: pOpacity,
                boxShadow: `0 0 8px ${i % 2 === 0 ? '#38bdf8' : '#f43f5e'}`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* ====================================================
          LAYER 1: MAIN CINEMATIC SCENE MECHANISMS (SCENES 1-6)
          ==================================================== */}
      <AbsoluteFill
        style={{
          transform: `translate3d(${cameraTransforms.camX}px, ${cameraTransforms.camY}px, 0) scale(${cameraTransforms.camScale}) rotate(${cameraTransforms.camRot}deg)`,
          transformOrigin: '540px 960px',
          opacity: 1 - outroEnterSpring,
        }}
      >
        {/* ---------------- SCENE 1: VAULT DIAL MECHANISM ---------------- */}
        {currentSceneIndex === 0 && (
          <Scene1VaultMechanism sceneFrame={sceneFrame} fps={fps} />
        )}

        {/* ---------------- SCENE 2: TELEMETRY RADAR CONSOLE ---------------- */}
        {currentSceneIndex === 1 && (
          <Scene2RadarTelemetry sceneFrame={sceneFrame} fps={fps} />
        )}

        {/* ---------------- SCENE 3: GPS TRACKING DART LAUNCHER ---------------- */}
        {currentSceneIndex === 2 && (
          <Scene3GpsDartLauncher sceneFrame={sceneFrame} fps={fps} />
        )}

        {/* ---------------- SCENE 4: ORTHOGRAPHIC CITY PERIMETER MATRIX ---------------- */}
        {currentSceneIndex === 3 && (
          <Scene4PerimeterMatrix sceneFrame={sceneFrame} fps={fps} />
        )}

        {/* ---------------- SCENE 5: DUAL COMPARATIVE VECTOR FUNNEL ---------------- */}
        {currentSceneIndex === 4 && (
          <Scene5SplitVectorFunnel sceneFrame={sceneFrame} fps={fps} />
        )}

        {/* ---------------- SCENE 6: 360 LOCKDOWN CONTAINMENT CLAMP ---------------- */}
        {currentSceneIndex === 5 && (
          <Scene6ContainmentClamp sceneFrame={sceneFrame} fps={fps} />
        )}
      </AbsoluteFill>

      {/* ====================================================
          LAYER 2: HUD METRICS & DATA BADGES (TOP / BOTTOM OVERLAYS)
          ==================================================== */}
      <AbsoluteFill style={{ opacity: 1 - outroEnterSpring, pointerEvents: 'none' }}>
        {/* Top Tactical Status Bar */}
        <div
          style={{
            position: 'absolute',
            top: 70,
            left: 60,
            right: 60,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 28px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: 16,
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: activeScene.themeColor,
                boxShadow: `0 0 12px ${activeScene.themeColor}`,
                animation: 'pulse 1s infinite alternate',
              }}
            />
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#f8fafc',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              TACTICAL INTERCEPT // SYS.SEC-0{activeScene.scene_number}
            </span>
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              fontFamily: 'monospace',
              color: '#38bdf8',
              letterSpacing: '0.08em',
            }}
          >
            REC: {Math.floor(frame / 60)}:{(frame % 60).toString().padStart(2, '0')}s
          </div>
        </div>

        {/* On-Screen Punchy Directive Banner */}
        <div
          style={{
            position: 'absolute',
            top: 170,
            left: 60,
            right: 60,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              padding: '14px 34px',
              borderRadius: 999,
              background: `linear-gradient(90deg, rgba(15, 23, 42, 0.9), ${activeScene.themeColor}33, rgba(15, 23, 42, 0.9))`,
              border: `1.5px solid ${activeScene.themeColor}88`,
              boxShadow: `0 0 24px ${activeScene.themeColor}44`,
            }}
          >
            <span
              style={{
                fontSize: 30,
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#ffffff',
                textShadow: `0 0 16px ${activeScene.themeColor}`,
              }}
            >
              {activeScene.on_screen_text}
            </span>
          </div>
        </div>
      </AbsoluteFill>

      {/* ====================================================
          LAYER 3: KINETIC KARAOKE CAPTIONS (SCENES 1-6)
          ==================================================== */}
      {!isOutro && (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            justifyContent: 'flex-end',
            paddingBottom: 220,
            paddingLeft: 60,
            paddingRight: 60,
            opacity: 1 - outroEnterSpring,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px 22px',
              textAlign: 'center',
              background: 'rgba(7, 10, 18, 0.85)',
              padding: '24px 36px',
              borderRadius: 24,
              border: '1.5px solid rgba(56, 189, 248, 0.25)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
            }}
          >
            {activeScene.words.map((w, idx) => {
              const isSpoken = sceneFrame >= w.startFrame && sceneFrame <= w.endFrame;
              const hasBeenSpoken = sceneFrame > w.endFrame;

              // Word scale spring pop when triggered
              const wordSpring = spring({
                frame: Math.max(0, sceneFrame - w.startFrame),
                fps,
                config: { damping: 12, stiffness: 220 },
              });

              const wordScale = isSpoken
                ? interpolate(wordSpring, [0, 1], [1, 1.25])
                : 1;

              return (
                <span
                  key={idx}
                  style={{
                    display: 'inline-block',
                    fontSize: 48,
                    fontWeight: 900,
                    letterSpacing: '-0.01em',
                    transform: `scale(${wordScale})`,
                    transformOrigin: '50% 80%',
                    color: isSpoken
                      ? activeScene.themeColor
                      : hasBeenSpoken
                      ? '#f8fafc'
                      : 'rgba(148, 163, 184, 0.45)',
                    textShadow: isSpoken
                      ? `0 0 25px ${activeScene.themeColor}, 0 0 40px ${activeScene.themeColor}`
                      : 'none',
                    transition: 'color 0.1s ease',
                  }}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        </AbsoluteFill>
      )}

      {/* ====================================================
          LAYER 4: BITTRIX TECHNOLOGIES ROYAL OUTRO (SCENE 7)
          ==================================================== */}
      {frame >= SCENE_OFFSETS[6] - 15 && (
        <AbsoluteFill
          style={{
            opacity: outroEnterSpring,
            transform: `scale(${interpolate(outroEnterSpring, [0, 1], [0.94, 1])})`,
          }}
        >
          <BittrixRoyalOutro frame={Math.max(0, frame - SCENE_OFFSETS[6])} fps={fps} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ========================================================
// SCENE 1: VAULT DIAL MECHANISM COMPONENT
// ========================================================
function Scene1VaultMechanism({ sceneFrame, fps }: { sceneFrame: number; fps: number }) {
  // Heavy bolt release spring physics
  const dialSpring = spring({
    frame: sceneFrame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const dialRotation = interpolate(dialSpring, [0, 1], [-90, 75]);
  const lockRingSpread = interpolate(sceneFrame, [15, 60], [0, 60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const redAlertAlpha = (Math.sin(sceneFrame * 0.25) + 1) * 0.4 + 0.2;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 800, height: 800 }}>
        {/* Outer Heavy Steel Vault Bezel */}
        <svg width="800" height="800" viewBox="0 0 800 800">
          <defs>
            <radialGradient id="vaultPlate" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <linearGradient id="redGlowRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
          </defs>

          {/* Heavy Steel Door Silhouette */}
          <circle
            cx="400"
            cy="400"
            r="380"
            fill="url(#vaultPlate)"
            stroke="#334155"
            strokeWidth="10"
          />

          {/* Hexagonal Locking Studs */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x = 400 + 340 * Math.cos(angle);
            const y = 400 + 340 * Math.sin(angle);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="14"
                fill="#475569"
                stroke="#64748b"
                strokeWidth="3"
              />
            );
          })}

          {/* Expandable Locking Perimeter Bars (Bolts Snapping Inward) */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const boltInward = interpolate(sceneFrame, [10, 45], [0, 45], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const rStart = 270 - boltInward;
            const rEnd = 330 - boltInward;
            const x1 = 400 + rStart * Math.cos(angle);
            const y1 = 400 + rStart * Math.sin(angle);
            const x2 = 400 + rEnd * Math.cos(angle);
            const y2 = 400 + rEnd * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#f43f5e"
                strokeWidth="14"
                strokeLinecap="round"
                filter="drop-shadow(0 0 10px #f43f5e)"
              />
            );
          })}

          {/* Calibrated Dial Outer Ticks */}
          {[...Array(60)].map((_, i) => {
            const angle = (i * 6 * Math.PI) / 180;
            const isMajor = i % 5 === 0;
            const rInner = isMajor ? 215 : 228;
            const rOuter = 240;
            const x1 = 400 + rInner * Math.cos(angle);
            const y1 = 400 + rInner * Math.sin(angle);
            const x2 = 400 + rOuter * Math.cos(angle);
            const y2 = 400 + rOuter * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? '#f43f5e' : '#64748b'}
                strokeWidth={isMajor ? 3.5 : 1.5}
                opacity={isMajor ? 0.9 : 0.4}
              />
            );
          })}

          {/* Glowing Red Warning Halo */}
          <circle
            cx="400"
            cy="400"
            r={245 + lockRingSpread * 0.3}
            fill="none"
            stroke="url(#redGlowRing)"
            strokeWidth="4"
            strokeDasharray="18 10 40 10"
            opacity={redAlertAlpha}
          />
        </svg>

        {/* Rotatable Vault Wheel Mechanism */}
        <div
          style={{
            position: 'absolute',
            top: 200,
            left: 200,
            width: 400,
            height: 400,
            transform: `rotate(${dialRotation}deg)`,
            transformOrigin: 'center center',
          }}
        >
          <svg width="400" height="400" viewBox="0 0 400 400">
            {/* Center Dial Face */}
            <circle
              cx="200"
              cy="200"
              r="170"
              fill="#0f172a"
              stroke="#e11d48"
              strokeWidth="6"
            />
            <circle
              cx="200"
              cy="200"
              r="130"
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="3"
            />

            {/* Three Heavy Chrome Spokes */}
            {[0, 120, 240].map((deg) => (
              <rect
                key={deg}
                x="184"
                y="15"
                width="32"
                height="185"
                rx="16"
                fill="url(#vaultPlate)"
                stroke="#64748b"
                strokeWidth="3"
                transform={`rotate(${deg} 200 200)`}
              />
            ))}

            {/* Hub Central Indicator */}
            <circle
              cx="200"
              cy="200"
              r="48"
              fill="#f43f5e"
              boxShadow="0 0 30px #f43f5e"
            />
            <circle cx="200" cy="200" r="28" fill="#ffffff" />
          </svg>
        </div>

        {/* Digital Telemetry Readout Panels Flanking Vault */}
        <div
          style={{
            position: 'absolute',
            bottom: -70,
            left: 50,
            right: 50,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              padding: '12px 20px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid #f43f5e66',
              borderRadius: 12,
              color: '#f43f5e',
              fontFamily: 'monospace',
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            VALVE: BREACHED // 0x48FA
          </div>
          <div
            style={{
              padding: '12px 20px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid #38bdf866',
              borderRadius: 12,
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            DISPATCH DELAY: &lt; 0.04s
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ========================================================
// SCENE 2: TELEMETRY RADAR CONSOLE COMPONENT
// ========================================================
function Scene2RadarTelemetry({ sceneFrame, fps }: { sceneFrame: number; fps: number }) {
  const radarSweepAngle = (sceneFrame * 4.5) % 360;

  // Concentric radar wave pulses
  const wave1 = (sceneFrame * 3.5) % 320;
  const wave2 = ((sceneFrame + 40) * 3.5) % 320;
  const wave3 = ((sceneFrame + 80) * 3.5) % 320;

  // Dispatch ping spring
  const pingPop = spring({
    frame: Math.max(0, sceneFrame - 20),
    fps,
    config: { damping: 10, stiffness: 180 },
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 850, height: 850 }}>
        <svg width="850" height="850" viewBox="0 0 850 850">
          <defs>
            <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#082f49" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#031f33" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#020b14" stopOpacity="0.98" />
            </radialGradient>
            <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Tactical Circular Radar Bezel */}
          <circle
            cx="425"
            cy="425"
            r="390"
            fill="url(#radarBg)"
            stroke="#0284c7"
            strokeWidth="4"
          />

          {/* Concentric Telemetry Distance Range Rings */}
          {[100, 190, 280, 360].map((r, i) => (
            <g key={i}>
              <circle
                cx="425"
                cy="425"
                r={r}
                fill="none"
                stroke="#0369a1"
                strokeWidth="1.8"
                strokeDasharray={i % 2 === 0 ? '8 6' : 'none'}
                opacity={0.65}
              />
              <text
                x={430}
                y={425 - r + 18}
                fill="#38bdf8"
                fontSize="14"
                fontFamily="monospace"
                opacity="0.75"
              >
                {r * 4}m
              </text>
            </g>
          ))}

          {/* Compass Crosshairs (Azimuth / Elevation) */}
          <line
            x1="425"
            y1="35"
            x2="425"
            y2="815"
            stroke="#0284c7"
            strokeWidth="1.5"
            opacity="0.4"
          />
          <line
            x1="35"
            y1="425"
            x2="815"
            y2="425"
            stroke="#0284c7"
            strokeWidth="1.5"
            opacity="0.4"
          />

          {/* Pulsing Sonar Rings */}
          <circle
            cx="425"
            cy="425"
            r={wave1}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            opacity={Math.max(0, 1 - wave1 / 320)}
          />
          <circle
            cx="425"
            cy="425"
            r={wave2}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            opacity={Math.max(0, 1 - wave2 / 320)}
          />
          <circle
            cx="425"
            cy="425"
            r={wave3}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            opacity={Math.max(0, 1 - wave3 / 320)}
          />

          {/* Rotating High-Frequency Radar Sweep Cone */}
          <g transform={`rotate(${radarSweepAngle} 425 425)`}>
            <path
              d="M 425 425 L 785 425 A 360 360 0 0 0 680 170 Z"
              fill="url(#sweepGrad)"
            />
            <line
              x1="425"
              y1="425"
              x2="785"
              y2="425"
              stroke="#7dd3fc"
              strokeWidth="3.5"
              filter="drop-shadow(0 0 10px #38bdf8)"
            />
          </g>

          {/* Central Transmitter Beacon */}
          <circle
            cx="425"
            cy="425"
            r="16"
            fill="#38bdf8"
            filter="drop-shadow(0 0 15px #38bdf8)"
          />
          <circle cx="425" cy="425" r="7" fill="#ffffff" />

          {/* Target Hostile Ping (Bank Robbery Incident Location) */}
          <g
            transform={`translate(550, 310) scale(${interpolate(pingPop, [0, 1], [0, 1])})`}
          >
            <circle
              cx="0"
              cy="0"
              r="24"
              fill="rgba(244, 63, 94, 0.25)"
              stroke="#f43f5e"
              strokeWidth="2.5"
            />
            <circle
              cx="0"
              cy="0"
              r="8"
              fill="#f43f5e"
              filter="drop-shadow(0 0 10px #f43f5e)"
            />
            <rect
              x="18"
              y="-30"
              width="180"
              height="55"
              rx="8"
              fill="rgba(15, 23, 42, 0.9)"
              stroke="#f43f5e"
              strokeWidth="1.5"
            />
            <text
              x="28"
              y="-10"
              fill="#f43f5e"
              fontSize="14"
              fontFamily="monospace"
              fontWeight="bold"
            >
              [!] TARGET LOCK
            </text>
            <text
              x="28"
              y="12"
              fill="#e2e8f0"
              fontSize="13"
              fontFamily="monospace"
            >
              SPEED: 84 MPH NE
            </text>
          </g>
        </svg>

        {/* Telemetry Lateral Data Strip */}
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: 20,
            right: 20,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'monospace',
            color: '#38bdf8',
            fontSize: 20,
            fontWeight: 700,
            background: 'rgba(3, 31, 51, 0.8)',
            padding: '14px 28px',
            borderRadius: 16,
            border: '1px solid #0284c788',
          }}
        >
          <span>CAD RESPONSE: 0.18 SEC</span>
          <span>911 TRUNK: ACTIVE</span>
          <span>APU UNITS: 4 DISPATCHED</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ========================================================
// SCENE 3: GPS TRACKING DART LAUNCHER (StarChase Tech)
// ========================================================
function Scene3GpsDartLauncher({ sceneFrame, fps }: { sceneFrame: number; fps: number }) {
  // Dart launch trajectory spring
  const launchSpring = spring({
    frame: Math.max(0, sceneFrame - 15),
    fps,
    config: { damping: 11, stiffness: 140 },
  });

  const dartX = interpolate(launchSpring, [0, 1], [-200, 360]);
  const dartY = interpolate(launchSpring, [0, 1], [60, -80]);
  const muzzleFlash = interpolate(sceneFrame, [14, 24], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 900, height: 750 }}>
        {/* Isometric Police Cruiser Grille & Dart Cannons */}
        <svg width="900" height="750" viewBox="0 0 900 750">
          <defs>
            <linearGradient id="grilleMetal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="dartGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* Cruiser Front Push Bumper Guard (Steel Frame) */}
          <rect
            x="80"
            y="260"
            width="340"
            height="260"
            rx="20"
            fill="url(#grilleMetal)"
            stroke="#64748b"
            strokeWidth="6"
          />

          {/* Grille Mesh Slits */}
          {[...Array(7)].map((_, i) => (
            <line
              key={i}
              x1="120"
              y1={290 + i * 28}
              x2="380"
              y2={290 + i * 28}
              stroke="#0f172a"
              strokeWidth="10"
              strokeLinecap="round"
            />
          ))}

          {/* StarChase Compressed Air Dual Dart Canisters */}
          <rect
            x="340"
            y="310"
            width="120"
            height="50"
            rx="10"
            fill="#0284c7"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          <rect
            x="340"
            y="410"
            width="120"
            height="50"
            rx="10"
            fill="#0284c7"
            stroke="#38bdf8"
            strokeWidth="3"
          />

          {/* Barrel Openings */}
          <circle cx="460" cy="335" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="460" cy="435" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />

          {/* Muzzle Compressed Air Flash Explosion */}
          {muzzleFlash > 0.05 && (
            <circle
              cx="460"
              cy="335"
              r={70 * muzzleFlash}
              fill="rgba(56, 189, 248, 0.4)"
              filter="drop-shadow(0 0 25px #38bdf8)"
            />
          )}

          {/* Laser Predictive Guidance Sight Beam */}
          <line
            x1="460"
            y1="335"
            x2="880"
            y2="250"
            stroke="#f43f5e"
            strokeWidth="3"
            strokeDasharray="16 8"
            filter="drop-shadow(0 0 10px #f43f5e)"
          />

          {/* In-Flight High-Speed Adhesive GPS Tracking Dart */}
          <g transform={`translate(${460 + dartX}, ${335 + dartY})`}>
            {/* Aerodynamic Dart Jet Stream Trail */}
            <line
              x1="-140"
              y1="0"
              x2="0"
              y2="0"
              stroke="url(#dartGlow)"
              strokeWidth="6"
              strokeLinecap="round"
              filter="drop-shadow(0 0 12px #f43f5e)"
            />

            {/* Dart Body */}
            <polygon
              points="0,-10 40,-6 65,0 40,6 0,10"
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Sticky Adhesive Compound Tip */}
            <circle
              cx="65"
              cy="0"
              r="9"
              fill="#f43f5e"
              filter="drop-shadow(0 0 8px #f43f5e)"
            />
            {/* Micro GPS Transmitter Beacon */}
            <circle cx="30" cy="0" r="4" fill="#38bdf8" />
          </g>

          {/* Target Hostile Vehicle Trunk Matrix (Lock Reticle) */}
          <g transform="translate(760, 260)">
            <circle
              cx="0"
              cy="0"
              r="48"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeDasharray="8 6"
            />
            <path
              d="M -20 -35 L -35 -35 L -35 -20 M 20 -35 L 35 -35 L 35 -20 M -20 35 L -35 35 L -35 20 M 20 35 L 35 35 L 35 20"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="4"
            />
            <text
              x="-65"
              y="75"
              fill="#f43f5e"
              fontSize="16"
              fontFamily="monospace"
              fontWeight="900"
            >
              TAG ENGAGED: 100%
            </text>
          </g>
        </svg>

        {/* Telemetry Hardware Specs Card */}
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: 40,
            right: 40,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid #f43f5e88',
            borderRadius: 16,
            padding: '16px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'monospace',
            color: '#f8fafc',
            fontSize: 20,
          }}
        >
          <div>VELOCITY: <span style={{ color: '#38bdf8' }}>420 FT/SEC</span></div>
          <div>COMPOUND: <span style={{ color: '#f43f5e' }}>THERMO-ADHESIVE</span></div>
          <div>GPS REFRESH: <span style={{ color: '#10b981' }}>20Hz LIVE</span></div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ========================================================
// SCENE 4: ORTHOGRAPHIC CITY PERIMETER MATRIX
// ========================================================
function Scene4PerimeterMatrix({ sceneFrame, fps }: { sceneFrame: number; fps: number }) {
  // Police interceptors converging inward
  const convergeProgress = interpolate(sceneFrame, [5, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 920, height: 920 }}>
        <svg width="920" height="920" viewBox="0 0 920 920">
          <defs>
            <radialGradient id="cityGridGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Map Ambient */}
          <rect width="920" height="920" rx="32" fill="#0b1120" stroke="#1e293b" strokeWidth="4" />
          <circle cx="460" cy="460" r="420" fill="url(#cityGridGlow)" />

          {/* Orthographic Urban Street Grid Network */}
          {[140, 300, 460, 620, 780].map((coord, i) => (
            <g key={i}>
              {/* Vertical Avenues */}
              <line
                x1={coord}
                y1="60"
                x2={coord}
                y2="860"
                stroke="#1e3a8a"
                strokeWidth={coord === 460 ? 18 : 12}
                opacity="0.6"
              />
              {/* Horizontal Streets */}
              <line
                x1="60"
                y1={coord}
                x2="860"
                y2={coord}
                stroke="#1e3a8a"
                strokeWidth={coord === 460 ? 18 : 12}
                opacity="0.6"
              />
            </g>
          ))}

          {/* Building Block Silhouettes */}
          {[
            [160, 160], [320, 160], [480, 160], [640, 160],
            [160, 320], [320, 320], [480, 320], [640, 320],
            [160, 480], [320, 480], [480, 480], [640, 480],
            [160, 640], [320, 640], [480, 640], [640, 640],
          ].map(([bx, by], idx) => (
            <rect
              key={idx}
              x={bx}
              y={by}
              width="120"
              height="120"
              rx="12"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
            />
          ))}

          {/* Center Suspect Vehicle Vector (Red Pin fleeing) */}
          <g transform="translate(460, 460)">
            <circle
              cx="0"
              cy="0"
              r="26"
              fill="rgba(244, 63, 94, 0.3)"
              stroke="#f43f5e"
              strokeWidth="3"
            />
            <rect x="-14" y="-22" width="28" height="44" rx="6" fill="#f43f5e" />
            <text
              x="36"
              y="6"
              fill="#f43f5e"
              fontSize="18"
              fontFamily="monospace"
              fontWeight="900"
            >
              FUGITIVE CAR
            </text>
          </g>

          {/* 4 Converging Tactical Cruiser Patrol Pins (Closing all 4 avenues) */}
          {[
            { id: 'North Unit', sx: 460, sy: 120, ex: 460, ey: 330, rot: 180 },
            { id: 'South Unit', sx: 460, sy: 800, ex: 460, ey: 590, rot: 0 },
            { id: 'West Unit', sx: 120, sy: 460, ex: 330, ey: 460, rot: 90 },
            { id: 'East Unit', sx: 800, sy: 460, ex: 590, ey: 460, rot: -90 },
          ].map((u, i) => {
            const curX = interpolate(convergeProgress, [0, 1], [u.sx, u.ex]);
            const curY = interpolate(convergeProgress, [0, 1], [u.sy, u.ey]);
            return (
              <g key={i} transform={`translate(${curX}, ${curY})`}>
                {/* Cruiser Body */}
                <rect
                  x="-16"
                  y="-26"
                  width="32"
                  height="52"
                  rx="7"
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                {/* Flashing Lightbar */}
                <rect
                  x="-10"
                  y="-6"
                  width="20"
                  height="8"
                  rx="2"
                  fill={sceneFrame % 6 < 3 ? '#38bdf8' : '#f43f5e'}
                  filter="drop-shadow(0 0 10px #38bdf8)"
                />
                {/* Convergence Arrow Laser */}
                <line
                  x1="0"
                  y1={u.rot === 180 ? 26 : u.rot === 0 ? -26 : 0}
                  x2={u.rot === 90 ? 35 : u.rot === -90 ? -35 : 0}
                  y2={u.rot === 180 ? 55 : u.rot === 0 ? -55 : 0}
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeDasharray="6 4"
                />
              </g>
            );
          })}

          {/* Hermetic Containment Perimeter Ring */}
          <circle
            cx="460"
            cy="460"
            r={interpolate(convergeProgress, [0, 1], [360, 170])}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeDasharray="14 10"
            filter="drop-shadow(0 0 16px #38bdf8)"
          />
        </svg>

        {/* Tactical Perimeter Status Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: -65,
            left: 30,
            right: 30,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'monospace',
            color: '#38bdf8',
            fontSize: 22,
            fontWeight: 800,
            background: 'rgba(11, 17, 32, 0.95)',
            padding: '16px 28px',
            borderRadius: 16,
            border: '1.5px solid #38bdf888',
          }}
        >
          <span>INTERSECTIONS BLOCKED: 16/16</span>
          <span style={{ color: '#f43f5e' }}>ESCAPES REMAINING: 0</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ========================================================
// SCENE 5: DUAL SPLIT COMPARISON (CHAOS VS CONTAINMENT)
// ========================================================
function Scene5SplitVectorFunnel({ sceneFrame, fps }: { sceneFrame: number; fps: number }) {
  const lineDrawProgress = interpolate(sceneFrame, [5, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 960, height: 860 }}>
        {/* Split Screen Container */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            gap: 24,
          }}
        >
          {/* Left Panel: High-Speed Pursuit Chaos (Failure Mode) */}
          <div
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.9)',
              borderRadius: 24,
              border: '2px solid #f43f5e88',
              padding: 24,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 22,
                fontWeight: 900,
                color: '#f43f5e',
                marginBottom: 16,
                letterSpacing: '0.08em',
              }}
            >
              [TRADITIONAL CHASE]
            </div>

            <svg width="410" height="600" viewBox="0 0 410 600">
              {/* Erratic, chaotic zig-zag pursuit vector line */}
              <path
                d="M 50 500 L 120 420 L 80 340 L 260 280 L 140 180 L 320 100"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="4"
                strokeDasharray="600"
                strokeDashoffset={600 * (1 - lineDrawProgress)}
              />
              {/* Crash Risk Hazard Zones */}
              <circle cx="260" cy="280" r="30" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="2" strokeDasharray="6 4" />
              <circle cx="140" cy="180" r="30" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="2" strokeDasharray="6 4" />

              <text x="70" y="550" fill="#f8fafc" fontSize="16" fontFamily="sans-serif" fontWeight="700">
                HIGH SPEED BLIND HAZARDS
              </text>
              <text x="70" y="575" fill="#f43f5e" fontSize="15" fontFamily="monospace">
                RISK FACTOR: EXTREME
              </text>
            </svg>
          </div>

          {/* Right Panel: Coordinated Perimeter Funnel (Modern Police Science) */}
          <div
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.9)',
              borderRadius: 24,
              border: '2px solid #38bdf888',
              padding: 24,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 22,
                fontWeight: 900,
                color: '#38bdf8',
                marginBottom: 16,
                letterSpacing: '0.08em',
              }}
            >
              [PREDICTIVE CONTAINMENT]
            </div>

            <svg width="410" height="600" viewBox="0 0 410 600">
              {/* Funnel Trap Vector Walls */}
              <path
                d="M 40 100 L 170 380 M 370 100 L 240 380"
                stroke="#38bdf8"
                strokeWidth="5"
                strokeDasharray="500"
                strokeDashoffset={500 * (1 - lineDrawProgress)}
              />
              {/* Funnel Dead-End Box Trap */}
              <rect
                x="150"
                y="380"
                width="110"
                height="80"
                rx="12"
                fill="rgba(56, 189, 248, 0.3)"
                stroke="#38bdf8"
                strokeWidth="3"
              />
              <text x="175" y="428" fill="#ffffff" fontSize="18" fontWeight="bold">
                TRAP
              </text>

              {/* Controlled Gentle Deceleration Route */}
              <line
                x1="205"
                y1="120"
                x2="205"
                y2="380"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray="10 6"
              />

              <text x="70" y="550" fill="#f8fafc" fontSize="16" fontFamily="sans-serif" fontWeight="700">
                AUTOMATED STREET SEALS
              </text>
              <text x="70" y="575" fill="#10b981" fontSize="15" fontFamily="monospace">
                INJURY RATE: 0.0%
              </text>
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ========================================================
// SCENE 6: 360 LOCKDOWN CONTAINMENT CLAMP
// ========================================================
function Scene6ContainmentClamp({ sceneFrame, fps }: { sceneFrame: number; fps: number }) {
  // Clamp lock inward spring
  const clampSpring = spring({
    frame: sceneFrame,
    fps,
    config: { damping: 10, stiffness: 180 },
  });

  const clampRadius = interpolate(clampSpring, [0, 1], [380, 130]);
  const bracketFlashing = (Math.sin(sceneFrame * 0.3) + 1) * 0.5;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 900, height: 900 }}>
        <svg width="900" height="900" viewBox="0 0 900 900">
          <defs>
            <radialGradient id="clampRedGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Central Ambience */}
          <circle cx="450" cy="450" r="400" fill="url(#clampRedGlow)" />

          {/* Collapsing Containment Ring */}
          <circle
            cx="450"
            cy="450"
            r={clampRadius}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="8"
            filter="drop-shadow(0 0 25px #f43f5e)"
          />

          {/* 4 Inward Precision Tactical Lock Brackets */}
          {[0, 90, 180, 270].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 450 450)`}>
              <path
                d={`M ${450 - 50} ${450 - clampRadius - 35} L ${450} ${450 - clampRadius} L ${450 + 50} ${450 - clampRadius - 35}`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
                opacity={bracketFlashing > 0.3 ? 1 : 0.4}
              />
              <line
                x1="450"
                y1={450 - clampRadius}
                x2="450"
                y2={450 - clampRadius - 80}
                stroke="#f43f5e"
                strokeWidth="4"
              />
            </g>
          ))}

          {/* Central Cornered Suspect Vehicle (Static, Blocked) */}
          <g transform="translate(450, 450)">
            <rect
              x="-24"
              y="-40"
              width="48"
              height="80"
              rx="10"
              fill="#0f172a"
              stroke="#f43f5e"
              strokeWidth="4"
            />
            {/* Flashing Hazard Blinkers */}
            <circle cx="-16" cy="-32" r="5" fill="#f59e0b" />
            <circle cx="16" cy="-32" r="5" fill="#f59e0b" />
            <circle cx="-16" cy="32" r="5" fill="#f43f5e" />
            <circle cx="16" cy="32" r="5" fill="#f43f5e" />
          </g>

          {/* Giant Hexagonal Security Barricade Warnings */}
          {[...Array(6)].map((_, i) => {
            const angle = (i * 60 * Math.PI) / 180;
            const x = 450 + 290 * Math.cos(angle);
            const y = 450 + 290 * Math.sin(angle);
            return (
              <g key={i} transform={`translate(${x}, ${y})`}>
                <polygon
                  points="0,-25 22,-12 22,12 0,25 -22,12 -22,-12"
                  fill="#0f172a"
                  stroke="#f43f5e"
                  strokeWidth="3"
                />
                <text
                  x="0"
                  y="6"
                  fill="#f43f5e"
                  fontSize="16"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  X
                </text>
              </g>
            );
          })}
        </svg>

        {/* Final Status Punch Box */}
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: 50,
            right: 50,
            background: 'rgba(244, 63, 94, 0.95)',
            borderRadius: 16,
            padding: '18px 32px',
            textAlign: 'center',
            boxShadow: '0 0 35px rgba(244, 63, 94, 0.5)',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: 26,
              fontWeight: 900,
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
            }}
          >
            [!] SUSPECT VEHICLE IMMOBILIZED // ARREST CONFIRMED
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ========================================================
// SCENE 7: BITTRIX TECHNOLOGIES ROYAL OUTRO COMPONENT
// ========================================================
// Grounded precisely in /home/eswaran/Downloads/bittrix-reel(1).html:
// - Warm cream #fdf3d0 canvas
// - Royal purple #5b1a78 & #9a4cc2
// - 6-point radial gradient hexagon with spoke circles
// - Rolling chain link track around perimeter
// - Rotating 12-tooth gear with serif 'B'
// - Staggered letter elastic italic bold "BITTRIX" wordmark
// - Tracking "TECHNOLOGIES" subtitle + purple underline bar
// - Diagonal light sweep shine
// ========================================================
function BittrixRoyalOutro({ frame, fps }: { frame: number; fps: number }) {
  // Convert frame to seconds for exact formula alignment (t in seconds)
  const t = frame / fps;

  // Easing helpers matching reference HTML
  const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (val: number, a: number, b: number) => cl((val - a) / (b - a));
  const eo = (u: number) => 1 - Math.pow(1 - u, 3);
  const eb = (u: number) => {
    const s = 1.70158;
    u -= 1;
    return u * u * ((s + 1) * u + s) + 1;
  };

  // 1. Hexagon entry scale and rotation
  const hs = eb(seg(t, 0, 0.7));
  const hexRot = (1 - eo(seg(t, 0, 0.8))) * -60.16; // -1.05 radians in degrees

  // 2. Rolling chain track visibility
  const chainAlpha = seg(t, 0.3, 0.6) * (1 - seg(t, 2, 2.45));
  const chainPhase = 0.6 * t + 0.25 * t * t;
  const numLinks = 42;

  // 3. 12-tooth Gear + 'B' scale and rotation
  const gearScale = eb(seg(t, 0.6, 1.3));
  const gearRot = (t * 2.2 * 180) / Math.PI;

  // 4. Wordmark "BITTRIX" letters
  const bittrixLetters = 'BITTRIX'.split('');

  // 5. "TECHNOLOGIES" subtitle
  const techAlpha = eo(seg(t, 1.9, 2.5));
  const techSpacing = 10 + 16 * techAlpha;

  // 6. Expanding Underline Bar
  const underlineWidth = 520 * eo(seg(t, 2.1, 2.6));

  // 7. Diagonal Light Sweep
  const sweepProgress = seg(t, 2.35, 2.95);
  const sweepPos = -400 + (1080 + 800) * sweepProgress;

  // Karaoke timestamps for Scene 7 narration:
  // "Follow Bittrix Technologies for more interesting concepts."
  const outroSceneWords: WordTimestamp[] = SCENES[6].words;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#fdf3d0',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Radial Warm Glow Gradient Background */}
      <div
        style={{
          position: 'absolute',
          width: 1080,
          height: 1920,
          background: 'radial-gradient(circle at 540px 720px, #fff9e2 0%, #fdf3d0 100%)',
        }}
      />

      {/* SVG Canvas for Hexagon, Spokes, Rolling Chain & 12-Tooth Gear */}
      <svg
        width="1080"
        height="1920"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="rgba(91, 26, 120, 0.35)" />
          </filter>
        </defs>

        {/* Rolling Chain Links Around Hexagon Perimeter */}
        {chainAlpha > 0.01 && (
          <g opacity={chainAlpha}>
            {[...Array(numLinks)].map((_, k) => {
              const e = (((k / numLinks + chainPhase) % 1) * 6);
              const i = Math.floor(e);
              const f = e - i;
              const A = CH[i];
              const B = CH[(i + 1) % 6];
              const curX = A[0] + (B[0] - A[0]) * f;
              const curY = A[1] + (B[1] - A[1]) * f;
              const linkAngle = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;

              return (
                <g key={k} transform={`translate(${curX}, ${curY}) rotate(${linkAngle})`}>
                  {k % 2 === 1 ? (
                    <rect
                      x="-9"
                      y="-9"
                      width="18"
                      height="18"
                      rx="6"
                      fill="#5b1a78"
                    />
                  ) : (
                    <rect
                      x="-21"
                      y="-11"
                      width="42"
                      height="22"
                      rx="11"
                      fill="none"
                      stroke="#5b1a78"
                      strokeWidth="6"
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* Royal Purple Hexagon Face */}
        <g
          transform={`translate(${BITTRIX_CX}, ${BITTRIX_CY}) rotate(${hexRot}) scale(${hs})`}
        >
          <polygon
            points={HX.map((p) => `${p[0]},${p[1]}`).join(' ')}
            fill="#5b1a78"
            filter="url(#purpleGlow)"
          />
        </g>

        {/* Spokes + Floating Satellite Nodes */}
        {NODES.map((n, i) => {
          const spokeProgress = eo(seg(t, 0.5 + i * 0.12, 1.0 + i * 0.12));
          const ex = n[0] + (BITTRIX_CX - n[0]) * 0.5 * spokeProgress;
          const ey = n[1] + (BITTRIX_CY - n[1]) * 0.5 * spokeProgress;

          const nodeScale = eb(seg(t, 0.5 + i * 0.12, 0.9 + i * 0.12)) * (1 + 0.07 * Math.sin(t * 7 + i));

          return (
            <g key={i}>
              <line
                x1={n[0]}
                y1={n[1]}
                x2={ex}
                y2={ey}
                stroke="#5b1a78"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <circle
                cx={n[0]}
                cy={n[1]}
                r={36 * nodeScale}
                fill="#5b1a78"
                stroke="#9a4cc2"
                strokeWidth="7"
              />
            </g>
          );
        })}

        {/* Rotating 12-Tooth Gear with Serif 'B' */}
        <g
          transform={`translate(${BITTRIX_CX}, ${BITTRIX_CY}) scale(${gearScale})`}
        >
          <g transform={`rotate(${gearRot})`}>
            <path d={GEAR_PATH_D} fill="#fdf3d0" />
          </g>
          <circle cx="0" cy="0" r="76" fill="#5b1a78" />
          <text
            x="0"
            y="42"
            fill="#fdf3d0"
            fontSize="130"
            fontWeight="700"
            fontFamily="Georgia, serif"
            textAnchor="middle"
          >
            B
          </text>
        </g>
      </svg>

      {/* Wordmark: BITTRIX (Staggered elastic bold italic letters) */}
      <div
        style={{
          position: 'absolute',
          top: 1040,
          left: 0,
          width: 1080,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          fontFamily: '"Arial Black", Impact, Arial, sans-serif',
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 168,
          color: '#5b1a78',
          letterSpacing: '-0.02em',
        }}
      >
        {bittrixLetters.map((l, i) => {
          const letterProgress = eo(seg(t, 1.4 + i * 0.07, 1.9 + i * 0.07));
          const offsetX = (1 - letterProgress) * -110;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: letterProgress,
                transform: `translateX(${offsetX}px)`,
              }}
            >
              {l}
            </span>
          );
        })}
      </div>

      {/* Subtitle: TECHNOLOGIES (Tracking spacing expansion) */}
      <div
        style={{
          position: 'absolute',
          top: 1225,
          left: 0,
          width: 1080,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: techAlpha,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 500,
          fontSize: 46,
          color: '#1d1a1a',
          letterSpacing: `${techSpacing}px`,
        }}
      >
        TECHNOLOGIES
      </div>

      {/* Expanding Royal Purple Underline Bar */}
      <div
        style={{
          position: 'absolute',
          top: 1316,
          left: (1080 - underlineWidth) / 2,
          width: underlineWidth,
          height: 7,
          backgroundColor: '#5b1a78',
          borderRadius: 4,
        }}
      />

      {/* Diagonal Light Sweep Shine Effect */}
      {sweepProgress > 0.01 && sweepProgress < 0.99 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1080,
            height: 1920,
            background: `linear-gradient(110deg, transparent ${sweepPos - 140}px, rgba(255, 255, 255, 0.45) ${sweepPos}px, transparent ${sweepPos + 140}px)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Spoken Voice Karaoke Captions for Scene 7 Outro */}
      <div
        style={{
          position: 'absolute',
          bottom: 180,
          left: 60,
          right: 60,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px 18px',
          background: 'rgba(91, 26, 120, 0.08)',
          border: '1.5px solid rgba(91, 26, 120, 0.25)',
          padding: '22px 34px',
          borderRadius: 24,
        }}
      >
        {outroSceneWords.map((w, idx) => {
          const isSpoken = frame >= w.startFrame && frame <= w.endFrame;
          const hasBeenSpoken = frame > w.endFrame;

          return (
            <span
              key={idx}
              style={{
                fontSize: 42,
                fontWeight: 900,
                color: isSpoken ? '#5b1a78' : hasBeenSpoken ? '#1d1a1a' : 'rgba(91, 26, 120, 0.35)',
                transform: isSpoken ? 'scale(1.2)' : 'scale(1)',
                transformOrigin: '50% 80%',
                display: 'inline-block',
                textShadow: isSpoken ? '0 0 20px rgba(91, 26, 120, 0.4)' : 'none',
                transition: 'all 0.1s ease',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}