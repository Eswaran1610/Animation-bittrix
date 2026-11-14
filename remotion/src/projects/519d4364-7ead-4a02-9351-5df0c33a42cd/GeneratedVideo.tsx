import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  TerminalWindow,
  GlassCard,
  LaserBusLine,
  GitCommitGraph,
  TelemetryPill,
  NetworkNodes,
  MetricBar,
  KineticTitle,
} from '../../components/MotionElements';
import { SyncCaptions } from '../../components/SyncCaptions';
import { BittrixOutroExact } from '../../components/BittrixOutroExact';

interface WordCue {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface SceneData {
  scene_number: number;
  role: string;
  startFrame: number;
  durationInFrames: number;
  narration: string;
  on_screen_text: string;
  themeColor: string;
  cam: { x: number; y: number; scale: number; rot: number };
  words: WordCue[];
}

const SCENES: SceneData[] = [
  {
    scene_number: 1,
    role: 'hook',
    startFrame: 0,
    durationInFrames: 94,
    narration: 'What if letters were living toys?',
    on_screen_text: 'Can Letters Come Alive?',
    themeColor: '#f43f5e',
    cam: { x: 0, y: 0, scale: 1.0, rot: 0 },
    words: [
      { word: 'What', startFrame: 3, endFrame: 8 },
      { word: 'if', startFrame: 9, endFrame: 12 },
      { word: 'letters', startFrame: 12, endFrame: 23 },
      { word: 'were', startFrame: 23, endFrame: 27 },
      { word: 'living', startFrame: 27, endFrame: 36 },
      { word: 'toys?', startFrame: 36, endFrame: 55 },
    ],
  },
  {
    scene_number: 2,
    role: 'body',
    startFrame: 94,
    durationInFrames: 114,
    narration: 'Inside this box, an island awakens.',
    on_screen_text: 'A Secret Island Awakens',
    themeColor: '#38bdf8',
    cam: { x: -60, y: -40, scale: 1.15, rot: -1.2 },
    words: [
      { word: 'Inside', startFrame: 3, endFrame: 17 },
      { word: 'this', startFrame: 17, endFrame: 22 },
      { word: 'box,', startFrame: 22, endFrame: 36 },
      { word: 'an', startFrame: 39, endFrame: 43 },
      { word: 'island', startFrame: 44, endFrame: 53 },
      { word: 'awakens.', startFrame: 53, endFrame: 75 },
    ],
  },
  {
    scene_number: 3,
    role: 'body',
    startFrame: 208,
    durationInFrames: 94,
    narration: 'A bounces onto a juicy apple.',
    on_screen_text: 'Letter A Meets Apple',
    themeColor: '#f43f5e',
    cam: { x: 50, y: -20, scale: 1.25, rot: 1.0 },
    words: [
      { word: 'A', startFrame: 3, endFrame: 7 },
      { word: 'bounces', startFrame: 7, endFrame: 20 },
      { word: 'onto', startFrame: 20, endFrame: 27 },
      { word: 'a', startFrame: 28, endFrame: 30 },
      { word: 'juicy', startFrame: 30, endFrame: 41 },
      { word: 'apple.', startFrame: 42, endFrame: 55 },
    ],
  },
  {
    scene_number: 4,
    role: 'body',
    startFrame: 302,
    durationInFrames: 84,
    narration: 'B rolls to a fuzzy bear.',
    on_screen_text: 'Letter B Hugs Bear',
    themeColor: '#38bdf8',
    cam: { x: -40, y: 30, scale: 1.2, rot: -0.8 },
    words: [
      { word: 'B', startFrame: 3, endFrame: 8 },
      { word: 'rolls', startFrame: 8, endFrame: 17 },
      { word: 'to', startFrame: 17, endFrame: 20 },
      { word: 'a', startFrame: 21, endFrame: 23 },
      { word: 'fuzzy', startFrame: 23, endFrame: 33 },
      { word: 'bear.', startFrame: 33, endFrame: 46 },
    ],
  },
  {
    scene_number: 5,
    role: 'body',
    startFrame: 386,
    durationInFrames: 91,
    narration: 'C drives a speedy toy car.',
    on_screen_text: 'Letter C Races Car',
    themeColor: '#f43f5e',
    cam: { x: 70, y: -10, scale: 1.22, rot: 1.5 },
    words: [
      { word: 'C', startFrame: 3, endFrame: 10 },
      { word: 'drives', startFrame: 11, endFrame: 18 },
      { word: 'a', startFrame: 19, endFrame: 21 },
      { word: 'speedy', startFrame: 21, endFrame: 31 },
      { word: 'toy', startFrame: 31, endFrame: 38 },
      { word: 'car.', startFrame: 38, endFrame: 52 },
    ],
  },
  {
    scene_number: 6,
    role: 'body',
    startFrame: 477,
    durationInFrames: 100,
    narration: 'Together, they build real words.',
    on_screen_text: 'Letters Assemble New Words',
    themeColor: '#38bdf8',
    cam: { x: 0, y: 0, scale: 1.3, rot: 0 },
    words: [
      { word: 'Together,', startFrame: 3, endFrame: 21 },
      { word: 'they', startFrame: 26, endFrame: 29 },
      { word: 'build', startFrame: 30, endFrame: 38 },
      { word: 'real', startFrame: 38, endFrame: 45 },
      { word: 'words.', startFrame: 45, endFrame: 61 },
    ],
  },
  {
    scene_number: 7,
    role: 'cta',
    startFrame: 577,
    durationInFrames: 122,
    narration: 'Join the phonics adventure today!',
    on_screen_text: 'Join The Phonics Adventure',
    themeColor: '#f43f5e',
    cam: { x: 0, y: 0, scale: 1.0, rot: 0 },
    words: [
      { word: 'Join', startFrame: 3, endFrame: 11 },
      { word: 'the', startFrame: 12, endFrame: 14 },
      { word: 'phonics', startFrame: 15, endFrame: 27 },
      { word: 'adventure', startFrame: 27, endFrame: 39 },
      { word: 'today!', startFrame: 40, endFrame: 54 },
    ],
  },
];

export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Floating background particle cloud
  const particles = useMemo(() => {
    return Array.from({ length: 42 }).map((_, i) => ({
      id: i,
      x: (i * 97) % 1080,
      y: (i * 139) % 1920,
      size: 2 + (i % 5) * 1.6,
      opacity: 0.15 + (i % 7) * 0.1,
      speed: 0.4 + (i % 4) * 0.35,
      color: i % 2 === 0 ? '#f43f5e' : '#38bdf8',
    }));
  }, []);

  // Continuous Camera Math
  const camera = useMemo(() => {
    let currentIdx = 0;
    for (let i = 0; i < SCENES.length; i++) {
      if (frame >= SCENES[i].startFrame) {
        currentIdx = i;
      }
    }
    const currentScene = SCENES[currentIdx];
    const nextScene = SCENES[Math.min(currentIdx + 1, SCENES.length - 1)];

    const sceneLocalFrame = frame - currentScene.startFrame;
    const transitionWindow = 28;
    const transitionStart = Math.max(0, currentScene.durationInFrames - transitionWindow);

    let progress = 0;
    if (sceneLocalFrame >= transitionStart && currentIdx < SCENES.length - 1) {
      progress = interpolate(
        sceneLocalFrame,
        [transitionStart, currentScene.durationInFrames],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
    }

    const easeProgress = Math.sin((progress * Math.PI) / 2);

    const x = interpolate(
      easeProgress,
      [0, 1],
      [currentScene.cam.x, nextScene.cam.x]
    ) + Math.sin(frame / 45) * 6;

    const y = interpolate(
      easeProgress,
      [0, 1],
      [currentScene.cam.y, nextScene.cam.y]
    ) + Math.cos(frame / 50) * 8;

    const scale = interpolate(
      easeProgress,
      [0, 1],
      [currentScene.cam.scale, nextScene.cam.scale]
    ) + Math.sin(frame / 60) * 0.015;

    const rot = interpolate(
      easeProgress,
      [0, 1],
      [currentScene.cam.rot, nextScene.cam.rot]
    ) + Math.sin(frame / 70) * 0.35;

    return { x, y, scale, rot, activeScene: currentScene };
  }, [frame]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07080e',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Dynamic Grid Canvas */}
      <div
        style={{
          position: 'absolute',
          inset: -200,
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.06) 0%, transparent 45%),
            linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px',
          opacity: 0.85,
        }}
      />

      {/* Floating Living Particles */}
      {particles.map((p) => {
        const py = (p.y - (frame * p.speed)) % 2100;
        const normalizedY = py < -50 ? py + 2150 : py;
        const px = p.x + Math.sin((frame + p.id * 10) / 28) * 22;
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: px,
              top: normalizedY,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              opacity: p.opacity,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* Persistent Continuous World Camera */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale}) rotate(${camera.rot}deg)`,
          transformOrigin: '540px 960px',
        }}
      >
        {/* Global Connection Laser Line System */}
        <LaserBusLine
          color="#38bdf8"
          strokeWidth={2}
          animated={true}
          style={{
            position: 'absolute',
            top: 420,
            left: 120,
            width: 840,
            height: 480,
            opacity: 0.28,
            pointerEvents: 'none',
          }}
        />

        {/* =========================================================================
            SCENE 1: HOOK - THE VINTAGE LIVING TOY CHEST
           ========================================================================= */}
        <Sequence from={0} durationInFrames={94}>
          <SceneOneChest frame={frame} fps={fps} />
        </Sequence>

        {/* =========================================================================
            SCENE 2: TOY ISLAND AWAKENS
           ========================================================================= */}
        <Sequence from={94} durationInFrames={114}>
          <SceneTwoIsland frame={frame - 94} fps={fps} />
        </Sequence>

        {/* =========================================================================
            SCENE 3: LETTER 'A' BOUNCES ONTO JUICY APPLE
           ========================================================================= */}
        <Sequence from={208} durationInFrames={94}>
          <SceneThreeApple frame={frame - 208} fps={fps} />
        </Sequence>

        {/* =========================================================================
            SCENE 4: LETTER 'B' ROLLS TO FUZZY BEAR
           ========================================================================= */}
        <Sequence from={302} durationInFrames={84}>
          <SceneFourBear frame={frame - 302} fps={fps} />
        </Sequence>

        {/* =========================================================================
            SCENE 5: LETTER 'C' DRIVES SPEEDY RACER CAR
           ========================================================================= */}
        <Sequence from={386} durationInFrames={91}>
          <SceneFiveCar frame={frame - 386} fps={fps} />
        </Sequence>

        {/* =========================================================================
            SCENE 6: C + A + B SNAP TOGETHER TO BUILD WORDS
           ========================================================================= */}
        <Sequence from={477} durationInFrames={100}>
          <SceneSixWordAssemble frame={frame - 477} fps={fps} />
        </Sequence>

        {/* =========================================================================
            SCENE 7: CTA ADVENTURE + BITTRIX TECHNOLOGIES OUTRO
           ========================================================================= */}
        <Sequence from={577} durationInFrames={122}>
          <SceneSevenCTA frame={frame - 577} fps={fps} />
        </Sequence>
      </div>

      {/* PERSISTENT REAL-TIME KARAOKE CAPTIONS (Safe zone strictly above bottom 20%) */}
      {SCENES.map((scene) => (
        <Sequence
          key={scene.scene_number}
          from={scene.startFrame}
          durationInFrames={scene.durationInFrames}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 220,
              left: 40,
              right: 40,
              zIndex: 100,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SyncCaptions
              words={scene.words}
              currentFrame={frame - scene.startFrame}
              accentColor={scene.themeColor}
            />
          </div>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 1 IMPLEMENTATION: Toy Chest Hook
// ============================================================================
function SceneOneChest({ frame, fps }: { frame: number; fps: number }) {
  const chestSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 110, mass: 0.9 },
  });

  const lidAngle = interpolate(frame, [15, 60], [0, -58], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glowPulse = Math.sin(frame / 8) * 0.35 + 0.65;
  const floatA = Math.sin(frame / 12) * 12;
  const floatB = Math.cos(frame / 14) * 15;
  const floatC = Math.sin((frame + 10) / 10) * 10;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Top Kinetic Heading */}
      <div style={{ position: 'absolute', top: 180, width: 920, zIndex: 10 }}>
        <KineticTitle
          title="CAN LETTERS COME ALIVE?"
          badge="MYTH OR REALITY"
          accentColor="#f43f5e"
          progress={interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' })}
        />
      </div>

      {/* Solitary Overhead Spotlight */}
      <div
        style={{
          position: 'absolute',
          top: -150,
          width: 820,
          height: 1200,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(244,63,94,0.3) 0%, rgba(56,189,248,0.06) 50%, transparent 75%)',
          pointerEvents: 'none',
          transform: `scale(${1 + Math.sin(frame / 20) * 0.05})`,
        }}
      />

      {/* Interactive Telemetry Data Ribbon */}
      <div style={{ position: 'absolute', top: 380, display: 'flex', gap: 14, zIndex: 8 }}>
        <TelemetryPill label="CHEST STATUS" value="UNSEALING" color="#f43f5e" />
        <TelemetryPill label="ANOMALY LEVEL" value="ACTIVE TOYS" color="#38bdf8" />
      </div>

      {/* 3D Isometric Living Toy Chest Assembly */}
      <div
        style={{
          position: 'relative',
          width: 620,
          height: 480,
          marginTop: 80,
          transform: `scale(${chestSpring}) translateY(${Math.sin(frame / 24) * 6}px)`,
          perspective: 1200,
        }}
      >
        {/* Chest Aura Glow */}
        <div
          style={{
            position: 'absolute',
            inset: -40,
            borderRadius: 60,
            background: `radial-gradient(circle, rgba(244,63,94,${glowPulse * 0.4}) 0%, transparent 70%)`,
            filter: 'blur(30px)',
          }}
        />

        {/* Chest Base Box */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 50,
            width: 520,
            height: 280,
            background: 'linear-gradient(135deg, #2b1810 0%, #170d08 100%)',
            borderRadius: 24,
            border: '3px solid #e09f3e',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(224, 159, 62, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Brass Decorative Ribs */}
          <div style={{ position: 'absolute', left: 40, top: 0, bottom: 0, width: 28, background: 'linear-gradient(90deg, #b07d2b, #ffe28a, #825712)', boxShadow: '0 0 10px rgba(255,226,138,0.3)' }} />
          <div style={{ position: 'absolute', right: 40, top: 0, bottom: 0, width: 28, background: 'linear-gradient(90deg, #b07d2b, #ffe28a, #825712)', boxShadow: '0 0 10px rgba(255,226,138,0.3)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 120, height: 16, background: 'linear-gradient(180deg, #ffe28a, #b07d2b)' }} />

          {/* Keyhole Mechanism */}
          <div
            style={{
              position: 'absolute',
              top: 50,
              left: 236,
              width: 48,
              height: 60,
              background: '#07080e',
              borderRadius: '24px 24px 12px 12px',
              border: '2px solid #ffe28a',
              boxShadow: '0 0 18px #f43f5e',
            }}
          />
        </div>

        {/* Chest Hinged Lid */}
        <div
          style={{
            position: 'absolute',
            top: 100,
            left: 45,
            width: 530,
            height: 120,
            background: 'linear-gradient(180deg, #3d2317 0%, #1e110b 100%)',
            borderRadius: '40px 40px 8px 8px',
            border: '4px solid #e09f3e',
            transformOrigin: 'top center',
            transform: `rotateX(${lidAngle}deg)`,
            transition: 'transform 0.1s ease-out',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            zIndex: 12,
          }}
        >
          <div style={{ position: 'absolute', top: 30, left: 240, width: 50, height: 18, borderRadius: 9, background: '#ffe28a' }} />
        </div>

        {/* Rising Living Letters (Toys) Peeking Out */}
        <div
          style={{
            position: 'absolute',
            top: 20 + floatA,
            left: 120,
            fontFamily: 'Impact',
            fontSize: 110,
            color: '#f43f5e',
            textShadow: '0 0 25px rgba(244,63,94,0.9), 4px 6px 0px #07080e',
            transform: `rotate(-14deg) scale(${interpolate(frame, [20, 60], [0.4, 1.1], { extrapolateRight: 'clamp' })})`,
            zIndex: 10,
          }}
        >
          A
        </div>

        <div
          style={{
            position: 'absolute',
            top: -10 + floatB,
            left: 245,
            fontFamily: 'Impact',
            fontSize: 130,
            color: '#38bdf8',
            textShadow: '0 0 30px rgba(56,189,248,0.95), 4px 6px 0px #07080e',
            transform: `rotate(8deg) scale(${interpolate(frame, [25, 65], [0.3, 1.15], { extrapolateRight: 'clamp' })})`,
            zIndex: 11,
          }}
        >
          B
        </div>

        <div
          style={{
            position: 'absolute',
            top: 25 + floatC,
            left: 390,
            fontFamily: 'Impact',
            fontSize: 115,
            color: '#fbbf24',
            textShadow: '0 0 28px rgba(251,191,36,0.9), 4px 6px 0px #07080e',
            transform: `rotate(18deg) scale(${interpolate(frame, [30, 70], [0.3, 1.05], { extrapolateRight: 'clamp' })})`,
            zIndex: 10,
          }}
        >
          C
        </div>
      </div>

      {/* Floating Micro Inspection Card */}
      <div style={{ position: 'absolute', bottom: 330, width: 720 }}>
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px' }}>
            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.05em', color: '#f43f5e' }}>
              ENTITY DETECTED: LIVING TOY LETTERS
            </span>
            <span style={{ fontSize: 20, color: '#94a3b8', fontFamily: 'monospace' }}>
              STATUS: READY TO ESCAPE
            </span>
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 2 IMPLEMENTATION: Toy Diorama Island Awakens
// ============================================================================
function SceneTwoIsland({ frame, fps }: { frame: number; fps: number }) {
  const islandZoom = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 100, mass: 0.9 },
  });

  const islandElevation = interpolate(frame, [0, 50], [80, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 160, width: 920, zIndex: 10 }}>
        <KineticTitle
          title="A SECRET ISLAND AWAKENS"
          badge="DISCOVERY DIORAMA"
          accentColor="#38bdf8"
          progress={interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })}
        />
      </div>

      {/* Network Topology Connecting Letter Outposts */}
      <div style={{ position: 'absolute', top: 340, width: 860, height: 260, zIndex: 5, opacity: 0.85 }}>
        <NetworkNodes
          count={5}
          primaryColor="#38bdf8"
          secondaryColor="#f43f5e"
          progress={interpolate(frame, [10, 60], [0, 1], { extrapolateRight: 'clamp' })}
        />
      </div>

      {/* Stylized Floating Diorama Island */}
      <div
        style={{
          position: 'relative',
          width: 740,
          height: 620,
          marginTop: 130,
          transform: `scale(${islandZoom}) translateY(${islandElevation + Math.sin(frame / 20) * 8}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Floating Island Base Layer */}
        <div
          style={{
            position: 'absolute',
            width: 640,
            height: 340,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #065f46 60%, #042f2e 100%)',
            boxShadow: '0 40px 90px rgba(16,185,129,0.35), inset 0 8px 30px rgba(255,255,255,0.2)',
            border: '4px solid #34d399',
            transform: 'rotateX(55deg)',
          }}
        />

        {/* Island Underground Floating Rock Shards */}
        <div
          style={{
            position: 'absolute',
            top: 310,
            width: 480,
            height: 220,
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            clipPath: 'polygon(15% 0%, 85% 0%, 50% 100%)',
            borderTop: '3px solid #38bdf8',
            opacity: 0.95,
          }}
        />

        {/* Diorama Features: Mini Castle, Toy Trees, Pathways */}
        <div style={{ position: 'absolute', top: 120, display: 'flex', gap: 60, zIndex: 12 }}>
          {/* Tree 1 */}
          <div style={{ textAlign: 'center', transform: `scale(${interpolate(frame, [15, 40], [0, 1], { extrapolateRight: 'clamp' })})` }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f43f5e', margin: '0 auto', boxShadow: '0 0 15px #f43f5e' }} />
            <div style={{ width: 10, height: 35, background: '#78350f', margin: '0 auto' }} />
          </div>
          {/* Center Phonics Citadel */}
          <div
            style={{
              padding: '18px 28px',
              borderRadius: 18,
              background: 'rgba(7,8,14,0.85)',
              border: '2px solid #38bdf8',
              boxShadow: '0 0 25px rgba(56,189,248,0.5)',
              transform: `scale(${interpolate(frame, [20, 55], [0, 1.05], { extrapolateRight: 'clamp' })})`,
            }}
          >
            <span style={{ fontFamily: 'Impact', fontSize: 44, color: '#ffffff', letterSpacing: 2 }}>
              ALPHABET HAVEN
            </span>
          </div>
          {/* Tree 2 */}
          <div style={{ textAlign: 'center', transform: `scale(${interpolate(frame, [25, 48], [0, 1], { extrapolateRight: 'clamp' })})` }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#38bdf8', margin: '0 auto', boxShadow: '0 0 15px #38bdf8' }} />
            <div style={{ width: 10, height: 35, background: '#78350f', margin: '0 auto' }} />
          </div>
        </div>

        {/* Orbiting Playful Letter Glyphs */}
        <div
          style={{
            position: 'absolute',
            top: 220,
            left: 90,
            fontFamily: 'Impact',
            fontSize: 70,
            color: '#f43f5e',
            transform: `translateY(${Math.sin(frame / 14) * 12}px)`,
            filter: 'drop-shadow(0 0 14px #f43f5e)',
          }}
        >
          A
        </div>
        <div
          style={{
            position: 'absolute',
            top: 190,
            right: 110,
            fontFamily: 'Impact',
            fontSize: 76,
            color: '#38bdf8',
            transform: `translateY(${Math.cos(frame / 15) * 14}px)`,
            filter: 'drop-shadow(0 0 14px #38bdf8)',
          }}
        >
          B
        </div>
      </div>

      {/* Progress Metric Bar */}
      <div style={{ position: 'absolute', bottom: 330, width: 720 }}>
        <MetricBar
          label="ISLAND TERRAIN DISCOVERY"
          value={Math.min(100, Math.round(interpolate(frame, [0, 80], [10, 100], { extrapolateRight: 'clamp' })))}
          max={100}
          unit="%"
          color="#38bdf8"
        />
      </div>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 3 IMPLEMENTATION: Letter A Bounces onto Apple
// ============================================================================
function SceneThreeApple({ frame, fps }: { frame: number; fps: number }) {
  // Bouncing physics for Letter A
  const bounceY = interpolate(
    frame,
    [0, 18, 28, 38, 48, 56],
    [-260, 40, -40, 20, -10, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const appleSquash = interpolate(
    frame,
    [16, 22, 28, 36],
    [1.0, 0.85, 1.08, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 160, width: 920, zIndex: 10 }}>
        <KineticTitle
          title="LETTER A MEETS APPLE"
          badge="TACTILE PHONICS"
          accentColor="#f43f5e"
          progress={interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })}
        />
      </div>

      {/* Terminal Inspection Diagnostic Window */}
      <div style={{ position: 'absolute', top: 320, width: 680, zIndex: 6 }}>
        <TerminalWindow
          title="phonics-kernel // letter-bind"
          lines={[
            '$ bind --letter=A --object=Apple',
            '+ Event: Kinetic impact registered at velocity 9.8m/s',
            '+ Phoneme resonance: /æ/ validated',
          ]}
        />
      </div>

      {/* Showcase Platform */}
      <div
        style={{
          position: 'relative',
          width: 600,
          height: 600,
          marginTop: 220,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Glowing Pedestal */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            width: 440,
            height: 90,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(244,63,94,0.35) 0%, rgba(7,8,14,0.9) 70%)',
            border: '2px solid rgba(244,63,94,0.4)',
            boxShadow: '0 0 35px rgba(244,63,94,0.4)',
          }}
        />

        {/* 3D Glossy Apple */}
        <div
          style={{
            position: 'relative',
            width: 240,
            height: 240,
            borderRadius: '50% 50% 45% 45%',
            background: 'radial-gradient(circle at 35% 30%, #ff4d6d 0%, #d90429 65%, #7a0014 100%)',
            boxShadow: '0 25px 50px rgba(217,4,41,0.5), inset 0 8px 24px rgba(255,255,255,0.4)',
            transform: `scaleY(${appleSquash})`,
            zIndex: 8,
          }}
        >
          {/* Leaf & Stem */}
          <div style={{ position: 'absolute', top: -24, left: 114, width: 12, height: 32, borderRadius: 6, background: '#78350f', transform: 'rotate(-8deg)' }} />
          <div style={{ position: 'absolute', top: -28, left: 124, width: 36, height: 20, borderRadius: '50% 0', background: '#22c55e', boxShadow: '0 0 10px #22c55e', transform: 'rotate(25deg)' }} />
          {/* Juicy Specular Highlight */}
          <div style={{ position: 'absolute', top: 32, left: 45, width: 50, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.45)', filter: 'blur(8px)', transform: 'rotate(-25deg)' }} />
        </div>

        {/* Letter 'A' Bouncing Character */}
        <div
          style={{
            position: 'absolute',
            top: 80,
            fontFamily: 'Impact',
            fontSize: 160,
            color: '#ffffff',
            WebkitTextStroke: '4px #f43f5e',
            textShadow: '0 0 40px #f43f5e, 0 10px 0 #9f1239',
            transform: `translateY(${bounceY}px) rotate(${Math.sin(frame / 6) * 8}deg)`,
            zIndex: 12,
          }}
        >
          A
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 4 IMPLEMENTATION: Letter B Rolls to Bear
// ============================================================================
function SceneFourBear({ frame, fps }: { frame: number; fps: number }) {
  const rollX = interpolate(frame, [0, 38], [-320, -50], {
    extrapolateRight: 'clamp',
  });
  const rollRot = interpolate(frame, [0, 38], [-360, 0], {
    extrapolateRight: 'clamp',
  });

  const hugGlow = interpolate(frame, [38, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 160, width: 920, zIndex: 10 }}>
        <KineticTitle
          title="LETTER B HUGS BEAR"
          badge="EMPATHY MECHANIC"
          accentColor="#38bdf8"
          progress={interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })}
        />
      </div>

      {/* Commit Graph Visualizing Connection */}
      <div style={{ position: 'absolute', top: 320, width: 720, zIndex: 6 }}>
        <GitCommitGraph
          commits={[
            { hash: 'b17e4', message: 'letter_b: roll_forward', branch: 'main' },
            { hash: 'e48a2', message: 'plush_bear: initiate_hug', branch: 'hug/v1' },
          ]}
          progress={interpolate(frame, [10, 50], [0, 1], { extrapolateRight: 'clamp' })}
          color="#38bdf8"
        />
      </div>

      {/* Play Area Vignette */}
      <div
        style={{
          position: 'relative',
          width: 700,
          height: 520,
          marginTop: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Soft Cozy Floor Glow */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            width: 580,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.3) 0%, transparent 70%)',
            boxShadow: '0 0 40px rgba(56,189,248,0.25)',
          }}
        />

        {/* Sculpted Sitting Fuzzy Bear */}
        <div
          style={{
            position: 'absolute',
            right: 120,
            bottom: 90,
            width: 220,
            height: 250,
            zIndex: 8,
            transform: `scale(${1 + Math.sin(frame / 16) * 0.03})`,
          }}
        >
          {/* Bear Body */}
          <div style={{ width: 170, height: 190, margin: '0 auto', borderRadius: '50%', background: '#92400e', border: '4px solid #b45309', position: 'relative' }}>
            {/* Bear Belly */}
            <div style={{ width: 100, height: 120, margin: '35px auto', borderRadius: '50%', background: '#fef3c7', opacity: 0.85 }} />
            {/* Arms Welcoming Hug */}
            <div style={{ position: 'absolute', left: -25, top: 40, width: 45, height: 85, borderRadius: 30, background: '#78350f', transform: 'rotate(25deg)' }} />
            <div style={{ position: 'absolute', right: -25, top: 40, width: 45, height: 85, borderRadius: 30, background: '#78350f', transform: 'rotate(-25deg)' }} />
          </div>
          {/* Bear Head */}
          <div style={{ position: 'absolute', top: -65, left: 35, width: 140, height: 130, borderRadius: '50%', background: '#92400e', border: '3px solid #b45309' }}>
            {/* Ears */}
            <div style={{ position: 'absolute', top: -14, left: 6, width: 38, height: 38, borderRadius: '50%', background: '#78350f', border: '2px solid #b45309' }} />
            <div style={{ position: 'absolute', top: -14, right: 6, width: 38, height: 38, borderRadius: '50%', background: '#78350f', border: '2px solid #b45309' }} />
            {/* Cute Snout */}
            <div style={{ position: 'absolute', bottom: 18, left: 40, width: 60, height: 46, borderRadius: '50%', background: '#fef3c7' }}>
              <div style={{ width: 22, height: 14, margin: '8px auto', borderRadius: '50%', background: '#451a03' }} />
            </div>
          </div>
        </div>

        {/* Rolling Letter B */}
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: 320,
            transform: `translateX(${rollX}px) rotate(${rollRot}deg)`,
            fontFamily: 'Impact',
            fontSize: 150,
            color: '#38bdf8',
            textShadow: '0 0 35px #38bdf8, 4px 6px 0px #0369a1',
            zIndex: 10,
          }}
        >
          B
        </div>

        {/* Hug Connection Sparkles */}
        {hugGlow > 0 && (
          <div
            style={{
              position: 'absolute',
              right: 250,
              bottom: 160,
              padding: '8px 18px',
              borderRadius: 20,
              background: 'rgba(56,189,248,0.25)',
              border: '1px solid #38bdf8',
              boxShadow: '0 0 20px #38bdf8',
              opacity: hugGlow,
              fontFamily: 'Impact',
              fontSize: 22,
              color: '#ffffff',
            }}
          >
            HUG ENGAGED!
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 5 IMPLEMENTATION: Letter C Drives Speedy Car
// ============================================================================
function SceneFiveCar({ frame, fps }: { frame: number; fps: number }) {
  const carX = interpolate(frame, [0, 45, 90], [-450, 0, 480], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const wheelSpin = frame * 24;
  const exhaustCount = 4;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 160, width: 920, zIndex: 10 }}>
        <KineticTitle
          title="LETTER C RACES CAR"
          badge="VELOCITY EXPERIMENT"
          accentColor="#f43f5e"
          progress={interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })}
        />
      </div>

      {/* Speedometer Telemetry Readout */}
      <div style={{ position: 'absolute', top: 320, display: 'flex', gap: 16, zIndex: 6 }}>
        <TelemetryPill label="SPEED" value="120 KM/H" color="#f43f5e" />
        <TelemetryPill label="STEERING" value="PILOT [C]" color="#38bdf8" />
        <TelemetryPill label="TURBO" value="ACTIVE" color="#fbbf24" />
      </div>

      {/* Dynamic 3/4 Track Assembly */}
      <div
        style={{
          position: 'relative',
          width: 760,
          height: 480,
          marginTop: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Speed Streaks on Floor */}
        <div style={{ position: 'absolute', bottom: 50, width: 720, height: 6, background: 'linear-gradient(90deg, transparent, #38bdf8, #f43f5e, transparent)', opacity: 0.7 }} />

        {/* The Racing Toy Car */}
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            transform: `translateX(${carX}px) translateY(${Math.sin(frame * 1.4) * 4}px)`,
            width: 360,
            height: 180,
            zIndex: 10,
          }}
        >
          {/* Exhaust Flames */}
          {Array.from({ length: exhaustCount }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: -24 - i * 14,
                bottom: 35 + (i % 2) * 6,
                width: 20 - i * 3,
                height: 10,
                borderRadius: '50%',
                background: i % 2 === 0 ? '#f43f5e' : '#fbbf24',
                boxShadow: '0 0 14px #f43f5e',
                opacity: 0.9 - i * 0.2,
              }}
            />
          ))}

          {/* Car Chassis */}
          <div
            style={{
              position: 'absolute',
              bottom: 25,
              width: 340,
              height: 75,
              borderRadius: '24px 70px 18px 18px',
              background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
              border: '3px solid #fda4af',
              boxShadow: '0 15px 35px rgba(244,63,94,0.5)',
            }}
          />

          {/* Cockpit Canopy */}
          <div
            style={{
              position: 'absolute',
              bottom: 85,
              left: 90,
              width: 140,
              height: 65,
              borderRadius: '40px 40px 0 0',
              background: 'linear-gradient(180deg, rgba(56,189,248,0.7) 0%, rgba(15,23,42,0.85) 100%)',
              border: '2px solid #38bdf8',
            }}
          />

          {/* Driver: Glowing Letter C Steering */}
          <div
            style={{
              position: 'absolute',
              bottom: 78,
              left: 125,
              fontFamily: 'Impact',
              fontSize: 70,
              color: '#ffffff',
              textShadow: '0 0 20px #fbbf24',
              transform: `rotate(${Math.sin(frame / 4) * 12}deg)`,
              zIndex: 15,
            }}
          >
            C
          </div>

          {/* Wheels */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 45,
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#0f172a',
              border: '5px solid #64748b',
              transform: `rotate(${wheelSpin}deg)`,
              boxShadow: '0 0 10px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fbbf24', margin: '17px auto' }} />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 45,
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#0f172a',
              border: '5px solid #64748b',
              transform: `rotate(${wheelSpin}deg)`,
              boxShadow: '0 0 10px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fbbf24', margin: '17px auto' }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 6 IMPLEMENTATION: C + A + B Letters Snap Together
// ============================================================================
function SceneSixWordAssemble({ frame, fps }: { frame: number; fps: number }) {
  // Magnet snapping animation
  const snapProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 11, stiffness: 140, mass: 0.8 },
  });

  const posC = interpolate(snapProgress, [0, 1], [-320, -170]);
  const posA = interpolate(snapProgress, [0, 1], [0, 0]);
  const posB = interpolate(snapProgress, [0, 1], [320, 170]);

  // Flash explosion when snapped
  const flashOpacity = interpolate(frame, [25, 32, 50], [0, 0.9, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 160, width: 920, zIndex: 10 }}>
        <KineticTitle
          title="LETTERS ASSEMBLE WORDS"
          badge="SYNTACTIC SYNTHESIS"
          accentColor="#38bdf8"
          progress={interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })}
        />
      </div>

      {/* Snap Flash Wave */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.5) 0%, transparent 65%)',
          opacity: flashOpacity,
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />

      {/* Magnet Resonance Lines */}
      <div style={{ position: 'absolute', top: 380, width: 700, display: 'flex', justifyContent: 'center' }}>
        <LaserBusLine
          color="#fbbf24"
          strokeWidth={3}
          animated={true}
          style={{ width: 560, height: 40 }}
        />
      </div>

      {/* 3D Toy Blocks: C - A - B Snap into "CAB" */}
      <div
        style={{
          position: 'relative',
          width: 740,
          height: 380,
          marginTop: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1000,
        }}
      >
        {/* Block C */}
        <div
          style={{
            position: 'absolute',
            transform: `translateX(${posC}px) rotateY(-10deg)`,
            width: 150,
            height: 150,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)',
            border: '4px solid #fda4af',
            boxShadow: '0 20px 40px rgba(244,63,94,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Impact',
            fontSize: 90,
            color: '#ffffff',
          }}
        >
          C
        </div>

        {/* Block A */}
        <div
          style={{
            position: 'absolute',
            transform: `translateX(${posA}px)`,
            width: 150,
            height: 150,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
            border: '4px solid #fde68a',
            boxShadow: '0 20px 40px rgba(251,191,36,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Impact',
            fontSize: 90,
            color: '#ffffff',
          }}
        >
          A
        </div>

        {/* Block B */}
        <div
          style={{
            position: 'absolute',
            transform: `translateX(${posB}px) rotateY(10deg)`,
            width: 150,
            height: 150,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
            border: '4px solid #bae6fd',
            boxShadow: '0 20px 40px rgba(56,189,248,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Impact',
            fontSize: 90,
            color: '#ffffff',
          }}
        >
          B
        </div>
      </div>

      {/* Assembly Success Pill Banner */}
      <div style={{ position: 'absolute', bottom: 330 }}>
        <GlassCard>
          <div style={{ padding: '14px 36px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'Impact', fontSize: 32, letterSpacing: 3, color: '#fbbf24' }}>
              RESULT: "CAB" (VEHICLE UNLOCKED)
            </span>
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
}

// ============================================================================
// SCENE 7 IMPLEMENTATION: CTA Adventure & Exact Bittrix Technologies Outro
// ============================================================================
function SceneSevenCTA({ frame, fps }: { frame: number; fps: number }) {
  // Switch to Bittrix Outro during final ~3 seconds (frame 36 to 122)
  const showBittrix = frame >= 36;
  const bittrixTransition = spring({
    frame: Math.max(0, frame - 36),
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.9 },
  });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      {!showBittrix ? (
        <>
          {/* Adventure Compass & CTA Hook */}
          <div style={{ position: 'absolute', top: 180, width: 920, zIndex: 10 }}>
            <KineticTitle
              title="JOIN THE PHONICS ADVENTURE"
              badge="START YOUR JOURNEY"
              accentColor="#f43f5e"
              progress={interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })}
            />
          </div>

          {/* Golden Adventure Compass Badge */}
          <div
            style={{
              position: 'relative',
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ffe28a 0%, #b07d2b 70%, #58390b 100%)',
              border: '6px solid #fde68a',
              boxShadow: '0 0 60px rgba(251,191,36,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${spring({ frame, fps, config: { damping: 12, stiffness: 100 } })})`,
            }}
          >
            {/* Spinning Compass Star */}
            <div
              style={{
                width: 140,
                height: 140,
                background: 'linear-gradient(45deg, #f43f5e, #38bdf8)',
                clipPath: 'polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)',
                transform: `rotate(${frame * 4}deg)`,
              }}
            />
          </div>

          {/* High Contrast Action Button */}
          <div style={{ marginTop: 60 }}>
            <div
              style={{
                padding: '24px 64px',
                borderRadius: 40,
                background: 'linear-gradient(90deg, #f43f5e, #e11d48)',
                border: '2px solid #ffffff',
                boxShadow: '0 0 35px rgba(244,63,94,0.7)',
                fontFamily: 'Impact',
                fontSize: 38,
                letterSpacing: 2,
                color: '#ffffff',
              }}
            >
              EXPLORE TODAY
            </div>
          </div>
        </>
      ) : (
        /* EXACT BITTRIX TECHNOLOGIES OUTRO COMPONENT */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${bittrixTransition})`,
            opacity: bittrixTransition,
          }}
        >
          <BittrixOutroExact />
        </div>
      )}
    </AbsoluteFill>
  );
}