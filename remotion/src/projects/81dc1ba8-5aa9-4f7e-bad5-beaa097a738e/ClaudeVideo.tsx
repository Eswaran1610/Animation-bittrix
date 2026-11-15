import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';

export const soundEvents = [
  {"frame": 0, "role": "riser", "description": "hospital silhouette springs in"},
  {"frame": 30, "role": "sparkle", "description": "lit window pulses"},
  {"frame": 40, "role": "impact", "description": "AI AGENT badge lands"},
  {"frame": 96, "role": "click", "description": "Scheduling tab lights"},
  {"frame": 100, "role": "click", "description": "Billing tab lights"},
  {"frame": 104, "role": "click", "description": "Clinician tab lights"},
  {"frame": 125, "role": "pop", "description": "agent chip docks into the EHR"},
  {"frame": 143, "role": "chime", "description": "Scheduling tab flashes rose"},
  {"frame": 198, "role": "tick", "description": "appointment drops into new slot"},
  {"frame": 205, "role": "count", "description": "14,900 counter runs up"},
  {"frame": 272, "role": "slide", "description": "request card lands"},
  {"frame": 288, "role": "slide", "description": "payer rules card slides in"},
  {"frame": 296, "role": "draw", "description": "rule lines draw on"},
  {"frame": 306, "role": "slide", "description": "submitted card slides in"},
  {"frame": 335, "role": "impact", "description": "SUBMITTED stamp slams down"},
  {"frame": 417, "role": "tick", "description": "after bar starts shrinking"},
  {"frame": 424, "role": "count", "description": "-42% badge counts up"},
  {"frame": 441, "role": "click", "description": "cut segment breaks away"},
  {"frame": 472, "role": "pop", "description": "clinician silhouette springs in"},
  {"frame": 492, "role": "tick", "description": "note lines start typing"},
  {"frame": 560, "role": "draw", "description": "review path draws on"},
  {"frame": 604, "role": "ding", "description": "human review check lands"},
  {"frame": 630, "role": "impact", "description": "shield springs in"},
  {"frame": 662, "role": "pop", "description": "follow button pops up"}
];

type Word = {word: string; startFrame: number; endFrame: number};
type SceneProp = {scene_number: number; start: number; durationInFrames: number; narration: string; words: Word[]};
type VP = {fps: number; durationInFrames: number; scenes: SceneProp[]};
type SP = {f: number; fps: number};

const W = 1080;
const H = 1920;
const ROSE = '#f43f5e';
const SKY = '#38bdf8';
const BG = '#07080e';
const PANEL = '#0e1220';
const CARD = '#121829';
const LINE = '#26304a';
const MUTE = '#8a94ab';
const SOFT = '#e6e9f2';
const HEAD = 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif';
const BODY = 'Arial, Helvetica, sans-serif';
const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EO = Easing.bezier(0.22, 1, 0.36, 1);
const EIO = Easing.inOut(Easing.cubic);
const LIN = Easing.linear;

const ramp = (f: number, a: number, b: number, e: (t: number) => number = EO) =>
  interpolate(f, [a, b], [0, 1], {...CL, easing: e});
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const sp = (f: number, fps: number, s: number, damping = 13, stiffness = 140, mass = 0.9) =>
  spring({frame: f - s, fps, config: {damping, stiffness, mass}});
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/* ---------------- camera ---------------- */
const CK = [0, 84, 96, 150, 166, 262, 276, 360, 376, 462, 480, 550, 566, 626, 640, 683, 773];
const CS = [1, 1.06, 1, 1.05, 1, 1.04, 1, 1.04, 1, 1.05, 1, 1.06, 1, 1.03, 1, 1.08, 1.08];
const CX = [0, 0, 0, 0, 20, -30, 30, -40, 0, 0, 0, -30, 60, -60, 0, 0, 0];
const CY = [0, 30, 0, -20, 0, 0, 40, -40, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const cam = (f: number, v: number[]) => interpolate(f, CK, v, {...CL, easing: Easing.inOut(Easing.sin)});

/* ---------------- background world ---------------- */
const PARTS = Array.from({length: 70}, (_, i) => {
  const c = random('pc' + i);
  return {
    x: random('px' + i) * W,
    y: random('py' + i) * H,
    r: 1 + random('pr' + i) * 2.6,
    s: 0.25 + random('ps' + i) * 0.9,
    ph: random('ph' + i) * Math.PI * 2,
    d: 0.2 + random('pd' + i) * 0.9,
    c: c > 0.82 ? ROSE : c > 0.6 ? SKY : '#ffffff',
  };
});

const Background: React.FC<{f: number; cx: number; cy: number}> = ({f, cx, cy}) => {
  const e = {...CL, easing: Easing.inOut(Easing.sin)};
  const keys = [0, 155, 366, 556, 773];
  const rx = interpolate(f, keys, [780, 260, 820, 240, 540], e);
  const ry = interpolate(f, keys, [520, 760, 640, 980, 820], e);
  const bx = interpolate(f, keys, [260, 820, 240, 860, 540], e);
  const by = interpolate(f, keys, [1100, 1200, 1040, 700, 900], e);
  const hz = 1180;
  const vpX = 540 + cx * 0.4;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(circle at ${rx}px ${ry}px, rgba(244,63,94,0.18), rgba(244,63,94,0) 45%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(circle at ${bx}px ${by}px, rgba(56,189,248,0.16), rgba(56,189,248,0) 48%)`}} />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <linearGradient id="bg-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SKY} stopOpacity="0" />
            <stop offset="1" stopColor={SKY} stopOpacity="0.07" />
          </linearGradient>
        </defs>
        <rect x={0} y={hz} width={W} height={H - hz} fill="url(#bg-floor)" />
        {Array.from({length: 15}, (_, k) => (
          <line key={'v' + k} x1={vpX} y1={hz} x2={-900 + k * 205 + cx * 1.2} y2={H} stroke={SKY} strokeOpacity={0.07} strokeWidth={1.5} />
        ))}
        {Array.from({length: 10}, (_, k) => {
          const t = ((k + f * 0.025) % 10) / 10;
          const yy = hz + (H - hz) * t * t;
          return <line key={'h' + k} x1={0} x2={W} y1={yy} y2={yy} stroke={SKY} strokeOpacity={0.09 * t} strokeWidth={1.5} />;
        })}
        {PARTS.map((p, i) => {
          let yy = (p.y - f * p.s * 1.4) % (H + 40);
          if (yy < 0) yy += H + 40;
          yy -= 20;
          const xx = p.x + Math.sin(f * 0.02 + p.ph) * 14 + cx * p.d * 0.6;
          const tw = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(f * 0.06 + p.ph));
          return <circle key={i} cx={xx} cy={yy + cy * p.d * 0.5} r={p.r} fill={p.c} opacity={tw * 0.7} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- morph bridge ---------------- */
type Box = {x: number; y: number; w: number; h: number; r: number; c: string};
const Morph: React.FC<{f: number; a: number; b: number; from: Box; to: Box}> = ({f, a, b, from, to}) => {
  if (f < a || f > b + 10) return null;
  const t = ramp(f, a, b, EIO);
  const op = Math.min(ramp(f, a, a + 3, LIN), 1 - ramp(f, b, b + 10, LIN));
  return (
    <div
      style={{
        position: 'absolute',
        left: mix(from.x, to.x, t),
        top: mix(from.y, to.y, t),
        width: mix(from.w, to.w, t),
        height: mix(from.h, to.h, t),
        borderRadius: mix(from.r, to.r, t),
        background: interpolateColors(t, [0, 1], [from.c, to.c]),
        opacity: op,
        border: `2px solid rgba(255,255,255,${0.12 * t})`,
        boxShadow: `0 0 ${50 * (1 - t) + 10}px ${from.c}, 0 30px 80px rgba(0,0,0,0.5)`,
      }}
    />
  );
};

/* ---------------- scene 1: hospital ---------------- */
const Scene1: React.FC<SP> = ({f, fps}) => {
  if (f > 100) return null;
  const s = sp(f, fps, 0, 12, 90);
  const sc = mix(0.85, 1, s);
  const exit = ramp(f, 72, 100, Easing.in(Easing.cubic));
  const op = ramp(f, 0, 5, LIN) * (1 - ramp(f, 86, 100, LIN));
  const lit = ramp(f, 4, 14);
  const pulse = f >= 30 ? Math.exp(-(f - 30) / 9) : 0;
  const ring = f >= 30 ? ramp(f, 30, 56, Easing.out(Easing.quad)) : 0;
  const ox = 540;
  const oy = 703;
  const crossGlow = 0.55 + 0.2 * Math.sin(f / 8);
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: op}}>
      <defs>
        <linearGradient id="h-bldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2136" />
          <stop offset="1" stopColor="#090c16" />
        </linearGradient>
        <linearGradient id="h-wing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#131a2b" />
          <stop offset="1" stopColor="#080a12" />
        </linearGradient>
        <filter id="h-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <g transform={`translate(${ox} ${oy}) scale(${sc * (1 + exit * 2.4)}) translate(${-ox} ${-oy})`}>
        <g transform="translate(0 80)">
          <ellipse cx={540} cy={1040} rx={460} ry={26} fill="#000" opacity={0.55} />
          {[150, 780].map((wx, wi) => (
            <g key={wi}>
              <rect x={wx} y={650} width={150} height={385} rx={6} fill="url(#h-wing)" stroke="#222b40" strokeWidth={2} />
              {Array.from({length: 8}, (_, k) => {
                const i = k % 2;
                const j = Math.floor(k / 2);
                const on = random('ww' + wi + k) > 0.75;
                return <rect key={k} x={wx + 25 + i * 60} y={690 + j * 80} width={40} height={36} rx={4} fill={on ? 'rgba(56,189,248,0.16)' : '#0b0f1c'} stroke="#28314c" strokeWidth={1.5} />;
              })}
            </g>
          ))}
          <rect x={300} y={470} width={480} height={565} rx={8} fill="url(#h-bldg)" stroke="#2a3350" strokeWidth={2} />
          <rect x={470} y={400} width={140} height={70} rx={6} fill="#151b2d" stroke="#2a3350" strokeWidth={2} />
          <text x={540} y={445} textAnchor="middle" fill={MUTE} fontFamily={BODY} fontWeight={700} fontSize={18} letterSpacing={4}>
            HOSPITAL
          </text>
          <g opacity={crossGlow} filter="url(#h-glow)">
            <rect x={522} y={290} width={36} height={110} rx={6} fill={ROSE} />
            <rect x={485} y={327} width={110} height={36} rx={6} fill={ROSE} />
          </g>
          <rect x={522} y={290} width={36} height={110} rx={6} fill={ROSE} />
          <rect x={485} y={327} width={110} height={36} rx={6} fill={ROSE} />
          {Array.from({length: 25}, (_, k) => {
            const i = k % 5;
            const j = Math.floor(k / 5);
            const x = 330 + i * 90;
            const y = 520 + j * 80;
            if (i === 2 && j === 1) return null;
            const on = random('mw' + k) > 0.82;
            return <rect key={k} x={x} y={y} width={60} height={46} rx={5} fill={on ? 'rgba(56,189,248,0.15)' : '#0b0f1c'} stroke="#2a3350" strokeWidth={1.5} />;
          })}
          <rect x={500} y={590} width={80} height={66} rx={10} fill={SKY} opacity={lit * (0.45 + pulse * 0.9)} filter="url(#h-glow)" />
          <rect x={510} y={600} width={60} height={46} rx={5} fill={SKY} opacity={0.2 + lit * 0.8} />
          {ring > 0 && ring < 1 && (
            <rect
              x={540 - 30 * (1 + ring * 1.6)}
              y={623 - 23 * (1 + ring * 1.6)}
              width={60 * (1 + ring * 1.6)}
              height={46 * (1 + ring * 1.6)}
              rx={8}
              fill="none"
              stroke={SKY}
              strokeWidth={3}
              opacity={1 - ring}
            />
          )}
          <rect x={440} y={940} width={200} height={22} rx={6} fill="#232c45" />
          <rect x={475} y={962} width={130} height={73} fill="#0a0d18" stroke="#2a3350" strokeWidth={2} />
          <line x1={540} y1={962} x2={540} y2={1035} stroke="#2a3350" strokeWidth={2} />
        </g>
      </g>
    </svg>
  );
};

/* ---------------- badge → chip carrier ---------------- */
const Carrier: React.FC<SP> = ({f, fps}) => {
  if (f < 38 || f > 166) return null;
  const inS = sp(f, fps, 40, 10, 170);
  const m = ramp(f, 72, 94, EIO);
  const g = ramp(f, 100, 125, EIO);
  const cx = mix(540, 162, m) + (540 - 162) * g;
  const cy = mix(1290, 1150, m);
  const w = mix(440, 240, m);
  const h = mix(250, 84, m);
  const r = mix(30, 42, m);
  const pop = interpolate(f, [125, 129, 138], [1, 1.14, 1], CL);
  const ex = ramp(f, 148, 160, LIN);
  const yIn = (1 - inS) * 260;
  const op = ramp(f, 40, 46, LIN) * (1 - ex);
  const sc = mix(0.6, 1, inS) * pop;
  const badgeOp = 1 - ramp(f, 74, 86, LIN);
  const chipOp = ramp(f, 82, 92, LIN);
  const glow = f >= 125 ? Math.exp(-(f - 125) / 10) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2 + yIn,
        width: w,
        height: h,
        borderRadius: r,
        opacity: op,
        transform: `scale(${sc})`,
        background: interpolateColors(m, [0, 1], ['#121829', ROSE]),
        border: `2px solid ${interpolateColors(m, [0, 1], ['#2c3756', '#ff7b90'])}`,
        boxShadow: `0 30px 60px rgba(0,0,0,0.55), 0 0 ${30 + glow * 60}px rgba(244,63,94,${0.25 + glow * 0.5})`,
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', inset: 0, opacity: badgeOp, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 24}}>
        <div style={{position: 'absolute', top: 12, left: '50%', marginLeft: -36, width: 72, height: 12, borderRadius: 6, background: BG}} />
        <div style={{width: 130, height: 170, borderRadius: 18, background: `linear-gradient(160deg, ${ROSE}, #9f1239)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
          <svg width={100} height={110} viewBox="0 0 100 110">
            <line x1={50} y1={8} x2={50} y2={26} stroke="#fff" strokeWidth={4} />
            <circle cx={50} cy={8} r={6} fill="#fff" />
            <rect x={14} y={26} width={72} height={58} rx={16} fill="#fff" />
            <circle cx={36} cy={54} r={8} fill={SKY} />
            <circle cx={64} cy={54} r={8} fill={SKY} />
            <rect x={36} y={70} width={28} height={5} rx={2.5} fill="#9f1239" />
            <rect x={22} y={90} width={56} height={16} rx={8} fill="rgba(255,255,255,0.7)" />
          </svg>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 18, color: MUTE, letterSpacing: 4}}>STAFF ID</div>
          <div style={{fontFamily: HEAD, fontSize: 58, color: '#fff', lineHeight: 1}}>AI AGENT</div>
          <div style={{fontFamily: BODY, fontSize: 20, color: '#c6cce0'}}>Dept · Operations</div>
          <div style={{display: 'flex', gap: 3, marginTop: 8, height: 26}}>
            {Array.from({length: 22}, (_, k) => (
              <div key={k} style={{width: 2 + Math.floor(random('bc' + k) * 4), height: 26, background: k % 3 === 0 ? SKY : '#cbd2e4'}} />
            ))}
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: chipOp, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>
        <div style={{width: 16, height: 16, borderRadius: 8, background: '#fff', boxShadow: '0 0 12px #fff'}} />
        <div style={{fontFamily: HEAD, fontSize: 36, color: '#fff', letterSpacing: 1}}>AI AGENT</div>
      </div>
    </div>
  );
};

/* ---------------- scene 2: EHR window ---------------- */
const TABS = ['Scheduling', 'Billing', 'Clinician'];
const Scene2: React.FC<SP> = ({f, fps}) => {
  if (f < 82 || f > 168) return null;
  const s = sp(f, fps, 86, 13, 130);
  const exit = ramp(f, 150, 164, LIN);
  const sc = mix(0.82, 1, s) * (1 + exit * 0.04);
  const op = ramp(f, 84, 92, LIN) * (1 - exit);
  const flash = ramp(f, 141, 146) * (1 - ramp(f, 150, 156));
  const docked = ramp(f, 120, 126, LIN);
  const dockGlow = f >= 125 ? 0.4 + 0.6 * Math.exp(-(f - 125) / 12) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        top: 440,
        width: 860,
        height: 800,
        borderRadius: 30,
        background: 'linear-gradient(170deg,#131a2c 0%,#0a0d18 100%)',
        border: `2px solid ${LINE}`,
        boxShadow: '0 50px 120px rgba(0,0,0,0.6)',
        opacity: op,
        transform: `scale(${sc})`,
        fontFamily: BODY,
      }}
    >
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 64, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 10}}>
        {[ROSE, '#f59e0b', '#22c55e'].map((c, i) => (
          <div key={i} style={{width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.8}} />
        ))}
        <div style={{marginLeft: 20, color: MUTE, fontSize: 24}}>EHR · Patient Health Record</div>
        <div style={{marginLeft: 'auto', color: SKY, fontSize: 20, fontWeight: 700, letterSpacing: 3, opacity: 0.6 + 0.4 * Math.sin(f / 6)}}>● LIVE</div>
      </div>
      {TABS.map((t, i) => {
        const l = ramp(f, 96 + i * 4, 102 + i * 4);
        const fl = i === 0 ? flash : 0;
        const bg = interpolateColors(fl, [0, 1], [interpolateColors(l, [0, 1], ['#151b2d', '#16324a']), ROSE]);
        return (
          <div
            key={t}
            style={{
              position: 'absolute',
              left: 30 + i * 270,
              top: 90,
              width: 250,
              height: 64,
              borderRadius: 14,
              background: bg,
              border: `2px solid ${interpolateColors(l, [0, 1], [LINE, SKY])}`,
              color: interpolateColors(l, [0, 1], [MUTE, '#ffffff']),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              transform: `scale(${1 + 0.06 * Math.sin(l * Math.PI)})`,
              boxShadow: fl > 0 ? `0 0 ${40 * fl}px ${ROSE}` : 'none',
            }}
          >
            {t}
          </div>
        );
      })}
      {Array.from({length: 5}, (_, i) => {
        const d = ramp(f, 100 + i * 4, 116 + i * 4);
        return (
          <div key={i} style={{position: 'absolute', left: 30, right: 30, top: 190 + i * 86, height: 70, borderRadius: 12, background: '#10162a', border: `1px solid ${LINE}`, opacity: 0.3 + 0.7 * d, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 18}}>
            <div style={{width: 40, height: 40, borderRadius: 20, background: '#222b42'}} />
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              <div style={{width: (180 + random('ra' + i) * 140) * d, height: 12, borderRadius: 6, background: '#2a3452'}} />
              <div style={{width: (90 + random('rb' + i) * 90) * d, height: 10, borderRadius: 5, background: '#1f2740'}} />
            </div>
            <div style={{marginLeft: 'auto', width: 100 * d, height: 26, borderRadius: 13, border: `1px dashed ${LINE}`}} />
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 300,
          top: 662,
          width: 260,
          height: 96,
          borderRadius: 48,
          border: `3px dashed ${interpolateColors(docked, [0, 1], ['#3a4566', ROSE])}`,
          boxShadow: dockGlow > 0 ? `0 0 ${50 * dockGlow}px rgba(244,63,94,0.6)` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: MUTE,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 4,
        }}
      >
        <span style={{opacity: 1 - docked}}>AGENT SLOT</span>
      </div>
    </div>
  );
};

/* ---------------- scene 3: calendar + counter ---------------- */
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const TIMES = ['9:00', '10:00', '11:00', '12:00', '13:00'];
const BOOK: Array<[number, number]> = [[1, 0], [2, 2], [4, 1], [0, 3], [3, 0], [1, 4], [4, 3], [2, 1], [0, 4]];
const Scene3: React.FC<SP> = ({f, fps}) => {
  if (f < 156 || f > 282) return null;
  const op = ramp(f, 160, 170, LIN) * (1 - ramp(f, 262, 274, LIN));
  const t = ramp(f, 180, 198, EIO);
  const lift = ramp(f, 175, 180);
  const sx = mix(206, 674, t);
  const sy = mix(624, 820, t) - Math.sin(Math.PI * t) * 50;
  const ssc = 1 + 0.1 * Math.sin(Math.PI * t) + 0.04 * lift * (1 - t);
  const squash = interpolate(f, [198, 201, 206], [1, 0.86, 1], CL);
  const col = interpolateColors(ramp(f, 198, 206), [0, 1], [ROSE, SKY]);
  const approach = ramp(f, 164, 178, EIO);
  let curX = mix(900, 290, approach);
  let curY = mix(1000, 680, approach);
  if (f >= 178) {
    const drift = ramp(f, 200, 214);
    curX = sx + 84 + drift * 70;
    curY = sy + 56 + drift * 60;
  }
  const curOp = ramp(f, 164, 170, LIN);
  const cIn = ramp(f, 200, 208);
  const v = interpolate(f, [205, 229], [0, 14900], {...CL, easing: Easing.out(Easing.cubic)});
  const lab = ramp(f, 230, 242);
  const s = sp(f, fps, 158, 14, 120);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <filter id="c-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <g transform={`translate(540 730) scale(${mix(0.96, 1, s)}) translate(-540 -730)`}>
          <rect x={100} y={440} width={880} height={580} rx={28} fill={PANEL} stroke={LINE} strokeWidth={2} />
          {DAYS.map((d, i) => (
            <text key={d} x={200 + i * 156 + 78} y={495} textAnchor="middle" fill={MUTE} fontFamily={BODY} fontWeight={700} fontSize={24} letterSpacing={3}>
              {d}
            </text>
          ))}
          {TIMES.map((tm, j) => (
            <text key={tm} x={150} y={520 + j * 98 + 56} textAnchor="middle" fill={MUTE} fontFamily={BODY} fontSize={22}>
              {tm}
            </text>
          ))}
          {Array.from({length: 6}, (_, i) => (
            <line key={'gv' + i} x1={200 + i * 156} x2={200 + i * 156} y1={515} y2={1010} stroke={LINE} strokeWidth={1.5} />
          ))}
          {Array.from({length: 6}, (_, j) => (
            <line key={'gh' + j} x1={200} x2={980} y1={520 + j * 98} y2={520 + j * 98} stroke={LINE} strokeWidth={1.5} />
          ))}
          {BOOK.map(([c, r], k) => {
            const o = ramp(f, 164 + k * 2, 172 + k * 2);
            return (
              <g key={k} opacity={o}>
                <rect x={200 + c * 156 + 6} y={520 + r * 98 + 6} width={144} height={86} rx={14} fill="#182035" />
                <rect x={200 + c * 156 + 22} y={520 + r * 98 + 30} width={60 + random('bk' + k) * 50} height={10} rx={5} fill="#2c3756" />
                <rect x={200 + c * 156 + 22} y={520 + r * 98 + 52} width={40 + random('bj' + k) * 30} height={8} rx={4} fill="#232c45" />
              </g>
            );
          })}
          <rect x={206} y={624} width={144} height={86} rx={14} fill="none" stroke={ROSE} strokeOpacity={0.6} strokeWidth={3} strokeDasharray="10 8" opacity={ramp(f, 182, 192)} />
          {f >= 198 &&
            [0, 1].map((k) => {
              const p = (((f - 198) + k * 15) % 30) / 30;
              return <rect key={k} x={674 - p * 24} y={820 - p * 24} width={144 + p * 48} height={86 + p * 48} rx={16 + p * 10} fill="none" stroke={SKY} strokeWidth={3} opacity={(1 - p) * 0.8} />;
            })}
          <g transform={`translate(${sx + 72} ${sy + 43}) scale(${ssc} ${ssc * squash}) translate(-72 -43)`}>
            <rect x={-6} y={-6} width={156} height={98} rx={18} fill={col} opacity={0.45} filter="url(#c-glow)" />
            <rect x={0} y={0} width={144} height={86} rx={14} fill={col} />
            <text x={16} y={36} fill="#fff" fontFamily={BODY} fontWeight={700} fontSize={22}>
              {f < 200 ? 'Follow-up' : 'Booked ✓'}
            </text>
            <text x={16} y={64} fill="#fff" fillOpacity={0.85} fontFamily={BODY} fontSize={18}>
              Pt. 0412
            </text>
          </g>
          <g transform={`translate(${curX} ${curY})`} opacity={curOp}>
            <path d="M0 0 L0 44 L12 33 L21 52 L29 48 L20 30 L36 30 Z" fill="#fff" stroke="#07080e" strokeWidth={2.5} />
            <rect x={30} y={44} width={44} height={26} rx={8} fill={ROSE} />
            <text x={52} y={63} textAnchor="middle" fill="#fff" fontFamily={HEAD} fontSize={20}>
              AI
            </text>
          </g>
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, width: W, top: 1050, textAlign: 'center', opacity: cIn, transform: `translateY(${(1 - cIn) * 40}px)`}}>
        <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 6, color: SKY}}>OCHSNER HEALTH</div>
        <div style={{fontFamily: HEAD, fontSize: 200, lineHeight: 1, color: '#fff', textShadow: '0 0 40px rgba(56,189,248,0.45)'}}>{fmt(v)}</div>
        <div style={{fontFamily: BODY, fontSize: 34, color: '#c6cce0', opacity: lab, transform: `translateY(${(1 - lab) * 24}px)`, marginTop: 6}}>
          reschedules · ~750 staff hrs (reported)
        </div>
      </div>
    </div>
  );
};

/* ---------------- scene 4: prior-auth cards ---------------- */
const RULES = ['Medical necessity', 'Prior imaging on file', 'In-network provider', 'Form complete'];
const cardStyle = (x: number, y: number): React.CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width: 560,
  height: 330,
  borderRadius: 26,
  background: 'linear-gradient(160deg,#161d31 0%,#0c101c 100%)',
  border: `2px solid ${LINE}`,
  boxShadow: '0 40px 80px rgba(0,0,0,0.55)',
  padding: '28px 32px',
  boxSizing: 'border-box',
  fontFamily: BODY,
});
const CardHead: React.FC<{n: string; t: string; c: string}> = ({n, t, c}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
    <div style={{background: c, color: BG, fontFamily: HEAD, fontSize: 26, padding: '4px 14px', borderRadius: 10}}>{n}</div>
    <div style={{fontFamily: HEAD, fontSize: 44, color: '#fff', letterSpacing: 1}}>{t}</div>
  </div>
);
const Check: React.FC<{size: number; color: string; sw?: number}> = ({size, color, sw = 4}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M5 12.5 L10 17 L19 7" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Scene4: React.FC<SP> = ({f, fps}) => {
  if (f < 264 || f > 376) return null;
  const op = 1 - ramp(f, 360, 372, LIN);
  const s0 = sp(f, fps, 268, 14, 150);
  const s1 = sp(f, fps, 288, 13, 140);
  const s2 = sp(f, fps, 306, 13, 140);
  const shake = f >= 335 ? Math.sin((f - 335) * 2.2) * 10 * Math.exp(-(f - 335) / 5) : 0;
  const st = sp(f, fps, 335, 12, 260);
  const stOp = ramp(f, 333, 337, LIN);
  const rows: Array<[string, string]> = [['Patient', '#A-2291'], ['Procedure', 'MRI · lumbar'], ['Code', 'CPT 72148'], ['Drafted by', 'AI agent']];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      <div style={{...cardStyle(100, 470), opacity: ramp(f, 270, 276, LIN), transform: `scale(${mix(0.94, 1, s0)})`}}>
        <CardHead n="01" t="REQUEST" c={SKY} />
        <div style={{marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12}}>
          {rows.map(([a, b], k) => (
            <div key={a} style={{display: 'flex', fontSize: 26, opacity: ramp(f, 274 + k * 3, 282 + k * 3)}}>
              <div style={{width: 180, color: MUTE}}>{a}</div>
              <div style={{color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10}}>
                {k === 3 && <div style={{width: 12, height: 12, borderRadius: 6, background: ROSE}} />}
                {b}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{...cardStyle(260, 720), opacity: ramp(f, 288, 293, LIN), transform: `translateX(${(1 - s1) * 720}px)`}}>
        <CardHead n="02" t="PAYER RULES" c={SKY} />
        {RULES.map((r, k) => {
          const d = ramp(f, 296 + k * 6, 308 + k * 6);
          return (
            <div key={r} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: k ? 14 : 22}}>
              <div style={{width: 34, height: 34, borderRadius: 17, border: `3px solid ${SKY}`, background: `rgba(56,189,248,${d})`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * d})`, opacity: 0.3 + 0.7 * d, boxSizing: 'border-box'}}>
                <Check size={22} color={BG} />
              </div>
              <div style={{position: 'relative', height: 34, flex: 1}}>
                <div style={{position: 'absolute', left: 0, top: 32, height: 3, width: `${d * 100}%`, background: 'rgba(56,189,248,0.35)'}} />
                <div style={{overflow: 'hidden', width: `${d * 100}%`, whiteSpace: 'nowrap', color: SOFT, fontSize: 26, lineHeight: '30px'}}>{r}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{...cardStyle(420, 970), opacity: ramp(f, 306, 311, LIN), transform: `translate(${(1 - s2) * 720 + shake}px, ${shake * 0.6}px)`}}>
        <CardHead n="03" t="SUBMITTED" c={ROSE} />
        <div style={{marginTop: 22, color: MUTE, fontSize: 22}}>Payer portal · auto-filled</div>
        {[260, 200, 230].map((w0, k) => (
          <div key={k} style={{marginTop: 18, width: w0 * ramp(f, 312 + k * 3, 322 + k * 3), height: 12, borderRadius: 6, background: '#2a3452'}} />
        ))}
        <div style={{marginTop: 22, color: SOFT, fontSize: 22, fontWeight: 700}}>Ref #PA-58213</div>
        <div
          style={{
            position: 'absolute',
            left: 420 - 95,
            top: 190 - 95,
            width: 190,
            height: 190,
            borderRadius: 95,
            border: `8px solid ${ROSE}`,
            boxSizing: 'border-box',
            background: 'rgba(244,63,94,0.14)',
            opacity: stOp,
            transform: `rotate(-14deg) scale(${mix(2.4, 1, st)})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 40px rgba(244,63,94,${0.5 * stOp})`,
          }}
        >
          <Check size={70} color={ROSE} sw={4.5} />
          <div style={{fontFamily: HEAD, fontSize: 28, color: ROSE, letterSpacing: 1}}>SUBMITTED</div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- scene 5: timer bars ---------------- */
const Stopwatch: React.FC<{f: number; x: number; y: number}> = ({f, x, y}) => {
  const a = ((f * 7) % 360) * (Math.PI / 180);
  return (
    <svg width={60} height={60} style={{position: 'absolute', left: x, top: y}}>
      <circle cx={30} cy={33} r={22} fill="none" stroke="#fff" strokeWidth={4} />
      <rect x={25} y={3} width={10} height={7} rx={2} fill="#fff" />
      <line x1={30} y1={33} x2={30 + 15 * Math.sin(a)} y2={33 - 15 * Math.cos(a)} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
};
const Scene5: React.FC<SP> = ({f, fps}) => {
  if (f < 370 || f > 480) return null;
  const out = 1 - ramp(f, 462, 474, LIN);
  const b1 = ramp(f, 374, 378, LIN);
  const wipe = ramp(f, 380, 394);
  const shrink = interpolate(f, [417, 441], [1, 0.58], {...CL, easing: EIO});
  const w2 = 560 * wipe * shrink;
  const bar2Op = 1 - ramp(f, 459, 462, LIN);
  const lab = ramp(f, 372, 382);
  const lab2 = ramp(f, 380, 390);
  const bs = sp(f, fps, 424, 10, 180);
  const n = Math.round(interpolate(f, [424, 440], [0, 42], {...CL, easing: Easing.out(Easing.cubic)}));
  const rep = ramp(f, 440, 450);
  const fall = f >= 441 ? f - 441 : 0;
  const pieceL = 90 + 560 * shrink;
  const pieceOp = f < 417 ? 0 : 1 - ramp(f, 441, 462, LIN);
  const broken = f >= 441;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out, fontFamily: BODY}}>
      <div style={{position: 'absolute', left: 90, top: 640, opacity: lab, transform: `translateY(${(1 - lab) * 20}px)`, display: 'flex', alignItems: 'baseline', gap: 14}}>
        <span style={{fontFamily: HEAD, fontSize: 42, color: ROSE}}>BEFORE</span>
        <span style={{fontSize: 22, color: MUTE}}>time to submit</span>
      </div>
      <div style={{position: 'absolute', left: 90, top: 700, width: 560, height: 80, borderRadius: 40, opacity: b1, background: `linear-gradient(90deg, #be123c, ${ROSE})`, boxShadow: '0 0 40px rgba(244,63,94,0.35)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: 0, bottom: 0, width: 120, left: -160 + ((f - 374) * 14) % 900, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.25), rgba(255,255,255,0))'}} />
      </div>
      <div style={{opacity: b1}}>
        <Stopwatch f={f} x={580} y={710} />
      </div>
      <div style={{position: 'absolute', left: 90, top: 840, opacity: lab2, transform: `translateY(${(1 - lab2) * 20}px)`, display: 'flex', alignItems: 'baseline', gap: 14}}>
        <span style={{fontFamily: HEAD, fontSize: 42, color: SKY}}>AFTER</span>
        <span style={{fontSize: 22, color: MUTE}}>with agent drafts</span>
      </div>
      <div style={{position: 'absolute', left: 90, top: 900, width: w2, height: 80, borderRadius: 40, opacity: bar2Op, background: `linear-gradient(90deg, #0284c7, ${SKY})`, boxShadow: '0 0 40px rgba(56,189,248,0.35)'}} />
      {pieceOp > 0 && (
        <div
          style={{
            position: 'absolute',
            left: pieceL,
            top: 900 + 0.8 * fall * fall,
            width: Math.max(0, 650 - pieceL),
            height: 80,
            borderRadius: '0 40px 40px 0',
            boxSizing: 'border-box',
            border: broken ? 'none' : `3px dashed rgba(56,189,248,0.7)`,
            background: broken ? 'rgba(56,189,248,0.35)' : 'transparent',
            transform: `rotate(${fall * 2}deg)`,
            transformOrigin: 'left center',
            opacity: pieceOp,
          }}
        />
      )}
      <div style={{position: 'absolute', left: 690, top: 700, width: 330, textAlign: 'center', opacity: ramp(f, 424, 428, LIN), transform: `scale(${mix(0.4, 1, bs)})`}}>
        <div style={{fontWeight: 700, fontSize: 22, letterSpacing: 4, color: SKY}}>SUMMIT HEALTH</div>
        <div style={{fontFamily: HEAD, fontSize: 130, lineHeight: 1.05, color: '#fff', textShadow: '0 0 36px rgba(56,189,248,0.5)'}}>{'\u2212' + n + '%'}</div>
        <div style={{fontSize: 30, color: MUTE, opacity: rep, transform: `translateY(${(1 - rep) * 18}px)`}}>reported</div>
      </div>
    </div>
  );
};

/* ---------------- scene 6: clinician + note ---------------- */
const NOTE = ['S: Low back pain, 5 days', 'O: BP 128/82, HR 74', 'A: Lumbar strain', 'P: PT twice weekly', 'Follow-up in 4 weeks'];
const NOTE_TOTAL = NOTE.reduce((a, l) => a + l.length, 0);
const Scene6: React.FC<SP> = ({f, fps}) => {
  if (f < 470 || f > 572) return null;
  const sIn = sp(f, fps, 472, 14, 110);
  const out = ramp(f, 552, 566, LIN);
  const pOp = ramp(f, 476, 482, LIN) * (1 - out);
  const typed = Math.floor(interpolate(f, [492, 546], [0, NOTE_TOTAL], CL));
  let rem = typed;
  const shown = NOTE.map((l) => {
    const k = Math.max(0, Math.min(l.length, rem));
    rem -= l.length;
    return l.slice(0, k);
  });
  let cur = NOTE.length - 1;
  for (let k = 0; k < NOTE.length; k++) {
    if (shown[k].length < NOTE[k].length) {
      cur = k;
      break;
    }
  }
  const typing = f >= 492 && f < 546;
  const blink = typing ? 1 : 0.5 + 0.5 * Math.cos((f - 546) * 0.45);
  const light = 0.8 + 0.2 * Math.sin(f / 10);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: ramp(f, 472, 478, LIN) * (1 - out), transform: `translateX(${(1 - sIn) * -420}px)`}}>
        <defs>
          <linearGradient id="c-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#12141a" />
            <stop offset="0.65" stopColor="#3a3f4a" />
            <stop offset="1" stopColor="#9aa1ad" />
          </linearGradient>
          <radialGradient id="c-light" cx="0.7" cy="0.4" r="0.6">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.14 * light} />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={330} cy={860} rx={320} ry={460} fill="url(#c-light)" />
        <path d="M 90 1320 C 90 1080 150 960 290 930 C 430 960 490 1080 490 1320 Z" fill="url(#c-body)" />
        <rect x={255} y={830} width={70} height={110} rx={20} fill="url(#c-body)" />
        <ellipse cx={290} cy={760} rx={92} ry={108} fill="url(#c-body)" />
        <path d="M 240 940 L 290 1080 L 340 940" fill="none" stroke="#c9ced8" strokeOpacity={0.55} strokeWidth={5} />
        <path d="M 240 935 C 220 1030 260 1110 300 1120 C 340 1110 360 1040 345 935" fill="none" stroke="#aab2c0" strokeWidth={7} strokeLinecap="round" />
        <path d="M 300 1120 L 300 1188" stroke="#aab2c0" strokeWidth={7} strokeLinecap="round" />
        <circle cx={300} cy={1205} r={20} fill="#d0d5de" />
        <path d="M 382 760 C 382 700 360 670 330 655" fill="none" stroke={SKY} strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" />
        <path d="M 440 1000 C 470 1080 488 1180 490 1320" fill="none" stroke={SKY} strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 470,
          width: 470,
          height: 840,
          borderRadius: 30,
          background: 'linear-gradient(170deg,#141b2e 0%,#0b0f1b 100%)',
          border: `2px solid ${LINE}`,
          boxShadow: '0 50px 110px rgba(0,0,0,0.6), -30px 0 80px rgba(56,189,248,0.08)',
          opacity: pOp,
          fontFamily: BODY,
        }}
      >
        <div style={{position: 'absolute', left: 36, top: 36, display: 'flex', alignItems: 'center', gap: 14}}>
          <div style={{width: 14, height: 14, borderRadius: 7, background: ROSE, boxShadow: `0 0 12px ${ROSE}`}} />
          <div style={{fontFamily: HEAD, fontSize: 42, color: '#fff', letterSpacing: 1}}>CLINICAL NOTE</div>
        </div>
        <div style={{position: 'absolute', left: 36, top: 94, fontSize: 24, color: MUTE}}>Draft · Art (AI scribe)</div>
        <div style={{position: 'absolute', left: 36, right: 36, top: 146, height: 2, background: LINE}} />
        {NOTE.map((l, k) => (
          <div key={k} style={{position: 'absolute', left: 36, top: 186 + k * 62, fontSize: 30, lineHeight: '36px', color: SOFT, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center'}}>
            <span>{shown[k]}</span>
            {k === cur && <span style={{display: 'inline-block', width: 4, height: 34, marginLeft: 3, background: SKY, opacity: blink}} />}
          </div>
        ))}
        {[300, 240, 280].map((w0, k) => (
          <div key={'sk' + k} style={{position: 'absolute', left: 36, top: 520 + k * 40, width: w0, height: 12, borderRadius: 6, background: '#1c2438'}} />
        ))}
        <div style={{position: 'absolute', left: 36, bottom: 40, padding: '10px 18px', borderRadius: 24, border: `2px solid ${SKY}`, color: SKY, fontSize: 22, fontWeight: 700}}>
          Awaiting clinician sign-off
        </div>
      </div>
    </div>
  );
};

/* ---------------- scene 7: accountability path ---------------- */
const P7A = 'M 170 1000 C 300 1000 380 860 540 860';
const PATH7 = 'M 170 1000 C 300 1000 380 860 540 860 C 700 860 780 1000 910 1000';
const L7A = getLength(P7A);
const L7T = getLength(PATH7);
const Scene7: React.FC<SP> = ({f, fps}) => {
  if (f < 552 || f > 646) return null;
  const op = ramp(f, 556, 566, LIN) * (1 - ramp(f, 630, 642, LIN));
  const draw = ramp(f, 560, 575, EIO);
  const ev = evolvePath(draw, PATH7);
  let len = 0;
  if (f < 600) len = L7A * ramp(f, 576, 600, EIO);
  else if (f < 608) len = L7A;
  else len = mix(L7A, L7T, ramp(f, 608, 624, EIO));
  const pt = getPointAtLength(PATH7, len);
  const moving = (f >= 576 && f < 600) || (f >= 608 && f < 624);
  const pkOp = ramp(f, 566, 569, LIN) * (1 - ramp(f, 628, 636, LIN));
  const cs = sp(f, fps, 604, 9, 200);
  const csOp = ramp(f, 604, 607, LIN) * (1 - ramp(f, 620, 624, LIN));
  const arrive = f >= 624 ? Math.exp(-(f - 624) / 8) : 0;
  const gateFlash = f >= 604 ? Math.exp(-(f - 604) / 8) : 0;
  const ns = [sp(f, fps, 558, 12, 150), sp(f, fps, 562, 12, 150), sp(f, fps, 566, 12, 150)];
  const nodes = [
    {x: 170, n: '1', c: ROSE, l: 'Agent acts'},
    {x: 540, n: '2', c: SKY, l: 'Human review'},
    {x: 910, n: '3', c: '#ffffff', l: 'EHR record'},
  ];
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: op}}>
      <defs>
        <filter id="p-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <linearGradient id="p-scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKY} stopOpacity="0.35" />
          <stop offset="1" stopColor={SKY} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {Array.from({length: 12}, (_, k) => {
        const bx = -700 + k * 225;
        return (
          <g key={k}>
            <line x1={540} y1={720} x2={bx} y2={1500} stroke={SKY} strokeOpacity={0.08} strokeWidth={1.5} />
            <line x1={540} y1={720} x2={bx} y2={-60} stroke="#fff" strokeOpacity={0.04} strokeWidth={1.5} />
          </g>
        );
      })}
      {Array.from({length: 5}, (_, k) => {
        const t = ((k + (f - 552) * 0.05) % 5) / 5;
        const y = 720 - 760 * t * t;
        const w = 40 + 700 * t * t;
        return <rect key={'l' + k} x={540 - w / 2} y={y} width={w} height={4 + 16 * t * t} rx={4} fill="#fff" opacity={0.2 * t} />;
      })}
      <path d={PATH7} fill="none" stroke={SKY} strokeOpacity={0.25} strokeWidth={14} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} filter="url(#p-glow)" />
      <path d={PATH7} fill="none" stroke={SKY} strokeWidth={5} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
      <g transform={`translate(170 1000) scale(${ns[0]})`}>
        <rect x={-100} y={-40} width={200} height={80} rx={40} fill={ROSE} />
        <circle cx={-62} cy={0} r={8} fill="#fff" />
        <text x={14} y={12} textAnchor="middle" fill="#fff" fontFamily={HEAD} fontSize={32}>AI AGENT</text>
      </g>
      <g transform={`translate(540 860) scale(${ns[1]})`}>
        <rect x={-70} y={-70} width={140} height={140} fill="url(#p-scan)" opacity={0.7 + 0.3 * Math.sin(f / 4) + gateFlash} />
        <rect x={-70} y={-90} width={20} height={160} rx={6} fill={SKY} />
        <rect x={50} y={-90} width={20} height={160} rx={6} fill={SKY} />
        <rect x={-80} y={-100} width={160} height={26} rx={8} fill={SKY} />
        <circle cx={0} cy={-128} r={14} fill="#fff" opacity={0.9} />
        <path d="M -20 -98 C -20 -112 20 -112 20 -98 Z" fill="#fff" opacity={0.9} />
      </g>
      <g transform={`translate(910 1000) scale(${ns[2] * (1 + arrive * 0.12)})`}>
        <rect x={-75} y={-65} width={150} height={130} rx={18} fill={CARD} stroke={interpolateColors(arrive, [0, 1], [LINE, SKY])} strokeWidth={3} />
        <text x={0} y={-18} textAnchor="middle" fill={SKY} fontFamily={HEAD} fontSize={34}>EHR</text>
        <rect x={-50} y={4} width={100} height={9} rx={4} fill="#2a3452" />
        <rect x={-50} y={24} width={70} height={9} rx={4} fill="#2a3452" />
        <rect x={-50} y={44} width={86} height={9} rx={4} fill="#2a3452" />
      </g>
      {nodes.map((nd, i) => (
        <g key={nd.n} opacity={ns[i]}>
          <circle cx={nd.x} cy={1140} r={26} fill="none" stroke={nd.c} strokeWidth={3} />
          <text x={nd.x} y={1152} textAnchor="middle" fill={nd.c} fontFamily={HEAD} fontSize={32}>{nd.n}</text>
          <text x={nd.x} y={1206} textAnchor="middle" fill={SOFT} fontFamily={BODY} fontSize={26}>{nd.l}</text>
        </g>
      ))}
      <g opacity={pkOp}>
        {moving &&
          [1, 2, 3, 4, 5].map((k) => {
            const p = getPointAtLength(PATH7, Math.max(0, len - k * 14));
            return <circle key={k} cx={p.x} cy={p.y} r={12 - k * 1.6} fill="#fff" opacity={(1 - k / 6) * 0.5} />;
          })}
        <circle cx={pt.x} cy={pt.y} r={22} fill={SKY} opacity={0.5} filter="url(#p-glow)" />
        <circle cx={pt.x} cy={pt.y} r={11} fill="#fff" />
      </g>
      <g transform={`translate(540 740) scale(${cs})`} opacity={csOp}>
        <circle r={40} fill={SKY} />
        <path d="M -17 1 L -5 13 L 18 -11" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

/* ---------------- scene 8: shield ---------------- */
const SHIELD = 'M 540 510 L 800 600 L 800 850 C 800 1010 690 1100 540 1150 C 390 1100 280 1010 280 850 L 280 600 Z';
const Scene8: React.FC<SP> = ({f, fps}) => {
  if (f < 624) return null;
  const s = sp(f, fps, 630, 10, 120);
  const sc = mix(0.7, 1, s);
  const op = ramp(f, 628, 636, LIN);
  const shake = f >= 630 ? Math.sin((f - 630) * 2.5) * 12 * Math.exp(-(f - 630) / 6) : 0;
  const hs = sp(f, fps, 634, 12, 160);
  const cs = sp(f, fps, 642, 14, 120);
  const fb = sp(f, fps, 662, 9, 180);
  const fbPulse = f >= 672 ? 1 + 0.035 * Math.sin((f - 672) * 0.25) : 1;
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shake * 0.4}px)`}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: op}}>
        <defs>
          <linearGradient id="s-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#15203a" />
            <stop offset="1" stopColor="#0a0e1a" />
          </linearGradient>
          <filter id="s-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        {f >= 632 &&
          [0, 1, 2].map((k) => {
            const p = (((f - 632) + k * 22) % 66) / 66;
            return (
              <g key={k} transform={`translate(540 830) scale(${1 + p * 0.6}) translate(-540 -830)`}>
                <path d={SHIELD} fill="none" stroke={SKY} strokeWidth={3} opacity={(1 - p) * 0.35} />
              </g>
            );
          })}
        <g transform={`translate(540 830) scale(${sc}) translate(-540 -830)`}>
          <path d={SHIELD} fill="none" stroke={SKY} strokeWidth={16} opacity={0.5} filter="url(#s-glow)" />
          <path d={SHIELD} fill="url(#s-fill)" stroke={SKY} strokeWidth={6} />
          <g transform="translate(540 830) scale(0.88) translate(-540 -830)">
            <path d={SHIELD} fill="none" stroke={SKY} strokeOpacity={0.22} strokeWidth={3} />
          </g>
          <g opacity={cs * 0.92} transform={`translate(${mix(560, 650, cs)} 905)`}>
            <rect x={-85} y={-33} width={170} height={66} rx={33} fill={ROSE} />
            <circle cx={-52} cy={0} r={7} fill="#fff" />
            <text x={12} y={11} textAnchor="middle" fill="#fff" fontFamily={HEAD} fontSize={28}>AI AGENT</text>
          </g>
          <g transform={`translate(510 900) scale(${hs}) translate(-510 -900)`}>
            <circle cx={510} cy={790} r={70} fill="#fff" opacity={0.15} filter="url(#s-glow)" />
            <circle cx={510} cy={790} r={52} fill="#fff" />
            <path d="M 410 1015 C 410 922 452 868 510 864 C 568 868 610 922 610 1015 Z" fill="#fff" />
          </g>
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 330,
          top: 1210,
          width: 420,
          height: 110,
          borderRadius: 55,
          background: ROSE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          opacity: ramp(f, 662, 666, LIN),
          transform: `scale(${mix(0.3, 1, fb) * fbPulse})`,
          boxShadow: `0 0 ${40 + 20 * Math.sin(f * 0.25)}px rgba(244,63,94,0.6), 0 20px 50px rgba(0,0,0,0.5)`,
        }}
      >
        <svg width={44} height={44} viewBox="0 0 24 24">
          <path d="M12 4 V20 M4 12 H20" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
        </svg>
        <div style={{fontFamily: HEAD, fontSize: 58, color: '#fff', letterSpacing: 2}}>FOLLOW</div>
      </div>
    </div>
  );
};

/* ---------------- HUD: headlines ---------------- */
type Head = {s: number; e: number; w: string[]; acc: number[]; c: string; stag: number; d: number};
const HEADS: Head[] = [
  {s: 0, e: 84, w: ['What', 'if', 'AI', 'joined', 'hospital', 'staff?'], acc: [2], c: ROSE, stag: 5, d: 12},
  {s: 84, e: 155, w: ['Agents', 'now', 'live', 'in', 'the', 'EHR'], acc: [5], c: SKY, stag: 2, d: 4},
  {s: 155, e: 266, w: ['Scheduling:', '14,900', 'reschedules'], acc: [1], c: SKY, stag: 3, d: 4},
  {s: 266, e: 366, w: ['Prior', 'auth,', 'drafted', 'by', 'agents'], acc: [4], c: ROSE, stag: 2, d: 4},
  {s: 366, e: 469, w: ['Submission', 'time', 'down', '42%'], acc: [3], c: SKY, stag: 3, d: 4},
  {s: 469, e: 556, w: ['Art', 'drafts', 'the', "clinician's", 'note'], acc: [0], c: ROSE, stag: 2, d: 4},
  {s: 556, e: 630, w: ["Who's", 'accountable', 'when', 'agents', 'act?'], acc: [1], c: ROSE, stag: 2, d: 3},
];
const headBox: React.CSSProperties = {
  position: 'absolute',
  top: 150,
  left: 70,
  right: 70,
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  columnGap: 22,
  fontFamily: HEAD,
  fontSize: 88,
  lineHeight: 1.04,
  color: '#fff',
  textTransform: 'uppercase',
  letterSpacing: 1,
};
const Headlines: React.FC<{f: number}> = ({f}) => (
  <>
    {HEADS.map((h, hi) => {
      if (f < h.s - 2 || f > h.e + 10) return null;
      const exit = ramp(f, h.e - 6, h.e + 6, Easing.in(Easing.cubic));
      return (
        <div key={hi} style={{...headBox, transform: `translateY(${-exit * 50}px)`, opacity: 1 - exit}}>
          {h.w.map((w, i) => {
            const st = h.s + h.d + i * h.stag;
            const t = ramp(f, st, st + 10);
            return (
              <span key={i} style={{display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 44}px)`, color: h.acc.includes(i) ? h.c : '#fff', textShadow: '0 6px 24px rgba(0,0,0,0.6)'}}>
                {w}
              </span>
            );
          })}
        </div>
      );
    })}
  </>
);
const FINAL_LINES: Array<Array<[string, number, string]>> = [
  [['Humans', 633, SKY], ['in', 651, '#fff'], ['charge.', 655, '#fff']],
  [['Follow', 668, ROSE], ['for', 672, '#fff'], ['more.', 676, '#fff']],
];
const FinalHeadline: React.FC<SP> = ({f, fps}) => {
  if (f < 630) return null;
  return (
    <div style={{position: 'absolute', top: 150, left: 70, right: 70, fontFamily: HEAD, fontSize: 92, lineHeight: 1.06, textTransform: 'uppercase', textAlign: 'center'}}>
      {FINAL_LINES.map((line, li) => (
        <div key={li} style={{display: 'flex', justifyContent: 'center', columnGap: 24}}>
          {line.map(([w, fr, c]) => {
            const t = sp(f, fps, fr, 12, 220);
            const o = ramp(f, fr, fr + 5, LIN);
            const blur = (1 - ramp(f, fr, fr + 8)) * 14;
            return (
              <span key={w} style={{display: 'inline-block', color: c, opacity: o, filter: `blur(${blur}px)`, transform: `scale(${mix(1.8, 1, t)}) translateY(${(1 - t) * -20}px)`, textShadow: '0 6px 24px rgba(0,0,0,0.6)'}}>
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ---------------- HUD: captions ---------------- */
const Captions: React.FC<{f: number; scenes: SceneProp[]}> = ({f, scenes}) => {
  let idx = -1;
  for (let i = 0; i < scenes.length; i++) if (f >= scenes[i].start) idx = i;
  if (idx < 0) return null;
  const sc = scenes[idx];
  const local = f - sc.start;
  const inT = ramp(local, 0, 6);
  return (
    <div style={{position: 'absolute', top: 1480, left: 70, right: 70, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px 12px', opacity: inT, transform: `translateY(${(1 - inT) * 20}px)`}}>
      {sc.words.map((w, i) => {
        const active = local >= w.startFrame && local < w.endFrame;
        const past = local >= w.endFrame;
        const pop = active ? interpolate(local, [w.startFrame, w.startFrame + 3, w.startFrame + 7], [1.0, 1.08, 1.04], CL) : 1;
        return (
          <span
            key={i}
            style={{
              fontFamily: BODY,
              fontWeight: 900,
              fontSize: 56,
              lineHeight: 1.15,
              padding: '2px 14px',
              borderRadius: 14,
              background: active ? ROSE : 'transparent',
              color: active || past ? '#ffffff' : 'rgba(255,255,255,0.42)',
              transform: `scale(${pop})`,
              boxShadow: active ? '0 8px 28px rgba(244,63,94,0.45)' : 'none',
              textShadow: active ? 'none' : '0 3px 14px rgba(0,0,0,0.85)',
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

/* ---------------- main ---------------- */
export default function Video(props: VP) {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = cam(f, CS);
  const x = cam(f, CX);
  const y = cam(f, CY);
  const scenes = props.scenes ?? [];
  const kick = 0.6 + 0.4 * Math.sin(f / 7);
  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden', fontFamily: BODY}}>
      <Background f={f} cx={x} cy={y} />
      <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${s})`, transformOrigin: '540px 960px'}}>
        <Scene1 f={f} fps={fps} />
        <Scene2 f={f} fps={fps} />
        <Carrier f={f} fps={fps} />
        <Morph f={f} a={148} b={168} from={{x: 140, y: 530, w: 250, h: 64, r: 14, c: ROSE}} to={{x: 100, y: 440, w: 880, h: 580, r: 28, c: PANEL}} />
        <Scene3 f={f} fps={fps} />
        <Morph f={f} a={258} b={276} from={{x: 674, y: 820, w: 144, h: 86, r: 14, c: SKY}} to={{x: 100, y: 470, w: 560, h: 330, r: 26, c: CARD}} />
        <Scene4 f={f} fps={fps} />
        <Morph f={f} a={358} b={378} from={{x: 745, y: 1065, w: 190, h: 190, r: 95, c: ROSE}} to={{x: 90, y: 700, w: 560, h: 80, r: 40, c: ROSE}} />
        <Scene5 f={f} fps={fps} />
        <Morph f={f} a={459} b={480} from={{x: 90, y: 900, w: 325, h: 80, r: 40, c: SKY}} to={{x: 520, y: 470, w: 470, h: 840, r: 30, c: CARD}} />
        <Scene6 f={f} fps={fps} />
        <Morph f={f} a={550} b={568} from={{x: 862, y: 904, w: 6, h: 36, r: 3, c: SKY}} to={{x: 159, y: 989, w: 22, h: 22, r: 11, c: '#ffffff'}} />
        <Scene7 f={f} fps={fps} />
        <Morph f={f} a={620} b={640} from={{x: 500, y: 700, w: 80, h: 80, r: 40, c: SKY}} to={{x: 290, y: 520, w: 500, h: 620, r: 250, c: 'rgba(56,189,248,0)'}} />
        <Scene8 f={f} fps={fps} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.78) 100%)', pointerEvents: 'none'}} />
      <div style={{position: 'absolute', top: 86, left: 0, width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: ramp(f, 0, 10, LIN)}}>
        <div style={{width: 12, height: 12, borderRadius: 6, background: ROSE, opacity: kick, boxShadow: `0 0 12px ${ROSE}`}} />
        <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 6, color: MUTE}}>NEWS · AI IN HOSPITALS</div>
      </div>
      <div style={{position: 'absolute', top: 128, left: 340, width: 400, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)'}}>
        <div style={{width: `${Math.min(1, f / 683) * 100}%`, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${ROSE}, ${SKY})`}} />
      </div>
      <Headlines f={f} />
      <FinalHeadline f={f} fps={fps} />
      <Captions f={f} scenes={scenes} />
    </AbsoluteFill>
  );
}