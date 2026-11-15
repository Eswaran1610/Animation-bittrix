import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  spring,
  Easing,
  random,
} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';

export const soundEvents = [
  {"frame": 0, "role": "riser", "description": "riser builds under the hidden fruit bowl"},
  {"frame": 14, "role": "impact", "description": "fruit bowl springs up into centre"},
  {"frame": 97, "role": "whoosh", "description": "wipe sweeps left to right, bowl exits right"},
  {"frame": 108, "role": "pop", "description": "big red apple pops in"},
  {"frame": 143, "role": "click", "description": "Grows on trees chip blips up"},
  {"frame": 183, "role": "whoosh", "description": "wipe right to left, apple slides out"},
  {"frame": 191, "role": "slide", "description": "banana card slides in from the right"},
  {"frame": 229, "role": "click", "description": "Soft and easy to eat chip blips up"},
  {"frame": 283, "role": "whoosh", "description": "wipe right to left, bananas push out"},
  {"frame": 296, "role": "pop", "description": "mango drops into centre"},
  {"frame": 323, "role": "sparkle", "description": "crown lands on the mango"},
  {"frame": 376, "role": "whoosh", "description": "wipe left to right, crown lifts away"},
  {"frame": 384, "role": "slide", "description": "orange rolls in from the right"},
  {"frame": 402, "role": "impact", "description": "orange settles with a soft thud"},
  {"frame": 418, "role": "pop", "description": "cut orange half springs open"},
  {"frame": 473, "role": "whoosh", "description": "wipe right to left, orange halves exit"},
  {"frame": 485, "role": "tick", "description": "first grape dot pops in"},
  {"frame": 519, "role": "pop", "description": "grape bunch springs in"},
  {"frame": 569, "role": "whoosh", "description": "wipe left to right, grapes slide off"},
  {"frame": 580, "role": "pop", "description": "strawberry pops in"},
  {"frame": 613, "role": "sparkle", "description": "magnifier ring lands on the seeds"},
  {"frame": 621, "role": "click", "description": "Tiny seeds chip blips up"},
  {"frame": 677, "role": "whoosh", "description": "magnifier ring expands into the recap"},
  {"frame": 687, "role": "impact", "description": "fruit bowl springs back in for the recap"}
];

const DEFAULT_STARTS = [0, 103, 189, 289, 382, 479, 575, 683, 766];
const BG = '#07080e';
const CORAL = '#f43f5e';
const SKY = '#38bdf8';
const HEAD = 'Impact, "Anton", "Oswald", "Arial Narrow", sans-serif';
const BODY = 'Arial, Helvetica, sans-serif';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const NAMES: (string | null)[] = [null, 'Apple', 'Banana', 'Mango', 'Orange', 'Grapes', 'Strawberry', null];
const NAME_X = [540, 540, 330, 540, 540, 540, 640, 540];
const NAME_Y = [1170, 1170, 1060, 1170, 1170, 1170, 1150, 1170];
const NAME_FS = [150, 150, 140, 150, 150, 150, 120, 150];
const CHIPS: (string | null)[] = [null, 'Grows on trees', 'Soft and easy to eat', 'King of fruits', 'Round and bright', 'Grows in bunches', 'Tiny seeds', null];
const CHIP_T = [0, 40, 40, 47, 47, 48, 46, 0];
const HEADLINES = [
  'Can you name these fruits?',
  'A is for Apple',
  'B is for Banana',
  'Mango, king of fruits',
  'O is for Orange',
  'Grapes grow in bunches',
  'S is for Strawberry',
  'Try saying them all!',
];
const LABELS = ["LET'S LEARN FRUITS", 'FRUIT 01', 'FRUIT 02', 'FRUIT 03', 'FRUIT 04', 'FRUIT 05', 'FRUIT 06', 'RECAP'];
const HL_WORDS = ['apple', 'banana', 'mango', 'orange', 'grapes', 'strawberry', 'fruits?', 'all!'];
const GLOWS = [
  'rgba(56,189,248,0.30)',
  'rgba(244,63,94,0.34)',
  'rgba(250,204,21,0.26)',
  'rgba(251,146,60,0.30)',
  'rgba(249,115,22,0.30)',
  'rgba(168,85,247,0.32)',
  'rgba(244,63,94,0.34)',
  'rgba(56,189,248,0.30)',
];
const TARGETS = [-38, -30, -48, -34, -26, -30, -28, -38];
const REST = 62;
const WIPE_DIR = [1, -1, -1, 1, -1, 1, -1];

const PARTICLES = new Array(70).fill(0).map((_, i) => ({
  x: random('px' + i) * 1080,
  y: random('py' + i) * 1920,
  r: 1.5 + random('pr' + i) * 4,
  sp: 0.3 + random('ps' + i) * 1.2,
  d: 0.3 + random('pd' + i) * 0.9,
  tw: random('pt' + i) * 6.28,
  c: random('pc' + i) > 0.7 ? SKY : '#ffffff',
}));

const DIMPLES = new Array(26).fill(0).map((_, i) => {
  const a = random('da' + i) * Math.PI * 2;
  const r = Math.sqrt(random('dr' + i)) * 64;
  return [100 + Math.cos(a) * r, 105 + Math.sin(a) * r];
});

const RECAP_D =
  'M 150 1170 C 260 1030, 380 1030, 470 1130 C 560 1230, 680 1240, 760 1130 C 830 1030, 900 1040, 950 1110';
const RECAP_LEN = getLength(RECAP_D);

/* ---------------- Fruit illustrations ---------------- */

const Apple = ({size, id}: any) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
    <defs>
      <radialGradient id={`${id}b`} cx="38%" cy="35%" r="70%">
        <stop offset="0" stopColor="#ff9a9a" />
        <stop offset="0.45" stopColor="#e11d48" />
        <stop offset="1" stopColor="#7f0b20" />
      </radialGradient>
      <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#86efac" />
        <stop offset="1" stopColor="#15803d" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="190" rx="62" ry="8" fill="#000" opacity="0.35" />
    <path
      d="M100 52 C 80 36, 30 38, 26 92 C 22 140, 60 186, 84 182 C 92 180, 96 176, 100 176 C 104 176, 108 180, 116 182 C 140 186, 178 140, 174 92 C 170 38, 120 36, 100 52 Z"
      fill={`url(#${id}b)`}
    />
    <path d="M98 54 C 96 40, 98 30, 106 20" stroke="#5b3a1e" strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M106 34 C 120 14, 150 16, 158 24 C 146 40, 122 44, 106 34 Z" fill={`url(#${id}l)`} />
    <ellipse cx="62" cy="86" rx="13" ry="24" fill="#fff" opacity="0.35" transform="rotate(20 62 86)" />
    <ellipse cx="80" cy="64" rx="5" ry="7" fill="#fff" opacity="0.5" />
  </svg>
);

const BANANA_D = 'M28 60 C 40 130, 110 168, 178 120 C 184 114, 180 106, 172 110 C 120 138, 70 114, 46 54 Z';
const Banana = ({size, id}: any) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
    <defs>
      <linearGradient id={`${id}y`} x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor="#fef08a" />
        <stop offset="0.55" stopColor="#facc15" />
        <stop offset="1" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <ellipse cx="105" cy="182" rx="70" ry="9" fill="#000" opacity="0.35" />
    {[
      [-16, -6, -8],
      [0, 0, 0],
      [14, 8, 12],
    ].map(([r, dx, dy], i) => (
      <g key={i} transform={`translate(${dx} ${dy}) rotate(${r} 40 58)`}>
        <path d={BANANA_D} fill={`url(#${id}y)`} stroke="#a16207" strokeWidth="1.5" />
        <path d="M50 66 C 70 112, 116 132, 166 118" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="176" cy="114" r="4" fill="#422006" />
      </g>
    ))}
    <path d="M30 62 L 40 40 L 52 46 L 44 64 Z" fill="#65a30d" />
    <rect x="34" y="30" width="14" height="16" rx="3" fill="#3f6212" />
  </svg>
);

const Mango = ({size, id}: any) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
    <defs>
      <linearGradient id={`${id}m`} x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ef4444" />
        <stop offset="0.35" stopColor="#f97316" />
        <stop offset="0.7" stopColor="#fbbf24" />
        <stop offset="1" stopColor="#84cc16" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="190" rx="64" ry="8" fill="#000" opacity="0.35" />
    <path
      d="M100 30 C 150 28, 178 80, 170 125 C 162 170, 120 186, 88 180 C 50 172, 28 140, 32 100 C 36 60, 62 32, 100 30 Z"
      fill={`url(#${id}m)`}
    />
    <ellipse cx="70" cy="80" rx="14" ry="28" fill="#fff" opacity="0.3" transform="rotate(25 70 80)" />
    <path d="M100 32 C 100 24, 102 18, 106 14" stroke="#4d2c0f" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M104 26 C 120 6, 150 4, 164 12 C 150 30, 126 36, 104 26 Z" fill="#16a34a" />
    <path d="M108 25 C 126 18, 144 14, 160 13" stroke="#bbf7d0" strokeWidth="2" fill="none" opacity="0.6" />
  </svg>
);

const Orange = ({size, id}: any) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
    <defs>
      <radialGradient id={`${id}o`} cx="38%" cy="35%" r="72%">
        <stop offset="0" stopColor="#ffd08a" />
        <stop offset="0.45" stopColor="#fb8c00" />
        <stop offset="1" stopColor="#b9480a" />
      </radialGradient>
    </defs>
    <ellipse cx="100" cy="190" rx="60" ry="8" fill="#000" opacity="0.35" />
    <circle cx="100" cy="105" r="78" fill={`url(#${id}o)`} />
    {DIMPLES.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="2" fill="#9a3412" opacity="0.28" />
    ))}
    <ellipse cx="70" cy="76" rx="16" ry="24" fill="#fff" opacity="0.3" transform="rotate(30 70 76)" />
    <circle cx="100" cy="30" r="5" fill="#65a30d" />
    <path d="M102 30 C 116 10, 140 10, 150 18 C 138 32, 118 36, 102 30 Z" fill="#22c55e" />
  </svg>
);

const OrangeHalf = ({size, id, draw = 1}: any) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
    <defs>
      <radialGradient id={`${id}f`} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#ffe0a8" />
        <stop offset="0.7" stopColor="#fb923c" />
        <stop offset="1" stopColor="#ea580c" />
      </radialGradient>
    </defs>
    <ellipse cx="100" cy="190" rx="62" ry="8" fill="#000" opacity="0.35" />
    <circle cx="100" cy="100" r="82" fill="#ea580c" />
    <circle cx="100" cy="100" r="74" fill="#fff1d6" />
    <circle cx="100" cy="100" r="68" fill={`url(#${id}f)`} opacity={0.35 + 0.65 * draw} />
    {new Array(10).fill(0).map((_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return (
        <line
          key={i}
          x1="100"
          y1="100"
          x2={100 + Math.cos(a) * 68}
          y2={100 + Math.sin(a) * 68}
          stroke="#fff1d6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="68"
          strokeDashoffset={68 * (1 - draw)}
        />
      );
    })}
    <circle cx="100" cy="100" r="9" fill="#fff1d6" />
    <ellipse cx="72" cy="70" rx="10" ry="5" fill="#fff" opacity={0.4 * draw} transform="rotate(-35 72 70)" />
  </svg>
);

const GRAPE_POS = [
  [55, 64], [85, 62], [115, 62], [145, 64],
  [70, 94], [100, 92], [130, 94],
  [85, 124], [115, 124],
  [100, 152],
];
const Grapes = ({size, id}: any) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
    <defs>
      <radialGradient id={`${id}g`} cx="35%" cy="32%" r="70%">
        <stop offset="0" stopColor="#e9d5ff" />
        <stop offset="0.4" stopColor="#9333ea" />
        <stop offset="1" stopColor="#3b0764" />
      </radialGradient>
    </defs>
    <ellipse cx="100" cy="186" rx="50" ry="7" fill="#000" opacity="0.35" />
    <path d="M100 46 C 98 32, 102 22, 110 14" stroke="#5b3a1e" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M106 26 C 124 6, 156 8, 166 20 C 150 36, 124 40, 106 26 Z" fill="#16a34a" />
    {GRAPE_POS.map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r="20" fill={`url(#${id}g)`} />
        <circle cx={x - 7} cy={y - 7} r="4" fill="#fff" opacity="0.45" />
      </g>
    ))}
  </svg>
);

const SEEDS = [
  [75, 82], [100, 78], [125, 82], [60, 102], [88, 100], [112, 100], [140, 102],
  [70, 124], [100, 122], [130, 124], [85, 146], [115, 146], [100, 166],
];
const Strawberry = ({size, id}: any) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
    <defs>
      <radialGradient id={`${id}s`} cx="38%" cy="35%" r="72%">
        <stop offset="0" stopColor="#fda4af" />
        <stop offset="0.45" stopColor="#e11d48" />
        <stop offset="1" stopColor="#881337" />
      </radialGradient>
    </defs>
    <ellipse cx="100" cy="190" rx="50" ry="7" fill="#000" opacity="0.35" />
    <path
      d="M100 182 C 60 162, 28 112, 36 76 C 42 52, 70 48, 100 56 C 130 48, 158 52, 164 76 C 172 112, 140 162, 100 182 Z"
      fill={`url(#${id}s)`}
    />
    {SEEDS.map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx="2.6" ry="4.2" fill="#fde68a" />
    ))}
    <ellipse cx="66" cy="92" rx="8" ry="18" fill="#fff" opacity="0.25" transform="rotate(20 66 92)" />
    <path d="M100 60 L70 42 L86 62 L56 70 L90 72 L100 84 L110 72 L144 70 L114 62 L130 42 Z" fill="#16a34a" />
    <rect x="96" y="36" width="8" height="22" rx="4" fill="#15803d" />
  </svg>
);

const Crown = ({size, id}: any) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 200 120" style={{overflow: 'visible'}}>
    <defs>
      <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#bae6fd" />
        <stop offset="0.5" stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0369a1" />
      </linearGradient>
    </defs>
    <path d="M20 92 L30 30 L65 65 L100 12 L135 65 L170 30 L180 92 Z" fill={`url(#${id}c)`} stroke="#e0f2fe" strokeWidth="2" />
    <rect x="18" y="90" width="164" height="22" rx="6" fill="#0284c7" />
    <circle cx="100" cy="101" r="7" fill={CORAL} />
    <circle cx="60" cy="101" r="5" fill="#fff" />
    <circle cx="140" cy="101" r="5" fill="#fff" />
    <circle cx="30" cy="30" r="6" fill="#fff" />
    <circle cx="100" cy="12" r="7" fill={CORAL} />
    <circle cx="170" cy="30" r="6" fill="#fff" />
  </svg>
);

const Abs = ({l, t, rot = 0, children}: any) => (
  <div style={{position: 'absolute', left: l, top: t, transform: `rotate(${rot}deg)`}}>{children}</div>
);

const FruitPile = ({id}: any) => (
  <div style={{position: 'relative', width: 640, height: 480}}>
    <Abs l={10} t={40} rot={-12}><Grapes size={240} id={id + 'g'} /></Abs>
    <Abs l={360} t={10} rot={18}><Banana size={270} id={id + 'b'} /></Abs>
    <Abs l={215} t={60}><Mango size={220} id={id + 'm'} /></Abs>
    <Abs l={395} t={150}><Orange size={210} id={id + 'o'} /></Abs>
    <Abs l={110} t={140} rot={-6}><Apple size={230} id={id + 'a'} /></Abs>
    <Abs l={300} t={205} rot={8}><Strawberry size={180} id={id + 's'} /></Abs>
    <svg width={640} height={480} viewBox="0 0 640 480" style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={id + 'bowl'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="0.4" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#0c4a6e" />
        </linearGradient>
      </defs>
      <path d="M30 330 Q 320 362 610 330 Q 590 476 320 476 Q 50 476 30 330 Z" fill={`url(#${id}bowl)`} />
      <path d="M30 330 Q 320 362 610 330" stroke="#e0f2fe" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M90 380 Q 140 430 230 448" stroke="#fff" strokeOpacity="0.25" strokeWidth="10" fill="none" strokeLinecap="round" />
    </svg>
  </div>
);

const Place = ({x, y, size, h, scale = 1, rot = 0, opacity = 1, children}: any) => {
  const hh = h ?? size;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - hh / 2,
        width: size,
        height: hh,
        transform: `rotate(${rot}deg) scale(${scale})`,
        opacity,
        filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.55))',
      }}
    >
      {children}
    </div>
  );
};

const Sparkle = ({x, y, t0, f, color = SKY, size = 160}: any) => {
  const t = f - t0;
  if (t < 0 || t > 26) return null;
  const p = t / 26;
  const e = Easing.out(Easing.cubic)(p);
  return (
    <svg
      style={{position: 'absolute', left: x - size, top: y - size, overflow: 'visible'}}
      width={size * 2}
      height={size * 2}
      viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`}
    >
      {new Array(8).fill(0).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const r1 = size * 0.25 + size * 0.5 * e;
        const r2 = r1 + size * 0.22 * (1 - p);
        return (
          <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2}
            stroke={i % 2 ? '#fff' : color} strokeWidth={6 * (1 - p) + 1} strokeLinecap="round" opacity={1 - p} />
        );
      })}
      <path d="M0 -30 L7 -7 L30 0 L7 7 L0 30 L-7 7 L-30 0 L-7 -7 Z" fill="#fff"
        transform={`scale(${Math.sin(p * Math.PI) * 1.4}) rotate(${p * 90})`} />
    </svg>
  );
};

const Wipe = ({f, b, dir}: any) => {
  if (f < b - 9 || f > b + 9) return null;
  const t = interpolate(f, [b - 9, b + 9], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const x = dir > 0 ? interpolate(t, [0, 1], [-800, 1880]) : interpolate(t, [0, 1], [1880, -800]);
  return (
    <div
      style={{
        position: 'absolute',
        top: -200,
        left: x - 280,
        width: 560,
        height: 2320,
        transform: 'skewX(-14deg)',
        background: `linear-gradient(${dir > 0 ? 90 : 270}deg, rgba(56,189,248,0) 0%, rgba(56,189,248,0.35) 45%, rgba(244,63,94,0.6) 88%, rgba(255,255,255,0.9) 97%, rgba(255,255,255,0) 100%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
};

const Teacher = ({angle, mouth, blink}: any) => {
  const skin = '#f5c6a0';
  const hair = '#3b2a24';
  return (
    <svg width={300} height={380} viewBox="0 0 300 380" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="tBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fb7185" />
          <stop offset="1" stopColor="#be123c" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="374" rx="120" ry="10" fill="#000" opacity="0.4" />
      <path d="M62 380 C 62 290, 92 238, 150 232 C 208 238, 238 290, 238 380 Z" fill="url(#tBody)" />
      <path d="M128 236 L150 292 L172 236 Z" fill="#e0f2fe" />
      <path d="M86 280 C 72 320, 80 350, 104 362" stroke="#be123c" strokeWidth="24" strokeLinecap="round" fill="none" />
      <rect x="138" y="194" width="24" height="42" fill="#e8b58f" />
      <circle cx="150" cy="150" r="58" fill={skin} />
      <circle cx="150" cy="84" r="26" fill={hair} />
      <path d="M92 150 C 86 98, 120 86, 150 88 C 182 86, 216 100, 208 150 C 200 120, 180 108, 150 110 C 122 110, 100 122, 92 150 Z" fill={hair} />
      <ellipse cx="128" cy="152" rx="4.5" ry={blink ? 0.8 : 5} fill="#1f2937" />
      <ellipse cx="172" cy="152" rx="4.5" ry={blink ? 0.8 : 5} fill="#1f2937" />
      <circle cx="128" cy="152" r="16" fill="rgba(255,255,255,0.08)" stroke="#0f172a" strokeWidth="3" />
      <circle cx="172" cy="152" r="16" fill="rgba(255,255,255,0.08)" stroke="#0f172a" strokeWidth="3" />
      <line x1="144" y1="152" x2="156" y2="152" stroke="#0f172a" strokeWidth="3" />
      <circle cx="116" cy="174" r="9" fill="#fb7185" opacity="0.45" />
      <circle cx="184" cy="174" r="9" fill="#fb7185" opacity="0.45" />
      {mouth > 0.05 ? (
        <ellipse cx="150" cy="185" rx="11" ry={2 + mouth * 7} fill="#7f1d1d" />
      ) : (
        <path d="M138 181 Q150 192 162 181" stroke="#7f1d1d" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      <g transform={`rotate(${angle} 206 252)`}>
        <line x1="206" y1="252" x2="272" y2="252" stroke="#be123c" strokeWidth="24" strokeLinecap="round" />
        <circle cx="284" cy="252" r="13" fill={skin} />
        <line x1="292" y1="252" x2="402" y2="252" stroke="#a16207" strokeWidth="6" strokeLinecap="round" />
        <circle cx="404" cy="252" r="8" fill={SKY} />
      </g>
    </svg>
  );
};

/* ---------------- Main film ---------------- */

export default function Video(props: {
  fps: number;
  durationInFrames: number;
  scenes: Array<{
    scene_number: number;
    start: number;
    durationInFrames: number;
    narration: string;
    words: Array<{word: string; startFrame: number; endFrame: number}>;
  }>;
}) {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scenes = props.scenes && props.scenes.length === 8 ? props.scenes : null;
  const S = scenes
    ? [...scenes.map((s) => s.start), scenes[7].start + scenes[7].durationInFrames]
    : DEFAULT_STARTS;

  const sp = (delay: number, cfg: any = {damping: 12, stiffness: 120, mass: 0.8}) =>
    spring({frame: f - delay, fps, config: cfg});
  let ci = 0;
  for (let i = 0; i < 8; i++) if (f >= S[i]) ci = i;
  const ex = (b: number) => interpolate(f, [b - 6, b + 10], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const vis = (a: number, b: number) => f >= a && f <= b;

  const keyIn: number[] = [];
  for (let k = 1; k < 8; k++) keyIn.push(S[k] - 8, S[k] + 8);
  const keyed = (vals: number[]) => {
    const out: number[] = [];
    for (let k = 1; k < 8; k++) out.push(vals[k - 1], vals[k]);
    return interpolate(f, keyIn, out, {...clamp, easing: Easing.inOut(Easing.cubic)});
  };
  const keyedColor = (vals: string[]) => {
    const out: string[] = [];
    for (let k = 1; k < 8; k++) out.push(vals[k - 1], vals[k]);
    return interpolateColors(f, keyIn, out);
  };

  // Camera
  const ease = {...clamp, easing: Easing.inOut(Easing.sin)};
  const camS = interpolate(
    f,
    [S[0], S[1], S[1] + 8, S[2], S[2] + 8, S[3], S[3] + 8, S[4], S[4] + 8, S[5], S[5] + 8, S[6], S[6] + 8, S[7], S[7] + 8, S[8]],
    [1, 1.05, 1.02, 1.06, 1.02, 1.06, 1.02, 1.05, 1.02, 1.06, 1.02, 1.05, 1.0, 1.07, 1.05, 1.0],
    ease
  );
  const camX = interpolate(f, [S[0], S[2], S[3], S[4], S[5], S[6], S[8]], [0, 0, -40, 30, -30, 0, 0], ease) + Math.sin(f / 50) * 6;
  const camY = interpolate(f, [S[0], S[3], S[4], S[5], S[8]], [0, 0, 25, 0, 0], ease) + Math.cos(f / 60) * 5;

  const glow = keyedColor(GLOWS);

  // Captions data
  const sc = scenes ? scenes[ci] : null;
  const words = sc ? sc.words : [];
  const narrTokens = sc ? sc.narration.trim().split(/\s+/) : [];
  const tokens = narrTokens.length === words.length ? narrTokens : words.map((w) => w.word);
  let speaking = false;
  if (scenes) {
    for (const s of scenes) for (const w of s.words) if (f >= s.start + w.startFrame && f < s.start + w.endFrame) speaking = true;
  }

  // Teacher arm
  const release = ci === 7 ? 0 : interpolate(f, [S[ci + 1] - 14, S[ci + 1] - 2], [0, 1], clamp);
  const p = sp(S[ci] + (ci === 0 ? 2 : 6), {damping: 13, stiffness: 110}) * (1 - release);
  let angle = REST + (TARGETS[ci] - REST) * p;
  if (ci === 0) {
    const lf = f - S[0];
    const win = interpolate(lf, [8, 14, 46, 52], [0, 1, 1, 0], clamp);
    angle += 12 * Math.sin(((lf - 8) / 40) * 4 * Math.PI) * win;
  }
  if (ci === 7) {
    const lw = f - (S[7] + 40);
    const win = interpolate(lw, [0, 6, 34, 40], [0, 1, 1, 0], clamp);
    angle += 14 * Math.sin((lw / 40) * 4 * Math.PI) * win;
  }
  angle += Math.sin(f / 18) * 2;
  const teacherIn = sp(0, {damping: 12, stiffness: 100});
  const mouth = speaking ? 0.4 + 0.6 * Math.abs(Math.sin(f * 0.9)) : 0;

  // Name pill
  const nx = keyed(NAME_X);
  const ny = keyed(NAME_Y);
  const widths = NAMES.map((n, i) => (n ? n.length * NAME_FS[i] * 0.5 + 100 : 420));
  const pillW = keyed(widths);
  const pillH = keyed(NAME_FS.map((s) => s * 1.2));
  const pillO = keyed([0, 1, 1, 1, 1, 1, 1, 0]);
  const name = NAMES[ci];
  const fs = NAME_FS[ci];
  const nameStart = S[ci] + (sc && sc.words[0] ? sc.words[0].startFrame : 3);
  const nameOut = interpolate(f, [S[ci + 1] - 8, S[ci + 1] - 1], [0, 1], clamp);
  const chip = CHIPS[ci];
  const cs = sp(S[ci] + CHIP_T[ci], {damping: 13, stiffness: 160});

  // Headline
  const hIn = sp(S[ci] + 6, {damping: 16, stiffness: 120});
  const hOut = interpolate(f, [S[ci + 1] - 8, S[ci + 1]], [0, 1], clamp);
  const hY = ci === 7 ? 900 : 300;

  return (
    <AbsoluteFill style={{backgroundColor: BG, overflow: 'hidden', fontFamily: BODY}}>
      {/* Atmosphere */}
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 44%, ${glow} 0%, rgba(7,8,14,0) 55%)`}} />
      <div style={{position: 'absolute', left: 120 + Math.sin(f / 70) * 80, top: 200 + Math.cos(f / 90) * 60, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.12), rgba(56,189,248,0) 70%)'}} />
      <div style={{position: 'absolute', left: 380 + Math.cos(f / 80) * 90, top: 1100 + Math.sin(f / 75) * 70, width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.10), rgba(244,63,94,0) 70%)'}} />
      {PARTICLES.map((pt, i) => {
        const y = (((pt.y - f * pt.sp * pt.d) % 1920) + 1920) % 1920;
        const x = pt.x + Math.sin(f / 60 + pt.tw) * 12 - camX * pt.d * 0.6;
        const o = (0.15 + 0.35 * pt.d) * (0.6 + 0.4 * Math.sin(f / 10 + pt.tw));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: pt.r * 2, height: pt.r * 2, borderRadius: '50%', background: pt.c, opacity: o, boxShadow: `0 0 ${pt.r * 4}px ${pt.c}`}} />;
      })}

      {/* Camera world */}
      <AbsoluteFill style={{transform: `translate(${camX}px, ${camY}px) scale(${camS})`, transformOrigin: '50% 45%'}}>
        {/* Stage floor */}
        <div style={{position: 'absolute', left: 90, top: 980, width: 900, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.08), rgba(255,255,255,0) 70%)'}} />

        {/* Headline */}
        <div style={{position: 'absolute', left: 70, right: 70, top: hY - 110, textAlign: 'center', opacity: hIn * (1 - hOut), transform: `translateY(${(1 - hIn) * 40 - hOut * 40}px)`}}>
          <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: SKY, marginBottom: 14}}>{LABELS[ci]}</div>
          <div style={{fontFamily: HEAD, fontSize: 86, lineHeight: 1.05, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.6)'}}>
            {HEADLINES[ci].split(' ').map((w, i) => (
              <span key={i} style={{color: HL_WORDS.includes(w.toLowerCase().replace(',', '')) ? CORAL : '#fff'}}>{w} </span>
            ))}
          </div>
        </div>

        {/* Scene 1: fruit pile */}
        {vis(S[0], S[1] + 12) && (() => {
          const rise = sp(14, {damping: 9, stiffness: 140, mass: 0.9});
          const y = interpolate(rise, [0, 1], [0.58, 0.44]) * 1920;
          const e = ex(S[1]);
          return (
            <Place x={540 + e * 1300} y={y} size={640} h={480} scale={(0.85 + 0.15 * rise) * (1 + 0.1 * e)} opacity={interpolate(f, [0, 10], [0, 1], clamp)} rot={Math.sin(f / 20) * 1.2}>
              <FruitPile id="p1" />
            </Place>
          );
        })()}

        {/* Scene 2: apple */}
        {vis(S[1] - 2, S[2] + 12) && (() => {
          const lf = Math.max(0, f - S[1] - 4);
          const s = sp(S[1] + 4, {damping: 10, stiffness: 150});
          const rot = f > S[1] + 4 ? 6 * Math.exp(-lf / 8) * Math.cos(lf / 2.5) : 6;
          const e = ex(S[2]);
          return (
            <Place x={540 - e * 1300} y={790 + Math.sin(f / 14) * 6} size={560} scale={s} rot={rot - e * 20}>
              <Apple size={560} id="a2" />
            </Place>
          );
        })()}

        {/* Scene 3: banana card */}
        {vis(S[2] - 2, S[3] + 12) && (() => {
          const s = sp(S[2] + 2, {damping: 11, stiffness: 110});
          const e = ex(S[3]);
          const x = interpolate(s, [0, 1], [1500, 720]) - e * 1400;
          return (
            <div style={{position: 'absolute', left: x - 260, top: 440, width: 520, height: 520, borderRadius: 48, background: 'linear-gradient(160deg, #1a2036, #0b0e1a)', border: '2px solid rgba(56,189,248,0.35)', boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 0 80px rgba(250,204,21,0.12)'}}>
              <div style={{position: 'absolute', left: 40, top: 40, transform: `rotate(${(1 - s) * 14 + Math.sin(f / 16) * 2}deg)`, filter: 'drop-shadow(0 24px 30px rgba(0,0,0,0.6))'}}>
                <Banana size={440} id="b3" />
              </div>
            </div>
          );
        })()}

        {/* Scene 4: mango + crown */}
        {vis(S[3] - 2, S[4] + 12) && (() => {
          const s = sp(S[3] + 4, {damping: 10, stiffness: 120});
          const my = interpolate(s, [0, 1], [-350, 830]) + Math.sin(f / 15) * 5;
          const e = ex(S[4]);
          const cy = interpolate(f, [S[3] + 8, S[3] + 34], [230, 590], {...clamp, easing: Easing.out(Easing.back(1.4))});
          const landed = interpolate(f, [S[3] + 26, S[3] + 34], [0, 1], clamp);
          const lift = interpolate(f, [S[4] - 8, S[4] + 10], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
          return (
            <>
              <Place x={540 - e * 1300} y={my} size={480} scale={0.9 + 0.1 * s} rot={-e * 25}>
                <Mango size={480} id="m4" />
              </Place>
              <Place x={540} y={cy + (my - 830) * landed - lift * 900} size={210} h={126} rot={Math.sin((f - S[3]) / 5) * 10 * (1 - landed) - 4 * landed} opacity={interpolate(f, [S[3] + 6, S[3] + 12], [0, 1], clamp)}>
                <Crown size={210} id="c4" />
              </Place>
              <Sparkle x={540} y={570} t0={S[3] + 34} f={f} />
            </>
          );
        })()}

        {/* Scene 5: orange + half */}
        {vis(S[4] - 2, S[5] + 12) && (() => {
          const s = sp(S[4] + 2, {damping: 14, stiffness: 90});
          const e = ex(S[5]);
          const x = interpolate(s, [0, 1], [1350, 346]);
          const rot = ((x - 346) / 190) * (180 / Math.PI);
          const hs = sp(S[4] + 36, {damping: 9, stiffness: 160});
          const draw = interpolate(f, [S[4] + 40, S[4] + 58], [0, 1], clamp);
          return (
            <>
              <Place x={x - e * 1400} y={840} size={380} rot={rot}>
                <Orange size={380} id="o5" />
              </Place>
              <Place x={756 - e * 1400} y={840} size={360} scale={hs} rot={(1 - hs) * -30}>
                <OrangeHalf size={360} id="h5" draw={draw} />
              </Place>
            </>
          );
        })()}

        {/* Scene 6: grapes */}
        {vis(S[5] - 2, S[6] + 12) && (() => {
          const e = ex(S[6]);
          const dots = [[-90, -80], [0, -80], [90, -80], [-45, 0], [45, 0], [0, 80]];
          const gs = sp(S[5] + 40, {damping: 10, stiffness: 140});
          return (
            <>
              {dots.map(([dx, dy], i) => {
                const ds = sp(S[5] + 6 + 5 * i, {damping: 9, stiffness: 200});
                return (
                  <div key={i} style={{position: 'absolute', left: 300 + dx - 46 + e * 1300, top: 820 + dy - 46, width: 92, height: 92, borderRadius: '50%', transform: `scale(${ds})`, background: 'radial-gradient(circle at 35% 32%, #e9d5ff, #9333ea 45%, #3b0764)', boxShadow: '0 16px 30px rgba(0,0,0,0.5), 0 0 30px rgba(168,85,247,0.35)'}} />
                );
              })}
              <Place x={770 + e * 1300} y={830} size={420} scale={gs} rot={(1 - gs) * 20 + Math.sin(f / 18) * 2}>
                <Grapes size={420} id="g6" />
              </Place>
            </>
          );
        })()}

        {/* Scene 7: strawberry + magnifier */}
        {vis(S[6] - 2, S[7] + 14) && (() => {
          const lf = Math.max(0, f - S[6] - 4);
          const s = sp(S[6] + 4, {damping: 10, stiffness: 150});
          const rot = f > S[6] + 4 ? 6 * Math.exp(-lf / 8) * Math.cos(lf / 2.5) : 6;
          const e = ex(S[7]);
          const ms = sp(S[6] + 38, {damping: 10, stiffness: 150});
          const pulse = f > S[6] + 46 ? 1 + 0.05 * Math.sin((f - S[6] - 46) / 4) : 1;
          const g = interpolate(f, [S[7] - 8, S[7] + 12], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
          const inner = interpolate(g, [0, 0.25], [1, 0], clamp);
          return (
            <>
              <Place x={432 - e * 1300} y={790} size={520} scale={s} rot={rot}>
                <Strawberry size={520} id="s7" />
              </Place>
              <div style={{position: 'absolute', left: 432 - 115, top: 830 - 115, width: 230, height: 230, transform: `scale(${ms * pulse * (1 + g * 5)})`, opacity: 1 - g}}>
                <div style={{position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', opacity: inner, background: '#881337'}}>
                  <div style={{position: 'absolute', left: -353, top: -425}}>
                    <Strawberry size={936} id="sm" />
                  </div>
                </div>
                <div style={{position: 'absolute', inset: -6, borderRadius: '50%', border: `12px solid ${CORAL}`, boxShadow: `0 0 40px rgba(244,63,94,0.6), inset 0 0 30px rgba(255,255,255,0.25)`}} />
                <div style={{position: 'absolute', left: 196, top: 196, width: 90, height: 22, borderRadius: 11, background: CORAL, transform: 'rotate(45deg)', transformOrigin: '0 50%', opacity: inner}} />
              </div>
              <Sparkle x={500} y={760} t0={S[6] + 40} f={f} color={CORAL} />
            </>
          );
        })()}

        {/* Scene 8: recap */}
        {vis(S[7] - 2, S[8]) && (() => {
          const ps = sp(S[7] + 4, {damping: 10, stiffness: 120});
          const dp = interpolate(f, [S[7] + 10, S[7] + 28], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
          const dt = interpolate(f, [S[7] + 30, S[7] + 80], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
          const dot = getPointAtLength(RECAP_D, RECAP_LEN * dt);
          const icons = [Apple, Banana, Mango, Orange, Grapes, Strawberry];
          return (
            <>
              <Place x={540} y={540} size={640} h={480} scale={0.78 * ps} rot={Math.sin(f / 20) * 1.2}>
                <FruitPile id="p8" />
              </Place>
              <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
                <path d={RECAP_D} stroke={SKY} strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={RECAP_LEN} strokeDashoffset={RECAP_LEN * (1 - dp)} opacity="0.85" />
                <path d={RECAP_D} stroke={CORAL} strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={RECAP_LEN} strokeDashoffset={RECAP_LEN * (1 - dt)} opacity={dt > 0 ? 1 : 0} />
              </svg>
              {icons.map((Icon, i) => {
                const pt = getPointAtLength(RECAP_D, (RECAP_LEN * i) / 5);
                const app = sp(S[7] + 10 + i * 3, {damping: 11, stiffness: 160});
                const ti = S[7] + 30 + (50 * i) / 5;
                const pulse = interpolate(f - ti, [0, 4, 14], [1, 1.35, 1], clamp);
                const hit = f >= ti;
                return (
                  <div key={i} style={{position: 'absolute', left: pt.x - 52, top: pt.y - 52, width: 104, height: 104, borderRadius: '50%', background: '#111526', border: `5px solid ${hit ? CORAL : SKY}`, transform: `scale(${app * pulse})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: hit ? '0 0 30px rgba(244,63,94,0.6)' : '0 10px 24px rgba(0,0,0,0.5)'}}>
                    <Icon size={74} id={'st' + i} />
                  </div>
                );
              })}
              {dt > 0 && <div style={{position: 'absolute', left: dot.x - 18, top: dot.y - 18, width: 36, height: 36, borderRadius: '50%', background: CORAL, boxShadow: '0 0 30px 8px rgba(244,63,94,0.7)'}} />}
            </>
          );
        })()}

        {/* Persistent name pill */}
        <div style={{position: 'absolute', left: nx - pillW / 2, top: ny - pillH / 2, width: pillW, height: pillH, borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(56,189,248,0.35)', opacity: pillO, boxShadow: '0 20px 50px rgba(0,0,0,0.4)'}} />
        {name && (
          <div style={{position: 'absolute', left: nx - 500, width: 1000, top: ny - fs * 0.62, height: fs * 1.24, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 1 - nameOut, transform: `scale(${1 - nameOut * 0.1})`}}>
            {name.split('').map((ch, i) => {
              const t0 = nameStart + 3 * i;
              const ls = sp(t0, {damping: 12, stiffness: 180});
              const pop = i === 0 ? 1 + 0.12 * Math.sin(interpolate(f, [t0 + 2, t0 + 12], [0, Math.PI], clamp)) : 1;
              return (
                <span key={i} style={{display: 'inline-block', fontFamily: HEAD, fontSize: fs, lineHeight: 1, color: i === 0 ? CORAL : '#fff', opacity: Math.min(1, ls), transform: `translateY(${(1 - ls) * 40}px) scale(${pop * (0.6 + 0.4 * ls)})`, textShadow: '0 10px 30px rgba(0,0,0,0.6)'}}>
                  {ch}
                </span>
              );
            })}
          </div>
        )}
        {chip && (
          <div style={{position: 'absolute', left: nx - 400, width: 800, top: ny + fs * 0.62 + 18, display: 'flex', justifyContent: 'center', opacity: Math.min(1, cs) * (1 - nameOut), transform: `translateY(${(1 - cs) * 40}px)`}}>
            <div style={{background: SKY, color: '#04121c', fontFamily: BODY, fontWeight: 700, fontSize: 40, padding: '12px 32px', borderRadius: 40, boxShadow: '0 12px 30px rgba(56,189,248,0.35)'}}>{chip}</div>
          </div>
        )}

        {/* Wipes */}
        {WIPE_DIR.map((d, k) => (
          <Wipe key={k} f={f} b={S[k + 1]} dir={d} />
        ))}
      </AbsoluteFill>

      {/* Vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none'}} />

      {/* Captions */}
      {sc && (
        <div style={{position: 'absolute', left: 60, right: 60, top: 1385, display: 'flex', justifyContent: 'center', opacity: interpolate(f, [S[ci], S[ci] + 4, S[ci + 1] - 3, S[ci + 1]], [0, 1, 1, ci === 7 ? 1 : 0], clamp)}}>
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 14px', padding: '16px 26px', borderRadius: 28, background: 'rgba(7,8,14,0.6)', border: '1px solid rgba(255,255,255,0.08)'}}>
            {tokens.map((tok, i) => {
              const w = words[i];
              const a = f >= sc.start + w.startFrame && f < sc.start + w.endFrame;
              const done = f >= sc.start + w.endFrame;
              return (
                <span key={i} style={{fontFamily: BODY, fontWeight: 700, fontSize: 56, lineHeight: 1.2, padding: '0 10px', borderRadius: 14, background: a ? CORAL : 'transparent', color: a || done ? '#fff' : 'rgba(255,255,255,0.45)', transform: `scale(${a ? 1.08 : 1})`, display: 'inline-block'}}>
                  {tok}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Teacher */}
      <div style={{position: 'absolute', left: 20, top: 1920 - 30 - 380, width: 300, height: 380, transform: `translateY(${(1 - teacherIn) * 420 + Math.sin(f / 16) * 3}px)`}}>
        <Teacher angle={angle} mouth={mouth} blink={f % 97 < 3} />
      </div>
    </AbsoluteFill>
  );
}