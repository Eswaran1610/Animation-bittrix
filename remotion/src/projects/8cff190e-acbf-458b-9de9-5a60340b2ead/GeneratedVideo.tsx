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
  KineticTitle
} from '../../components/MotionElements';
import { SyncCaptions } from '../../components/SyncCaptions';
import { BittrixOutroExact } from '../../components/BittrixOutroExact';

// --- DATA DEFINITION & WORD TIMINGS ---
const SCENES = [
  {
    scene_number: 1,
    role: "hook",
    durationInFrames: 94,
    startFrame: 0,
    narration: "What if letters were living toys?",
    on_screen_text: "Can Letters Become Living Toys?",
    themeColor: "#f43f5e",
    words: [
      { word: "What", startFrame: 3, endFrame: 8 },
      { word: "if", startFrame: 9, endFrame: 12 },
      { word: "letters", startFrame: 12, endFrame: 23 },
      { word: "were", startFrame: 23, endFrame: 27 },
      { word: "living", startFrame: 27, endFrame: 36 },
      { word: "toys?", startFrame: 36, endFrame: 55 }
    ]
  },
  {
    scene_number: 2,
    role: "body",
    durationInFrames: 114,
    startFrame: 94,
    narration: "Inside this box, an island awakens.",
    on_screen_text: "Enter The Magic Toy Island",
    themeColor: "#38bdf8",
    words: [
      { word: "Inside", startFrame: 3, endFrame: 17 },
      { word: "this", startFrame: 17, endFrame: 22 },
      { word: "box,", startFrame: 22, endFrame: 36 },
      { word: "an", startFrame: 39, endFrame: 43 },
      { word: "island", startFrame: 44, endFrame: 53 },
      { word: "awakens.", startFrame: 53, endFrame: 75 }
    ]
  },
  {
    scene_number: 3,
    role: "body",
    durationInFrames: 94,
    startFrame: 208,
    narration: "A bounces onto a juicy apple.",
    on_screen_text: "A Leaps Onto Crisp Apple",
    themeColor: "#f43f5e",
    words: [
      { word: "A", startFrame: 3, endFrame: 7 },
      { word: "bounces", startFrame: 7, endFrame: 20 },
      { word: "onto", startFrame: 20, endFrame: 27 },
      { word: "a", startFrame: 28, endFrame: 30 },
      { word: "juicy", startFrame: 30, endFrame: 41 },
      { word: "apple.", startFrame: 42, endFrame: 55 }
    ]
  },
  {
    scene_number: 4,
    role: "body",
    durationInFrames: 84,
    startFrame: 302,
    narration: "B rolls to a fuzzy bear.",
    on_screen_text: "B Cuddles Friendly Bear",
    themeColor: "#38bdf8",
    words: [
      { word: "B", startFrame: 3, endFrame: 8 },
      { word: "rolls", startFrame: 8, endFrame: 17 },
      { word: "to", startFrame: 17, endFrame: 20 },
      { word: "a", startFrame: 21, endFrame: 23 },
      { word: "fuzzy", startFrame: 23, endFrame: 33 },
      { word: "bear.", startFrame: 33, endFrame: 46 }
    ]
  },
  {
    scene_number: 5,
    role: "body",
    durationInFrames: 91,
    startFrame: 386,
    narration: "C drives a speedy toy car.",
    on_screen_text: "C Steers The Wooden Car",
    themeColor: "#f43f5e",
    words: [
      { word: "C", startFrame: 3, endFrame: 10 },
      { word: "drives", startFrame: 11, endFrame: 18 },
      { word: "a", startFrame: 19, endFrame: 21 },
      { word: "speedy", startFrame: 21, endFrame: 31 },
      { word: "toy", startFrame: 31, endFrame: 38 },
      { word: "car.", startFrame: 38, endFrame: 52 }
    ]
  },
  {
    scene_number: 6,
    role: "body",
    durationInFrames: 100,
    startFrame: 477,
    narration: "Together, they build real words.",
    on_screen_text: "Stack Sounds Into Stories",
    themeColor: "#38bdf8",
    words: [
      { word: "Together,", startFrame: 3, endFrame: 21 },
      { word: "they", startFrame: 26, endFrame: 29 },
      { word: "build", startFrame: 30, endFrame: 38 },
      { word: "real", startFrame: 38, endFrame: 45 },
      { word: "words.", startFrame: 45, endFrame: 61 }
    ]
  },
  {
    scene_number: 7,
    role: "cta",
    durationInFrames: 122,
    startFrame: 577,
    narration: "Join the phonics adventure today!",
    on_screen_text: "Join The Phonics Adventure",
    themeColor: "#f43f5e",
    words: [
      { word: "Join", startFrame: 3, endFrame: 11 },
      { word: "the", startFrame: 12, endFrame: 14 },
      { word: "phonics", startFrame: 15, endFrame: 27 },
      { word: "adventure", startFrame: 27, endFrame: 39 },
      { word: "today!", startFrame: 40, endFrame: 54 }
    ]
  }
];

// --- BACKGROUND PARTICLES SYSTEM ---
const BackgroundParticles = ({ frame }: { frame: number }) => {
  const particles = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: (i * 79 + 43) % 1080,
      baseY: (i * 137 + 91) % 1920,
      size: (i % 4) * 2 + 3,
      speed: 0.6 + (i % 5) * 0.35,
      color: i % 3 === 0 ? '#f43f5e' : i % 3 === 1 ? '#38bdf8' : '#ffffff',
      alpha: 0.15 + (i % 4) * 0.12,
      wobbleSpeed: 0.02 + (i % 3) * 0.015,
      wobbleRadius: 10 + (i % 5) * 8
    }));
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p) => {
        const yPos = (p.baseY - frame * p.speed * 2) % 2000;
        const normalizedY = yPos < -50 ? yPos + 2050 : yPos;
        const xOffset = Math.sin(frame * p.wobbleSpeed + p.id) * p.wobbleRadius;
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x + xOffset,
              top: normalizedY,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              opacity: p.alpha,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              filter: 'blur(0.5px)'
            }}
          />
        );
      })}
    </div>
  );
};

// --- SCENE 1: GLOWING CHEST & AWAKENING RUNES ---
const SceneOneChest = ({ localFrame, fps }: { localFrame: number; fps: number }) => {
  const chestSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.9 }
  });

  const lidAngle = interpolate(localFrame, [10, 45], [0, -68], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const rayPulse = Math.sin(localFrame * 0.12) * 0.2 + 0.8;
  const runes = ['A', 'B', 'C', '✨', 'X', 'Y', 'Z', '★'];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Light God-Rays */}
      <div
        style={{
          position: 'absolute',
          top: 750,
          width: 700,
          height: 700,
          background: 'radial-gradient(circle, rgba(244,63,94,0.45) 0%, rgba(56,189,248,0.2) 40%, rgba(7,8,14,0) 70%)',
          transform: `scale(${rayPulse * chestSpring})`,
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }}
      />

      {/* Floating Letters / Runes */}
      {runes.map((rune, idx) => {
        const floatDelay = idx * 4 + 12;
        const runeProg = spring({
          frame: Math.max(0, localFrame - floatDelay),
          fps,
          config: { damping: 12, stiffness: 80, mass: 0.7 }
        });
        const angle = (idx / runes.length) * Math.PI * 2;
        const radius = 220 + (idx % 2) * 80;
        const targetX = Math.cos(angle) * radius;
        const targetY = Math.sin(angle) * (radius * 0.75) - 240;
        const floatDriftY = Math.sin(localFrame * 0.08 + idx) * 15;

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: 860,
              left: 540,
              transform: `translate3d(${targetX * runeProg}px, ${targetY * runeProg + floatDriftY}px, 0) scale(${runeProg}) rotate(${Math.sin(localFrame * 0.05 + idx) * 15}deg)`,
              fontFamily: '"Impact", sans-serif',
              fontSize: 56,
              color: idx % 2 === 0 ? '#f43f5e' : '#38bdf8',
              textShadow: `0 0 25px ${idx % 2 === 0 ? 'rgba(244,63,94,0.9)' : 'rgba(56,189,248,0.9)'}`,
              opacity: runeProg
            }}
          >
            {rune}
          </div>
        );
      })}

      {/* 3D Toy Chest */}
      <div
        style={{
          position: 'relative',
          width: 440,
          height: 300,
          perspective: 1200,
          transform: `scale(${chestSpring})`,
          marginTop: 180
        }}
      >
        {/* Chest Base */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: 440,
            height: 200,
            backgroundColor: '#16192b',
            border: '4px solid #f43f5e',
            borderRadius: '24px 24px 32px 32px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), inset 0 0 35px rgba(244,63,94,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Golden latch & lock */}
          <div
            style={{
              width: 50,
              height: 70,
              backgroundColor: '#fbbf24',
              borderRadius: '8px',
              border: '3px solid #78350f',
              boxShadow: '0 0 15px rgba(251,191,36,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ width: 14, height: 22, backgroundColor: '#1e293b', borderRadius: '4px' }} />
          </div>
        </div>

        {/* Chest Hinged Lid */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            width: 440,
            height: 110,
            backgroundColor: '#1e2238',
            border: '4px solid #38bdf8',
            borderRadius: '40px 40px 10px 10px',
            boxShadow: '0 10px 30px rgba(56,189,248,0.3)',
            transformOrigin: 'top center',
            transform: `rotateX(${lidAngle}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
      </div>

      {/* Micro-UI Pill */}
      <div style={{ position: 'absolute', top: 380 }}>
        <TelemetryPill label="CHEST STATUS" value="DISCOVERED // PRIMORDIAL" active color="#f43f5e" />
      </div>
    </div>
  );
};

// --- SCENE 2: FLOATING ISLAND & PATHWAYS ---
const SceneTwoIsland = ({ localFrame, fps }: { localFrame: number; fps: number }) => {
  const islandDrop = spring({
    frame: localFrame,
    fps,
    config: { damping: 13, stiffness: 110, mass: 1.1 }
  });

  const wobble = Math.sin(localFrame * 0.08) * 4;
  const pathProg = interpolate(localFrame, [15, 65], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 340 }}>
        <TelemetryPill label="ZONE IDENTIFIER" value="PHONICS ISLE 01" active color="#38bdf8" />
      </div>

      {/* Floating Island Body */}
      <div
        style={{
          position: 'relative',
          width: 580,
          height: 580,
          transform: `translateY(${interpolate(islandDrop, [0, 1], [-250, 0])}px) rotate(${wobble}deg) scale(${islandDrop})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Island Cylinder base / shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            width: 540,
            height: 140,
            backgroundColor: '#0c0f1d',
            borderRadius: '50%',
            filter: 'blur(25px)',
            opacity: 0.8
          }}
        />

        {/* Cylinder 3D Stack */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 280,
            backgroundColor: '#151b33',
            border: '3px solid #38bdf8',
            borderRadius: '50% / 30%',
            boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 -30px 40px rgba(56,189,248,0.25)',
            overflow: 'hidden'
          }}
        >
          {/* Stratified rock layers */}
          <div style={{ position: 'absolute', bottom: 40, width: '100%', height: 40, backgroundColor: '#0f172a', opacity: 0.6 }} />
          <div style={{ position: 'absolute', bottom: 90, width: '100%', height: 25, backgroundColor: '#1e293b', opacity: 0.5 }} />
        </div>

        {/* Island Top Surface */}
        <div
          style={{
            position: 'absolute',
            top: 140,
            width: 500,
            height: 200,
            backgroundColor: '#1a2342',
            border: '3px solid #f43f5e',
            borderRadius: '50%',
            boxShadow: 'inset 0 0 45px rgba(244,63,94,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Winding alphabet path */}
          <svg width="420" height="150" viewBox="0 0 420 150" style={{ overflow: 'visible' }}>
            <path
              d="M 40 100 Q 140 10 210 80 T 380 40"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 40 100 Q 140 10 210 80 T 380 40"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="10"
              strokeDasharray="450"
              strokeDashoffset={450 - (450 * pathProg) / 100}
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px #38bdf8)"
            />
          </svg>

          {/* Stepping Letter Mascots on Path */}
          {['A', 'B', 'C'].map((char, i) => {
            const charPop = spring({
              frame: Math.max(0, localFrame - (25 + i * 14)),
              fps,
              config: { damping: 10, stiffness: 120 }
            });
            const offsets = [
              { x: -140, y: 15 },
              { x: 0, y: -20 },
              { x: 140, y: -50 }
            ];

            return (
              <div
                key={char}
                style={{
                  position: 'absolute',
                  transform: `translate(${offsets[i].x}px, ${offsets[i].y}px) scale(${charPop})`,
                  width: 54,
                  height: 54,
                  borderRadius: '14px',
                  backgroundColor: i % 2 === 0 ? '#f43f5e' : '#38bdf8',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Impact", sans-serif',
                  fontSize: 32,
                  boxShadow: `0 0 20px ${i % 2 === 0 ? '#f43f5e' : '#38bdf8'}`
                }}
              >
                {char}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- SCENE 3: LETTER 'A' BOUNCES ONTO APPLE ---
const SceneThreeApple = ({ localFrame, fps }: { localFrame: number; fps: number }) => {
  // A leaps and lands around frame 20-25
  const leapProgress = interpolate(localFrame, [5, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const jumpY = Math.sin(leapProgress * Math.PI) * -220;
  const currentX = interpolate(leapProgress, [0, 1], [-260, 40]);
  const currentY = interpolate(leapProgress, [0, 1], [0, -100]) + jumpY;

  // Apple squashes upon impact (frame 22 to 45)
  const impactSpring = spring({
    frame: Math.max(0, localFrame - 22),
    fps,
    config: { damping: 8, stiffness: 160, mass: 0.6 }
  });
  const appleSquashY = 1 - Math.sin(impactSpring * Math.PI) * 0.22;
  const appleSquashX = 1 + Math.sin(impactSpring * Math.PI) * 0.22;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 340 }}>
        <TelemetryPill label="PHONIC INTERACTION" value="A :: BOUNCE TARGET" active color="#f43f5e" />
      </div>

      <div style={{ position: 'relative', width: 700, height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Apple Entity */}
        <div
          style={{
            position: 'absolute',
            right: 120,
            bottom: 120,
            width: 280,
            height: 280,
            transform: `scale(${appleSquashX}, ${appleSquashY})`,
            transformOrigin: 'bottom center'
          }}
        >
          {/* Apple Glow Base */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#f43f5e',
              borderRadius: '130px 130px 150px 150px',
              boxShadow: '0 25px 60px rgba(244,63,94,0.4), inset -20px -20px 45px rgba(0,0,0,0.5), inset 25px 25px 45px rgba(255,255,255,0.3)',
              border: '3px solid rgba(255,255,255,0.2)'
            }}
          />

          {/* Apple Stem & Leaf */}
          <div
            style={{
              position: 'absolute',
              top: -30,
              left: 130,
              width: 14,
              height: 45,
              backgroundColor: '#78350f',
              borderRadius: '7px',
              transform: 'rotate(-10deg)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -24,
              left: 140,
              width: 55,
              height: 28,
              backgroundColor: '#10b981',
              borderRadius: '25px 0px 25px 0px',
              boxShadow: '0 0 15px rgba(16,185,129,0.7)',
              transform: 'rotate(20deg)'
            }}
          />

          {/* Sparkles on impact */}
          {localFrame > 22 && (
            <div
              style={{
                position: 'absolute',
                top: -50,
                left: 60,
                fontSize: 36,
                animation: 'pulse 0.3s'
              }}
            >
              💥
            </div>
          )}
        </div>

        {/* Dynamic Letter 'A' Mascot */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(${currentX}px, ${currentY}px) rotate(${leapProgress * 360}deg)`,
            width: 130,
            height: 130,
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            border: '5px solid #f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(244,63,94,0.6)',
            zIndex: 10
          }}
        >
          <span
            style={{
              fontFamily: '"Impact", sans-serif',
              fontSize: 82,
              color: '#f43f5e',
              lineHeight: 1
            }}
          >
            A
          </span>
        </div>
      </div>
    </div>
  );
};

// --- SCENE 4: LETTER 'B' ROLLS TO FUZZY BEAR ---
const SceneFourBear = ({ localFrame, fps }: { localFrame: number; fps: number }) => {
  const rollProg = interpolate(localFrame, [5, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const bX = interpolate(rollProg, [0, 1], [-300, 20]);
  const bRot = interpolate(rollProg, [0, 1], [0, 720]);

  const earWiggle = Math.sin(localFrame * 0.18) * 8;
  const catchSpring = spring({
    frame: Math.max(0, localFrame - 28),
    fps,
    config: { damping: 9, stiffness: 130 }
  });

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 340 }}>
        <TelemetryPill label="OBJECT ENCOUNTER" value="B :: FUZZY BEAR COMPANION" active color="#38bdf8" />
      </div>

      <div style={{ position: 'relative', width: 700, height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Round Wooden Dais */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            width: 520,
            height: 110,
            backgroundColor: '#1e293b',
            borderRadius: '50%',
            border: '3px solid #38bdf8',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 0 30px rgba(56,189,248,0.3)'
          }}
        />

        {/* 3D Stylized Teddy Bear */}
        <div
          style={{
            position: 'absolute',
            right: 140,
            bottom: 120,
            width: 260,
            height: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: `scale(${1 + catchSpring * 0.08})`,
            transformOrigin: 'bottom center'
          }}
        >
          {/* Bear Ears */}
          <div style={{ position: 'absolute', top: -10, left: 25, width: 60, height: 60, backgroundColor: '#b45309', borderRadius: '50%', border: '4px solid #78350f', transform: `rotate(${-earWiggle}deg)` }} />
          <div style={{ position: 'absolute', top: -10, right: 25, width: 60, height: 60, backgroundColor: '#b45309', borderRadius: '50%', border: '4px solid #78350f', transform: `rotate(${earWiggle}deg)` }} />

          {/* Bear Head */}
          <div
            style={{
              width: 210,
              height: 180,
              backgroundColor: '#d97706',
              borderRadius: '50%',
              border: '4px solid #78350f',
              boxShadow: 'inset 0 -15px 30px rgba(0,0,0,0.3), inset 0 15px 30px rgba(255,255,255,0.2)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Eyes */}
            <div style={{ display: 'flex', gap: 60, marginTop: -20 }}>
              <div style={{ width: 18, height: 26, backgroundColor: '#1e1b4b', borderRadius: '50%' }} />
              <div style={{ width: 18, height: 26, backgroundColor: '#1e1b4b', borderRadius: '50%' }} />
            </div>

            {/* Snout & Nose */}
            <div
              style={{
                width: 80,
                height: 55,
                backgroundColor: '#fef3c7',
                borderRadius: '50%',
                marginTop: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ width: 28, height: 18, backgroundColor: '#451a03', borderRadius: '14px 14px 6px 6px' }} />
            </div>
          </div>

          {/* Bear Body */}
          <div
            style={{
              width: 230,
              height: 160,
              backgroundColor: '#b45309',
              borderRadius: '115px 115px 60px 60px',
              border: '4px solid #78350f',
              marginTop: -25,
              zIndex: -1
            }}
          />
        </div>

        {/* Rolling Letter 'B' */}
        <div
          style={{
            position: 'absolute',
            left: 200,
            bottom: 140,
            transform: `translate3d(${bX}px, 0, 0) rotate(${bRot}deg)`,
            width: 120,
            height: 120,
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            border: '5px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 15px 35px rgba(56,189,248,0.7)',
            zIndex: 10
          }}
        >
          <span style={{ fontFamily: '"Impact", sans-serif', fontSize: 78, color: '#38bdf8', lineHeight: 1 }}>
            B
          </span>
        </div>
      </div>
    </div>
  );
};

// --- SCENE 5: LETTER 'C' DRIVES SPEEDY TOY CAR ---
const SceneFiveCar = ({ localFrame, fps }: { localFrame: number; fps: number }) => {
  const driveProg = spring({
    frame: localFrame,
    fps,
    config: { damping: 11, stiffness: 100, mass: 0.9 }
  });

  const carScale = interpolate(driveProg, [0, 1], [0.4, 1.15]);
  const carY = interpolate(driveProg, [0, 1], [-180, 80]);
  const wheelSpin = localFrame * 24;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 340 }}>
        <TelemetryPill label="SPEED VELOCITY" value="C :: 120 KM/H CRUISE" active color="#f43f5e" />
      </div>

      {/* Sweeping Perspective Track */}
      <div style={{ position: 'relative', width: 800, height: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="700" height="400" viewBox="0 0 700 400" style={{ position: 'absolute', bottom: 40, overflow: 'visible' }}>
          {/* Highway trapezoid */}
          <polygon points="260,20 440,20 660,380 40,380" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" opacity="0.8" />
          {/* Dashed center line */}
          <line
            x1="350"
            y1="20"
            x2="350"
            y2="380"
            stroke="#fbbf24"
            strokeWidth="10"
            strokeDasharray="30 25"
            strokeDashoffset={-localFrame * 15}
          />
        </svg>

        {/* 3D Toy Car */}
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            transform: `translateY(${carY}px) scale(${carScale})`,
            width: 380,
            height: 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.8))'
          }}
        >
          {/* Letter 'C' sitting in Driver Seat */}
          <div
            style={{
              position: 'absolute',
              top: -50,
              width: 100,
              height: 100,
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '4px solid #f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(244,63,94,0.8)',
              zIndex: 3
            }}
          >
            <span style={{ fontFamily: '"Impact", sans-serif', fontSize: 68, color: '#f43f5e', lineHeight: 1 }}>
              C
            </span>
          </div>

          {/* Car Body Canopy */}
          <div
            style={{
              width: 240,
              height: 90,
              backgroundColor: '#0284c7',
              borderRadius: '60px 60px 0 0',
              border: '4px solid #38bdf8',
              position: 'relative'
            }}
          >
            <div style={{ position: 'absolute', inset: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '50px 50px 0 0' }} />
          </div>

          {/* Car Chassis */}
          <div
            style={{
              width: 380,
              height: 95,
              backgroundColor: '#f43f5e',
              borderRadius: '28px',
              border: '4px solid #ffffff',
              boxShadow: 'inset 0 10px 25px rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              position: 'relative',
              zIndex: 2
            }}
          >
            {/* Glowing Headlights */}
            <div style={{ width: 22, height: 40, backgroundColor: '#fef08a', borderRadius: '8px', boxShadow: '0 0 25px #fef08a' }} />
            <div style={{ width: 22, height: 40, backgroundColor: '#fef08a', borderRadius: '8px', boxShadow: '0 0 25px #fef08a' }} />
          </div>

          {/* Wheels */}
          <div style={{ position: 'absolute', bottom: -24, width: '100%', display: 'flex', justifyContent: 'space-around', padding: '0 30px', zIndex: 1 }}>
            {[0, 1].map((w) => (
              <div
                key={w}
                style={{
                  width: 65,
                  height: 65,
                  backgroundColor: '#0f172a',
                  borderRadius: '50%',
                  border: '6px solid #e2e8f0',
                  transform: `rotate(${wheelSpin}deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{ width: 14, height: 14, backgroundColor: '#f43f5e', borderRadius: '50%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SCENE 6: CARDS SNAP INTO WORDS ---
const SceneSixStack = ({ localFrame, fps }: { localFrame: number; fps: number }) => {
  const cards = [
    { char: 'C', color: '#f43f5e', delay: 4 },
    { char: 'A', color: '#38bdf8', delay: 14 },
    { char: 'B', color: '#10b981', delay: 24 }
  ];

  const snapAll = spring({
    frame: Math.max(0, localFrame - 38),
    fps,
    config: { damping: 10, stiffness: 140 }
  });

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 340 }}>
        <TelemetryPill label="SYNTAX COMPOSITION" value="3 CHARACTERS // COHESION 100%" active color="#38bdf8" />
      </div>

      <div style={{ position: 'relative', width: 700, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {cards.map((card, idx) => {
          const cardSpring = spring({
            frame: Math.max(0, localFrame - card.delay),
            fps,
            config: { damping: 12, stiffness: 110 }
          });

          // Animate from scattered to connected horizontal word formation
          const scatterX = (idx - 1) * 260;
          const snapX = (idx - 1) * 160;
          const currentX = interpolate(snapAll, [0, 1], [scatterX, snapX]);
          const cardRot = interpolate(snapAll, [0, 1], [(idx - 1) * 14, 0]);

          return (
            <div
              key={card.char}
              style={{
                position: 'absolute',
                transform: `translateX(${currentX}px) rotate(${cardRot}deg) scale(${cardSpring})`,
                width: 145,
                height: 195,
                backgroundColor: '#111827',
                border: `4px solid ${card.color}`,
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 15px 40px rgba(0,0,0,0.8), 0 0 25px ${card.color}40}`,
                zIndex: idx + 2
              }}
            >
              <div
                style={{
                  fontFamily: '"Impact", sans-serif',
                  fontSize: 90,
                  color: card.color,
                  lineHeight: 1
                }}
              >
                {card.char}
              </div>
              <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#94a3b8', marginTop: 10, letterSpacing: 2 }}>
                TOY #{idx + 1}
              </div>
            </div>
          );
        })}

        {/* Word Synthesis Banner */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            transform: `scale(${snapAll})`,
            backgroundColor: 'rgba(255,255,255,0.08)',
            padding: '12px 36px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <span style={{ color: '#fbbf24', fontSize: 20 }}>★</span>
          <span style={{ fontFamily: '"Impact", sans-serif', fontSize: 28, letterSpacing: 3, color: '#ffffff' }}>
            WORD FORMED: "CAB"
          </span>
          <span style={{ color: '#fbbf24', fontSize: 20 }}>★</span>
        </div>
      </div>
    </div>
  );
};

// --- SCENE 7: CTA GRAND FINALE & BITTRIX OUTRO TRANSITION ---
const SceneSevenOutro = ({ localFrame, fps }: { localFrame: number; fps: number }) => {
  // First half: Phonics Play CTA; Second half: Bittrix Outro Exact
  const isBittrixPhase = localFrame >= 50;
  const bittrixLocalFrame = Math.max(0, localFrame - 50);

  const btnInflate = spring({
    frame: localFrame,
    fps,
    config: { damping: 10, stiffness: 120 }
  });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Phonics Mascots & Big Play Button (Frames 0 to 52) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: interpolate(localFrame, [46, 52], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: isBittrixPhase ? 'none' : 'auto'
        }}
      >
        <div style={{ position: 'absolute', top: 340 }}>
          <TelemetryPill label="FINAL ADVENTURE" value="READY TO PLAY" active color="#f43f5e" />
        </div>

        {/* Giant Tactile 3D Play Button */}
        <div
          style={{
            transform: `scale(${btnInflate})`,
            width: 240,
            height: 240,
            backgroundColor: '#f43f5e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 60px rgba(244,63,94,0.8), inset 0 10px 25px rgba(255,255,255,0.4)',
            border: '6px solid #ffffff'
          }}
        >
          <svg width="90" height="90" viewBox="0 0 24 24" fill="#ffffff" style={{ marginLeft: 14 }}>
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </div>

        {/* Mascots Cheering Around */}
        {['A', 'B', 'C'].map((char, i) => {
          const mascotBounce = Math.sin(localFrame * 0.15 + i * 1.5) * 18;
          const pos = [
            { x: -220, y: 140 },
            { x: 0, y: 200 },
            { x: 220, y: 140 }
          ];

          return (
            <div
              key={char}
              style={{
                position: 'absolute',
                transform: `translate(${pos[i].x}px, ${pos[i].y + mascotBounce}px)`,
                width: 75,
                height: 75,
                borderRadius: '18px',
                backgroundColor: i === 1 ? '#38bdf8' : '#f43f5e',
                color: '#ffffff',
                fontFamily: '"Impact", sans-serif',
                fontSize: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
              }}
            >
              {char}
            </div>
          );
        })}
      </div>

      {/* Bittrix Technologies Exact Outro (Frames 50 to 122) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: interpolate(localFrame, [48, 54], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          pointerEvents: !isBittrixPhase ? 'none' : 'auto'
        }}
      >
        <BittrixOutroExact />
      </div>
    </div>
  );
};

// --- MAIN GENERATED REMOTION COMPONENT ---
export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find active scene index based on frame
  const currentSceneIndex = useMemo(() => {
    let accumulated = 0;
    for (let i = 0; i < SCENES.length; i++) {
      if (frame >= accumulated && frame < accumulated + SCENES[i].durationInFrames) {
        return i;
      }
      accumulated += SCENES[i].durationInFrames;
    }
    return SCENES.length - 1;
  }, [frame]);

  const activeScene = SCENES[currentSceneIndex];
  const localSceneFrame = frame - activeScene.startFrame;

  // Single Canvas / Continuous Camera Tracking
  const cameraTransforms = useMemo(() => {
    // Camera coordinates for each scene focal anchor
    const waypoints = [
      { x: 0, y: -20, scale: 1.0 },   // S1: Chest
      { x: 20, y: 30, scale: 1.05 },  // S2: Island
      { x: -50, y: -10, scale: 1.1 }, // S3: Apple
      { x: 50, y: 10, scale: 1.08 },  // S4: Bear
      { x: 0, y: 40, scale: 1.15 },   // S5: Car
      { x: 0, y: -10, scale: 1.0 },   // S6: Cards
      { x: 0, y: 0, scale: 1.04 }     // S7: Finale
    ];

    const currentWaypoint = waypoints[currentSceneIndex];
    const nextWaypoint = waypoints[Math.min(currentSceneIndex + 1, waypoints.length - 1)];

    // Smooth transition in final 15 frames of each scene
    const transProg = interpolate(
      localSceneFrame,
      [activeScene.durationInFrames - 15, activeScene.durationInFrames],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const camX = interpolate(transProg, [0, 1], [currentWaypoint.x, nextWaypoint.x]);
    const camY = interpolate(transProg, [0, 1], [currentWaypoint.y, nextWaypoint.y]);
    const camScale = interpolate(transProg, [0, 1], [currentWaypoint.scale, nextWaypoint.scale]);

    // Idle organic camera sway
    const camSwayX = Math.sin(frame * 0.03) * 6;
    const camSwayY = Math.cos(frame * 0.025) * 6;

    return {
      camX: camX + camSwayX,
      camY: camY + camSwayY,
      camScale
    };
  }, [frame, currentSceneIndex, localSceneFrame, activeScene]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07080e',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Background Matrix Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }}
      />

      {/* Floating Animated Ambient Particles */}
      <BackgroundParticles frame={frame} />

      {/* CONTINUOUS CAMERA RIG */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate3d(${cameraTransforms.camX}px, ${cameraTransforms.camY}px, 0) scale(${cameraTransforms.camScale})`,
          transformOrigin: '540px 960px'
        }}
      >
        {/* TOP CINEMATIC HEADER & TITLE HUD */}
        <div
          style={{
            position: 'absolute',
            top: 90,
            left: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 60px',
            zIndex: 40
          }}
        >
          <KineticTitle
            title={activeScene.on_screen_text}
            subtitle={`SCENE 0${activeScene.scene_number} // ${activeScene.role.toUpperCase()}`}
            badgeColor={activeScene.themeColor}
          />
        </div>

        {/* SCENE RENDERING PIPELINE */}
        <Sequence from={0} durationInFrames={94}>
          <SceneOneChest localFrame={frame - 0} fps={fps} />
        </Sequence>

        <Sequence from={94} durationInFrames={114}>
          <SceneTwoIsland localFrame={frame - 94} fps={fps} />
        </Sequence>

        <Sequence from={208} durationInFrames={94}>
          <SceneThreeApple localFrame={frame - 208} fps={fps} />
        </Sequence>

        <Sequence from={302} durationInFrames={84}>
          <SceneFourBear localFrame={frame - 302} fps={fps} />
        </Sequence>

        <Sequence from={386} durationInFrames={91}>
          <SceneFiveCar localFrame={frame - 386} fps={fps} />
        </Sequence>

        <Sequence from={477} durationInFrames={100}>
          <SceneSixStack localFrame={frame - 477} fps={fps} />
        </Sequence>

        <Sequence from={577} durationInFrames={122}>
          <SceneSevenOutro localFrame={frame - 577} fps={fps} />
        </Sequence>
      </div>

      {/* SYNCHRONIZED KARAOKE CAPTIONS (Safe Zone Above Bottom 20%) */}
      {currentSceneIndex < 6 || (currentSceneIndex === 6 && localSceneFrame < 50) ? (
        <div
          style={{
            position: 'absolute',
            bottom: 240,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 40px',
            zIndex: 50
          }}
        >
          <SyncCaptions
            words={activeScene.words}
            currentFrame={localSceneFrame}
            accentColor={activeScene.themeColor}
          />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}