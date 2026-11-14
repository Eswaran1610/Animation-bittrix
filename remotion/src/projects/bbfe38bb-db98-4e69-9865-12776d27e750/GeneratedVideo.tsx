import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// ==========================================
// SCENE METADATA & WORD TIMINGS
// ==========================================
interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface SceneDef {
  scene_number: number;
  role: string;
  durationInFrames: number;
  startFrame: number;
  endFrame: number;
  narration: string;
  on_screen_text: string;
  themeColor: string;
  words: WordTiming[];
}

const RAW_SCENES = [
  {
    scene_number: 1,
    role: "hook",
    durationInFrames: 108,
    narration: "What if hackers steal your VPN password?",
    on_screen_text: "What If Hackers Breach VPN?",
    themeColor: "#f43f5e",
    rawWords: ["What", "if", "hackers", "steal", "your", "VPN", "password?"]
  },
  {
    scene_number: 2,
    role: "body",
    durationInFrames: 114,
    narration: "VPNs unlock the whole corporate castle.",
    on_screen_text: "The Castle And Moat Illusion",
    themeColor: "#38bdf8",
    rawWords: ["VPNs", "unlock", "the", "whole", "corporate", "castle."]
  },
  {
    scene_number: 3,
    role: "body",
    durationInFrames: 132,
    narration: "Attackers roam laterally across unlocked databases.",
    on_screen_text: "Unrestricted Lateral Movement",
    themeColor: "#f43f5e",
    rawWords: ["Attackers", "roam", "laterally", "across", "unlocked", "databases."]
  },
  {
    scene_number: 4,
    role: "body",
    durationInFrames: 132,
    narration: "Public concentrator ports stay dangerously exposed.",
    on_screen_text: "Exposed Perimeter Ports",
    themeColor: "#f43f5e",
    rawWords: ["Public", "concentrator", "ports", "stay", "dangerously", "exposed."]
  },
  {
    scene_number: 5,
    role: "body",
    durationInFrames: 126,
    narration: "Zero Trust enforces continuous verification.",
    on_screen_text: "Enter Zero Trust Architecture",
    themeColor: "#38bdf8",
    rawWords: ["Zero", "Trust", "enforces", "continuous", "verification."]
  },
  {
    scene_number: 6,
    role: "body",
    durationInFrames: 106,
    narration: "Users connect only to specific apps.",
    on_screen_text: "Direct Per-Application Tunnels",
    themeColor: "#38bdf8",
    rawWords: ["Users", "connect", "only", "to", "specific", "apps."]
  },
  {
    scene_number: 7,
    role: "body",
    durationInFrames: 111,
    narration: "Identity and device posture are validated.",
    on_screen_text: "Continuous Context Verification",
    themeColor: "#38bdf8",
    rawWords: ["Identity", "and", "device", "posture", "are", "validated."]
  },
  {
    scene_number: 8,
    role: "body",
    durationInFrames: 110,
    narration: "Lateral movement is completely eliminated.",
    on_screen_text: "Zero Lateral Attack Surface",
    themeColor: "#38bdf8",
    rawWords: ["Lateral", "movement", "is", "completely", "eliminated."]
  },
  {
    scene_number: 9,
    role: "cta",
    durationInFrames: 140,
    narration: "Follow Bittrix Technologies for more interesting concepts.",
    on_screen_text: "Upgrade To Zero Trust Today",
    themeColor: "#5b1a78",
    rawWords: ["Follow", "Bittrix", "Technologies", "for", "more", "interesting", "concepts."]
  }
];

// Build measured timing offsets
let accumulatedFrame = 0;
const SCENES: SceneDef[] = RAW_SCENES.map((s) => {
  const start = accumulatedFrame;
  const end = start + s.durationInFrames;
  accumulatedFrame = end;
  const wordCount = s.rawWords.length;
  const wordDuration = Math.floor(s.durationInFrames / wordCount);

  const words: WordTiming[] = s.rawWords.map((w, idx) => ({
    word: w,
    startFrame: start + idx * wordDuration,
    endFrame: start + (idx + 1) * wordDuration
  }));

  return {
    scene_number: s.scene_number,
    role: s.role,
    durationInFrames: s.durationInFrames,
    startFrame: start,
    endFrame: end,
    narration: s.narration,
    on_screen_text: s.on_screen_text,
    themeColor: s.themeColor,
    words
  };
});

// ==========================================
// BACKGROUND PARTICLES & AMBIENT MESH
// ==========================================
const AMBIENT_PARTICLES = Array.from({ length: 42 }).map((_, i) => ({
  id: i,
  x: (i * 247) % 1080,
  y: (i * 383) % 1920,
  size: 2 + (i % 5) * 1.5,
  speed: 0.8 + (i % 4) * 0.4,
  opacity: 0.2 + (i % 6) * 0.12,
  pulseSpeed: 0.05 + (i % 3) * 0.02
}));

export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Find active scene
  const activeSceneIndex = useMemo(() => {
    const idx = SCENES.findIndex((s) => frame >= s.startFrame && frame < s.endFrame);
    return idx === -1 ? SCENES.length - 1 : idx;
  }, [frame]);

  const activeScene = SCENES[activeSceneIndex];
  const sceneFrame = frame - activeScene.startFrame;

  // ----------------------------------------------------
  // CONTINUOUS CINEMATIC CAMERA SYSTEM
  // ----------------------------------------------------
  // Camera moves smoothly across a vast 3D-feeling coordinate stage
  const camX = interpolate(
    frame,
    [0, 108, 222, 354, 486, 612, 718, 829, 939, 1079],
    [0, -40, 50, -60, 0, 40, -30, 20, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camY = interpolate(
    frame,
    [0, 108, 222, 354, 486, 612, 718, 829, 939, 1079],
    [0, 30, -50, 40, 0, -30, 20, -20, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const camScale = interpolate(
    frame,
    [0, 108, 222, 354, 486, 612, 718, 829, 939, 1079],
    [1.0, 1.05, 1.02, 1.08, 1.0, 1.06, 1.03, 1.07, 1.0, 1.02],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Global color theme blend
  const isZeroTrustEra = frame >= 486;
  const isBittrixEra = frame >= 939;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#07080e',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* 1. LIVING CANVAS: Cyber Background Grid & Deep Gradient Radial */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isBittrixEra
            ? 'radial-gradient(circle at 50% 45%, #2a0b3b 0%, #100418 60%, #07080e 100%)'
            : isZeroTrustEra
            ? 'radial-gradient(circle at 50% 40%, rgba(56, 189, 248, 0.12) 0%, rgba(7, 8, 14, 0.95) 75%)'
            : 'radial-gradient(circle at 50% 38%, rgba(244, 63, 94, 0.15) 0%, rgba(7, 8, 14, 0.95) 75%)',
          transition: 'background 0.5s ease'
        }}
      />

      {/* Perspective Wireframe Ground Grid */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: -200,
          right: -200,
          height: 600,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: `perspective(600px) rotateX(70deg) translateY(${(frame * 1.5) % 60}px)`,
          opacity: 0.7,
          pointerEvents: 'none'
        }}
      />

      {/* Ambient Drifting Particles */}
      {AMBIENT_PARTICLES.map((p) => {
        const driftY = (p.y - frame * p.speed) % 1920;
        const actualY = driftY < 0 ? driftY + 1920 : driftY;
        const pulse = Math.sin(frame * p.pulseSpeed + p.id) * 0.3 + 0.7;
        const color = isBittrixEra
          ? '#fdf3d0'
          : isZeroTrustEra
          ? '#38bdf8'
          : '#f43f5e';

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: actualY,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: p.opacity * pulse,
              boxShadow: `0 0 10px ${color}`,
              pointerEvents: 'none'
            }}
          />
        );
      })}

      {/* 2. DYNAMIC CAMERA TRANSFORM STAGE */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${camX}px, ${camY}px) scale(${camScale})`,
          transformOrigin: '540px 960px',
          transition: 'transform 0.05s linear'
        }}
      >
        {/* ======================================================== */}
        {/* SCENE 1: QUESTION HOOK - CYBER PADLOCK BRUTE FORCE */}
        {/* ======================================================== */}
        {activeSceneIndex === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Brute force tension shake */}
            {(() => {
              const shakeX = Math.sin(frame * 1.2) * (frame > 40 ? 6 : 2);
              const shakeY = Math.cos(frame * 1.4) * (frame > 40 ? 4 : 1);
              const lockCrackProgress = interpolate(sceneFrame, [20, 95], [0, 100], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
              });

              return (
                <div
                  style={{
                    position: 'relative',
                    width: 440,
                    height: 480,
                    transform: `translate(${shakeX}px, ${shakeY}px)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Cyber Lock Shackle */}
                  <svg width="260" height="200" viewBox="0 0 260 200">
                    <path
                      d="M 40 180 L 40 100 A 90 90 0 0 1 220 100 L 220 180"
                      fill="none"
                      stroke={lockCrackProgress > 70 ? '#f43f5e' : '#38bdf8'}
                      strokeWidth="28"
                      strokeLinecap="round"
                      style={{
                        filter: `drop-shadow(0 0 16px ${
                          lockCrackProgress > 70 ? 'rgba(244,63,94,0.8)' : 'rgba(56,189,248,0.7)'
                        })`
                      }}
                    />
                  </svg>

                  {/* Lock Body */}
                  <div
                    style={{
                      width: 380,
                      height: 280,
                      marginTop: -40,
                      borderRadius: 36,
                      background: 'linear-gradient(145deg, #181d2a 0%, #0d111a 100%)',
                      border: '3px solid rgba(244, 63, 94, 0.6)',
                      boxShadow: '0 0 45px rgba(244, 63, 94, 0.4), inset 0 0 25px rgba(244, 63, 94, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Matrix Digital Stream behind lock */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 15,
                        left: 20,
                        right: 20,
                        fontFamily: 'monospace',
                        fontSize: 13,
                        color: 'rgba(244, 63, 94, 0.5)',
                        letterSpacing: 2
                      }}
                    >
                      AUTH_CRACK_ATTEMPT: 0x89EF44C...
                    </div>

                    {/* Keyhole with pulsing alert */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: '#f43f5e',
                        boxShadow: '0 0 25px #f43f5e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 38,
                          backgroundColor: '#07080e',
                          borderRadius: 6,
                          transform: 'translateY(16px)'
                        }}
                      />
                    </div>

                    {/* Password brute force digits */}
                    <div
                      style={{
                        marginTop: 48,
                        display: 'flex',
                        gap: 12
                      }}
                    >
                      {['*', '*', '*', '*', '*', '*'].map((ch, i) => (
                        <div
                          key={i}
                          style={{
                            width: 38,
                            height: 46,
                            borderRadius: 8,
                            backgroundColor: 'rgba(244, 63, 94, 0.15)',
                            border: '1.5px solid #f43f5e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: 28,
                            fontWeight: 'bold'
                          }}
                        >
                          {i < Math.floor(sceneFrame / 15) ? '•' : String(Math.floor((frame * 7 + i) % 10))}
                        </div>
                      ))}
                    </div>

                    {/* Laser scanning line */}
                    <div
                      style={{
                        position: 'absolute',
                        top: `${(sceneFrame * 4) % 280}px`,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: '#ffffff',
                        boxShadow: '0 0 12px #f43f5e'
                      }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 2: CORPORATE CASTLE & MOAT ILLUSION */}
        {/* ======================================================== */}
        {activeSceneIndex === 1 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* The Castle Perimeter Enclosure */}
            <div
              style={{
                position: 'relative',
                width: 720,
                height: 720,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Pulsing Moat Border */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 60,
                  border: '3px dashed #38bdf8',
                  boxShadow: '0 0 40px rgba(56, 189, 248, 0.3)',
                  transform: `rotate(${frame * 0.1}deg)`
                }}
              />

              {/* Castle Fortress Walls */}
              <div
                style={{
                  position: 'absolute',
                  inset: 40,
                  borderRadius: 48,
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: '2px solid rgba(56, 189, 248, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 30
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
                    paddingBottom: 15
                  }}
                >
                  <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 20 }}>
                    ENTERPRISE_INTERNAL_VLAN
                  </span>
                  <span style={{ color: '#f43f5e', fontSize: 16, fontWeight: 700 }}>
                    GATE: UNRESTRICTED
                  </span>
                </div>

                {/* Internal Server Clusters inside Castle */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 18,
                    marginTop: 35
                  }}
                >
                  {[
                    { label: 'FINANCE_DB', port: '1433' },
                    { label: 'CUSTOMER_CRM', port: '8443' },
                    { label: 'HR_PAYROLL', port: '3306' },
                    { label: 'SOURCE_GIT', port: '22' },
                    { label: 'CORE_KERBEROS', port: '88' },
                    { label: 'S3_BUCKETS', port: '9000' }
                  ].map((srv, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        border: '1.5px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: 16,
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 28,
                          backgroundColor: '#0f172a',
                          borderRadius: 6,
                          border: '1px solid #38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-around',
                          padding: '0 4px'
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{srv.label}</span>
                      <span style={{ fontSize: 11, color: '#38bdf8', fontFamily: 'monospace' }}>:{srv.port}</span>
                    </div>
                  ))}
                </div>

                {/* Single Piercing VPN Entry Line */}
                <div
                  style={{
                    marginTop: 35,
                    padding: 16,
                    borderRadius: 14,
                    backgroundColor: 'rgba(244, 63, 94, 0.15)',
                    border: '1.5px solid #f43f5e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 15
                  }}
                >
                  <span style={{ color: '#f43f5e', fontWeight: 900, fontSize: 18 }}>VPN TUNNEL BREACHED</span>
                  <span style={{ color: '#ffffff', fontSize: 15 }}>→ Full Subnet Granted</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 3: LATERAL MOVEMENT ACROSS DATABASES */}
        {/* ======================================================== */}
        {activeSceneIndex === 2 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Dark Network Topology Map */}
            <div style={{ position: 'relative', width: 840, height: 750 }}>
              <svg width="840" height="750" style={{ position: 'absolute', inset: 0 }}>
                {/* Lateral Compromise Path Lines */}
                <line x1="200" y1="200" x2="420" y2="380" stroke="#f43f5e" strokeWidth="4" strokeDasharray="8 6" />
                <line x1="420" y1="380" x2="680" y2="240" stroke="#f43f5e" strokeWidth="4" strokeDasharray="8 6" />
                <line x1="420" y1="380" x2="520" y2="600" stroke="#f43f5e" strokeWidth="4" strokeDasharray="8 6" />
                <line x1="200" y1="200" x2="220" y2="560" stroke="#f43f5e" strokeWidth="4" strokeDasharray="8 6" />

                {/* Lateral moving packet dot */}
                {(() => {
                  const pulsePos = (sceneFrame * 4) % 600;
                  return (
                    <circle
                      cx={200 + pulsePos * 0.8}
                      cy={200 + pulsePos * 0.65}
                      r="10"
                      fill="#ffffff"
                      filter="drop-shadow(0 0 10px #f43f5e)"
                    />
                  );
                })()}
              </svg>

              {/* Server Nodes */}
              {[
                { x: 120, y: 150, name: 'INITIAL_COMPROMISE', sub: 'VPN Client IP', infected: true },
                { x: 340, y: 320, name: 'DOMAIN_CONTROLLER', sub: 'Kerberos Tickets', infected: true },
                { x: 600, y: 180, name: 'PROD_DATABASE', sub: 'User Credentials', infected: sceneFrame > 40 },
                { x: 140, y: 500, name: 'BACKUP_VOLUMES', sub: 'Ransomware Target', infected: sceneFrame > 70 },
                { x: 440, y: 540, name: 'PAYMENT_GATEWAY', sub: 'Cardholder Data', infected: sceneFrame > 90 }
              ].map((node, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: 210,
                    padding: 16,
                    borderRadius: 18,
                    backgroundColor: '#0d111a',
                    border: `2px solid ${node.infected ? '#f43f5e' : '#38bdf8'}`,
                    boxShadow: node.infected ? '0 0 30px rgba(244, 63, 94, 0.6)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: node.infected ? '#f43f5e' : '#22c55e',
                        boxShadow: `0 0 8px ${node.infected ? '#f43f5e' : '#22c55e'}`
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#ffffff' }}>{node.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{node.sub}</span>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 10,
                      fontWeight: 'bold',
                      color: node.infected ? '#f43f5e' : '#38bdf8',
                      letterSpacing: 1
                    }}
                  >
                    {node.infected ? 'STATUS: EXPLOITED ✗' : 'SECURE ✓'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 4: EXPOSED PERIMETER CONCENTRATOR PORTS */}
        {/* ======================================================== */}
        {activeSceneIndex === 3 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Ominous Terminal Radar Badge */}
            <div
              style={{
                width: 760,
                borderRadius: 32,
                backgroundColor: 'rgba(13, 17, 26, 0.95)',
                border: '3px solid #f43f5e',
                boxShadow: '0 0 50px rgba(244, 63, 94, 0.4)',
                padding: 40,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {/* Radar Circle with Sweeping Scan Line */}
              <div
                style={{
                  position: 'relative',
                  width: 340,
                  height: 340,
                  borderRadius: '50%',
                  border: '2px solid rgba(244, 63, 94, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', width: '70%', height: '70%', borderRadius: '50%', border: '1px dashed rgba(244, 63, 94, 0.4)' }} />
                <div style={{ position: 'absolute', width: '40%', height: '40%', borderRadius: '50%', border: '1px solid rgba(244, 63, 94, 0.3)' }} />
                
                {/* Crosshairs */}
                <div style={{ position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(244, 63, 94, 0.3)' }} />
                <div style={{ position: 'absolute', height: '100%', width: 1, backgroundColor: 'rgba(244, 63, 94, 0.3)' }} />

                {/* Sweeping Radar Needle */}
                <div
                  style={{
                    position: 'absolute',
                    width: '50%',
                    height: '50%',
                    top: 0,
                    right: 0,
                    transformOrigin: '0% 100%',
                    transform: `rotate(${sceneFrame * 4}deg)`,
                    background: 'linear-gradient(45deg, rgba(244, 63, 94, 0.8) 0%, transparent 80%)'
                  }}
                />

                <span style={{ fontSize: 24, fontWeight: 900, color: '#f43f5e', zIndex: 2 }}>
                  PORT: 443
                </span>
              </div>

              {/* Public Exposure Info */}
              <div style={{ marginTop: 30, textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 26,
                    color: '#ffffff',
                    fontWeight: 700,
                    letterSpacing: 2
                  }}
                >
                  VPN.ENTERPRISE.CORP : 443
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 18,
                    color: '#f43f5e',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  ⚠️ 1,280,000 Shodan Scans Detected Daily
                </div>
                <div
                  style={{
                    marginTop: 15,
                    fontSize: 15,
                    color: '#94a3b8',
                    maxWidth: 520,
                    lineHeight: 1.5
                  }}
                >
                  Anyone on the public internet can ping, brute-force, or exploit zero-day buffer overflows on this boundary.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 5: PIVOT TO ZERO TRUST - CONTINUOUS VERIFICATION */}
        {/* ======================================================== */}
        {activeSceneIndex === 4 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Procedural 3D Decision Cube with Cyan Energy */}
            {(() => {
              const cubeRotate = sceneFrame * 1.5;
              const scaleSpring = spring({
                frame: sceneFrame,
                fps,
                config: { damping: 12, stiffness: 100 }
              });

              return (
                <div
                  style={{
                    transform: `scale(${scaleSpring})`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Rotating 3D Isometric Core */}
                  <div
                    style={{
                      width: 320,
                      height: 320,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Glowing Energy Aura */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: -20,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)',
                        filter: 'blur(25px)'
                      }}
                    />

                    {/* Isometric Cube Shell */}
                    <div
                      style={{
                        width: 220,
                        height: 220,
                        borderRadius: 36,
                        border: '4px solid #38bdf8',
                        backgroundColor: 'rgba(7, 8, 14, 0.85)',
                        boxShadow: '0 0 50px #38bdf8, inset 0 0 35px rgba(56, 189, 248, 0.4)',
                        transform: `rotate(${cubeRotate}deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: 140,
                          height: 140,
                          borderRadius: 24,
                          border: '2px dashed #ffffff',
                          transform: `rotate(-${cubeRotate * 2}deg)`
                        }}
                      />
                    </div>

                    {/* Center Trust Shield Icon */}
                    <div
                      style={{
                        position: 'absolute',
                        color: '#ffffff',
                        fontSize: 48,
                        fontWeight: 900
                      }}
                    >
                      🛡️
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 40,
                      fontSize: 32,
                      fontWeight: 900,
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: 2
                    }}
                  >
                    NEVER TRUST • ALWAYS VERIFY
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 18,
                      color: '#38bdf8',
                      fontWeight: 700
                    }}
                  >
                    CONTINUOUS REAL-TIME CONTEXT EVALUATION
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 6: DIRECT PER-APP MICROTUNNELS (BENTO STACK) */}
        {/* ======================================================== */}
        {activeSceneIndex === 5 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Vertical Bento Architecture Stack */}
            <div
              style={{
                width: 780,
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}
            >
              {[
                { app: 'Jira Software', route: 'user -> dev.company.com', allowed: true, delay: 0 },
                { app: 'Internal HR Portal', route: 'user -> hr.company.com', allowed: true, delay: 15 },
                { app: 'Database Subnet /24', route: 'user -> 10.0.4.0/24', allowed: false, delay: 30 },
                { app: 'Core Active Directory', route: 'user -> dc01.internal', allowed: false, delay: 45 }
              ].map((tunnel, idx) => {
                const itemSpring = spring({
                  frame: Math.max(0, sceneFrame - tunnel.delay),
                  fps,
                  config: { damping: 14, stiffness: 120 }
                });

                return (
                  <div
                    key={idx}
                    style={{
                      transform: `scale(${itemSpring})`,
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: `2px solid ${tunnel.allowed ? '#38bdf8' : '#f43f5e'}`,
                      borderRadius: 22,
                      padding: '24px 30px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: tunnel.allowed
                        ? '0 8px 30px rgba(56, 189, 248, 0.2)'
                        : '0 8px 30px rgba(244, 63, 94, 0.2)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff' }}>{tunnel.app}</div>
                      <div style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'monospace', marginTop: 4 }}>
                        {tunnel.route}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '10px 20px',
                        borderRadius: 12,
                        backgroundColor: tunnel.allowed ? 'rgba(56, 189, 248, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: tunnel.allowed ? '#38bdf8' : '#f43f5e',
                        fontWeight: 900,
                        fontSize: 15,
                        letterSpacing: 1
                      }}
                    >
                      {tunnel.allowed ? 'ISOLATED TUNNEL ✓' : 'ACCESS BLOCKED ✕'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 7: IDENTITY & DEVICE POSTURE VERIFICATION */}
        {/* ======================================================== */}
        {activeSceneIndex === 6 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Security Context Dashboard Card */}
            <div
              style={{
                width: 760,
                borderRadius: 30,
                backgroundColor: 'rgba(13, 17, 26, 0.95)',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 45px rgba(56, 189, 248, 0.3)',
                padding: 35
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 15,
                  borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
                  paddingBottom: 20
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#ffffff' }}>POSTURE_VERIFICATION_ENGINE</div>
                  <div style={{ fontSize: 14, color: '#38bdf8' }}>STATUS: PASS (ALL SIGNALS VALIDATED)</div>
                </div>
              </div>

              {/* Signals Grid */}
              <div style={{ marginTop: 25, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'EDR Agent Health Check', value: 'CrowdStrike Falcon Online', passed: true },
                  { label: 'Hardware TPM 2.0 Attestation', value: 'Hardware Key Secure Enclave', passed: true },
                  { label: 'Impossible Travel / Geolocation', value: 'Austin, TX (Expected IP Range)', passed: true },
                  { label: 'OS Patch Level', value: 'macOS 15.1 Compliance Met', passed: true }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(30, 41, 59, 0.6)',
                      borderRadius: 14,
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ color: '#ffffff', fontSize: 16, fontWeight: 700 }}>{item.label}</div>
                      <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>{item.value}</div>
                    </div>
                    <div style={{ color: '#22c55e', fontSize: 20, fontWeight: 900 }}>PASS ✓</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 8: SPLIT COMPARISON: VPN VS ZERO TRUST */}
        {/* ======================================================== */}
        {activeSceneIndex === 7 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 40px'
            }}
          >
            <div style={{ display: 'flex', width: '100%', gap: 30, justifyContent: 'center' }}>
              {/* Left Side: Legacy VPN */}
              <div
                style={{
                  flex: 1,
                  borderRadius: 26,
                  backgroundColor: 'rgba(244, 63, 94, 0.08)',
                  border: '2px solid #f43f5e',
                  padding: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 900, color: '#f43f5e', textTransform: 'uppercase' }}>
                  Legacy VPN
                </div>
                <div style={{ fontSize: 14, color: '#fda4af', marginTop: 4 }}>Castle-and-Moat</div>

                <div
                  style={{
                    width: '100%',
                    height: 280,
                    margin: '25px 0',
                    borderRadius: 16,
                    backgroundColor: '#07080e',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    padding: 15
                  }}
                >
                  <div style={{ color: '#f43f5e', fontWeight: 'bold' }}>🔓 1 Ingress Entry</div>
                  <div style={{ color: '#ffffff', fontSize: 13 }}>↓ Full Subnet Lateral Access</div>
                  <div style={{ color: '#f43f5e', fontWeight: 900, fontSize: 18 }}>🚨 RANSOMWARE SPREADS</div>
                </div>

                <div style={{ color: '#f43f5e', fontWeight: 900, fontSize: 16 }}>WIDE ATTACK SURFACE</div>
              </div>

              {/* Right Side: Zero Trust */}
              <div
                style={{
                  flex: 1,
                  borderRadius: 26,
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  border: '2px solid #38bdf8',
                  padding: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Zero Trust
                </div>
                <div style={{ fontSize: 14, color: '#bae6fd', marginTop: 4 }}>Micro-Segmentation</div>

                <div
                  style={{
                    width: '100%',
                    height: 280,
                    margin: '25px 0',
                    borderRadius: 16,
                    backgroundColor: '#07080e',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    padding: 15
                  }}
                >
                  <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>🔒 Zero Exposed Ports</div>
                  <div style={{ color: '#ffffff', fontSize: 13 }}>✓ Microtunnel Per App</div>
                  <div style={{ color: '#22c55e', fontWeight: 900, fontSize: 18 }}>🛡️ ZERO LATERAL HOP</div>
                </div>

                <div style={{ color: '#38bdf8', fontWeight: 900, fontSize: 16 }}>ATTACK SURFACE = 0</div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCENE 9: BITTRIX TECHNOLOGIES OUTRO (EXACT ROYAL PURPLE UI) */}
        {/* ======================================================== */}
        {activeSceneIndex === 8 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {(() => {
              const outroProgress = spring({
                frame: sceneFrame,
                fps,
                config: { damping: 14, stiffness: 100 }
              });

              const gearRotation = sceneFrame * 2.5;
              const lightSweepX = interpolate(sceneFrame, [20, 90], [-400, 400], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
              });

              return (
                <div
                  style={{
                    transform: `scale(${outroProgress})`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                >
                  {/* 6-Point Radial Gradient Hexagon with Spoke Circles */}
                  <div
                    style={{
                      position: 'relative',
                      width: 360,
                      height: 360,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Background Radial Glow */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: -30,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(91, 26, 120, 0.8) 0%, transparent 70%)',
                        filter: 'blur(30px)'
                      }}
                    />

                    {/* SVG Hexagon & Spoke Circles */}
                    <svg width="340" height="340" viewBox="0 0 340 340">
                      <polygon
                        points="170,20 300,95 300,245 170,320 40,245 40,95"
                        fill="none"
                        stroke="#fdf3d0"
                        strokeWidth="3"
                        strokeDasharray="6 6"
                      />
                      {[
                        [170, 20],
                        [300, 95],
                        [300, 245],
                        [170, 320],
                        [40, 245],
                        [40, 95]
                      ].map(([cx, cy], i) => (
                        <circle key={i} cx={cx} cy={cy} r="8" fill="#5b1a78" stroke="#fdf3d0" strokeWidth="2.5" />
                      ))}
                    </svg>

                    {/* Rotating 12-Tooth Gear with Serif 'B' */}
                    <div
                      style={{
                        position: 'absolute',
                        width: 190,
                        height: 190,
                        borderRadius: '50%',
                        backgroundColor: '#5b1a78',
                        border: '4px solid #fdf3d0',
                        boxShadow: '0 0 35px rgba(253, 243, 208, 0.4), inset 0 0 20px rgba(0,0,0,0.5)',
                        transform: `rotate(${gearRotation}deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {/* Gear Teeth */}
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            width: 14,
                            height: 24,
                            backgroundColor: '#fdf3d0',
                            borderRadius: 3,
                            transform: `rotate(${i * 30}deg) translateY(-94px)`
                          }}
                        />
                      ))}

                      {/* Counter-rotating Serif 'B' to stay upright */}
                      <span
                        style={{
                          transform: `rotate(-${gearRotation}deg)`,
                          fontSize: 92,
                          fontFamily: 'serif',
                          fontWeight: 900,
                          color: '#fdf3d0',
                          textShadow: '0 4px 12px rgba(0,0,0,0.6)'
                        }}
                      >
                        B
                      </span>
                    </div>
                  </div>

                  {/* Staggered Elastic "BITTRIX" Wordmark */}
                  <div
                    style={{
                      marginTop: 35,
                      display: 'flex',
                      gap: 6
                    }}
                  >
                    {'BITTRIX'.split('').map((char, index) => {
                      const charDelay = 15 + index * 4;
                      const charSpring = spring({
                        frame: Math.max(0, sceneFrame - charDelay),
                        fps,
                        config: { damping: 10, stiffness: 150 }
                      });

                      return (
                        <span
                          key={index}
                          style={{
                            transform: `scale(${charSpring})`,
                            fontSize: 64,
                            fontFamily: 'Impact, sans-serif',
                            fontStyle: 'italic',
                            fontWeight: 900,
                            color: '#fdf3d0',
                            letterSpacing: 4,
                            textShadow: '0 4px 20px rgba(91, 26, 120, 0.9)'
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
                      marginTop: 8,
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#ffffff',
                      letterSpacing: 10,
                      textTransform: 'uppercase'
                    }}
                  >
                    TECHNOLOGIES
                  </div>

                  {/* Expanding Purple Underline Bar with Diagonal Light Sweep */}
                  <div
                    style={{
                      position: 'relative',
                      marginTop: 18,
                      width: 420,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: '#5b1a78',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: 80,
                        background: 'linear-gradient(90deg, transparent, #fdf3d0, transparent)',
                        transform: `translateX(${lightSweepX}px)`
                      }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 3. SYNCHRONIZED KINETIC KARAOKE CAPTIONS (Anchored in Safe Caption Zone) */}
      <div
        style={{
          position: 'absolute',
          bottom: 230,
          left: 40,
          right: 40,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px 16px',
          zIndex: 100,
          pointerEvents: 'none'
        }}
      >
        {activeScene.words.map((item, index) => {
          const isActive = frame >= item.startFrame && frame <= item.endFrame;
          const isSpoken = frame > item.endFrame;

          return (
            <span
              key={index}
              style={{
                fontFamily: 'Impact, sans-serif',
                fontSize: isActive ? 52 : 46,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: isActive ? '#fef08a' : isSpoken ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                transform: isActive ? 'scale(1.18)' : 'scale(1.0)',
                textShadow: isActive
                  ? `0 0 20px #fef08a, 0 4px 12px rgba(0, 0, 0, 0.9)`
                  : '0 3px 8px rgba(0, 0, 0, 0.85)',
                transition: 'transform 0.08s ease, color 0.08s ease'
              }}
            >
              {item.word}
            </span>
          );
        })}
      </div>

      {/* 4. UPPER PROGRESS METRIC HUD */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: activeScene.themeColor,
              boxShadow: `0 0 10px ${activeScene.themeColor}`
            }}
          />
          <span
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: 18,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: 2,
              textTransform: 'uppercase'
            }}
          >
            {activeScene.on_screen_text}
          </span>
        </div>

        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 16,
            fontWeight: 700,
            color: activeScene.themeColor
          }}
        >
          0{activeScene.scene_number} / 09
        </span>
      </div>
    </AbsoluteFill>
  );
}