import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, random} from 'remotion';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';

const BG = '#07080e';
const CYAN = '#38bdf8';
const ROSE = '#f43f5e';
const WHITE = '#ffffff';
const HEAD = 'Impact, "Anton", "Oswald", "Arial Narrow", sans-serif';
const BODY = 'Arial, Helvetica, sans-serif';
const MONO = '"Courier New", Menlo, Consolas, monospace';
const W = 1080;
const H = 1920;
const CL = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const EO = Easing.bezier(0.22, 1, 0.36, 1);
const EIO = Easing.bezier(0.65, 0, 0.35, 1);
const EI = Easing.bezier(0.55, 0, 1, 0.45);
const BOUNDS = [0, 63, 170, 246, 314, 443, 532, 612, 702];

const ip = (f: number, a: number[], b: number[], e: (t: number) => number = EO) =>
  interpolate(f, a, b, {...CL, easing: e});
const sp = (f: number, fps: number, d: number, damping = 12, stiffness = 140, mass = 0.8) =>
  spring({frame: f - d, fps, config: {damping, stiffness, mass}});
const fadeUp = (f: number, d: number, dist = 46, dur = 14): React.CSSProperties => {
  const p = ip(f, [d, d + dur], [0, 1]);
  return {opacity: p, transform: `translateY(${(1 - p) * dist}px)`};
};
const mod = (a: number, m: number) => ((a % m) + m) % m;
const press = (f: number, t: number) => (f < t ? 0 : interpolate(f, [t, t + 2, t + 10], [0, 1, 0], CL));

export const soundEvents = [
  {"frame": 40, "role": "click", "description": "L key pressed, glyph appears"},
  {"frame": 52, "role": "click", "description": "O key pressed, glyph appears"},
  {"frame": 56, "role": "impact", "description": "red glitch slices tear the screen"},
  {"frame": 63, "role": "draw", "description": "California coastline draws on"},
  {"frame": 75, "role": "pop", "description": "UCLA pin drops"},
  {"frame": 83, "role": "pop", "description": "SRI pin drops"},
  {"frame": 113, "role": "tick", "description": "packets ride the arc"},
  {"frame": 184, "role": "impact", "description": "screen cracks, system crash"},
  {"frame": 212, "role": "click", "description": "L flashes on cracked screen"},
  {"frame": 224, "role": "click", "description": "O flashes on cracked screen"},
  {"frame": 264, "role": "pop", "description": "message splits into packets"},
  {"frame": 302, "role": "ding", "description": "packets reassemble with check"},
  {"frame": 344, "role": "impact", "description": "NCP struck through with red X"},
  {"frame": 364, "role": "chime", "description": "1 JAN 1983 lands"},
  {"frame": 483, "role": "click", "description": "hyperlinks underline"},
  {"frame": 548, "role": "draw", "description": "packet arcs connect continents"},
  {"frame": 584, "role": "chime", "description": "From 2 labs to worldwide label"}
];

/* ---------------- shared pieces ---------------- */

const Headline: React.FC<{f: number; text: string; delay?: number; accent?: number[]; size?: number; kicker?: string; top?: number}> = ({
  f, text, delay = 0, accent = [], size = 96, kicker, top = 200,
}) => {
  const words = text.split(' ');
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top, textAlign: 'center'}}>
      {kicker ? (
        <div style={{...fadeUp(f, delay, 20, 12), fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: CYAN, marginBottom: 18, fontWeight: 700}}>
          {kicker}
        </div>
      ) : null}
      <div style={{fontFamily: HEAD, fontSize: size, lineHeight: 1.04, textTransform: 'uppercase', letterSpacing: 1}}>
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              margin: '0 0.11em',
              ...fadeUp(f, delay + 2 + i * 3),
              color: accent.includes(i) ? ROSE : WHITE,
              textShadow: '0 6px 30px rgba(0,0,0,0.7)',
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
};

const OV = 7;
const Shot: React.FC<{
  frame: number; start: number; end: number;
  inFocal?: [number, number]; outFocal?: [number, number];
  children: (f: number) => React.ReactNode;
}> = ({frame, start, end, inFocal, outFocal, children}) => {
  if (frame < start - OV || frame >= end + OV) return null;
  let scale = 1;
  let opacity = 1;
  let blur = 0;
  let ox = 540;
  let oy = 960;
  if (inFocal && frame < start + OV + 3) {
    const q = ip(frame, [start - OV, start + OV + 3], [0, 1]);
    scale *= interpolate(q, [0, 1], [0.3, 1]);
    opacity *= ip(frame, [start - OV, start + 2], [0, 1], Easing.linear);
    blur += (1 - q) * 6;
    [ox, oy] = inFocal;
  }
  if (outFocal && frame > end - OV) {
    const p = ip(frame, [end - OV, end + OV], [0, 1], EI);
    scale *= interpolate(p, [0, 1], [1, 3.2]);
    opacity *= ip(frame, [end - 1, end + OV], [1, 0], Easing.linear);
    blur += p * 8;
    [ox, oy] = outFocal;
  }
  return (
    <AbsoluteFill
      style={{
        transformOrigin: `${ox}px ${oy}px`,
        transform: `scale(${scale})`,
        opacity,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children(frame - start)}
    </AbsoluteFill>
  );
};

/* ---------------- world background ---------------- */

const PARTS = new Array(90).fill(0).map((_, i) => ({
  x: random(`px${i}`) * W,
  y: random(`py${i}`) * H,
  d: 0.25 + random(`pd${i}`) * 0.75,
  c: random(`pc${i}`) < 0.18 ? ROSE : random(`pw${i}`) < 0.5 ? CYAN : WHITE,
  ph: random(`pp${i}`) * 6.28,
}));

const World: React.FC<{frame: number}> = ({frame}) => {
  const camX = Math.sin(frame / 80) * 14;
  const gx = 540 + Math.sin(frame / 110) * 260;
  const gy = 700 + Math.cos(frame / 140) * 160;
  const rx = 540 - Math.sin(frame / 95) * 300;
  const roseAmt = 0.1 + 0.12 * (frame > 170 && frame < 246 ? 1 : 0.4);
  const phase = mod(frame * 0.02, 1);
  const hz = 1260;
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 80% at 50% 40%, #0d1120 0%, ${BG} 62%)`}}>
      <div style={{position: 'absolute', left: gx - 500, top: gy - 500, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.16), transparent 65%)'}} />
      <div style={{position: 'absolute', left: rx - 450, top: 1250, width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, rgba(244,63,94,${roseAmt}), transparent 65%)`}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={CYAN} stopOpacity="0" />
            <stop offset="1" stopColor={CYAN} stopOpacity="0.16" />
          </linearGradient>
        </defs>
        <g stroke="url(#floorFade)" strokeWidth={1.5}>
          {new Array(17).fill(0).map((_, i) => {
            const x = -1400 + i * 240 + camX * 2;
            return <line key={`v${i}`} x1={540 + camX * 0.3} y1={hz} x2={x} y2={H} />;
          })}
          {new Array(10).fill(0).map((_, k) => {
            const t = (k + phase) / 10;
            const y = hz + t * t * (H - hz);
            return <line key={`h${k}`} x1={0} y1={y} x2={W} y2={y} />;
          })}
        </g>
        {PARTS.map((p, i) => {
          const speed = 0.25 + p.d * 1.1;
          const y = mod(p.y - frame * speed, H + 40) - 20;
          const x = mod(p.x + Math.sin(frame / 70 + p.ph) * 16 * p.d - camX * p.d * 1.5, W);
          const tw = 0.55 + 0.45 * Math.sin(frame / 18 + p.ph);
          return <circle key={i} cx={x} cy={y} r={0.8 + p.d * 2.6} fill={p.c} opacity={(0.12 + p.d * 0.5) * tw} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Wipes: React.FC<{frame: number}> = ({frame}) => (
  <>
    {BOUNDS.slice(1, 8).map((b, i) => {
      const p = (frame - (b - 9)) / 18;
      if (p < 0 || p > 1) return null;
      const x = interpolate(p, [0, 1], [-1400, 1700], {...CL, easing: EIO});
      const col = i % 2 ? ROSE : CYAN;
      return (
        <div
          key={b}
          style={{
            position: 'absolute', left: 0, top: -600, width: 520, height: 3200,
            transform: `translateX(${x}px) rotate(18deg)`,
            background: `linear-gradient(90deg, transparent, ${col}33 35%, rgba(255,255,255,0.22) 50%, ${col}33 65%, transparent)`,
            mixBlendMode: 'screen', filter: 'blur(6px)',
          }}
        />
      );
    })}
  </>
);

/* ---------------- scene 1: keyboard + CRT ---------------- */

const ROWS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

const Key: React.FC<{ch: string; pr: number}> = ({ch, pr}) => (
  <div
    style={{
      width: 74, height: 66, borderRadius: 12,
      background: pr > 0.02 ? `linear-gradient(180deg, rgba(244,63,94,${0.35 + pr * 0.5}), #2a0d16)` : 'linear-gradient(180deg,#1f2537,#121623)',
      boxShadow: `0 ${8 - 6 * pr}px 0 #04050a, 0 0 ${pr * 40}px rgba(244,63,94,${pr})`,
      transform: `translateY(${pr * 6}px)`,
      color: pr > 0.2 ? WHITE : 'rgba(255,255,255,0.7)',
      fontFamily: BODY, fontWeight: 700, fontSize: 28,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    {ch}
  </div>
);

const Scene1: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const push = interpolate(f, [0, 70], [1, 1.06], CL);
  const kb = sp(f, fps, 8, 14, 110, 0.9);
  const scr = sp(f, fps, 16, 11, 120, 0.8);
  const float = Math.sin(f / 14) * 6;
  const g = f >= 55 ? interpolate(f, [55, 58, 61, 66], [0, 1, 0.4, 0], CL) : 0;
  const blink = Math.floor(f / 7) % 2 === 0 ? 1 : 0.2;
  const glyph = (t: number, ch: string) => {
    if (f < t) return null;
    const s = sp(f, fps, t, 10, 220, 0.6);
    return (
      <span style={{display: 'inline-block', transform: `scale(${interpolate(s, [0, 1], [1.6, 1])})`, opacity: Math.min(1, s * 2), color: WHITE, textShadow: `0 0 ${interpolate(s, [0, 1], [60, 18])}px ${CYAN}`}}>
        {ch}
      </span>
    );
  };
  return (
    <AbsoluteFill style={{transform: `scale(${push})`}}>
      <Headline f={f} text="What was the internet's first word?" delay={2} accent={[4, 5]} size={104} kicker="ORIGINS · THE INTERNET" top={180} />
      <div style={{position: 'absolute', left: 190, top: 600, width: 700, height: 440, transform: `translateY(${float + (1 - scr) * 120}px) scale(${interpolate(scr, [0, 1], [0.6, 1])})`, opacity: Math.min(1, scr * 1.5)}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 36, background: 'linear-gradient(160deg,#1e2334,#0b0e17 75%)', border: '2px solid rgba(255,255,255,0.07)', boxShadow: '0 40px 90px rgba(0,0,0,0.7), 0 0 80px rgba(56,189,248,0.12)'}} />
        <div style={{position: 'absolute', left: 26, top: 26, right: 26, bottom: 26, borderRadius: 24, overflow: 'hidden', background: 'radial-gradient(120% 100% at 50% 40%, #0c2333, #03070c)', boxShadow: 'inset 0 0 70px rgba(56,189,248,0.28)'}}>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${g * Math.sin(f * 5) * 10}px)`}}>
            <div style={{position: 'absolute', left: 30, top: 24, right: 30, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 22, color: CYAN, opacity: 0.65, fontWeight: 700}}>
              <span>UCLA SIGMA-7</span>
              <span>LINK ▸ SRI</span>
            </div>
            <div style={{position: 'absolute', left: 40, top: 130, fontFamily: MONO, fontSize: 150, fontWeight: 700, lineHeight: '150px', display: 'flex', alignItems: 'center', textShadow: g > 0 ? `${g * 8}px 0 ${ROSE}, ${-g * 8}px 0 ${CYAN}` : undefined}}>
              <span style={{color: 'rgba(56,189,248,0.55)', marginRight: 30}}>&gt;</span>
              {glyph(40, 'L')}
              {glyph(52, 'O')}
              <span style={{display: 'inline-block', width: 80, height: 120, marginLeft: 10, background: ROSE, opacity: blink, boxShadow: `0 0 30px ${ROSE}`}} />
            </div>
          </div>
          {[60, 150, 235, 320].map((y, i) => (
            <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: 14 + i * 6, background: i % 2 ? 'rgba(56,189,248,0.55)' : 'rgba(244,63,94,0.65)', transform: `translateX(${Math.sin(i * 3.1 + f) * 50 * g}px)`, opacity: g}} />
          ))}
          <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 5px)'}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 90, top: 1060, width: 900, height: 410, perspective: 1400}}>
        <div
          style={{
            width: '100%', height: '100%', transformOrigin: '50% 100%',
            transform: `translateY(${(1 - kb) * 520}px) rotateX(${interpolate(kb, [0, 1], [80, 46])}deg)`,
            borderRadius: 34, background: 'linear-gradient(180deg,#151a28,#0a0c14)',
            border: '2px solid rgba(56,189,248,0.22)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.06)',
            padding: '26px 30px', boxSizing: 'border-box',
            display: 'flex', flexDirection: 'column', gap: 9, alignItems: 'center',
          }}
        >
          {ROWS.map((row, r) => (
            <div key={r} style={{display: 'flex', gap: 8}}>
              {row.split('').map((ch) => (
                <Key key={ch} ch={ch} pr={ch === 'L' ? press(f, 40) : ch === 'O' ? press(f, 52) : 0} />
              ))}
            </div>
          ))}
          <div style={{width: 420, height: 56, borderRadius: 12, background: 'linear-gradient(180deg,#1f2537,#121623)', boxShadow: '0 8px 0 #04050a'}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- scene 2: California map ---------------- */

const CA = 'M 40 40 L 330 40 L 330 340 L 560 690 L 575 760 L 548 800 L 555 880 L 395 895 L 385 860 L 352 815 L 320 790 L 285 772 L 250 765 L 215 740 L 180 720 L 168 690 L 150 650 L 128 600 L 110 545 L 100 500 L 85 455 L 72 420 L 68 395 L 58 360 L 48 320 L 40 270 L 28 200 L 22 140 L 30 90 Z';
const ARC = 'M 300 765 Q 360 540 100 425';
const ARC_LEN = getLength(ARC);

const Pin: React.FC<{x: number; y: number; s: number; color: string; f: number; d: number}> = ({x, y, s, color, f, d}) => {
  const pulse = f > d ? ((f - d) % 28) / 28 : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      {f > d ? <circle cx={0} cy={0} r={6 + pulse * 30} fill="none" stroke={color} strokeWidth={2} opacity={(1 - pulse) * 0.8} /> : null}
      <ellipse cx={0} cy={2} rx={10 * s} ry={4 * s} fill="rgba(0,0,0,0.5)" />
      <g transform={`translate(0 ${-(1 - Math.min(1, s)) * 40}) scale(${s})`}>
        <path d="M0 0 C -7 -12 -18 -20 -18 -33 A 18 18 0 1 1 18 -33 C 18 -20 7 -12 0 0 Z" fill={color} filter="url(#glow2)" />
        <circle cx={0} cy={-33} r={7} fill={BG} />
      </g>
    </g>
  );
};

const Scene2: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const coast = ip(f, [-4, 44], [0, 1], EIO);
  const ev = evolvePath(coast, CA);
  const tx = ip(f, [20, 100], [130, 310], EIO);
  const ty = ip(f, [20, 100], [-406, 140], EIO);
  const arcP = ip(f, [34, 66], [0, 1], EIO);
  const arcEv = evolvePath(arcP, ARC);
  const ucla = sp(f, fps, 12, 9, 180, 0.7);
  const sri = sp(f, fps, 20, 9, 180, 0.7);
  const fill = ip(f, [20, 50], [0, 1]);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 980 + ty * 0.25, textAlign: 'center', fontFamily: HEAD, fontSize: 420, color: 'transparent', WebkitTextStroke: '2px rgba(56,189,248,0.12)', opacity: fill}}>
        1969
      </div>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={`translate(${tx} ${ty}) scale(1.6)`}>
          <g stroke="rgba(56,189,248,0.07)" strokeWidth={1}>
            {new Array(16).fill(0).map((_, i) => <line key={`gx${i}`} x1={-200 + i * 60} y1={-300} x2={-200 + i * 60} y2={1200} />)}
            {new Array(26).fill(0).map((_, i) => <line key={`gy${i}`} x1={-300} y1={-300 + i * 60} x2={900} y2={-300 + i * 60} />)}
          </g>
          <text x={-60} y={620} fill="rgba(56,189,248,0.3)" fontFamily={MONO} fontSize={14} letterSpacing={6} transform="rotate(-70 -60 620)">PACIFIC OCEAN</text>
          <path d={CA} fill="rgba(56,189,248,0.07)" opacity={fill} />
          <path d={CA} fill="none" stroke={CYAN} strokeWidth={2.4} strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} filter="url(#glow2)" />
          <path d={ARC} fill="none" stroke={ROSE} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={arcEv.strokeDasharray} strokeDashoffset={arcEv.strokeDashoffset} filter="url(#glow2)" />
          {[0, 1, 2].map((i) => {
            const t = ip(f, [50 + i * 8, 80 + i * 8], [0, 1], EIO);
            if (t <= 0 || t >= 1) return null;
            const p = getPointAtLength(ARC, t * ARC_LEN);
            return <rect key={i} x={p.x - 6} y={p.y - 6} width={12} height={12} fill={WHITE} stroke={ROSE} strokeWidth={2} transform={`rotate(${t * 180} ${p.x} ${p.y})`} filter="url(#glow2)" />;
          })}
          {f > 82 ? <circle cx={100} cy={425} r={10 + ip(f, [82, 104], [0, 40])} fill="none" stroke={CYAN} strokeWidth={3} opacity={1 - ip(f, [82, 104], [0, 1])} /> : null}
          <Pin x={300} y={765} s={ucla} color={ROSE} f={f} d={12} />
          <Pin x={100} y={425} s={sri} color={CYAN} f={f} d={20} />
          <g opacity={ip(f, [16, 26], [0, 1])}>
            <text x={326} y={752} fill={WHITE} fontFamily={HEAD} fontSize={26}>UCLA</text>
            <text x={326} y={772} fill="rgba(255,255,255,0.6)" fontFamily={MONO} fontSize={12}>LOS ANGELES</text>
          </g>
          <g opacity={ip(f, [24, 34], [0, 1])}>
            <text x={126} y={412} fill={WHITE} fontFamily={HEAD} fontSize={26}>SRI</text>
            <text x={126} y={432} fill="rgba(255,255,255,0.6)" fontFamily={MONO} fontSize={12}>MENLO PARK</text>
          </g>
        </g>
      </svg>
      <Headline f={f} text="1969: UCLA calls SRI" delay={2} accent={[0]} size={100} kicker="OCT 29, 1969 · 10:30 PM" top={190} />
    </AbsoluteFill>
  );
};

/* ---------------- scene 3: SRI terminal crash ---------------- */

const CRACK = 'M 30 70 L 170 150 L 140 205 L 310 235 L 285 300 L 460 290 L 505 360 L 640 385';
const CRACK_B1 = 'M 310 235 L 370 160 L 450 140 L 520 70';
const CRACK_B2 = 'M 285 300 L 240 395';
const CRACK_B3 = 'M 170 150 L 210 40';

const Scene3: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const t = sp(f, fps, 0, 12, 90, 1);
  const ry = interpolate(t, [0, 1], [-25, 0]);
  const push = interpolate(f, [0, 90], [1, 1.08], CL);
  const amp = f >= 14 ? interpolate(f, [14, 32], [20, 0], CL) : 0;
  const dx = Math.sin(f * 2.9) * amp;
  const dy = Math.cos(f * 3.7) * amp * 0.6;
  const crack = ip(f, [14, 22], [0, 1], Easing.out(Easing.cubic));
  const branch = ip(f, [18, 27], [0, 1], Easing.out(Easing.cubic));
  const crashed = f >= 14;
  const flick = crashed ? 0.12 + 0.2 * Math.max(0, Math.sin(f * 1.7)) * interpolate(f, [14, 40], [1, 0.2], CL) : 0;
  const hl = (t0: number) => (f < t0 ? 0 : interpolate(f, [t0, t0 + 3, t0 + 14], [0, 1, 0.25], CL));
  const glyph = (ch: string, appear: number, hit: number) => {
    const a = sp(f, fps, appear, 10, 200, 0.6);
    const h = hl(hit);
    return (
      <span style={{display: 'inline-block', opacity: Math.min(1, a * 2), transform: `scale(${interpolate(a, [0, 1], [1.5, 1]) * (1 + h * 0.22)}) translateY(${-h * 8}px)`, color: WHITE, textShadow: `0 0 ${18 + h * 50}px ${h > 0.1 ? ROSE : CYAN}`, marginRight: 24}}>
        {ch}
      </span>
    );
  };
  const glassOp = 1 - ip(f, [63, 68], [0, 1], Easing.linear);
  const shatter = ip(f, [64, 84], [0, 1], EI);
  const crashS = sp(f, fps, 16, 9, 160, 0.7);
  const c1 = evolvePath(crack, CRACK);
  return (
    <AbsoluteFill style={{transform: `translate(${dx}px,${dy}px) scale(${push})`}}>
      <Headline f={f} text="It crashed after LO" delay={0} accent={[3]} size={104} kicker="SRI · MENLO PARK" top={190} />
      <div style={{position: 'absolute', left: 170, top: 540, width: 740, height: 560, perspective: 1600}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${ry}deg) scale(${interpolate(t, [0, 1], [0.85, 1])})`}}>
          <div style={{position: 'absolute', left: '100%', top: 16, width: 120, height: 528, transformOrigin: 'left center', transform: 'rotateY(90deg)', background: 'linear-gradient(90deg,#161c2b,#06080e)', borderRadius: '0 18px 18px 0', border: '1px solid rgba(56,189,248,0.15)'}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: 30, background: 'linear-gradient(160deg,#20263a,#0b0e17 70%)', border: '2px solid rgba(255,255,255,0.07)', boxShadow: `0 50px 100px rgba(0,0,0,0.7), 0 0 ${crashed ? 90 : 40}px ${crashed ? 'rgba(244,63,94,0.25)' : 'rgba(56,189,248,0.15)'}`}}>
            <div style={{position: 'absolute', left: 40, top: 40, width: 660, height: 430, borderRadius: 22, overflow: 'hidden', background: 'radial-gradient(120% 100% at 50% 40%, #0c2333, #03070c)', boxShadow: 'inset 0 0 80px rgba(56,189,248,0.25)'}}>
              <div style={{position: 'absolute', inset: 0, opacity: glassOp}}>
                <div style={{position: 'absolute', left: 32, top: 24, right: 32, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 22, fontWeight: 700, color: CYAN, opacity: 0.65}}>
                  <span>SRI · SDS 940</span>
                  <span>RX ◂ UCLA</span>
                </div>
                <div style={{position: 'absolute', left: 40, top: 80, fontFamily: MONO, fontSize: 30, fontWeight: 700, color: 'rgba(56,189,248,0.75)'}}>LOGIN:</div>
                <div style={{position: 'absolute', left: 40, top: 130, fontFamily: MONO, fontSize: 170, fontWeight: 700, lineHeight: '170px', transform: crashed ? `translateX(${Math.sin(f * 4) * amp * 0.3}px)` : undefined}}>
                  {glyph('L', 4, 42)}
                  {glyph('O', 9, 54)}
                </div>
                <div style={{position: 'absolute', left: 40, top: 340, fontFamily: MONO, fontSize: 26, fontWeight: 700, color: ROSE, opacity: crashed ? (Math.floor(f / 6) % 2 ? 1 : 0.5) : 0}}>*** HOST DOWN ***</div>
              </div>
              <div style={{position: 'absolute', inset: 0, background: ROSE, opacity: flick * glassOp}} />
              <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 5px)'}} />
              <svg width={660} height={430} style={{position: 'absolute', inset: 0, opacity: glassOp}}>
                <path d={CRACK} fill="none" stroke={ROSE} strokeWidth={6} strokeLinejoin="round" strokeDasharray={c1.strokeDasharray} strokeDashoffset={c1.strokeDashoffset} style={{filter: `drop-shadow(0 0 8px ${ROSE})`}} />
                <path d={CRACK} fill="none" stroke={WHITE} strokeWidth={1.6} strokeDasharray={c1.strokeDasharray} strokeDashoffset={c1.strokeDashoffset} />
                {[CRACK_B1, CRACK_B2, CRACK_B3].map((p, i) => {
                  const e = evolvePath(branch, p);
                  return <path key={i} d={p} fill="none" stroke={ROSE} strokeWidth={3.5} strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset} />;
                })}
              </svg>
            </div>
            <div style={{position: 'absolute', left: 40, right: 40, bottom: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 20, color: 'rgba(255,255,255,0.45)', fontWeight: 700}}>
              <span>SRI-ARC TERMINAL</span>
              <span style={{width: 16, height: 16, borderRadius: 8, background: crashed ? ROSE : CYAN, boxShadow: `0 0 14px ${crashed ? ROSE : CYAN}`, opacity: crashed && Math.floor(f / 5) % 2 ? 0.35 : 1}} />
            </div>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', fontFamily: HEAD, fontSize: 130, color: ROSE, letterSpacing: 4, opacity: Math.min(1, crashS * 1.5), transform: `scale(${interpolate(crashS, [0, 1], [1.5, 1])})`, textShadow: `0 0 40px rgba(244,63,94,0.6)`}}>
        SYSTEM CRASH
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1310, textAlign: 'center', fontFamily: MONO, fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.75)', ...fadeUp(f, 58, 20, 10)}}>
        ▸ about an hour later, LOGIN went through
      </div>
      {f >= 62
        ? new Array(77).fill(0).map((_, k) => {
            const c = k % 11;
            const r = Math.floor(k / 11);
            const x0 = 210 + c * 60 + 30;
            const y0 = 580 + r * 62 + 30;
            const ang = random(`sa${k}`) * Math.PI * 2;
            const dist = 120 + random(`sd${k}`) * 260;
            const x = x0 + (x0 - 540) * shatter * 0.9 + Math.cos(ang) * dist * shatter;
            const y = y0 + (y0 - 795) * shatter * 0.9 + Math.sin(ang) * dist * shatter;
            const s = interpolate(shatter, [0, 1], [1, 0.35]);
            return (
              <div key={k} style={{position: 'absolute', left: x - 29, top: y - 29, width: 58, height: 58, background: k % 4 === 0 ? 'rgba(255,255,255,0.85)' : ROSE, opacity: ip(f, [62, 65], [0, 0.9]), transform: `scale(${s}) rotate(${(random(`sr${k}`) - 0.5) * 360 * shatter}deg)`, boxShadow: `0 0 16px ${ROSE}`}} />
            );
          })
        : null}
    </AbsoluteFill>
  );
};

/* ---------------- scene 4: packets through IMP ---------------- */

const P4 = 'M 230 580 C 380 620 420 860 540 960 S 720 1240 850 1300';
const L4 = getLength(P4);
const P4_END = {x: 850, y: 1300};
const SPAWN = [22, 29, 36];
const SPLIT_OFF = [-70, 0, 70];
const STACK_OFF = [-60, 0, 60];

const Scene4: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const panX = ip(f, [0, 68], [90, -90], EIO);
  const panY = ip(f, [0, 68], [160, -160], EIO);
  const blockS = sp(f, fps, 4, 11, 150, 0.8);
  const blockOp = f < 18 ? 1 : 1 - ip(f, [18, 21], [0, 1], Easing.linear);
  const cable = ip(f, [10, 34], [0, 1], EIO);
  const cev = evolvePath(cable, P4);
  const cube = sp(f, fps, 22, 12, 120, 0.9);
  const fin = sp(f, fps, 56, 10, 170, 0.7);
  const check = evolvePath(ip(f, [60, 68], [0, 1]), 'M -14 0 L -4 10 L 16 -12');
  let flash = 0;
  const packets = SPAWN.map((s, i) => {
    const t = ip(f, [s, s + 20], [0, 1], EIO);
    flash = Math.max(flash, Math.max(0, 1 - Math.abs(t - 0.5) * 8));
    const pt = getPointAtLength(P4, t * L4);
    const split = {x: 230 + SPLIT_OFF[i] * ip(f, [18, 24], [0, 1]), y: 580 - Math.sin(Math.min(1, Math.max(0, (f - 18) / 10)) * Math.PI) * 30};
    const k = ip(f, [s, s + 5], [0, 1]);
    let x = split.x + (pt.x - split.x) * k;
    let y = split.y + (pt.y - split.y) * k;
    const arrive = s + 20;
    if (f >= arrive) {
      const st = ip(f, [arrive, arrive + 5], [0, 1]) * (1 - ip(f, [56, 61], [0, 1]));
      x = P4_END.x + STACK_OFF[i] * st;
      y = P4_END.y - 10 * st;
    }
    const op = f < 18 ? 0 : 1 - ip(f, [57, 61], [0, 1], Easing.linear);
    return {x, y, op, rot: t * 360};
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${panX}px,${panY}px)`}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d={P4} fill="none" stroke="rgba(56,189,248,0.18)" strokeWidth={22} strokeLinecap="round" strokeDasharray={cev.strokeDasharray} strokeDashoffset={cev.strokeDashoffset} />
          <path d={P4} fill="none" stroke={CYAN} strokeWidth={6} strokeLinecap="round" strokeDasharray={cev.strokeDasharray} strokeDashoffset={cev.strokeDashoffset} style={{filter: `drop-shadow(0 0 10px ${CYAN})`}} />
          {cable > 0.98 ? <path d={P4} fill="none" stroke={WHITE} strokeWidth={2} strokeDasharray="6 22" strokeDashoffset={-f * 4} opacity={0.7} /> : null}
        </svg>
        <div style={{position: 'absolute', left: 230 - 120, top: 580 - 75, width: 240, height: 150, borderRadius: 18, background: `linear-gradient(150deg, ${ROSE}, #9f1239)`, boxShadow: '0 24px 60px rgba(244,63,94,0.4)', opacity: blockOp, transform: `scale(${blockS * (1 + (f >= 16 && f < 20 ? 0.08 : 0))})`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: WHITE}}>
          <div style={{fontFamily: MONO, fontSize: 18, fontWeight: 700, opacity: 0.8, letterSpacing: 4}}>MESSAGE</div>
          <div style={{fontFamily: HEAD, fontSize: 58, letterSpacing: 8}}>LOGIN</div>
        </div>
        <div style={{position: 'absolute', left: 120, top: 470, fontFamily: MONO, fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.6)', opacity: ip(f, [6, 14], [0, 1])}}>HOST · UCLA</div>
        <div style={{position: 'absolute', left: 540 - 95, top: 960 - 95, width: 190, height: 190, perspective: 900}}>
          <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `scale(${cube}) rotateX(-24deg) rotateY(${f * 3 + 20}deg)`}}>
            {['rotateY(0deg)', 'rotateY(180deg)', 'rotateY(90deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'].map((r, i) => (
              <div key={i} style={{position: 'absolute', inset: 0, transform: `${r} translateZ(95px)`, background: `rgba(56,189,248,${0.1 + flash * 0.25})`, border: `2px solid rgba(56,189,248,${0.6 + flash * 0.4})`, boxShadow: `inset 0 0 ${40 + flash * 40}px rgba(56,189,248,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontSize: 56, color: CYAN, backgroundImage: i >= 4 ? 'repeating-linear-gradient(90deg, rgba(56,189,248,0.25) 0 2px, transparent 2px 24px)' : undefined}}>
                {i < 4 ? 'IMP' : ''}
              </div>
            ))}
          </div>
        </div>
        <div style={{position: 'absolute', left: 540 - 200, top: 1090, width: 400, textAlign: 'center', fontFamily: MONO, fontSize: 22, fontWeight: 700, color: 'rgba(56,189,248,0.8)', opacity: ip(f, [26, 34], [0, 1])}}>IMP · PACKET ROUTER</div>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {packets.map((p, i) => (
            <g key={i} opacity={p.op} transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}>
              <rect x={-30} y={-30} width={60} height={60} rx={8} fill={ROSE} style={{filter: `drop-shadow(0 0 12px ${ROSE})`}} />
              <rect x={-30} y={-30} width={60} height={14} rx={6} fill="rgba(255,255,255,0.85)" />
              <text x={0} y={18} textAnchor="middle" fill={WHITE} fontFamily={HEAD} fontSize={26}>{i + 1}</text>
            </g>
          ))}
        </svg>
        <div style={{position: 'absolute', left: P4_END.x - 120, top: P4_END.y - 75, width: 240, height: 150, borderRadius: 18, background: `linear-gradient(150deg, ${ROSE}, #9f1239)`, boxShadow: '0 24px 60px rgba(244,63,94,0.45)', opacity: Math.min(1, fin * 2), transform: `scale(${fin})`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: WHITE}}>
          <div style={{fontFamily: MONO, fontSize: 18, fontWeight: 700, opacity: 0.8, letterSpacing: 4}}>REASSEMBLED</div>
          <div style={{fontFamily: HEAD, fontSize: 58, letterSpacing: 8}}>LOGIN</div>
        </div>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <g transform={`translate(${P4_END.x + 125} ${P4_END.y - 80}) scale(${sp(f, fps, 59, 9, 200, 0.6)})`}>
            <circle r={34} fill={CYAN} style={{filter: `drop-shadow(0 0 14px ${CYAN})`}} />
            <path d="M -14 0 L -4 10 L 16 -12" fill="none" stroke={BG} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={check.strokeDasharray} strokeDashoffset={check.strokeDashoffset} />
          </g>
        </svg>
        <div style={{position: 'absolute', left: P4_END.x - 120, top: P4_END.y + 90, width: 240, textAlign: 'center', fontFamily: MONO, fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.6)', opacity: ip(f, [40, 50], [0, 1])}}>HOST · SRI</div>
      </AbsoluteFill>
      <Headline f={f} text="Messages ride as packets" delay={0} accent={[3]} size={100} kicker="PACKET SWITCHING" top={190} />
    </AbsoluteFill>
  );
};

/* ---------------- scene 5: NCP vs TCP/IP ---------------- */

const Scene5: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const camX = ip(f, [0, 129], [0, -50], EIO);
  const camS = interpolate(f, [0, 129], [1, 1.05], CL);
  const seam = ip(f, [0, 18], [0, 1]);
  const ncp = sp(f, fps, 2, 14, 120, 0.9);
  const recede = ip(f, [30, 50], [0, 1]);
  const shake = f >= 30 ? Math.sin(f * 3) * interpolate(f, [30, 42], [12, 0], CL) : 0;
  const x1 = evolvePath(ip(f, [30, 37], [0, 1]), 'M 40 40 L 380 440');
  const x2 = evolvePath(ip(f, [33, 40], [0, 1]), 'M 380 40 L 40 440');
  const tcp = sp(f, fps, 22, 13, 110, 0.9);
  const rows: [string, string][] = [['SRC', '10.0.0.1 · UCLA'], ['DST', '10.3.0.2 · SRI'], ['SEQ', '0000 0001'], ['DATA', 'L O G I N']];
  const glow = 0.5 + 0.5 * Math.sin(f / 8);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transformOrigin: '780px 960px', transform: `translateX(${camX}px) scale(${camS})`}}>
        <div style={{position: 'absolute', left: 538, top: 560, width: 4, height: 820, background: `linear-gradient(180deg, transparent, ${CYAN}, transparent)`, transformOrigin: 'top', transform: `scaleY(${seam})`, opacity: 0.6}} />
        <div style={{position: 'absolute', left: 80, top: 720, width: 420, height: 480, perspective: 1200}}>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - ncp) * -300 + shake}px) rotateY(${recede * 18}deg) scale(${1 - recede * 0.08})`, opacity: Math.min(1, ncp * 1.5) * (1 - recede * 0.4), borderRadius: 26, background: 'linear-gradient(160deg,#1a1f2e,#0c0f18)', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 70px rgba(0,0,0,0.6)', padding: 36, boxSizing: 'border-box', color: WHITE}}>
            <div style={{fontFamily: MONO, fontSize: 22, fontWeight: 700, letterSpacing: 4, color: 'rgba(255,255,255,0.5)'}}>OLD PROTOCOL</div>
            <div style={{fontFamily: HEAD, fontSize: 150, lineHeight: 1.1, color: 'rgba(255,255,255,0.8)'}}>NCP</div>
            <div style={{fontFamily: BODY, fontSize: 30, color: 'rgba(255,255,255,0.65)'}}>Network Control Program</div>
            <div style={{fontFamily: MONO, fontSize: 26, fontWeight: 700, marginTop: 30, color: 'rgba(255,255,255,0.5)'}}>1970 — 1982</div>
            <svg width={420} height={480} style={{position: 'absolute', left: 0, top: 0}}>
              {[x1, x2].map((e, i) => (
                <path key={i} d={i ? 'M 380 40 L 40 440' : 'M 40 40 L 380 440'} stroke={ROSE} strokeWidth={16} strokeLinecap="round" fill="none" strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset} style={{filter: `drop-shadow(0 0 12px ${ROSE})`}} />
              ))}
            </svg>
          </div>
        </div>
        <div style={{position: 'absolute', left: 545, top: 650, width: 470, height: 570, transform: `translateX(${(1 - tcp) * 520}px) scale(${interpolate(tcp, [0, 1], [0.9, 1.03])})`, opacity: Math.min(1, tcp * 1.5), borderRadius: 26, background: 'linear-gradient(160deg,#0f2a3d,#081420 70%)', border: `2px solid rgba(56,189,248,${0.5 + glow * 0.4})`, boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 ${50 + glow * 40}px rgba(56,189,248,0.35)`, padding: 34, boxSizing: 'border-box', color: WHITE}}>
          <div style={{fontFamily: MONO, fontSize: 22, fontWeight: 700, letterSpacing: 4, color: 'rgba(56,189,248,0.8)'}}>NEW STANDARD</div>
          <div style={{fontFamily: HEAD, fontSize: 120, lineHeight: 1.1, color: CYAN, textShadow: `0 0 30px rgba(56,189,248,0.6)`}}>TCP/IP</div>
          <div style={{marginTop: 14}}>
            {rows.map(([k, v], i) => (
              <div key={k} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '12px 0', borderTop: '1px solid rgba(56,189,248,0.25)', ...fadeUp(f, 34 + i * 4, 18, 8)}}>
                <span style={{fontFamily: MONO, fontSize: 24, fontWeight: 700, color: 'rgba(56,189,248,0.8)', width: 80}}>{k}</span>
                <span style={{fontFamily: MONO, fontSize: 30, fontWeight: 700}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1255, textAlign: 'center', ...fadeUp(f, 50, 40, 12)}}>
          <div style={{fontFamily: HEAD, fontSize: 116, color: WHITE, letterSpacing: 4, textShadow: '0 8px 30px rgba(0,0,0,0.7)'}}>1 JAN 1983</div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1390, textAlign: 'center', fontFamily: MONO, fontSize: 26, fontWeight: 700, color: ROSE, letterSpacing: 3, ...fadeUp(f, 58, 16, 10)}}>
          FLAG DAY · ARPANET SWITCHES OVER
        </div>
      </AbsoluteFill>
      <Headline f={f} text="1983: TCP/IP takes over" delay={0} accent={[0]} size={100} kicker="ONE SHARED LANGUAGE" top={190} />
    </AbsoluteFill>
  );
};

/* ---------------- scene 6: Web timeline + CRT ---------------- */

const LinkU: React.FC<{children: React.ReactNode; u: number}> = ({children, u}) => (
  <span style={{position: 'relative', color: '#0b63b6', display: 'inline-block'}}>
    {children}
    <span style={{position: 'absolute', left: 0, right: 0, bottom: 1, height: 2, background: '#0b63b6', transform: `scaleX(${u})`, transformOrigin: 'left'}} />
  </span>
);

const Scene6: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const cam = ip(f, [0, 89], [80, -80], EIO);
  const rail = ip(f, [0, 22], [0, 1], EIO);
  const crt = sp(f, fps, 20, 12, 100, 0.9);
  const ry = interpolate(crt, [0, 1], [-25, 0]);
  const u = (k: number) => ip(f, [40 + k * 3, 48 + k * 3], [0, 1]);
  const nodes = [
    {x: 200, y: '1969', tag: 'ARPANET', d: 10},
    {x: 540, y: '1983', tag: 'TCP/IP', d: 18},
    {x: 880, y: '1991', tag: 'WWW', d: 26},
  ];
  const sig = -200 + mod(f * 14, 1480);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 190, top: 430, width: 700, height: 600, transform: `translateX(${cam * 0.4}px)`, perspective: 1600, opacity: Math.min(1, crt * 2)}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${ry}deg) scale(${interpolate(crt, [0, 1], [0.7, 1])})`}}>
          <div style={{position: 'absolute', left: '100%', top: 20, width: 140, height: 500, transformOrigin: 'left center', transform: 'rotateY(90deg)', background: 'linear-gradient(90deg,#161c2b,#06080e)', borderRadius: '0 30px 30px 0'}} />
          <div style={{position: 'absolute', left: 0, top: 0, width: 700, height: 540, borderRadius: 34, background: 'linear-gradient(160deg,#222838,#0b0e17 70%)', border: '2px solid rgba(255,255,255,0.08)', boxShadow: '0 50px 100px rgba(0,0,0,0.7), 0 0 90px rgba(56,189,248,0.18)'}}>
            <div style={{position: 'absolute', left: 34, top: 34, width: 632, height: 426, borderRadius: 26, overflow: 'hidden', background: '#e6edf4', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.35)'}}>
              <div style={{height: 42, background: '#c7d0db', display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: MONO, fontSize: 18, fontWeight: 700, color: '#22303f'}}>
                http://info.cern.ch/hypertext/WWW/TheProject.html
              </div>
              <div style={{padding: '14px 26px', fontFamily: '"Times New Roman", Times, serif', color: '#111', fontSize: 24, lineHeight: 1.36}}>
                <div style={{fontSize: 42, fontWeight: 700, marginBottom: 6}}>World Wide Web</div>
                <div>The WorldWideWeb (W3) is a wide-area</div>
                <div><LinkU u={u(0)}>hypermedia</LinkU> information retrieval</div>
                <div>initiative aiming to give universal</div>
                <div>access to a large <LinkU u={u(1)}>universe of documents</LinkU>.</div>
                <div style={{marginTop: 8}}>• <LinkU u={u(2)}>What&apos;s out there?</LinkU></div>
                <div>• <LinkU u={u(3)}>Help</LinkU>&nbsp;&nbsp;• <LinkU u={u(4)}>Software Products</LinkU></div>
              </div>
              <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 5px)'}} />
              <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(120% 110% at 50% 50%, transparent 60%, rgba(0,0,0,0.35))'}} />
            </div>
            <div style={{position: 'absolute', left: 44, bottom: 24, fontFamily: MONO, fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.45)'}}>CERN · NeXT</div>
            <div style={{position: 'absolute', right: 44, bottom: 26, width: 14, height: 14, borderRadius: 7, background: ROSE, boxShadow: `0 0 12px ${ROSE}`}} />
          </div>
          <div style={{position: 'absolute', left: 260, top: 540, width: 180, height: 50, background: 'linear-gradient(180deg,#151a28,#0a0c14)', clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)'}} />
        </div>
      </div>
      <AbsoluteFill style={{transform: `translateX(${cam}px)`}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <line x1={-200} y1={1200} x2={-200 + 1480 * rail} y2={1200} stroke={ROSE} strokeWidth={6} strokeLinecap="round" style={{filter: `drop-shadow(0 0 10px ${ROSE})`}} />
          {rail > 0.99 ? <circle cx={sig} cy={1200} r={7} fill={WHITE} style={{filter: `drop-shadow(0 0 8px ${WHITE})`}} /> : null}
          {nodes.map((n, i) => {
            const s = sp(f, fps, n.d, 8, 200, 0.6);
            const big = i === 2;
            const pulse = big && f > n.d ? (mod(f - n.d, 24)) / 24 : 0;
            return (
              <g key={n.y}>
                {big && f > n.d ? <circle cx={n.x} cy={1200} r={24 + pulse * 40} fill="none" stroke={ROSE} strokeWidth={3} opacity={1 - pulse} /> : null}
                <circle cx={n.x} cy={1200} r={(big ? 24 : 16) * s} fill={f > n.d + 3 ? ROSE : BG} stroke={ROSE} strokeWidth={5} />
                <text x={n.x} y={1160} textAnchor="middle" fill={big ? WHITE : 'rgba(255,255,255,0.7)'} fontFamily={HEAD} fontSize={big ? 62 : 48} opacity={Math.min(1, s)}>{n.y}</text>
                <text x={n.x} y={1250} textAnchor="middle" fill="rgba(56,189,248,0.85)" fontFamily={MONO} fontWeight={700} fontSize={22} opacity={Math.min(1, s)}>{n.tag}</text>
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1300, display: 'flex', justifyContent: 'center', ...fadeUp(f, 60, 30, 12)}}>
        <div style={{padding: '14px 34px', borderRadius: 40, border: `2px solid ${CYAN}`, background: 'rgba(56,189,248,0.1)', fontFamily: BODY, fontWeight: 700, fontSize: 36, color: WHITE, boxShadow: '0 0 30px rgba(56,189,248,0.25)'}}>
          Web <span style={{color: ROSE}}>≠</span> Internet
        </div>
      </div>
      <Headline f={f} text="1991: The Web goes live" delay={0} accent={[0]} size={100} kicker="CERN · TIM BERNERS-LEE" top={170} />
    </AbsoluteFill>
  );
};

/* ---------------- scene 7: globe ---------------- */

const DEG = Math.PI / 180;
type V3 = [number, number, number];
const vec = (lat: number, lon: number): V3 => [Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG)];
const BLOBS: [number, number, number][] = [
  [50, -100, 22], [38, -95, 16], [62, -120, 14], [65, -150, 8], [20, -102, 8], [70, -80, 10], [72, -40, 10],
  [-8, -60, 16], [-25, -58, 12], [-40, -68, 7], [5, -70, 8],
  [50, 10, 11], [60, 25, 10], [42, -4, 6], [45, 15, 6],
  [10, 15, 15], [0, 22, 15], [-18, 25, 12], [-28, 25, 7], [20, 0, 10], [25, 30, 8],
  [55, 90, 22], [60, 120, 15], [40, 95, 15], [30, 110, 12], [20, 78, 8], [35, 45, 10], [15, 100, 7], [65, 60, 14],
  [-25, 134, 12], [37, 138, 4], [-3, 115, 6],
];
const BLOBV = BLOBS.map(([a, b, r]) => ({v: vec(a, b), c: Math.cos(r * DEG)}));
const DOTS: {v: V3; land: boolean}[] = [];
for (let lat = -80; lat <= 80; lat += 5) {
  const step = 5 / Math.max(0.2, Math.cos(lat * DEG));
  for (let lon = -180; lon < 180; lon += step) {
    const v = vec(lat, lon);
    const land = BLOBV.some((b) => b.v[0] * v[0] + b.v[1] * v[1] + b.v[2] * v[2] > b.c);
    DOTS.push({v, land});
  }
}
const CITIES: Record<string, [number, number]> = {
  LA: [34, -118], NY: [41, -74], LON: [51, 0], LAG: [6, 3], BOM: [19, 73], TYO: [36, 140], SYD: [-34, 151], SAO: [-23, -46],
};
const PAIRS: [string, string][] = [['LA', 'NY'], ['NY', 'LON'], ['SAO', 'LAG'], ['LAG', 'LON'], ['NY', 'SAO'], ['LON', 'BOM'], ['BOM', 'TYO'], ['TYO', 'SYD']];
const ARC_N = 28;
const ARCS: V3[][] = PAIRS.map(([a, b]) => {
  const A = vec(...CITIES[a]);
  const B = vec(...CITIES[b]);
  const om = Math.acos(Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
  const pts: V3[] = [];
  for (let k = 0; k <= ARC_N; k++) {
    const t = k / ARC_N;
    const sa = Math.sin((1 - t) * om) / Math.sin(om);
    const sb = Math.sin(t * om) / Math.sin(om);
    const h = 1 + 0.22 * Math.sin(Math.PI * t) * Math.min(1, om / 1.0);
    pts.push([(A[0] * sa + B[0] * sb) * h, (A[1] * sa + B[1] * sb) * h, (A[2] * sa + B[2] * sb) * h]);
  }
  return pts;
});
const rot3 = (v: V3, th: number, ph: number): V3 => {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const x = v[0] * c + v[2] * s;
  const z0 = -v[0] * s + v[2] * c;
  const y0 = v[1];
  const cp = Math.cos(ph);
  const sp2 = Math.sin(ph);
  return [x, y0 * cp - z0 * sp2, y0 * sp2 + z0 * cp];
};

const DeviceIcon: React.FC<{kind: number}> = ({kind}) => {
  const st = {fill: 'none', stroke: WHITE, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  if (kind === 0)
    return (
      <g>
        <rect x={-13} y={-23} width={26} height={46} rx={6} {...st} />
        <circle cx={0} cy={15} r={2.5} fill={WHITE} />
      </g>
    );
  if (kind === 1)
    return (
      <g>
        <rect x={-22} y={-17} width={44} height={28} rx={3} {...st} />
        <path d="M -30 16 L 30 16 L 26 22 L -26 22 Z" {...st} />
      </g>
    );
  if (kind === 2)
    return (
      <g>
        <rect x={-24} y={0} width={48} height={18} rx={4} {...st} />
        <path d="M -12 0 L -18 -22 M 12 0 L 18 -22" {...st} />
        <circle cx={-10} cy={9} r={2.5} fill={CYAN} />
        <circle cx={0} cy={9} r={2.5} fill={ROSE} />
      </g>
    );
  return (
    <g>
      <rect x={-20} y={-22} width={40} height={18} rx={3} {...st} />
      <rect x={-20} y={2} width={40} height={18} rx={3} {...st} />
      <circle cx={12} cy={-13} r={2.5} fill={CYAN} />
      <circle cx={12} cy={11} r={2.5} fill={CYAN} />
    </g>
  );
};

const Scene7: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const CX = 540;
  const CY = 860;
  const R = 310;
  const pull = ip(f, [0, 55], [1.3, 1], EIO);
  const gs = interpolate(sp(f, fps, 0, 12, 110, 0.9), [0, 1], [0.6, 1]);
  const th = (40 - f * 0.9) * DEG;
  const ph = 18 * DEG;
  const orbit = sp(f, fps, 28, 12, 110, 0.9);
  const TILT = -14 * DEG;
  const rx = 470 * orbit;
  const ry = 120 * orbit;
  const icons = [0, 1, 2, 3].map((i) => {
    const a = (f * 1.4 + i * 90) * DEG;
    const ex = rx * Math.cos(a);
    const ey = ry * Math.sin(a);
    return {i, x: CX + ex * Math.cos(TILT) - ey * Math.sin(TILT), y: CY + ex * Math.sin(TILT) + ey * Math.cos(TILT), front: Math.sin(a) > 0, s: 0.82 + 0.18 * Math.sin(a)};
  });
  const renderIcon = (ic: {i: number; x: number; y: number; s: number; front: boolean}) => (
    <g key={ic.i} transform={`translate(${ic.x} ${ic.y}) scale(${ic.s * orbit})`} opacity={(ic.front ? 1 : 0.5) * orbit}>
      <circle r={46} fill="#0d1424" stroke={ic.i % 2 ? ROSE : CYAN} strokeWidth={3} style={{filter: `drop-shadow(0 0 12px ${ic.i % 2 ? ROSE : CYAN})`}} />
      <DeviceIcon kind={ic.i} />
    </g>
  );
  const vis = (p: V3) => p[2] > 0 || p[0] * p[0] + p[1] * p[1] > 1;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transformOrigin: `${CX}px ${CY}px`, transform: `scale(${pull})`}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
              <stop offset="0.7" stopColor={CYAN} stopOpacity="0.25" />
              <stop offset="1" stopColor={CYAN} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="body" cx="40%" cy="35%" r="70%">
              <stop offset="0" stopColor="#123049" />
              <stop offset="1" stopColor="#050a14" />
            </radialGradient>
          </defs>
          <g transform={`translate(${CX} ${CY}) rotate(-14)`} opacity={orbit}>
            <path d={`M ${-rx} 0 A ${rx} ${ry} 0 0 1 ${rx} 0`} fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth={2.5} strokeDasharray="10 10" strokeDashoffset={-f * 2} />
          </g>
          {icons.filter((i) => !i.front).map(renderIcon)}
          <g transform={`translate(${CX} ${CY}) scale(${gs}) translate(${-CX} ${-CY})`}>
            <circle cx={CX} cy={CY} r={R * 1.18} fill="url(#atmo)" />
            <circle cx={CX} cy={CY} r={R} fill="url(#body)" stroke="rgba(56,189,248,0.55)" strokeWidth={2} />
            {DOTS.map((d, k) => {
              const p = rot3(d.v, th, ph);
              if (p[2] <= 0) return null;
              return <circle key={k} cx={CX + R * p[0]} cy={CY - R * p[1]} r={d.land ? 3.3 : 1.5} fill={CYAN} opacity={(d.land ? 0.95 : 0.22) * (0.35 + 0.65 * p[2])} />;
            })}
            {ARCS.map((pts, i) => {
              const d0 = 16 + i * 6;
              const prog = ip(f, [d0, d0 + 16], [0, 1], EIO);
              if (prog <= 0) return null;
              const n = Math.floor(prog * ARC_N);
              const P = pts.map((v) => rot3(v, th, ph));
              const segs: React.ReactNode[] = [];
              for (let k = 0; k < n; k++) {
                if (vis(P[k]) && vis(P[k + 1])) {
                  segs.push(<line key={k} x1={CX + R * P[k][0]} y1={CY - R * P[k][1]} x2={CX + R * P[k + 1][0]} y2={CY - R * P[k + 1][1]} stroke={ROSE} strokeWidth={3.5} strokeLinecap="round" />);
                }
              }
              const hk = prog < 1 ? n : Math.floor(mod((f - d0) * 1.2, ARC_N));
              const hp = P[hk];
              return (
                <g key={i} style={{filter: `drop-shadow(0 0 6px ${ROSE})`}}>
                  {segs}
                  {vis(hp) ? <circle cx={CX + R * hp[0]} cy={CY - R * hp[1]} r={6} fill={WHITE} /> : null}
                </g>
              );
            })}
          </g>
          <g transform={`translate(${CX} ${CY}) rotate(-14)`} opacity={orbit}>
            <path d={`M ${-rx} 0 A ${rx} ${ry} 0 0 0 ${rx} 0`} fill="none" stroke="rgba(56,189,248,0.6)" strokeWidth={3} strokeDasharray="10 10" strokeDashoffset={-f * 2} />
          </g>
          {icons.filter((i) => i.front).map(renderIcon)}
        </svg>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1330, display: 'flex', justifyContent: 'center', ...fadeUp(f, 52, 30, 12)}}>
        <div style={{padding: '14px 34px', borderRadius: 40, background: 'rgba(244,63,94,0.14)', border: `2px solid ${ROSE}`, fontFamily: BODY, fontWeight: 700, fontSize: 36, color: WHITE}}>
          From <span style={{color: ROSE}}>2 labs</span> to worldwide
        </div>
      </div>
      <Headline f={f} text="One network spans the globe" delay={0} accent={[4]} size={96} kicker="TODAY" top={180} />
    </AbsoluteFill>
  );
};

/* ---------------- scene 8: CTA ---------------- */

const RecapIcon: React.FC<{k: number}> = ({k}) => {
  const st = {fill: 'none', stroke: WHITE, strokeWidth: 3, strokeLinejoin: 'round' as const};
  return (
    <svg width={80} height={80} viewBox="-40 -40 80 80">
      {k === 0 ? (
        <g>
          <rect x={-28} y={-14} width={56} height={30} rx={5} {...st} />
          {[-18, -6, 6, 18].map((x) => <rect key={x} x={x - 4} y={-8} width={8} height={7} fill={WHITE} />)}
          <rect x={-14} y={5} width={28} height={6} fill={WHITE} />
        </g>
      ) : k === 1 ? (
        <g>
          <path d="M 0 -24 L 22 -12 L 22 14 L 0 26 L -22 14 L -22 -12 Z" {...st} />
          <path d="M -22 -12 L 0 0 L 22 -12 M 0 0 L 0 26" {...st} />
        </g>
      ) : k === 2 ? (
        <g>
          <rect x={-26} y={-22} width={52} height={36} rx={5} {...st} />
          <path d="M -10 22 L 10 22 M 0 14 L 0 22" {...st} />
        </g>
      ) : (
        <g>
          <circle r={24} {...st} />
          <ellipse rx={10} ry={24} {...st} />
          <path d="M -24 0 L 24 0" {...st} />
        </g>
      )}
    </svg>
  );
};

const Scene8: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const push = interpolate(f, [0, 90], [1, 1.05], CL);
  const words = ['FOLLOW', 'FOR', 'MORE', 'ORIGINS'];
  const line = ip(f, [20, 34], [0, 1], EIO);
  const btn = sp(f, fps, 34, 9, 170, 0.7);
  const rip = ip(f, [50, 70], [0, 1]);
  const btnPress = f >= 50 ? interpolate(f, [50, 52, 58], [1, 0.94, 1], CL) : 1;
  const strip = ip(f, [40, 90], [320, -40], EIO);
  const dot = sp(f, fps, 0, 10, 160, 0.7);
  return (
    <AbsoluteFill style={{transform: `scale(${push})`}}>
      <div style={{position: 'absolute', left: 60, right: 60, top: 600, textAlign: 'center', fontFamily: HEAD, fontSize: 150, lineHeight: 1.02, color: WHITE}}>
        {words.map((w, i) => (
          <span key={w} style={{display: 'inline-block', margin: '0 0.12em', color: i === 3 ? ROSE : WHITE, ...fadeUp(f, 6 + i * 4, 50, 12), textShadow: '0 10px 40px rgba(0,0,0,0.6)'}}>{w}</span>
        ))}
      </div>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <circle cx={150} cy={1000} r={12 * dot} fill={CYAN} style={{filter: `drop-shadow(0 0 10px ${CYAN})`}} />
        <line x1={150} y1={1000} x2={150 + 780 * line} y2={1000} stroke={ROSE} strokeWidth={8} strokeLinecap="round" style={{filter: `drop-shadow(0 0 10px ${ROSE})`}} />
      </svg>
      <div style={{position: 'absolute', left: 330, top: 1070, width: 420, height: 120}}>
        {f >= 50 ? <div style={{position: 'absolute', left: 210 - 260 * rip, top: 60 - 260 * rip, width: 520 * rip, height: 520 * rip, borderRadius: '50%', border: `3px solid ${ROSE}`, opacity: 1 - rip}} /> : null}
        <div style={{position: 'absolute', inset: 0, borderRadius: 60, background: `linear-gradient(180deg, ${ROSE}, #be123c)`, boxShadow: '0 20px 50px rgba(244,63,94,0.45)', transform: `scale(${btn * btnPress})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BODY, fontWeight: 800, fontSize: 52, color: WHITE}}>
          + Follow
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, top: 1260, width: W, height: 120, overflow: 'hidden', opacity: ip(f, [40, 48], [0, 1])}}>
        <div style={{position: 'absolute', left: 120, top: 58, width: 1000, height: 3, background: 'rgba(56,189,248,0.4)', transform: `translateX(${strip}px)`}} />
        <div style={{position: 'absolute', left: 120, top: 10, display: 'flex', gap: 120, transform: `translateX(${strip}px)`}}>
          {[0, 1, 2, 3].map((k) => (
            <div key={k} style={{width: 100, height: 100, borderRadius: 22, background: '#0d1424', border: `2px solid ${k % 2 ? ROSE : CYAN}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <RecapIcon k={k} />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- captions ---------------- */

type SceneProp = {scene_number: number; start: number; durationInFrames: number; narration: string; words: Array<{word: string; startFrame: number; endFrame: number}>};

const Captions: React.FC<{frame: number; scenes: SceneProp[]}> = ({frame, scenes}) => {
  const sc = scenes.find((s) => frame >= s.start && frame < s.start + s.durationInFrames);
  if (!sc || !sc.words || sc.words.length === 0) return null;
  const lf = frame - sc.start;
  const enter = ip(lf, [0, 7], [0, 1]);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1490, display: 'flex', justifyContent: 'center', opacity: enter, transform: `translateY(${(1 - enter) * 14}px)`}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 4px', padding: '20px 26px', borderRadius: 28, background: 'rgba(7,8,14,0.62)', border: '1px solid rgba(56,189,248,0.18)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
        {sc.words.map((w, i) => {
          const active = lf >= w.startFrame && lf < w.endFrame;
          const spoken = lf >= w.endFrame;
          return (
            <span
              key={i}
              style={{
                fontFamily: BODY, fontWeight: 800, fontSize: 58, lineHeight: 1.2,
                padding: '4px 14px', borderRadius: 14,
                background: active ? ROSE : 'transparent',
                color: active || spoken ? WHITE : 'rgba(255,255,255,0.42)',
                transform: active ? 'scale(1.06)' : 'scale(1)',
                boxShadow: active ? '0 8px 26px rgba(244,63,94,0.5)' : undefined,
                textShadow: active ? undefined : '0 3px 14px rgba(0,0,0,0.8)',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- main ---------------- */

export default function Video(props: {fps: number; durationInFrames: number; scenes: SceneProp[]}) {
  const frame = useCurrentFrame();
  const scenes = props.scenes ?? [];
  const camX = Math.sin(frame / 80) * 14;
  const camY = Math.cos(frame / 95) * 10;
  const camR = Math.sin(frame / 140) * 0.4;
  const breathe = 1 + Math.sin(frame / 60) * 0.006;
  return (
    <AbsoluteFill style={{backgroundColor: BG, overflow: 'hidden'}}>
      <World frame={frame} />
      <AbsoluteFill style={{transform: `translate(${camX}px, ${camY}px) rotate(${camR}deg) scale(${breathe})`}}>
        <Shot frame={frame} start={0} end={63} outFocal={[610, 818]}>{(f) => <Scene1 f={f} />}</Shot>
        <Shot frame={frame} start={63} end={170} inFocal={[610, 818]} outFocal={[470, 800]}>{(f) => <Scene2 f={f} />}</Shot>
        <Shot frame={frame} start={170} end={246} inFocal={[470, 800]} outFocal={[540, 782]}>{(f) => <Scene3 f={f} />}</Shot>
        <Shot frame={frame} start={246} end={314} inFocal={[540, 782]} outFocal={[760, 1140]}>{(f) => <Scene4 f={f} />}</Shot>
        <Shot frame={frame} start={314} end={443} inFocal={[760, 1140]} outFocal={[790, 980]}>{(f) => <Scene5 f={f} />}</Shot>
        <Shot frame={frame} start={443} end={532} inFocal={[790, 980]} outFocal={[508, 750]}>{(f) => <Scene6 f={f} />}</Shot>
        <Shot frame={frame} start={532} end={612} inFocal={[508, 750]} outFocal={[540, 860]}>{(f) => <Scene7 f={f} />}</Shot>
        <Shot frame={frame} start={612} end={702} inFocal={[540, 860]}>{(f) => <Scene8 f={f} />}</Shot>
      </AbsoluteFill>
      <Wipes frame={frame} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.72) 100%)', pointerEvents: 'none'}} />
      <Captions frame={frame} scenes={scenes} />
    </AbsoluteFill>
  );
}