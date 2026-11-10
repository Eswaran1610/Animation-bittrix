import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ============================================================================
// DATA & TYPES
// ============================================================================

interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface SceneConfig {
  scene_number: number;
  role: string;
  durationInFrames: number;
  narration: string;
  on_screen_text: string;
  themeColor: string;
  words: WordTiming[];
}

const SCENES: SceneConfig[] = [
  {
    scene_number: 1,
    role: "hook",
    durationInFrames: 313,
    narration: "Quantum key distribution uses single photons to exchange unbreakable encryption keys.",
    on_screen_text: "Quantum Key Distribution: Physics-Secured Keys",
    themeColor: "#0284c7",
    words: [
      { word: "Quantum", startFrame: 6, endFrame: 36 },
      { word: "key", startFrame: 37, endFrame: 51 },
      { word: "distribution", startFrame: 52, endFrame: 92 },
      { word: "uses", startFrame: 93, endFrame: 114 },
      { word: "single", startFrame: 115, endFrame: 135 },
      { word: "photons", startFrame: 136, endFrame: 172 },
      { word: "to", startFrame: 173, endFrame: 179 },
      { word: "exchange", startFrame: 179, endFrame: 211 },
      { word: "unbreakable", startFrame: 212, endFrame: 248 },
      { word: "encryption", startFrame: 248, endFrame: 279 },
      { word: "keys", startFrame: 280, endFrame: 313 }
    ]
  },
  {
    scene_number: 2,
    role: "mechanism",
    durationInFrames: 376,
    narration: "Transmitters encode random binary bits onto fragile quantum photon polarization bases.",
    on_screen_text: "BB84 Protocol: Dual-Basis Polarization",
    themeColor: "#6366f1",
    words: [
      { word: "Transmitters", startFrame: 52, endFrame: 94 },
      { word: "encode", startFrame: 94, endFrame: 118 },
      { word: "random", startFrame: 118, endFrame: 142 },
      { word: "binary", startFrame: 143, endFrame: 171 },
      { word: "bits", startFrame: 171, endFrame: 188 },
      { word: "onto", startFrame: 189, endFrame: 207 },
      { word: "fragile", startFrame: 208, endFrame: 236 },
      { word: "quantum", startFrame: 237, endFrame: 261 },
      { word: "photon", startFrame: 262, endFrame: 292 },
      { word: "polarization", startFrame: 293, endFrame: 340 },
      { word: "bases", startFrame: 340, endFrame: 376 }
    ]
  },
  {
    scene_number: 3,
    role: "security-proof",
    durationInFrames: 377,
    narration: "Any eavesdropper measuring the stream collapses quantum states, instantly exposing the intrusion.",
    on_screen_text: "No-Cloning Principle: Observation Triggers Errors",
    themeColor: "#e11d48",
    words: [
      { word: "Any", startFrame: 52, endFrame: 71 },
      { word: "eavesdropper", startFrame: 72, endFrame: 111 },
      { word: "measuring", startFrame: 111, endFrame: 138 },
      { word: "the", startFrame: 138, endFrame: 143 },
      { word: "stream", startFrame: 144, endFrame: 167 },
      { word: "collapses", startFrame: 168, endFrame: 201 },
      { word: "quantum", startFrame: 202, endFrame: 225 },
      { word: "states", startFrame: 226, endFrame: 255 },
      { word: "instantly", startFrame: 270, endFrame: 297 },
      { word: "exposing", startFrame: 297, endFrame: 332 },
      { word: "the", startFrame: 332, endFrame: 336 },
      { word: "intrusion", startFrame: 337, endFrame: 377 }
    ]
  },
  {
    scene_number: 4,
    role: "resolution",
    durationInFrames: 364,
    narration: "Discarding disturbed photons leaves Alice and Bob with perfectly synchronized secret keys.",
    on_screen_text: "Sifted Key: 100% Entropy One-Time Pad",
    themeColor: "#10b981",
    words: [
      { word: "Discarding", startFrame: 52, endFrame: 85 },
      { word: "disturbed", startFrame: 86, endFrame: 115 },
      { word: "photons", startFrame: 116, endFrame: 151 },
      { word: "leaves", startFrame: 152, endFrame: 172 },
      { word: "Alice", startFrame: 172, endFrame: 198 },
      { word: "and", startFrame: 199, endFrame: 209 },
      { word: "Bob", startFrame: 210, endFrame: 230 },
      { word: "with", startFrame: 231, endFrame: 239 },
      { word: "perfectly", startFrame: 240, endFrame: 268 },
      { word: "synchronized", startFrame: 269, endFrame: 308 },
      { word: "secret", startFrame: 309, endFrame: 331 },
      { word: "keys", startFrame: 332, endFrame: 364 }
    ]
  },
  {
    scene_number: 5,
    role: "cta",
    durationInFrames: 295,
    narration: "Follow Bittrix Technologies for more interesting concepts.",
    on_screen_text: "Bittrix Technologies",
    themeColor: "#5b1a78",
    words: [
      { word: "Follow", startFrame: 52, endFrame: 77 },
      { word: "Bittrix", startFrame: 78, endFrame: 103 },
      { word: "Technologies", startFrame: 104, endFrame: 148 },
      { word: "for", startFrame: 149, endFrame: 156 },
      { word: "more", startFrame: 157, endFrame: 169 },
      { word: "interesting", startFrame: 170, endFrame: 201 },
      { word: "concepts", startFrame: 201, endFrame: 247 }
    ]
  }
];

// Precompute absolute scene offsets
const SCENE_OFFSETS: number[] = (() => {
  const offsets: number[] = [0];
  for (let i = 0; i < SCENES.length; i++) {
    offsets.push(offsets[i] + SCENES[i].durationInFrames);
  }
  return offsets;
})();

// ============================================================================
// VECTOR & PHYSICAL MECHANICS HELPERS
// ============================================================================

// Sinusoidal wavepacket with Gaussian envelope: e^(-(x/w)^2) * sin(kx)
function generateWavepacketPath(
  centerX: number,
  centerY: number,
  length: number,
  amplitude: number,
  frequency: number,
  phase: number,
  envelopeWidth: number
): string {
  const points: string[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const relX = -length / 2 + (i / steps) * length;
    const normX = relX / (envelopeWidth || 1);
    const env = Math.exp(-0.5 * normX * normX);
    const wave = Math.sin((relX * frequency * 0.1) - phase);
    const y = centerY + env * amplitude * wave;
    const x = centerX + relX;
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.join(' ');
}

// ============================================================================
// BESPOKE QUANTUM GRAPHICS COMPONENTS
// ============================================================================

// High-tech Optical Laser Diode / Transmitter Transmitter Alice
const AliceEmitterNode: React.FC<{
  x: number;
  y: number;
  active: boolean;
  frame: number;
  themeColor: string;
}> = ({ x, y, active, frame, themeColor }) => {
  const pulse = Math.sin(frame * 0.25) * 0.5 + 0.5;
  const rotation = (frame * 1.5) % 360;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Outer Cryostat Chamber / Mount */}
      <rect
        x={-55}
        y={-45}
        width={110}
        height={90}
        rx={6}
        fill="#0b1120"
        stroke="#1e293b"
        strokeWidth={2.5}
      />
      {/* Precision Micro-Heatsink fins */}
      {[-35, -25, -15, -5, 5, 15, 25, 35].map((offY) => (
        <line
          key={offY}
          x1={-50}
          y1={offY}
          x2={-42}
          y2={offY}
          stroke="#334155"
          strokeWidth={2}
        />
      ))}
      {/* Optical Core */}
      <polygon
        points="-25,-25 20,-18 20,18 -25,25"
        fill="#030712"
        stroke={themeColor}
        strokeWidth={1.8}
        strokeOpacity={0.8}
      />
      {/* Collimator Aperture Blades */}
      <g transform={`rotate(${rotation})`}>
        <polygon points="-8,-14 8,-14 0,-4" fill={themeColor} fillOpacity={0.6} />
        <polygon points="-14,8 -14,-8 -4,0" fill={themeColor} fillOpacity={0.6} />
        <polygon points="8,14 -8,14 0,4" fill={themeColor} fillOpacity={0.6} />
        <polygon points="14,-8 14,8 4,0" fill={themeColor} fillOpacity={0.6} />
      </g>
      {/* Optical Emission Orifice */}
      <polygon
        points="22,-14 36,-8 36,8 22,14"
        fill="#1e293b"
        stroke="#475569"
        strokeWidth={1.5}
      />
      {/* Emitted Photon Laser Beam Cone */}
      {active && (
        <polygon
          points="36,-6 140,-20 140,20 36,6"
          fill={`url(#laserGlow-${themeColor.replace('#', '')})`}
          opacity={0.35 + pulse * 0.25}
        />
      )}
      {/* HUD Label */}
      <text
        x={0}
        y={58}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
        fontWeight="700"
        letterSpacing="1.5"
      >
        ALICE : SOURCE
      </text>
      <text
        x={0}
        y={72}
        textAnchor="middle"
        fill={themeColor}
        fontSize="9"
        fontFamily="ui-monospace, monospace"
        letterSpacing="1"
      >
        λ = 1550nm [PULSED]
      </text>
    </g>
  );
};

// Beam Splitter / Polarization Analyzer Bob
const BobReceiverNode: React.FC<{
  x: number;
  y: number;
  frame: number;
  themeColor: string;
  detectorTrigger: number;
}> = ({ x, y, frame, themeColor, detectorTrigger }) => {
  const triggerGlow = Math.max(0, Math.sin(detectorTrigger * Math.PI));

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Receiver Outer Enclosure */}
      <rect
        x={-60}
        y={-60}
        width={120}
        height={120}
        rx={8}
        fill="#090d16"
        stroke="#1e293b"
        strokeWidth={2}
      />
      {/* 50:50 Beam Splitter Cube */}
      <rect
        x={-24}
        y={-24}
        width={48}
        height={48}
        fill="#0f172a"
        stroke="#38bdf8"
        strokeWidth={1.5}
        strokeOpacity={0.6}
      />
      {/* Internal Beam-Splitting Dielectric Interface */}
      <line
        x1={-24}
        y1={24}
        x2={24}
        y2={-24}
        stroke="#38bdf8"
        strokeWidth={2.5}
        strokeDasharray="3 2"
      />
      {/* Channel 0: Horizontal Detector (Right) */}
      <rect
        x={32}
        y={-12}
        width={22}
        height={24}
        fill={triggerGlow > 0.3 ? '#10b981' : '#1e293b'}
        stroke="#334155"
        strokeWidth={1.5}
      />
      <text
        x={43}
        y={3}
        textAnchor="middle"
        fill="#f8fafc"
        fontSize="8"
        fontFamily="ui-monospace, monospace"
        fontWeight="bold"
      >
        D0
      </text>
      {/* Channel 1: Vertical Detector (Top) */}
      <rect
        x={-12}
        y={-54}
        width={24}
        height={22}
        fill={triggerGlow > 0.6 ? '#6366f1' : '#1e293b'}
        stroke="#334155"
        strokeWidth={1.5}
      />
      <text
        x={0}
        y={-40}
        textAnchor="middle"
        fill="#f8fafc"
        fontSize="8"
        fontFamily="ui-monospace, monospace"
        fontWeight="bold"
      >
        D1
      </text>
      {/* Reticle Sight Lines */}
      <line x1={-34} y1={0} x2={-24} y2={0} stroke="#64748b" strokeWidth={1.5} />
      <polygon points="-24,0 -29,-4 -29,4" fill="#64748b" />
      {/* HUD Station Description */}
      <text
        x={0}
        y={76}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
        fontWeight="700"
        letterSpacing="1.5"
      >
        BOB : ANALYZER
      </text>
      <text
        x={0}
        y={90}
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
        letterSpacing="1"
      >
        APD DETECTOR MATRIX
      </text>
    </g>
  );
};

// Eavesdropper Eve Interception Probe (Collapser of Quantum States)
const EveInterceptionStation: React.FC<{
  x: number;
  y: number;
  active: boolean;
  frame: number;
}> = ({ x, y, active, frame }) => {
  const alertBlink = active ? (Math.sin(frame * 0.4) > 0 ? 1 : 0.25) : 0;
  const probeOsc = Math.sin(frame * 0.15) * 8;

  return (
    <g transform={`translate(${x}, ${y + probeOsc})`}>
      {/* Intrusion Warning Glow Filter */}
      {active && (
        <circle
          cx={0}
          cy={0}
          r={70}
          fill="none"
          stroke="#e11d48"
          strokeWidth={2}
          strokeDasharray="6 4"
          opacity={alertBlink}
        />
      )}
      {/* Spy Prism Module */}
      <polygon
        points="0,-48 42,24 -42,24"
        fill="#1a0b16"
        stroke={active ? '#e11d48' : '#701a75'}
        strokeWidth={2.5}
      />
      {/* Sensor Eye / Quantum Measurement Tap */}
      <polygon
        points="0,-18 16,12 -16,12"
        fill="#0f172a"
        stroke={active ? '#f43f5e' : '#a855f7'}
        strokeWidth={1.5}
      />
      <circle
        cx={0}
        cy={0}
        r={4}
        fill={active ? '#f43f5e' : '#c084fc'}
        opacity={active ? alertBlink : 0.8}
      />
      {/* Measurement Tap Fibers descending toward quantum channel */}
      <line
        x1={0}
        y1={24}
        x2={0}
        y2={110}
        stroke="#e11d48"
        strokeWidth={2}
        strokeDasharray="4 3"
        opacity={active ? 1 : 0.3}
      />
      <polygon
        points="-6,110 6,110 0,122"
        fill="#e11d48"
        opacity={active ? 1 : 0.4}
      />
      {/* Warning Readout */}
      <text
        x={0}
        y={-60}
        textAnchor="middle"
        fill={active ? '#fb7185' : '#a855f7'}
        fontSize="12"
        fontFamily="ui-monospace, monospace"
        fontWeight="800"
        letterSpacing="2"
      >
        {active ? '▲ EVE : INTERCEPTION ACTIVE' : 'EVE : INACTIVE'}
      </text>
      <text
        x={0}
        y={-76}
        textAnchor="middle"
        fill="#f43f5e"
        fontSize="9"
        fontFamily="ui-monospace, monospace"
        letterSpacing="1"
        opacity={active ? 1 : 0}
      >
        MEASUREMENT FORCES COLLAPSE (ΔQBER &gt; 25%)
      </text>
    </g>
  );
};

// Quantum Photon Wavepacket Particle with State Reticle
const QuantumPhotonParticle: React.FC<{
  x: number;
  y: number;
  basis: '+' | 'x';
  bit: 0 | 1;
  angle: number; // in degrees
  color: string;
  isCollapsed?: boolean;
  frame: number;
  opacity?: number;
}> = ({ x, y, basis, bit, angle, color, isCollapsed, frame, opacity = 1 }) => {
  const rad = (angle * Math.PI) / 180;
  const vectorLength = 26;
  const vx = Math.cos(rad) * vectorLength;
  const vy = -Math.sin(rad) * vectorLength;

  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      {/* Wavepacket Sinusoidal Tail */}
      <path
        d={generateWavepacketPath(0, 0, 80, 14, 0.45, frame * 0.4, 28)}
        fill="none"
        stroke={isCollapsed ? '#e11d48' : color}
        strokeWidth={1.8}
        opacity={0.65}
      />

      {/* Diamond Photon Framing Reticle */}
      <polygon
        points="0,-22 22,0 0,22 -22,0"
        fill="#040814"
        stroke={isCollapsed ? '#f43f5e' : color}
        strokeWidth={2}
      />

      {/* Polarization Angle Vector (Electric field arrow) */}
      <line
        x1={-vx}
        y1={-vy}
        x2={vx}
        y2={vy}
        stroke={isCollapsed ? '#fb7185' : '#ffffff'}
        strokeWidth={2.8}
        strokeLinecap="round"
      />
      {/* Arrow Heads */}
      <polygon
        points={`${vx},${vy} ${vx - 5 * Math.cos(rad - 0.5)},${vy + 5 * Math.sin(rad - 0.5)} ${vx - 5 * Math.cos(rad + 0.5)},${vy + 5 * Math.sin(rad + 0.5)}`}
        fill="#ffffff"
      />

      {/* Quantum State / Basis Badges */}
      <circle cx={-15} cy={-15} r={8} fill="#090d16" stroke="#475569" strokeWidth={1} />
      <text
        x={-15}
        y={-12}
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="9"
        fontWeight="bold"
        fontFamily="ui-monospace, monospace"
      >
        {basis}
      </text>

      <circle cx={15} cy={-15} r={8} fill="#090d16" stroke="#475569" strokeWidth={1} />
      <text
        x={15}
        y={-12}
        textAnchor="middle"
        fill="#a7f3d0"
        fontSize="9"
        fontWeight="bold"
        fontFamily="ui-monospace, monospace"
      >
        {bit}
      </text>

      {/* Collapsed State Glitch Dispersal Markers */}
      {isCollapsed && (
        <g stroke="#f43f5e" strokeWidth={1.5} opacity={0.8}>
          <line x1={-18} y1={-25} x2={-26} y2={-35} />
          <line x1={18} y1={-25} x2={26} y2={-35} />
          <line x1={-18} y1={25} x2={-28} y2={35} />
          <line x1={18} y1={25} x2={28} y2={35} />
          <text
            x={0}
            y={36}
            textAnchor="middle"
            fill="#f43f5e"
            fontSize="8"
            fontFamily="ui-monospace, monospace"
            fontWeight="bold"
          >
            COLLAPSED
          </text>
        </g>
      )}
    </g>
  );
};

// ============================================================================
// BITTRIX TECHNOLOGIES OUTRO: GEAR & CHAIN TRACK
// ============================================================================

// Procedural Precision Spur Gear
function generateGearPath(
  centerX: number,
  centerY: number,
  teeth: number,
  outerRadius: number,
  rootRadius: number,
  toothDepth: number
): string {
  const points: string[] = [];
  const tipRadius = outerRadius + toothDepth;
  const anglePerTooth = (2 * Math.PI) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * anglePerTooth;
    const a1 = a0 + anglePerTooth * 0.25;
    const a2 = a0 + anglePerTooth * 0.55;
    const a3 = a0 + anglePerTooth * 0.8;
    const a4 = (i + 1) * anglePerTooth;

    const r0x = centerX + Math.cos(a0) * rootRadius;
    const r0y = centerY + Math.sin(a0) * rootRadius;
    const t1x = centerX + Math.cos(a1) * tipRadius;
    const t1y = centerY + Math.sin(a1) * tipRadius;
    const t2x = centerX + Math.cos(a2) * tipRadius;
    const t2y = centerY + Math.sin(a2) * tipRadius;
    const r3x = centerX + Math.cos(a3) * rootRadius;
    const r3y = centerY + Math.sin(a3) * rootRadius;
    const r4x = centerX + Math.cos(a4) * rootRadius;
    const r4y = centerY + Math.sin(a4) * rootRadius;

    if (i === 0) {
      points.push(`M ${r0x.toFixed(2)} ${r0y.toFixed(2)}`);
    } else {
      points.push(`L ${r0x.toFixed(2)} ${r0y.toFixed(2)}`);
    }
    points.push(`L ${t1x.toFixed(2)} ${t1y.toFixed(2)}`);
    points.push(`L ${t2x.toFixed(2)} ${t2y.toFixed(2)}`);
    points.push(`L ${r3x.toFixed(2)} ${r3y.toFixed(2)}`);
    points.push(`L ${r4x.toFixed(2)} ${r4y.toFixed(2)}`);
  }
  points.push('Z');
  return points.join(' ');
}

// Chain Track Path Generator
const BittrixChainAndGearAssembly: React.FC<{
  frame: number;
  themeColor: string;
}> = ({ frame, themeColor }) => {
  // Continuous mechanical rotation
  const mainGearAngle = (frame * 1.8) % 360;
  const pinionGearAngle = (-frame * 3.6) % 360;
  const chainOffset = (frame * 2.2) % 40;

  // Track Dimensions for Chain Loop
  const gear1X = -120;
  const gear1Y = 0;
  const gear2X = 120;
  const gear2Y = 0;
  const sprocketRadius = 70;

  // Path of the oval chain track (top tangent, right semi-circle, bottom tangent, left semi-circle)
  const trackPath = `
    M ${gear1X} ${-sprocketRadius}
    L ${gear2X} ${-sprocketRadius}
    A ${sprocketRadius} ${sprocketRadius} 0 0 1 ${gear2X} ${sprocketRadius}
    L ${gear1X} ${sprocketRadius}
    A ${sprocketRadius} ${sprocketRadius} 0 0 1 ${gear1X} ${-sprocketRadius}
    Z
  `;

  // Number of links along the track
  const linkCount = 28;
  const straightLength = gear2X - gear1X; // 240
  const arcLength = Math.PI * sprocketRadius; // ~219.9
  const totalPerimeter = 2 * straightLength + 2 * arcLength; // ~919.8

  const links = useMemo(() => {
    return Array.from({ length: linkCount }).map((_, i) => {
      const dist = (i * (totalPerimeter / linkCount) + chainOffset) % totalPerimeter;

      let lx = 0;
      let ly = 0;
      let rot = 0;

      // Top straight segment
      if (dist < straightLength) {
        lx = gear1X + dist;
        ly = -sprocketRadius;
        rot = 0;
      }
      // Right arc
      else if (dist < straightLength + arcLength) {
        const u = (dist - straightLength) / arcLength;
        const angle = -Math.PI / 2 + u * Math.PI;
        lx = gear2X + Math.cos(angle) * sprocketRadius;
        ly = Math.sin(angle) * sprocketRadius;
        rot = (angle + Math.PI / 2) * (180 / Math.PI);
      }
      // Bottom straight segment (travels right to left)
      else if (dist < 2 * straightLength + arcLength) {
        const u = (dist - (straightLength + arcLength));
        lx = gear2X - u;
        ly = sprocketRadius;
        rot = 180;
      }
      // Left arc
      else {
        const u = (dist - (2 * straightLength + arcLength)) / arcLength;
        const angle = Math.PI / 2 + u * Math.PI;
        lx = gear1X + Math.cos(angle) * sprocketRadius;
        ly = Math.sin(angle) * sprocketRadius;
        rot = (angle + Math.PI / 2) * (180 / Math.PI);
      }

      return { id: i, lx, ly, rot };
    });
  }, [chainOffset, totalPerimeter, gear1X, gear2X, sprocketRadius]);

  return (
    <g transform="scale(1.15)">
      {/* Background Track Guide Rail */}
      <path
        d={trackPath}
        fill="none"
        stroke="#27103a"
        strokeWidth={28}
        strokeLinecap="round"
      />
      <path
        d={trackPath}
        fill="none"
        stroke="#4a1566"
        strokeWidth={14}
        strokeLinecap="round"
      />
      <path
        d={trackPath}
        fill="none"
        stroke="#9d4edd"
        strokeWidth={2}
        strokeDasharray="6 6"
        opacity={0.6}
      />

      {/* Sprocket Left Gear */}
      <g transform={`translate(${gear1X}, ${gear1Y}) rotate(${mainGearAngle})`}>
        <path
          d={generateGearPath(0, 0, 16, 56, 46, 12)}
          fill="#1c072b"
          stroke="#a855f7"
          strokeWidth={2.5}
        />
        {/* Gear Spokes */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1={0}
            y1={0}
            x2={Math.cos((deg * Math.PI) / 180) * 44}
            y2={Math.sin((deg * Math.PI) / 180) * 44}
            stroke="#6b21a8"
            strokeWidth={3.5}
          />
        ))}
        {/* Hub Bore */}
        <polygon
          points="0,-18 16,-6 16,12 0,18 -16,12 -16,-6"
          fill="#0c0214"
          stroke="#c084fc"
          strokeWidth={2}
        />
        <circle cx={0} cy={0} r={6} fill="#ec4899" />
      </g>

      {/* Sprocket Right Gear */}
      <g transform={`translate(${gear2X}, ${gear2Y}) rotate(${mainGearAngle})`}>
        <path
          d={generateGearPath(0, 0, 16, 56, 46, 12)}
          fill="#1c072b"
          stroke="#a855f7"
          strokeWidth={2.5}
        />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1={0}
            y1={0}
            x2={Math.cos((deg * Math.PI) / 180) * 44}
            y2={Math.sin((deg * Math.PI) / 180) * 44}
            stroke="#6b21a8"
            strokeWidth={3.5}
          />
        ))}
        <polygon
          points="0,-18 16,-6 16,12 0,18 -16,12 -16,-6"
          fill="#0c0214"
          stroke="#c084fc"
          strokeWidth={2}
        />
        <circle cx={0} cy={0} r={6} fill="#ec4899" />
      </g>

      {/* Meshing Center Pinion Drive Gear */}
      <g transform={`translate(0, -60) rotate(${pinionGearAngle})`}>
        <path
          d={generateGearPath(0, 0, 12, 38, 30, 9)}
          fill="#150522"
          stroke="#f43f5e"
          strokeWidth={2}
        />
        <circle cx={0} cy={0} r={12} fill="#270c3c" stroke="#f43f5e" strokeWidth={1.5} />
        <circle cx={0} cy={0} r={4} fill="#ffffff" />
      </g>

      {/* Moving Chain Links along Track */}
      {links.map((link) => (
        <g
          key={link.id}
          transform={`translate(${link.lx}, ${link.ly}) rotate(${link.rot})`}
        >
          {/* Mechanical Roller Chain Link Plate */}
          <rect
            x={-12}
            y={-6}
            width={24}
            height={12}
            rx={4}
            fill="#3b0764"
            stroke="#d8b4fe"
            strokeWidth={1.4}
          />
          {/* Roller Rivet Pins */}
          <circle cx={-6} cy={0} r={2.5} fill="#f3e8ff" />
          <circle cx={6} cy={0} r={2.5} fill="#f3e8ff" />
          <line x1={-6} y1={0} x2={6} y2={0} stroke="#9333ea" strokeWidth={1} />
        </g>
      ))}
    </g>
  );
};

// ============================================================================
// KINETIC KARAOKE CAPTIONS COMPONENT
// ============================================================================

const KineticKaraokeCaption: React.FC<{
  scene: SceneConfig;
  currentSceneFrame: number;
}> = ({ scene, currentSceneFrame }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: 1300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        zIndex: 50,
      }}
    >
      {/* On-screen Topic Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 18px',
          background: 'rgba(11, 17, 32, 0.85)',
          borderRadius: 20,
          border: `1px solid ${scene.themeColor}66`,
          boxShadow: `0 0 20px ${scene.themeColor}33`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: scene.themeColor,
            boxShadow: `0 0 8px ${scene.themeColor}`,
          }}
        />
        <span
          style={{
            color: '#e2e8f0',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {scene.on_screen_text}
        </span>
      </div>

      {/* Kinetic Word-by-Word Caption Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px 14px',
          padding: '16px 28px',
          background: 'linear-gradient(180deg, rgba(3, 7, 18, 0.75) 0%, rgba(3, 7, 18, 0.92) 100%)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {scene.words.map((w, idx) => {
          const isActive =
            currentSceneFrame >= w.startFrame && currentSceneFrame <= w.endFrame;
          const isPast = currentSceneFrame > w.endFrame;

          return (
            <span
              key={`${w.word}-${idx}`}
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 30,
                fontWeight: isActive ? 800 : 600,
                color: isActive
                  ? '#ffffff'
                  : isPast
                  ? '#94a3b8'
                  : 'rgba(148, 163, 184, 0.4)',
                transform: isActive ? 'scale(1.12)' : 'scale(1)',
                transition: 'transform 0.1s ease, color 0.1s ease',
                textShadow: isActive
                  ? `0 0 16px ${scene.themeColor}, 0 0 32px ${scene.themeColor}aa`
                  : 'none',
                display: 'inline-block',
                position: 'relative',
              }}
            >
              {w.word}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -3,
                    left: 0,
                    width: '100%',
                    height: 3,
                    background: scene.themeColor,
                    borderRadius: 2,
                    boxShadow: `0 0 8px ${scene.themeColor}`,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN GENERATED REMOTION VIDEO COMPONENT
// ============================================================================

export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Find active scene and offset
  const { activeSceneIndex, currentScene, currentSceneFrame } = useMemo(() => {
    let index = 0;
    for (let i = 0; i < SCENES.length; i++) {
      if (
        frame >= SCENE_OFFSETS[i] &&
        frame < SCENE_OFFSETS[i] + SCENES[i].durationInFrames
      ) {
        index = i;
        break;
      }
    }
    // Clamping safeguard for last frame
    if (frame >= SCENE_OFFSETS[SCENES.length - 1] + SCENES[SCENES.length - 1].durationInFrames) {
      index = SCENES.length - 1;
    }
    const scene = SCENES[index];
    const offset = SCENE_OFFSETS[index];
    return {
      activeSceneIndex: index,
      currentScene: scene,
      currentSceneFrame: frame - offset,
    };
  }, [frame]);

  // Global camera pan across the physical quantum optical bench
  const cameraX = interpolate(
    frame,
    [0, 313, 689, 1066, 1430, 1725],
    [0, -180, -420, -780, -1120, -1350],
    { extrapolateRight: 'clamp' }
  );

  const cameraScale = interpolate(
    frame,
    [0, 313, 689, 1066, 1430, 1725],
    [1.0, 1.05, 1.12, 1.08, 1.02, 1.0],
    { extrapolateRight: 'clamp' }
  );

  // Background subtle quantum interference grid
  const gridPan = (frame * 0.8) % 80;

  // Photon Stream Simulation parameters
  const streamPhotons = useMemo(() => {
    // 16 photon pulses traversing the channel
    return Array.from({ length: 16 }).map((_, idx) => {
      const basePos = (idx * 160 + frame * 3.8) % 2400 - 400;
      const isDiagonal = idx % 2 === 1;
      const bitValue = ((idx * 3 + 1) % 2) as 0 | 1;
      const angle = isDiagonal ? (bitValue ? 135 : 45) : (bitValue ? 90 : 0);
      const isInterruptedByEve =
        activeSceneIndex === 2 && basePos > 650 && basePos < 1250;

      return {
        id: idx,
        x: basePos,
        y: 540 + Math.sin(idx * 1.5) * 24,
        basis: (isDiagonal ? 'x' : '+') as '+' | 'x',
        bit: bitValue,
        angle,
        isCollapsed: isInterruptedByEve,
      };
    });
  }, [frame, activeSceneIndex]);

  // Sifted Key Table State for Scene 4
  const siftedTableRows = [
    { photon: '#01', aliceBasis: '+', bobBasis: '+', aliceBit: 1, bobBit: 1, match: true },
    { photon: '#02', aliceBasis: 'x', bobBasis: '+', aliceBit: 0, bobBit: 1, match: false },
    { photon: '#03', aliceBasis: 'x', bobBasis: 'x', aliceBit: 1, bobBit: 1, match: true },
    { photon: '#04', aliceBasis: '+', bobBasis: 'x', aliceBit: 0, bobBit: 0, match: false },
    { photon: '#05', aliceBasis: '+', bobBasis: '+', aliceBit: 0, bobBit: 0, match: true },
    { photon: '#06', aliceBasis: 'x', bobBasis: 'x', aliceBit: 1, bobBit: 1, match: true },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        width: 1920,
        height: 1080,
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* ==================================================================== */}
      {/* SVG FILTERS & SHADERS                                                */}
      {/* ==================================================================== */}
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="laserGlow-0284c7" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="laserGlow-6366f1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="fiberGuide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
          </linearGradient>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* ==================================================================== */}
      {/* LIVING BACKGROUND GRID & QUANTUM COORDINATE LINES                   */}
      {/* ==================================================================== */}
      <div
        style={{
          position: 'absolute',
          inset: -200,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          backgroundPosition: `${gridPan}px ${gridPan}px`,
          opacity: 0.7,
        }}
      />

      {/* Background Ambient Color Wash for active scene */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            activeSceneIndex === 4
              ? 'radial-gradient(circle at 50% 50%, rgba(91, 26, 120, 0.55) 0%, rgba(3, 7, 18, 0.95) 100%)'
              : `radial-gradient(circle at 60% 50%, ${currentScene.themeColor}1f 0%, rgba(3, 7, 18, 0.95) 75%)`,
          transition: 'background 0.5s ease',
        }}
      />

      {/* HUD Telemetry Top Bar */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
          color: '#64748b',
          letterSpacing: '0.15em',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          paddingBottom: 16,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ color: currentScene.themeColor, fontWeight: 700 }}>
            ● LIVE QUANTUM CHANNEL
          </span>
          <span>PROTOCOL: BB84-E91</span>
          <span>QBER THRESHOLD: 11.0%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span>CH: 1550.12nm</span>
          <span>FRAME: {frame} / 1725</span>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              background: `${currentScene.themeColor}22`,
              color: currentScene.themeColor,
              border: `1px solid ${currentScene.themeColor}55`,
              fontWeight: 800,
            }}
          >
            STAGE {currentScene.scene_number}: {currentScene.role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* CONTINUOUS LIVING MOTION CANVAS (SCENES 1 TO 4)                     */}
      {/* ==================================================================== */}
      {activeSceneIndex < 4 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate3d(${cameraX}px, 0px, 0px) scale(${cameraScale})`,
            transformOrigin: '960px 540px',
            transition: 'transform 0.05s linear',
          }}
        >
          <svg width={3600} height={1080} style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Optical Fiber Core Channel Rails */}
            <line
              x1={200}
              y1={540}
              x2={2800}
              y2={540}
              stroke="url(#fiberGuide)"
              strokeWidth={48}
              strokeLinecap="round"
              opacity={0.4}
            />
            <line
              x1={200}
              y1={540}
              x2={2800}
              y2={540}
              stroke="#0f172a"
              strokeWidth={22}
            />
            <line
              x1={200}
              y1={540}
              x2={2800}
              y2={540}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="16 12"
              opacity={0.7}
            />

            {/* Scale Graticule Ticks Along Channel */}
            {Array.from({ length: 40 }).map((_, i) => (
              <line
                key={i}
                x1={240 + i * 65}
                y1={515}
                x2={240 + i * 65}
                y2={525}
                stroke="#334155"
                strokeWidth={1.5}
              />
            ))}

            {/* ALICE Transmitter (Left Edge) */}
            <AliceEmitterNode
              x={220}
              y={540}
              active={true}
              frame={frame}
              themeColor={currentScene.themeColor}
            />

            {/* SCENE 2: Dual Basis Modulator Bench */}
            <g transform="translate(680, 540)">
              <rect
                x={-60}
                y={-85}
                width={120}
                height={170}
                rx={8}
                fill="#0b0f19"
                stroke="#6366f1"
                strokeWidth={2}
              />
              <text
                x={0}
                y={-95}
                textAnchor="middle"
                fill="#818cf8"
                fontSize="11"
                fontFamily="ui-monospace, monospace"
                fontWeight="bold"
              >
                POCKELS CELL [MODULATOR]
              </text>
              {/* Basis Selection Graphic */}
              <g transform="translate(0, -30)">
                <text x={-25} y={-8} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  RECTILINEAR (+)
                </text>
                <line x1={-35} y1={10} x2={-15} y2={10} stroke="#38bdf8" strokeWidth={2} />
                <line x1={-25} y1={0} x2={-25} y2={20} stroke="#38bdf8" strokeWidth={2} />

                <text x={25} y={-8} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  DIAGONAL (x)
                </text>
                <line x1={15} y1={0} x2={35} y2={20} stroke="#a7f3d0" strokeWidth={2} />
                <line x1={35} y1={0} x2={15} y2={20} stroke="#a7f3d0" strokeWidth={2} />
              </g>

              {/* Piezo Electric High-Voltage Plates */}
              <rect x={-45} y={15} width={90} height={10} fill="#312e81" stroke="#6366f1" />
              <rect x={-45} y={55} width={90} height={10} fill="#312e81" stroke="#6366f1" />
              <line
                x1={-35}
                y1={25}
                x2={-35}
                y2={55}
                stroke="#a5b4fc"
                strokeWidth={2}
                strokeDasharray="2 3"
              />
              <line
                x1={0}
                y1={25}
                x2={0}
                y2={55}
                stroke="#a5b4fc"
                strokeWidth={2}
                strokeDasharray="2 3"
              />
              <line
                x1={35}
                y1={25}
                x2={35}
                y2={55}
                stroke="#a5b4fc"
                strokeWidth={2}
                strokeDasharray="2 3"
              />
            </g>

            {/* SCENE 3: EVE Interception Station */}
            <EveInterceptionStation
              x={1300}
              y={380}
              active={activeSceneIndex === 2}
              frame={frame}
            />

            {/* BOB Receiver (Right End) */}
            <BobReceiverNode
              x={2100}
              y={540}
              frame={frame}
              themeColor={currentScene.themeColor}
              detectorTrigger={currentSceneFrame % 30}
            />

            {/* Transiting Quantum Photons with Polarization Vectors */}
            {streamPhotons.map((p) => (
              <QuantumPhotonParticle
                key={p.id}
                x={p.x}
                y={p.y}
                basis={p.basis}
                bit={p.bit}
                angle={p.angle}
                color={p.isCollapsed ? '#e11d48' : currentScene.themeColor}
                isCollapsed={p.isCollapsed}
                frame={frame}
              />
            ))}
          </svg>

          {/* ================================================================ */}
          {/* SCENE 4: SIFTED KEY RECONCILIATION OVERLAY                      */}
          {/* ================================================================ */}
          {activeSceneIndex === 3 && (
            <div
              style={{
                position: 'absolute',
                top: 210,
                left: 1450,
                width: 660,
                background: 'rgba(5, 12, 28, 0.94)',
                borderRadius: 14,
                border: '1px solid #10b98166',
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.25)',
                padding: '24px 28px',
                fontFamily: 'ui-monospace, monospace',
                zIndex: 45,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #1e293b',
                  paddingBottom: 12,
                  marginBottom: 16,
                }}
              >
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: 16 }}>
                  PUBLIC BASIS RECONCILIATION (BB84 SIFTING)
                </span>
                <span
                  style={{
                    background: '#10b98122',
                    color: '#34d399',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  SHANNON ENTROPY: 1.00
                </span>
              </div>

              {/* Reconciliation Comparison Matrix */}
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                    <th style={{ padding: '6px 4px' }}>PHOTON</th>
                    <th>ALICE BASIS</th>
                    <th>BOB BASIS</th>
                    <th>BASIS MATCH?</th>
                    <th>ACTION</th>
                    <th>SIFTED BIT</th>
                  </tr>
                </thead>
                <tbody>
                  {siftedTableRows.map((row, idx) => {
                    const rowAppear = currentSceneFrame > idx * 25;
                    return (
                      <tr
                        key={row.photon}
                        style={{
                          opacity: rowAppear ? 1 : 0.15,
                          transition: 'opacity 0.2s',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <td style={{ padding: '8px 4px', color: '#94a3b8' }}>{row.photon}</td>
                        <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{row.aliceBasis}</td>
                        <td style={{ color: '#a7f3d0', fontWeight: 'bold' }}>{row.bobBasis}</td>
                        <td style={{ color: row.match ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                          {row.match ? 'MATCH' : 'MISMATCH'}
                        </td>
                        <td style={{ color: row.match ? '#34d399' : '#fda4af' }}>
                          {row.match ? 'RETAIN' : 'DISCARD'}
                        </td>
                        <td>
                          {row.match ? (
                            <span
                              style={{
                                background: '#10b981',
                                color: '#030712',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontWeight: 800,
                              }}
                            >
                              {row.aliceBit}
                            </span>
                          ) : (
                            <span style={{ color: '#64748b' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Shared Secret Key Pad Result */}
              <div
                style={{
                  marginTop: 18,
                  padding: '12px 16px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  borderRadius: 8,
                  border: '1px solid #10b98155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#e2e8f0', fontSize: 12 }}>FINAL SYNCHRONIZED KEY:</span>
                <span
                  style={{
                    color: '#6ee7b7',
                    fontWeight: 900,
                    letterSpacing: '0.25em',
                    fontSize: 18,
                  }}
                >
                  [ 1 1 0 1 ]
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SCENE 5: BESPOKE BITTRIX TECHNOLOGIES OUTRO                          */}
      {/* ==================================================================== */}
      {activeSceneIndex === 4 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at 50% 45%, #5b1a78 0%, #1a0624 60%, #06010a 100%)',
            zIndex: 60,
          }}
        >
          {/* Mechanical Gear & Chain Track Assembly */}
          <div
            style={{
              position: 'relative',
              width: 800,
              height: 340,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <svg
              width={800}
              height={340}
              viewBox="-400 -170 800 340"
              style={{ overflow: 'visible' }}
            >
              <BittrixChainAndGearAssembly
                frame={currentSceneFrame}
                themeColor="#5b1a78"
              />
            </svg>
          </div>

          {/* Brand Typography & Kinetic CTA */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              marginTop: 10,
            }}
          >
            {/* Main Brand Title */}
            <h1
              style={{
                margin: 0,
                fontSize: 64,
                fontWeight: 900,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.04em',
                background: 'linear-gradient(180deg, #ffffff 0%, #e9d5ff 70%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(192, 132, 252, 0.6)',
                textTransform: 'uppercase',
              }}
            >
              Bittrix Technologies
            </h1>

            {/* Sub-tagline */}
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontFamily: 'ui-monospace, monospace',
                color: '#d8b4fe',
                letterSpacing: '0.22em',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Architecting Quantum & Deep Systems
            </p>

            {/* Subscribe / Follow CTA Pill */}
            <div
              style={{
                marginTop: 20,
                padding: '12px 36px',
                borderRadius: 30,
                background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                boxShadow: '0 0 30px rgba(236, 72, 153, 0.6), inset 0 0 12px rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                transform: `scale(${1 + Math.sin(currentSceneFrame * 0.15) * 0.03})`,
              }}
            >
              + Follow for Deep Tech
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SYNCHRONIZED KINETIC KARAOKE CAPTIONS                               */}
      {/* ==================================================================== */}
      <KineticKaraokeCaption
        scene={currentScene}
        currentSceneFrame={currentSceneFrame}
      />
    </AbsoluteFill>
  );
}