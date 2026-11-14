import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  random,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { SyncCaptions } from '../../components/SyncCaptions';
import { BittrixOutroExact } from '../../components/BittrixOutroExact';

type Word = { word: string; startFrame: number; endFrame: number };
type Scene = {
  scene_number: number;
  durationInFrames: number;
  on_screen_text: string;
  themeColor: string;
  words: Word[];
};

const SCENES: Scene[] = [
  { scene_number: 1, durationInFrames: 76, on_screen_text: 'Why is the ocean blue?', themeColor: '#38bdf8',
    words: [{ word: "Why's", startFrame: 3, endFrame: 12 }, { word: 'the', startFrame: 12, endFrame: 15 }, { word: 'ocean', startFrame: 15, endFrame: 25 }, { word: 'blue', startFrame: 25, endFrame: 37 }] },
  { scene_number: 2, durationInFrames: 73, on_screen_text: "It's NOT the sky", themeColor: '#f43f5e',
    words: [{ word: "It's", startFrame: 3, endFrame: 9 }, { word: 'not', startFrame: 9, endFrame: 15 }, { word: 'the', startFrame: 16, endFrame: 18 }, { word: 'sky', startFrame: 19, endFrame: 34 }] },
  { scene_number: 3, durationInFrames: 86, on_screen_text: 'Water absorbs red light', themeColor: '#38bdf8',
    words: [{ word: 'Water', startFrame: 3, endFrame: 14 }, { word: 'absorbs', startFrame: 14, endFrame: 27 }, { word: 'red', startFrame: 28, endFrame: 35 }, { word: 'light', startFrame: 35, endFrame: 48 }] },
  { scene_number: 4, durationInFrames: 81, on_screen_text: 'Red fades out first', themeColor: '#f43f5e',
    words: [{ word: 'Red', startFrame: 3, endFrame: 11 }, { word: 'fades', startFrame: 12, endFrame: 21 }, { word: 'out', startFrame: 21, endFrame: 25 }, { word: 'first', startFrame: 26, endFrame: 42 }] },
  { scene_number: 5, durationInFrames: 82, on_screen_text: 'Blue travels deepest', themeColor: '#38bdf8',
    words: [{ word: 'Blue', startFrame: 3, endFrame: 11 }, { word: 'travels', startFrame: 11, endFrame: 24 }, { word: 'deepest', startFrame: 24, endFrame: 44 }] },
  { scene_number: 6, durationInFrames: 82, on_screen_text: 'Then scatters back up', themeColor: '#38bdf8',
    words: [{ word: 'Then', startFrame: 3, endFrame: 11 }, { word: 'scatters', startFrame: 11, endFrame: 24 }, { word: 'back', startFrame: 25, endFrame: 32 }, { word: 'up', startFrame: 33, endFrame: 43 }] },
  { scene_number: 7, durationInFrames: 84, on_screen_text: 'Plankton turns it greener', themeColor: '#5fa97a',
    words: [{ word: 'Plankton', startFrame: 3, endFrame: 18 }, { word: 'turns', startFrame: 18, endFrame: 27 }, { word: 'it', startFrame: 27, endFrame: 30 }, { word: 'greener', startFrame: 30, endFrame: 46 }] },
  { scene_number: 8, durationInFrames: 125, on_screen_text: 'Follow Bittrix Technologies', themeColor: '#38bdf8',
    words: [{ word: 'Follow', startFrame: 3, endFrame: 13 }, { word: 'Bittrix', startFrame: 14, endFrame: 27 }, { word: 'Technologies', startFrame: 27, endFrame: 56 }] },
];

const STARTS: number[] = SCENES.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].durationInFrames);
  return acc;
}, []);
const TOTAL = STARTS[STARTS.length - 1] + SCENES[SCENES.length - 1].durationInFrames;
const OUTRO_LEN = 90;
const OUTRO_START = TOTAL - OUTRO_LEN;

const W = 1080;
const H = 1920;
const SKY = '#38bdf8';
const ROSE = '#f43f5e';
const NAVY = '#06122b';
const IMPACT = 'Impact, "Anton", "Bebas Neue", "Arial Black", sans-serif';
const INTER = 'Inter, system-ui, sans-serif';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

const lerpColor = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
};

const pointAlong = (pts: [number, number][], t: number): [number, number] => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = segs[i] === 0 ? 0 : Math.min(1, d / segs[i]);
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};

/* ------------------------------------------------------------------ */
/* Living backdrop: shared across scenes, never cuts                    */
/* ------------------------------------------------------------------ */
const Backdrop: React.FC<{ frame: number }> = ({ frame }) => {
  const keys = [0, STARTS[2], STARTS[4], STARTS[5] + 30, STARTS[6], STARTS[6] + 50, STARTS[7], TOTAL];
  const tops = ['#0b2545', '#0b2545', '#0a3a66', '#030b1f', '#030b1f', '#0d3b33', '#070a18', '#070a18'];
  const bots = ['#02060f', '#02060f', '#031634', '#01040c', '#01040c', '#062019', '#02030a', '#02030a'];
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1]) i++;
  const t = interpolate(frame, [keys[i], keys[i + 1]], [0, 1], clamp);
  const top = lerpColor(tops[i], tops[i + 1], t);
  const bot = lerpColor(bots[i], bots[i + 1], t);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bot} 100%)` }}>
      <AbsoluteFill style={{ opacity: interpolate(frame, [0, 30, STARTS[7], TOTAL], [0, 0.35, 0.25, 0.1], clamp) }}>
        {[0, 1, 2, 3].map((k) => (
          <div
            key={k}
            style={{
              position: 'absolute',
              top: -200,
              left: 180 + k * 220 + Math.sin(frame / 50 + k) * 40,
              width: 120,
              height: 2400,
              transform: `rotate(${12 + k * 3}deg)`,
              background: 'linear-gradient(180deg, rgba(186,230,253,0.18), rgba(186,230,253,0))',
              filter: 'blur(20px)',
            }}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Particles: React.FC<{ frame: number; glintX?: number; glintY?: number }> = ({ frame, glintX, glintY }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    {new Array(46).fill(0).map((_, i) => {
      const x0 = random(`px${i}`) * W;
      const y0 = random(`py${i}`) * H;
      const sp = 0.25 + random(`ps${i}`) * 0.7;
      const r = 2 + random(`pr${i}`) * 5;
      const y = ((y0 - frame * sp * 1.4) % H + H) % H;
      const x = x0 + Math.sin(frame / 40 + i) * 18;
      let glow = 0.25 + 0.35 * random(`pa${i}`);
      if (glintX !== undefined && glintY !== undefined) {
        const d = Math.hypot(x - glintX, y - glintY);
        glow += interpolate(d, [0, 180], [0.9, 0], clamp);
      }
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: r,
            height: r,
            borderRadius: '50%',
            background: '#e0f2fe',
            opacity: Math.min(1, glow),
            boxShadow: `0 0 ${8 + glow * 16}px rgba(186,230,253,${glow})`,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ */
/* Scene shell: crossfade + per-scene push                              */
/* ------------------------------------------------------------------ */
const Shell: React.FC<{ index: number; frame: number; children: (f: number) => React.ReactNode; push?: number }> = ({
  index,
  frame,
  children,
  push = 0.05,
}) => {
  const start = STARTS[index];
  const dur = SCENES[index].durationInFrames;
  const f = frame - start;
  if (f < -10 || f > dur + 10) return null;
  const fadeIn = index === 0 ? 1 : interpolate(f, [-10, 6], [0, 1], clamp);
  const fadeOut = index === SCENES.length - 1 ? 1 : interpolate(f, [dur - 6, dur + 10], [1, 0], clamp);
  const s = 1 + interpolate(f, [0, dur], [0, push], clamp);
  const enterY = interpolate(f, [-10, 8], [60, 0], { ...clamp, easing: ease });
  const exitY = interpolate(f, [dur - 6, dur + 10], [0, -80], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut), transform: `translateY(${enterY + exitY}px) scale(${s})` }}>
      {children(f)}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 1 — hook: ocean cross-section + snapping question              */
/* ------------------------------------------------------------------ */
const Scene1: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const words = ['WHY', 'IS', 'THE', 'OCEAN', 'BLUE?'];
  const triggers = [3, 8, 12, 15, 25];
  const surface = 860;
  const wave = (phase: number, amp: number) => {
    let d = `M 0 ${surface}`;
    for (let x = 0; x <= W; x += 30) d += ` L ${x} ${surface + Math.sin(x / 90 + f / 14 + phase) * amp}`;
    return d + ` L ${W} ${H} L 0 ${H} Z`;
  };
  const sunIn = spring({ frame: f, fps, config: { damping: 18, stiffness: 80 } });
  const oceanRise = interpolate(f, [0, 22], [220, 0], { ...clamp, easing: ease });
  return (
    <AbsoluteFill>
      {/* FIX: sun moved off the "BLUE?" headline; it now sets on the horizon, lower half behind the water */}
      <div
        style={{
          position: 'absolute',
          right: 110,
          top: 740,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff7e0 0%, #fde68a 55%, rgba(253,230,138,0) 72%)',
          boxShadow: '0 0 120px 30px rgba(253,230,138,0.22)',
          transform: `scale(${sunIn})`,
        }}
      />
      <svg width={W} height={H} style={{ position: 'absolute', transform: `translateY(${oceanRise}px)` }}>
        <defs>
          <linearGradient id="s1sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7dd3fc" />
            <stop offset="0.25" stopColor="#0ea5e9" />
            <stop offset="0.6" stopColor="#075985" />
            <stop offset="1" stopColor="#020617" />
          </linearGradient>
        </defs>
        <path d={wave(1.4, 14)} fill="#0c4a6e" opacity={0.6} />
        <path d={wave(0, 20)} fill="url(#s1sea)" />
        <path
          d={(() => {
            let d = '';
            for (let x = 0; x <= W; x += 30) d += `${x === 0 ? 'M' : 'L'} ${x} ${surface + Math.sin(x / 90 + f / 14) * 20}`;
            return d;
          })()}
          stroke="#e0f2fe"
          strokeWidth={5}
          fill="none"
          opacity={0.85}
        />
      </svg>
      <div style={{ position: 'absolute', top: 230, left: 70, right: 70, textAlign: 'center', lineHeight: 0.98 }}>
        {words.map((w, i) => {
          const sp = spring({ frame: f - triggers[i], fps, config: { damping: 11, stiffness: 190 } });
          const isBlue = w === 'BLUE?';
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                margin: '0 14px',
                fontFamily: IMPACT,
                fontSize: isBlue ? 210 : 150,
                color: isBlue ? SKY : '#ffffff',
                textShadow: isBlue ? `0 0 50px ${SKY}aa, 0 8px 0 #0c4a6e` : '0 8px 0 rgba(0,0,0,0.45)',
                opacity: f >= triggers[i] ? 1 : 0,
                transform: `translateY(${(1 - sp) * -90}px) scale(${0.6 + sp * 0.4}) rotate(${(1 - sp) * (i % 2 ? 8 : -8)}deg)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 2 — "NOT the sky": sticker slam + rose strike                  */
/* ------------------------------------------------------------------ */
const Scene2: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const slam = spring({ frame: f - 2, fps, config: { damping: 10, stiffness: 160 } });
  const shake = f >= 9 && f < 20 ? Math.sin(f * 3.1) * (20 - f) * 1.4 : 0;
  const textIn = spring({ frame: f - 14, fps, config: { damping: 12, stiffness: 150 } });
  const cloudDrift = Math.sin(f / 18) * 14;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <div
        style={{
          position: 'absolute',
          left: 170,
          top: 420,
          width: 740,
          height: 540,
          borderRadius: 48,
          border: '14px solid #ffffff',
          background: 'linear-gradient(180deg, #bae6fd 0%, #e0f2fe 100%)',
          boxShadow: '0 40px 90px rgba(0,0,0,0.55)',
          overflow: 'hidden',
          transform: `scale(${interpolate(slam, [0, 1], [2.4, 1])}) rotate(${interpolate(slam, [0, 1], [-18, -5])}deg)`,
          opacity: interpolate(f, [0, 4], [0, 1], clamp),
        }}
      >
        <svg width={712} height={512} style={{ position: 'absolute' }}>
          <g transform={`translate(${cloudDrift}, 0)`} fill="#ffffff">
            <ellipse cx={300} cy={250} rx={150} ry={70} />
            <circle cx={240} cy={210} r={80} />
            <circle cx={350} cy={185} r={100} />
            <circle cx={440} cy={240} r={70} />
          </g>
          <circle cx={590} cy={110} r={46} fill="#fde68a" />
        </svg>
        {[-28, 28].map((deg, k) => (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: 356 - 410,
              top: 256 - 20,
              width: 820,
              height: 40,
              borderRadius: 20,
              background: ROSE,
              boxShadow: `0 0 40px ${ROSE}`,
              transformOrigin: '50% 50%',
              transform: `rotate(${deg}deg) scaleX(${interpolate(f, [9 + k * 3, 18 + k * 3], [0, 1], { ...clamp, easing: ease })})`,
            }}
          />
        ))}
      </div>
      {/* FIX: single line, smaller, raised — no longer wraps "SKY" onto the karaoke captions */}
      <div
        style={{
          position: 'absolute',
          top: 1060,
          left: 0,
          right: 0,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          fontFamily: IMPACT,
          fontSize: 120,
          color: '#fff',
          letterSpacing: 4,
          transform: `scale(${0.5 + textIn * 0.5})`,
          opacity: textIn,
          textShadow: '0 10px 0 rgba(0,0,0,0.4)',
        }}
      >
        <span style={{ color: ROSE, textShadow: `0 0 40px ${ROSE}99, 0 10px 0 #881337` }}>NOT</span> THE SKY
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 3 — split compare: glass vs tall column                        */
/* ------------------------------------------------------------------ */
const Scene3: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const draw = interpolate(f, [0, 20], [0, 1], { ...clamp, easing: ease });
  const grow = interpolate(f, [8, 60], [0, 1], { ...clamp, easing: ease });
  const redFade = interpolate(f, [28, 55], [1, 0], clamp);
  const colTop = interpolate(grow, [0, 1], [1080, 300]);
  const colBottom = 1320;
  const colCol = lerpColor('#e0f2fe', '#0284c7', grow);
  const glassPath = 'M 150 820 L 180 1300 Q 185 1320 205 1320 L 395 1320 Q 415 1320 420 1300 L 450 820';
  const divider = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: W / 2 - 2, top: 260, width: 4, height: 1100 * divider, background: 'rgba(255,255,255,0.18)' }} />
      <div style={{ position: 'absolute', left: 0, width: W / 2, top: 700, textAlign: 'center', fontFamily: INTER, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: 'rgba(255,255,255,0.7)' }}>A GLASS</div>
      <div style={{ position: 'absolute', left: W / 2, width: W / 2, top: Math.min(colTop - 90, 700), textAlign: 'center', fontFamily: INTER, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: SKY }}>THE OCEAN</div>
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        <path d={glassPath + ' Z'} fill="rgba(224,242,254,0.12)" />
        <path d="M 168 900 L 432 900 L 420 1300 Q 415 1320 395 1320 L 205 1320 Q 185 1320 180 1300 Z" fill="rgba(224,242,254,0.22)" />
        <path d={glassPath} stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={1200} strokeDashoffset={1200 * (1 - draw)} />
        <rect x={680} y={colTop} width={260} height={colBottom - colTop} rx={26} fill={colCol} />
        <rect x={680} y={colTop} width={260} height={(colBottom - colTop) * 0.45} rx={26} fill={ROSE} opacity={0.55 * redFade} />
        <rect x={680} y={colTop} width={260} height={colBottom - colTop} rx={26} fill="none" stroke="#fff" strokeWidth={8} />
        {[0, 1, 2].map((k) => (
          <path
            key={k}
            d={`M 692 ${colTop + 40 + k * 18} q 30 -10 60 0 t 60 0 t 60 0 t 60 0`}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={4}
            fill="none"
            transform={`translate(${Math.sin(f / 10 + k) * 8},0)`}
            opacity={1 - k * 0.3}
          />
        ))}
      </svg>
      {[0, 1, 2, 3, 4].map((k) => {
        const t = interpolate(f, [24 + k * 4, 50 + k * 4], [0, 1], clamp);
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: 720 + k * 42,
              top: colTop + 30 + t * 380,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: ROSE,
              boxShadow: `0 0 20px ${ROSE}`,
              opacity: t > 0 ? 1 - t : 0,
              transform: `scale(${1 - t * 0.7})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 4 — flow path: sunbeam splits into five rays                   */
/* ------------------------------------------------------------------ */
// FIX: whole beam/ray system shifted 60px left so the caption column fits inside the frame
const OX = 390;
const RAYS = [
  { c: ROSE, x: 150, depth: 860 },
  { c: '#d98a5b', x: 270, depth: 1000 },
  { c: '#e6c35c', x: 390, depth: 1130 },
  { c: '#6cbf84', x: 510, depth: 1270 },
  { c: SKY, x: 630, depth: 2100 },
];
const Scene4: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const wedge = interpolate(f, [0, 12], [0, 1], { ...clamp, easing: ease });
  const splitY = 640;
  const capIn = spring({ frame: f - 12, fps, config: { damping: 14, stiffness: 130 } });
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="s4w" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.1} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0.95} />
          </linearGradient>
        </defs>
        <polygon
          points={`${OX - 120},140 ${OX + 120},140 ${OX + 28},${140 + (splitY - 140) * wedge} ${OX - 28},${140 + (splitY - 140) * wedge}`}
          fill="url(#s4w)"
        />
        <line x1={0} x2={W} y1={760} y2={760} stroke="rgba(224,242,254,0.4)" strokeWidth={4} strokeDasharray="18 14" />
        {RAYS.map((r, i) => {
          const t = interpolate(f, [10 + i * 3, 46 + i * 4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const endY = splitY + (r.depth - splitY) * t;
          const fadeRed = i === 0 ? interpolate(f, [30, 60], [1, 0.25], clamp) : 1;
          return (
            <g key={i} opacity={fadeRed}>
              <path
                d={`M ${OX} ${splitY} Q ${(OX + r.x) / 2} ${splitY + 60} ${r.x} ${splitY + 140} L ${r.x} ${Math.max(splitY + 140, endY)}`}
                stroke={r.c}
                strokeWidth={30}
                strokeLinecap="round"
                fill="none"
                opacity={t > 0 ? 1 : 0}
                style={{ filter: `drop-shadow(0 0 14px ${r.c})` }}
              />
              {t >= 0.98 && i < 4 && (
                <circle cx={r.x} cy={r.depth} r={26 + Math.sin(f / 4 + i) * 3} fill="none" stroke={r.c} strokeWidth={5} opacity={0.8} />
              )}
            </g>
          );
        })}
      </svg>
      {/* FIX: SURFACE label moved to the right, above the dashed line, clear of the red ray's end ring */}
      <div style={{ position: 'absolute', right: 70, top: 712, textAlign: 'right', fontFamily: INTER, fontWeight: 700, fontSize: 28, color: 'rgba(224,242,254,0.7)', letterSpacing: 4 }}>SURFACE</div>
      {/* FIX: caption column resized so "FADES" no longer clips the right edge */}
      <div
        style={{
          position: 'absolute',
          right: 70,
          top: 820,
          width: 330,
          textAlign: 'right',
          fontFamily: IMPACT,
          fontSize: 90,
          lineHeight: 0.98,
          color: '#fff',
          transform: `translateX(${(1 - capIn) * 200}px)`,
          opacity: capIn,
        }}
      >
        <span style={{ color: ROSE }}>RED</span>
        <br />
        FADES
        <br />
        OUT
        <br />
        <span style={{ color: '#fecdd3' }}>FIRST</span>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 5 — depth descent ruler                                         */
/* ------------------------------------------------------------------ */
const Scene5: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const top = 280;
  const bot = 1340;
  const mk = interpolate(f, [6, 48], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const my = top + (bot - top) * mk;
  const badge = spring({ frame: f - 44, fps, config: { damping: 9, stiffness: 170 } });
  const labels = [
    { t: 'SHALLOW', y: top + 40 },
    { t: 'DEEPER', y: (top + bot) / 2 },
    { t: 'DEEPEST', y: bot - 20 },
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: NAVY, opacity: interpolate(f, [0, 60], [0, 0.7], clamp) }} />
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        <rect x={180} y={top} width={14} height={bot - top} rx={7} fill="rgba(255,255,255,0.25)" />
        {new Array(21).fill(0).map((_, i) => {
          const y = top + ((bot - top) * i) / 20;
          return <line key={i} x1={i % 5 === 0 ? 140 : 160} x2={180} y1={y} y2={y} stroke="rgba(255,255,255,0.55)" strokeWidth={i % 5 === 0 ? 6 : 3} />;
        })}
        <line x1={250} x2={250} y1={top} y2={my} stroke={SKY} strokeWidth={26} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 22px ${SKY})` }} />
        <polygon points={`200,${my} 236,${my - 26} 236,${my + 26}`} fill={SKY} />
      </svg>
      {labels.map((l, i) => {
        const lit = mk >= i / 2 - 0.02;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 310,
              top: l.y - 30,
              fontFamily: INTER,
              fontWeight: 800,
              fontSize: 52,
              letterSpacing: 6,
              color: lit ? '#fff' : 'rgba(255,255,255,0.3)',
              textShadow: lit ? `0 0 24px ${SKY}88` : 'none',
            }}
          >
            {l.t}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 520,
          top: 780,
          width: 460,
          textAlign: 'center',
          fontFamily: IMPACT,
          fontSize: 96,
          lineHeight: 1,
          color: '#fff',
          opacity: interpolate(f, [4, 14], [0, 1], clamp),
        }}
      >
        <span style={{ color: SKY }}>BLUE</span>
        <br />
        TRAVELS
      </div>
      <div
        style={{
          position: 'absolute',
          left: 560,
          top: 1080,
          padding: '26px 54px',
          borderRadius: 999,
          background: `linear-gradient(135deg, ${SKY}, #0369a1)`,
          border: '4px solid #e0f2fe',
          fontFamily: IMPACT,
          fontSize: 88,
          color: '#fff',
          letterSpacing: 6,
          boxShadow: `0 0 70px ${SKY}aa`,
          transform: `scale(${badge}) rotate(${(1 - badge) * -12}deg)`,
          opacity: badge > 0.01 ? 1 : 0,
        }}
      >
        DEEPEST
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 6 — photons scatter back up to the eye                          */
/* ------------------------------------------------------------------ */
// FIX: paths now terminate at the eye (y≈500) and start higher so trails stay clear of the captions
const EYE_Y = 420;
const PATHS: [number, number][][] = [
  [[200, 1300], [380, 1140], [240, 980], [430, 820], [330, 660], [540, 500]],
  [[540, 1340], [700, 1160], [500, 990], [680, 820], [560, 660], [540, 500]],
  [[880, 1300], [720, 1120], [900, 960], [700, 800], [780, 640], [540, 500]],
];
const Scene6: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const eyeIn = spring({ frame: f, fps, config: { damping: 12, stiffness: 120 } });
  const blink = f > 50 && f < 56 ? 0.15 : 1;
  const absorbed = f > 40;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: NAVY, opacity: 0.7 }} />
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        {/* FIX: surface line passes behind the eye instead of slicing through it */}
        <path
          d={(() => {
            let d = '';
            for (let x = 0; x <= W; x += 30) d += `${x === 0 ? 'M' : 'L'} ${x} ${EYE_Y + Math.sin(x / 80 + f / 12) * 10}`;
            return d;
          })()}
          stroke="#7dd3fc"
          strokeWidth={5}
          fill="none"
          opacity={0.7}
        />
        {PATHS.map((pts, i) => {
          const t = interpolate(f, [4 + i * 5, 44 + i * 5], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
          const head = pointAlong(pts, t);
          const prev = pointAlong(pts, Math.max(0, t - 0.02));
          const ang = Math.atan2(head[1] - prev[1], head[0] - prev[0]);
          const trail: [number, number][] = [];
          for (let k = 0; k <= 14; k++) trail.push(pointAlong(pts, Math.max(0, t - 0.28) + ((t - Math.max(0, t - 0.28)) * k) / 14));
          return (
            <g key={i} opacity={t > 0 && t < 1 ? 1 : 0}>
              <polyline points={pts.map((p) => p.join(',')).join(' ')} stroke={SKY} strokeOpacity={0.12} strokeWidth={4} fill="none" strokeDasharray="10 14" />
              <polyline points={trail.map((p) => p.join(',')).join(' ')} stroke={SKY} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 16px ${SKY})` }} />
              <polygon
                points="0,-22 40,0 0,22"
                fill="#e0f2fe"
                transform={`translate(${head[0]},${head[1]}) rotate(${(ang * 180) / Math.PI})`}
                style={{ filter: `drop-shadow(0 0 18px ${SKY})` }}
              />
            </g>
          );
        })}
        <g transform={`translate(540, ${EYE_Y}) scale(${eyeIn})`}>
          <ellipse cx={0} cy={0} rx={130} ry={70 * blink} fill="#ffffff" stroke={SKY} strokeWidth={8} />
          <circle cx={0} cy={0} r={46 * Math.min(1, blink * 1.6)} fill="#0284c7" />
          <circle cx={0} cy={0} r={20 * blink} fill="#020617" />
          <circle cx={-14} cy={-14} r={9 * blink} fill="#fff" />
          {absorbed && <circle cx={0} cy={0} r={150 + (f - 40) * 2} fill="none" stroke={SKY} strokeWidth={4} opacity={interpolate(f, [40, 66], [0.8, 0], clamp)} />}
        </g>
      </svg>
      {/* FIX: headline moved above the eye so it no longer sits on the converging photon arrows */}
      <div
        style={{
          position: 'absolute',
          top: 170,
          left: 0,
          right: 0,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          fontFamily: IMPACT,
          fontSize: 80,
          color: '#fff',
          opacity: interpolate(f, [10, 22], [0, 1], clamp),
          letterSpacing: 3,
          textShadow: `0 0 30px ${SKY}66`,
        }}
      >
        SCATTERS <span style={{ color: SKY }}>BACK UP</span>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 7 — card stack: plankton + sediment                             */
/* ------------------------------------------------------------------ */
const Scene7: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const back = spring({ frame: f - 2, fps, config: { damping: 13, stiffness: 120 } });
  const front = spring({ frame: f - 10, fps, config: { damping: 12, stiffness: 130 } });
  const green = interpolate(f, [20, 60], [0, 0.55], clamp);
  const title = spring({ frame: f, fps, config: { damping: 14, stiffness: 140 } });
  const CARD_H = 640;
  // FIX: shorter cards set lower so the title's "GREENER" line is never covered
  const card = (bg: string): React.CSSProperties => ({
    position: 'absolute',
    left: 240,
    top: 540,
    width: 600,
    height: CARD_H,
    borderRadius: 44,
    background: bg,
    border: '3px solid rgba(255,255,255,0.35)',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 60%, #3f8f5f 0%, #12382a 70%)', opacity: green }} />
      {/* FIX: smaller, higher title (ends ~y 462, clear of the cards) */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 40,
          right: 40,
          textAlign: 'center',
          fontFamily: IMPACT,
          fontSize: 104,
          lineHeight: 1,
          color: '#fff',
          opacity: title,
          transform: `translateY(${(1 - title) * -60}px)`,
        }}
      >
        PLANKTON TURNS IT <span style={{ color: '#86d6a0', textShadow: '0 0 40px #5fa97a' }}>GREENER</span>
      </div>
      <div style={{ ...card('rgba(90,62,40,0.75)'), transform: `translateX(${interpolate(back, [0, 1], [500, 70])}px) rotate(${interpolate(back, [0, 1], [30, 9])}deg)`, opacity: back }}>
        <svg width={600} height={CARD_H}>
          {new Array(26).fill(0).map((_, i) => (
            <circle
              key={i}
              cx={380 + (random(`sx${i}`) - 0.5) * 300}
              cy={290 + (random(`sy${i}`) - 0.5) * 320 + Math.sin(f / 15 + i) * 6}
              r={10 + random(`sr${i}`) * 22}
              fill={['#8b5e3c', '#a47148', '#6b4426'][i % 3]}
              opacity={0.9}
            />
          ))}
          <text x={360} y={590} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={36} fill="#f5deb3" letterSpacing={5}>SEDIMENT</text>
        </svg>
      </div>
      <div style={{ ...card('rgba(28,70,50,0.85)'), transform: `translateX(${interpolate(front, [0, 1], [-500, -60])}px) rotate(${interpolate(front, [0, 1], [-30, -6])}deg)`, opacity: front }}>
        <svg width={600} height={CARD_H}>
          <g transform={`translate(300, 290) rotate(${f * 0.8})`}>
            <circle r={190} fill="#5fa97a" opacity={0.25} />
            <circle r={160} fill="#4d8f66" stroke="#a7e3bb" strokeWidth={8} />
            {new Array(24).fill(0).map((_, i) => {
              const a = (i / 24) * Math.PI * 2;
              return <line key={i} x1={Math.cos(a) * 40} y1={Math.sin(a) * 40} x2={Math.cos(a) * 150} y2={Math.sin(a) * 150} stroke="#a7e3bb" strokeWidth={4} opacity={0.7} />;
            })}
            {new Array(3).fill(0).map((_, k) => (
              <circle key={k} r={60 + k * 34} fill="none" stroke="#cdf0d8" strokeWidth={3} strokeDasharray="6 10" opacity={0.6} />
            ))}
            <circle r={34} fill="#cdf0d8" />
          </g>
          <text x={300} y={590} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={36} fill="#cdf0d8" letterSpacing={5}>PHYTOPLANKTON</text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scene 8 — droplet → dot → Bittrix outro                               */
/* ------------------------------------------------------------------ */
const Scene8: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const outroAt = OUTRO_START - STARTS[7];
  const fall = interpolate(f, [0, 20], [-200, 900], { ...clamp, easing: Easing.in(Easing.quad) });
  const shrink = interpolate(f, [20, outroAt], [1, 0.12], { ...clamp, easing: ease });
  const dotFade = interpolate(f, [outroAt - 4, outroAt + 8], [1, 0], clamp);
  const ripple = interpolate(f, [20, outroAt + 10], [0, 1], clamp);
  const wordmark = spring({ frame: f - 14, fps, config: { damping: 12, stiffness: 120 } });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: dotFade }}>
        {ripple > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 540 - 300 * ripple,
              top: 900 - 300 * ripple,
              width: 600 * ripple,
              height: 600 * ripple,
              borderRadius: '50%',
              border: `4px solid ${SKY}`,
              opacity: 1 - ripple,
            }}
          />
        )}
        <svg width={W} height={H} style={{ position: 'absolute' }}>
          <g transform={`translate(540, ${fall}) scale(${shrink})`}>
            <path d="M 0 -120 C 40 -60 80 -10 80 30 A 80 80 0 0 1 -80 30 C -80 -10 -40 -60 0 -120 Z" fill={SKY} style={{ filter: `drop-shadow(0 0 ${30 + (1 - shrink) * 60}px ${SKY})` }} />
            <ellipse cx={-26} cy={10} rx={14} ry={26} fill="#e0f2fe" opacity={0.8} />
          </g>
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 1010,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: IMPACT,
            fontSize: 92,
            lineHeight: 1.05,
            color: '#fff',
            opacity: wordmark,
            transform: `scale(${0.4 + wordmark * 0.6})`,
          }}
        >
          FOLLOW
          <br />
          <span style={{ color: '#c084fc', textShadow: '0 0 40px #5b1a78' }}>BITTRIX TECHNOLOGIES</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Root                                                                  */
/* ------------------------------------------------------------------ */
export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Continuous virtual camera across the whole film
  const camKeys = [0, STARTS[1], STARTS[2], STARTS[3], STARTS[4], STARTS[5], STARTS[6], STARTS[7], TOTAL];
  const camScale = interpolate(frame, camKeys, [1.0, 1.06, 1.02, 1.05, 1.03, 1.06, 1.02, 1.04, 1.0], clamp);
  const camY = interpolate(frame, camKeys, [0, -20, 10, -30, 20, -10, 0, 10, 0], clamp);
  const camX = Math.sin(frame / 70) * 10;
  const rot = Math.sin(frame / 110) * 0.6;
  // impact punch on "not" (scene 2) and "DEEPEST" (scene 5)
  const punch =
    interpolate(frame - STARTS[1], [9, 12, 22], [0, 0.06, 0], clamp) +
    interpolate(frame - STARTS[4], [44, 47, 58], [0, 0.04, 0], clamp);

  // glint source for particles in scene 6
  let glint: [number, number] | undefined;
  const f6 = frame - STARTS[5];
  if (f6 >= 0 && f6 < SCENES[5].durationInFrames) {
    glint = pointAlong(PATHS[1], interpolate(f6, [9, 49], [0, 1], clamp));
  }

  const sceneIdx = Math.max(0, STARTS.findIndex((s, i) => frame >= s && frame < s + SCENES[i].durationInFrames));
  const scene = SCENES[sceneIdx];
  const localFrame = frame - STARTS[sceneIdx];
  const inOutro = frame >= OUTRO_START;

  const views = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8];

  return (
    <AbsoluteFill style={{ backgroundColor: '#02060f', overflow: 'hidden' }}>
      <Backdrop frame={frame} />
      <AbsoluteFill
        style={{
          transform: `translate(${camX}px, ${camY}px) scale(${camScale + punch}) rotate(${rot}deg)`,
          transformOrigin: '50% 45%',
        }}
      >
        <Particles frame={frame} glintX={glint?.[0]} glintY={glint?.[1]} />
        {views.map((View, i) => (
          <Shell key={i} index={i} frame={frame} push={i === 1 ? 0.08 : 0.05}>
            {(f) => <View f={f} fps={fps} />}
          </Shell>
        ))}
      </AbsoluteFill>

      {/* vignette */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)', pointerEvents: 'none' }} />

      {/* Bittrix outro — final 90 frames */}
      <Sequence from={OUTRO_START} durationInFrames={OUTRO_LEN}>
        <AbsoluteFill style={{ opacity: interpolate(frame - OUTRO_START, [0, 10], [0, 1], clamp) }}>
          <BittrixOutroExact theme="dark" callToAction="Follow Bittrix Technologies for more interesting concepts" />
        </AbsoluteFill>
      </Sequence>

      {/* karaoke captions (hidden once the outro's own wordmark takes over) */}
      {!inOutro && (
        <SyncCaptions words={scene.words} currentFrame={localFrame} accentColor={scene.themeColor} bottom={420} fontSize={62} />
      )}
    </AbsoluteFill>
  );
}