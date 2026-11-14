import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import {
  GlassCard,
  LaserBusLine,
  TelemetryPill,
  NetworkNodes,
  MetricBar,
  KineticTitle,
} from '../../components/MotionElements';
import { SyncCaptions } from '../../components/SyncCaptions';
import { BittrixOutroExact } from '../../components/BittrixOutroExact';

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
    role: "hook",
    durationInFrames: 107,
    duration_sec: 3.57,
    narration: "Can quantum atoms replace GPS?",
    on_screen_text: "Lost Without Satellite GPS Signals?",
    visual_direction: "Centered reticle HUD with dramatic particle field push-in and pulsing crosshairs",
    template: "question-hook",
    themeColor: "#f43f5e",
    words: [
      { word: "Can", startFrame: 0, endFrame: 18 },
      { word: "quantum", startFrame: 19, endFrame: 38 },
      { word: "atoms", startFrame: 39, endFrame: 58 },
      { word: "replace", startFrame: 59, endFrame: 78 },
      { word: "GPS?", startFrame: 79, endFrame: 105 }
    ]
  },
  {
    scene_number: 2,
    role: "body",
    durationInFrames: 102,
    duration_sec: 3.4,
    narration: "Lasers trap cold rubidium atoms.",
    on_screen_text: "Laser Trapped Cold Atoms",
    visual_direction: "Macro 3D-styled cross-section of a hexagonal titanium vacuum chamber with laser beams converging",
    template: "hero-object",
    themeColor: "#38bdf8",
    words: [
      { word: "Lasers", startFrame: 0, endFrame: 18 },
      { word: "trap", startFrame: 19, endFrame: 36 },
      { word: "cold", startFrame: 37, endFrame: 54 },
      { word: "rubidium", startFrame: 55, endFrame: 76 },
      { word: "atoms.", startFrame: 77, endFrame: 100 }
    ]
  },
  {
    scene_number: 3,
    role: "body",
    durationInFrames: 104,
    duration_sec: 3.47,
    narration: "Wave interference tracks subtle motion.",
    on_screen_text: "Interferometry Tracks Motion",
    visual_direction: "Three horizontal sequential stages illustrating the laser pulse interferometer pipeline",
    template: "steps-numbered",
    themeColor: "#f43f5e",
    words: [
      { word: "Wave", startFrame: 0, endFrame: 18 },
      { word: "interference", startFrame: 19, endFrame: 44 },
      { word: "tracks", startFrame: 45, endFrame: 62 },
      { word: "subtle", startFrame: 63, endFrame: 80 },
      { word: "motion.", startFrame: 81, endFrame: 102 }
    ]
  },
  {
    scene_number: 4,
    role: "body",
    durationInFrames: 99,
    duration_sec: 3.3,
    narration: "Standard signals fail underground.",
    on_screen_text: "GPS Blackout Versus Quantum",
    visual_direction: "Split viewport with jammed radio waves on left and solid quantum matter beams on right",
    template: "split-compare",
    themeColor: "#38bdf8",
    words: [
      { word: "Standard", startFrame: 0, endFrame: 22 },
      { word: "signals", startFrame: 23, endFrame: 45 },
      { word: "fail", startFrame: 46, endFrame: 66 },
      { word: "underground.", startFrame: 67, endFrame: 97 }
    ]
  },
  {
    scene_number: 5,
    role: "body",
    durationInFrames: 105,
    duration_sec: 3.5,
    narration: "Gravity mapping pinpoints hidden terrain.",
    on_screen_text: "Mapping Subsurface Anomalies",
    visual_direction: "Topographic contour map with glowing target pin locking onto a subterranean density gradient",
    template: "map-pin",
    themeColor: "#f43f5e",
    words: [
      { word: "Gravity", startFrame: 0, endFrame: 18 },
      { word: "mapping", startFrame: 19, endFrame: 38 },
      { word: "pinpoints", startFrame: 39, endFrame: 60 },
      { word: "hidden", startFrame: 61, endFrame: 80 },
      { word: "terrain.", startFrame: 81, endFrame: 103 }
    ]
  },
  {
    scene_number: 6,
    role: "body",
    durationInFrames: 105,
    duration_sec: 3.5,
    narration: "Accuracy reaches ninety-nine percent.",
    on_screen_text: "Zero Inertial Navigation Drift",
    visual_direction: "Prominent circular radial gauge dial filling from 0% to 99% with glowing cyan telemetry badges",
    template: "stat-callout",
    themeColor: "#38bdf8",
    words: [
      { word: "Accuracy", startFrame: 0, endFrame: 22 },
      { word: "reaches", startFrame: 23, endFrame: 44 },
      { word: "ninety-nine", startFrame: 45, endFrame: 74 },
      { word: "percent.", startFrame: 75, endFrame: 103 }
    ]
  },
  {
    scene_number: 7,
    role: "cta",
    durationInFrames: 134,
    duration_sec: 4.47,
    narration: "Follow Bittrix Technologies for more.",
    on_screen_text: "Follow Bittrix Technologies Today",
    visual_direction: "Geometric tech nexus emblem pulsing with quantum cyan and magenta radiation waves with bold follow action badge",
    template: "cta-outro",
    themeColor: "#a855f7",
    words: [
      { word: "Follow", startFrame: 0, endFrame: 16 },
      { word: "Bittrix", startFrame: 17, endFrame: 36 },
      { word: "Technologies", startFrame: 37, endFrame: 68 },
      { word: "for", startFrame: 69, endFrame: 84 },
      { word: "more.", startFrame: 85, endFrame: 110 }
    ]
  }
];

export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Compute scene timeline offsets
  const sceneOffsets = useMemo(() => {
    let acc = 0;
    return SCENES.map((scene) => {
      const start = acc;
      acc += scene.durationInFrames;
      return { ...scene, startFrame: start, endFrame: acc };
    });
  }, []);

  // Determine current active scene
  const activeSceneIndex = useMemo(() => {
    const idx = sceneOffsets.findIndex(
      (s) => frame >= s.startFrame && frame < s.endFrame
    );
    return idx === -1 ? sceneOffsets.length - 1 : idx;
  }, [frame, sceneOffsets]);

  const activeScene = sceneOffsets[activeSceneIndex];
  const sceneLocalFrame = Math.max(0, frame - activeScene.startFrame);

  // Global continuous camera kinematics
  const camScale = interpolate(
    frame,
    [0, 107, 209, 313, 412, 517, 622, 756],
    [1.0, 1.05, 1.02, 1.06, 1.03, 1.07, 1.04, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camY = interpolate(
    frame,
    [0, 107, 209, 313, 412, 517, 622, 756],
    [0, -15, 10, -10, 15, -12, 8, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camRotate = interpolate(
    Math.sin(frame * 0.025),
    [-1, 1],
    [-0.5, 0.5]
  );

  // Scene transition smooth spring factor
  const sceneEntranceSpring = spring({
    frame: sceneLocalFrame,
    fps,
    config: { damping: 14, stiffness: 130 }
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* CONTINUOUS DEEP QUANTUM SPACE CANVAS */}
      <div
        style={{
          position: 'absolute',
          inset: -100,
          transform: `translate3d(0px, ${camY}px, 0px) scale(${camScale}) rotate(${camRotate}deg)`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
      >
        {/* Dynamic Quantum Glow Orbs */}
        <div
          style={{
            position: 'absolute',
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${activeScene.themeColor}33 0%, transparent 70%)`,
            left: 200 + Math.sin(frame * 0.03) * 120,
            top: 400 + Math.cos(frame * 0.025) * 100,
            filter: 'blur(90px)',
            opacity: 0.85,
            transition: 'background 0.8s ease',
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: 800,
            height: 800,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, transparent 70%)',
            right: 150 + Math.cos(frame * 0.02) * 90,
            top: 750 + Math.sin(frame * 0.035) * 130,
            filter: 'blur(110px)',
            opacity: 0.7,
          }}
        />

        {/* Ambient Tech Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '90px 90px',
            opacity: 0.65,
          }}
        />
      </div>

      {/* TOP STATUS HEADER & TELEMETRY */}
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50,
        }}
      >
        <TelemetryPill
          label="QUANTUM INERTIAL SYSTEM"
          value={`Q-STAGE 0${activeScene.scene_number}`}
          color={activeScene.themeColor}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 16px',
            borderRadius: 999,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: 18,
            letterSpacing: 2,
            fontFamily: 'monospace',
            color: '#94a3b8',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              boxShadow: '0 0 12px #22c55e',
            }}
          />
          GNSS INDEPENDENT
        </div>
      </div>

      {/* DYNAMIC SCENE CONTENT (MIDDLE FOCUS ZONE: Top 220px to 1420px) */}
      <div
        style={{
          position: 'absolute',
          top: 210,
          left: 60,
          right: 60,
          bottom: 430,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
        }}
      >
        {/* SCENE 1: QUESTION HOOK - RETICLE HUD */}
        {activeScene.scene_number === 1 && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: sceneEntranceSpring,
              transform: `scale(${interpolate(sceneEntranceSpring, [0, 1], [0.92, 1])})`,
            }}
          >
            <KineticTitle
              title="THE QUANTUM COMPASS"
              subtitle="CAN ATOMS REPLACE GPS SATELLITES?"
              badgeText="DRIFT-FREE NAVIGATION"
              accentColor="#f43f5e"
            />

            <div
              style={{
                position: 'relative',
                width: 520,
                height: 520,
                marginTop: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Rotating Concentric Reticles */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px dashed rgba(244, 63, 94, 0.4)',
                  transform: `rotate(${frame * 0.8}deg)`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '75%',
                  height: '75%',
                  borderRadius: '50%',
                  border: '2px solid rgba(244, 63, 94, 0.25)',
                  boxShadow: '0 0 35px rgba(244, 63, 94, 0.25)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '45%',
                  height: '45%',
                  borderRadius: '50%',
                  border: '1px solid rgba(56, 189, 248, 0.6)',
                  transform: `rotate(${-frame * 1.2}deg)`,
                }}
              />

              {/* Pulsing Crosshair */}
              <div
                style={{
                  position: 'absolute',
                  width: '120%',
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, #f43f5e, transparent)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  height: '120%',
                  width: 2,
                  background: 'linear-gradient(180deg, transparent, #f43f5e, transparent)',
                }}
              />

              {/* Orbiting Quantum Wave Particles */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * Math.PI) / 4 + frame * 0.05;
                const r = 180 + Math.sin(frame * 0.08 + i) * 20;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      backgroundColor: i % 2 === 0 ? '#f43f5e' : '#38bdf8',
                      boxShadow: `0 0 16px ${i % 2 === 0 ? '#f43f5e' : '#38bdf8'}`,
                      transform: `translate(${Math.cos(angle) * r}px, ${Math.sin(angle) * r}px)`,
                    }}
                  />
                );
              })}

              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: 4,
                  textShadow: '0 0 20px #f43f5e',
                  zIndex: 2,
                }}
              >
                NO SATELLITE
              </div>
            </div>
          </div>
        )}

        {/* SCENE 2: HERO OBJECT - RUBIDIUM VACUUM CHAMBER */}
        {activeScene.scene_number === 2 && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: sceneEntranceSpring,
            }}
          >
            <KineticTitle
              title="MAGNETO-OPTICAL TRAP"
              subtitle="COOLING RUBIDIUM-87 TO MICROKELVIN"
              badgeText="CRYOGENIC LASER TRAPPING"
              accentColor="#38bdf8"
            />

            <div
              style={{
                position: 'relative',
                width: 580,
                height: 520,
                marginTop: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Hexagonal Titanium Chamber Body */}
              <div
                style={{
                  width: 440,
                  height: 440,
                  borderRadius: 60,
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '4px solid #38bdf8',
                  boxShadow: '0 0 60px rgba(56, 189, 248, 0.35)',
                  transform: `rotate(${Math.sin(frame * 0.02) * 5}deg)`,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* 6 Converging Laser Beams */}
                {Array.from({ length: 6 }).map((_, i) => {
                  const deg = i * 60;
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        width: 240,
                        height: 4,
                        background: 'linear-gradient(90deg, #38bdf8, transparent)',
                        transformOrigin: 'left center',
                        transform: `rotate(${deg}deg)`,
                        boxShadow: '0 0 15px #38bdf8',
                      }}
                    />
                  );
                })}

                {/* Central Trapped Rubidium Cloud */}
                <div
                  style={{
                    width: 70 + Math.sin(frame * 0.15) * 15,
                    height: 70 + Math.sin(frame * 0.15) * 15,
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 50px 20px #38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: '#0f172a',
                      fontFamily: 'monospace',
                    }}
                  >
                    87Rb
                  </span>
                </div>
              </div>

              {/* Chamber Metric Badges */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -30,
                  display: 'flex',
                  gap: 16,
                }}
              >
                <GlassCard style={{ padding: '12px 24px' }}>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>VACUUM PRESSURE</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#38bdf8' }}>10⁻¹¹ TORR</div>
                </GlassCard>
                <GlassCard style={{ padding: '12px 24px' }}>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>TEMPERATURE</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#f43f5e' }}>2.4 µK</div>
                </GlassCard>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 3: ATOM INTERFEROMETRY PIPELINE */}
        {activeScene.scene_number === 3 && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: sceneEntranceSpring,
            }}
          >
            <KineticTitle
              title="ATOM INTERFEROMETRY"
              subtitle="WAVE-PARTICLE DUALITY SENSING"
              badgeText="RAMAN PULSE SEQUENCE"
              accentColor="#f43f5e"
            />

            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                marginTop: 40,
              }}
            >
              {[
                { step: '01', title: 'BEAMSPLITTER PULSE (π/2)', desc: 'Coherent atomic wavepacket splits in superposed states' },
                { step: '02', title: 'MIRROR PULSE (π)', desc: 'Inverts trajectories and encodes gravitational acceleration' },
                { step: '03', title: 'RECOMBINER PULSE (π/2)', desc: 'Interference fringes measure spatial displacement' },
              ].map((item, idx) => {
                const stepDelay = idx * 10;
                const isCurrent = sceneLocalFrame > stepDelay;
                return (
                  <GlassCard
                    key={idx}
                    style={{
                      padding: 24,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 20,
                      borderColor: isCurrent ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                      transform: `translateX(${interpolate(
                        sceneLocalFrame - stepDelay,
                        [0, 15],
                        [40, 0],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                      )}px)`,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: '#f43f5e',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        fontWeight: 900,
                        boxShadow: '0 0 20px rgba(244, 63, 94, 0.5)',
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.4 }}>
                        {item.desc}
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            <div style={{ width: '100%', marginTop: 24 }}>
              <LaserBusLine active={true} color="#f43f5e" />
            </div>
          </div>
        )}

        {/* SCENE 4: SPLIT COMPARISON - GPS BLACKOUT VS QUANTUM */}
        {activeScene.scene_number === 4 && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: sceneEntranceSpring,
            }}
          >
            <KineticTitle
              title="ENVIRONMENT RESILIENCE"
              subtitle="NO VULNERABILITY TO SPOOFING OR SHIELDING"
              badgeText="DEEP SUBTERRANEAN TEST"
              accentColor="#38bdf8"
            />

            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
                marginTop: 40,
                height: 500,
              }}
            >
              {/* Left Column: SATELLITE GPS FAIL */}
              <GlassCard
                style={{
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, color: '#ef4444', fontWeight: 800, letterSpacing: 2 }}>
                    LEGACY RF GPS
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginTop: 6 }}>
                    SIGNAL BLOCKED
                  </div>
                </div>

                <div
                  style={{
                    position: 'relative',
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    border: '3px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <span style={{ fontSize: 56, color: '#ef4444', fontWeight: 900 }}>✕</span>
                </div>

                <div style={{ fontSize: 16, color: '#fda4af', textAlign: 'center' }}>
                  Tunnel & Sub-Sea Blackout
                  <br />
                  Susceptible to EW Jamming
                </div>
              </GlassCard>

              {/* Right Column: QUANTUM COMPASS LOCK */}
              <GlassCard
                style={{
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  backgroundColor: 'rgba(56, 189, 248, 0.07)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, color: '#38bdf8', fontWeight: 800, letterSpacing: 2 }}>
                    QUANTUM ATOM
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginTop: 6 }}>
                    100% AUTONOMOUS
                  </div>
                </div>

                <div
                  style={{
                    position: 'relative',
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    border: '3px solid #38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 35px rgba(56, 189, 248, 0.5)',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      backgroundColor: '#38bdf8',
                      boxShadow: '0 0 20px #38bdf8',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      border: '2px dashed #38bdf8',
                      transform: `rotate(${frame * 2}deg)`,
                    }}
                  />
                </div>

                <div style={{ fontSize: 16, color: '#7dd3fc', textAlign: 'center' }}>
                  Zero External Signals
                  <br />
                  Unjammable Physics Vector
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* SCENE 5: TOPOGRAPHIC GRAVIMETRY MAP PIN */}
        {activeScene.scene_number === 5 && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: sceneEntranceSpring,
            }}
          >
            <KineticTitle
              title="GRAVIMETRIC GRADIENT"
              subtitle="REAL-TIME EARTH CRUST ANOMALY CORRELATION"
              badgeText="QUANTUM GRAVIMETER"
              accentColor="#f43f5e"
            />

            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 480,
                marginTop: 40,
                borderRadius: 30,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Synthetic Subsurface Contour Rings */}
              {Array.from({ length: 5 }).map((_, i) => {
                const size = 150 + i * 90;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: size,
                      height: size * 0.7,
                      borderRadius: '50%',
                      border: `1.5px solid rgba(244, 63, 94, ${0.45 - i * 0.08})`,
                      transform: `rotate(${i * 12 + frame * 0.2}deg)`,
                    }}
                  />
                );
              })}

              {/* Pin Locking Animation */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: `translateY(${Math.sin(frame * 0.1) * 8}px)`,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#f43f5e',
                    border: '4px solid #ffffff',
                    boxShadow: '0 0 35px #f43f5e',
                  }}
                />
                <div
                  style={{
                    width: 4,
                    height: 50,
                    backgroundColor: '#f43f5e',
                    boxShadow: '0 0 15px #f43f5e',
                  }}
                />
                <div
                  style={{
                    padding: '8px 18px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    border: '1px solid #f43f5e',
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 700,
                    marginTop: 8,
                    letterSpacing: 1.5,
                  }}
                >
                  9.80665 m/s² MATCHED
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 6: STAT CALLOUT - 99% ACCURACY GAUGE */}
        {activeScene.scene_number === 6 && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: sceneEntranceSpring,
            }}
          >
            <KineticTitle
              title="LONG-HAUL PRECISION"
              subtitle="ELIMINATING SENSOR DRIFT OVER THOUSANDS OF MILES"
              badgeText="BENCHMARK VERIFIED"
              accentColor="#38bdf8"
            />

            <div
              style={{
                position: 'relative',
                width: 420,
                height: 420,
                marginTop: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Radial Dial Indicator */}
              <svg width="400" height="400" viewBox="0 0 400 400">
                <circle
                  cx="200"
                  cy="200"
                  r="160"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="24"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="160"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="24"
                  strokeDasharray={2 * Math.PI * 160}
                  strokeDashoffset={
                    2 * Math.PI * 160 * (1 - interpolate(sceneLocalFrame, [0, 60], [0, 0.99], { extrapolateRight: 'clamp' }))
                  }
                  strokeLinecap="round"
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center center',
                    filter: 'drop-shadow(0 0 20px #38bdf8)',
                  }}
                />
              </svg>

              {/* Central Dynamic Counter */}
              <div
                style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 84,
                    fontWeight: 900,
                    letterSpacing: -2,
                    color: '#ffffff',
                    textShadow: '0 0 30px #38bdf8',
                  }}
                >
                  {Math.round(interpolate(sceneLocalFrame, [0, 60], [10, 99], { extrapolateRight: 'clamp' }))}%
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#38bdf8',
                    letterSpacing: 3,
                  }}
                >
                  DRIFT SUPPRESSION
                </div>
              </div>
            </div>

            <div style={{ width: '90%', marginTop: 30 }}>
              <MetricBar
                label="QUANTUM SENSITIVITY COEFFICIENT"
                value={99}
                maxValue={100}
                color="#38bdf8"
              />
            </div>
          </div>
        )}

        {/* SCENE 7: CTA OUTRO - BITTRIX TECHNOLOGIES */}
        {activeScene.scene_number === 7 && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: sceneEntranceSpring,
            }}
          >
            {/* Seamless Bittrix Technologies Outro */}
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <BittrixOutroExact />
            </div>
          </div>
        )}
      </div>

      {/* SYNCHRONIZED KINETIC CAPTIONS IN SAFE ZONE (Bottom > 380px) */}
      {activeScene.scene_number !== 7 && (
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: 50,
            right: 50,
            minHeight: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
        >
          <SyncCaptions
            words={activeScene.words}
            currentFrame={sceneLocalFrame}
            accentColor={activeScene.themeColor}
          />
        </div>
      )}
    </AbsoluteFill>
  );
}