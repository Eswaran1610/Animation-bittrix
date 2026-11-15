import React from 'react';
import {interpolate, spring, Easing} from 'remotion';

export const soundEvents = [
  {"frame": 4, "role": "whoosh", "description": "headline words rise in"},
  {"frame": 10, "role": "slide", "description": "charging panel slides in from the left"},
  {"frame": 20, "role": "slide", "description": "discharging panel slides in from the right"},
  {"frame": 34, "role": "pop", "description": "charger and phone badges pop onto the wires"},
  {"frame": 52, "role": "ding", "description": "phone screen lights up as electrons arrive"}
];

const BG = '#f8fafc';
const PRI = '#6366f1';
const ACC = '#06b6d4';
const TXT = '#0f172a';
const MUTED = '#64748b';

const LANES = [196, 232, 268, 304, 340];
const LAYERS = [178, 214, 250, 286, 322, 358];

const WIRE: [number, number][] = [
  [160, 160],
  [160, 100],
  [380, 100],
  [580, 100],
  [800, 100],
  [800, 160],
];

function along(t: number): [number, number] {
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < WIRE.length - 1; i++) {
    const dx = WIRE[i + 1][0] - WIRE[i][0];
    const dy = WIRE[i + 1][1] - WIRE[i][1];
    const l = Math.sqrt(dx * dx + dy * dy);
    lens.push(l);
    total += l;
  }
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const k = lens[i] === 0 ? 0 : d / lens[i];
      return [
        WIRE[i][0] + (WIRE[i + 1][0] - WIRE[i][0]) * k,
        WIRE[i][1] + (WIRE[i + 1][1] - WIRE[i][1]) * k,
      ];
    }
    d -= lens[i];
  }
  return WIRE[WIRE.length - 1];
}

// deterministic slot order so parked ions appear / disappear scattered
const slotOrder = (n: number) => {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push((i * 7 + 3) % n);
  return out;
};
const SLOTS = slotOrder(25);

type PanelProps = {
  mode: 'charge' | 'discharge';
  frame: number;
  fps: number;
  enter: number;
  badgePop: number;
  wireDraw: number;
};

const Panel: React.FC<PanelProps> = ({mode, frame, fps, enter, badgePop, wireDraw}) => {
  const isCharge = mode === 'charge';
  const id = mode;
  const sec = frame / fps;

  // parked ion counts — charge loads graphite, discharge returns to cathode
  const anodeCount = Math.round(
    interpolate(frame, [0, 118], isCharge ? [3, 20] : [20, 5], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    })
  );
  const cathodeCount = Math.round(
    interpolate(frame, [0, 118], isCharge ? [21, 5] : [5, 21], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    })
  );

  const meter = interpolate(frame, [8, 118], isCharge ? [0.22, 0.9] : [0.9, 0.58], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  // moving ions across electrolyte
  const ions = Array.from({length: 7}).map((_, i) => {
    const t = (sec / 2.1 + i / 7) % 1;
    const p = isCharge ? t : 1 - t;
    const x = 238 + p * 530;
    const y = LANES[(i * 3) % 5] + Math.sin(sec * 3 + i) * 3;
    const fade = Math.min(1, t / 0.12, (1 - t) / 0.12);
    return {x, y, o: Math.max(0, fade) * enter};
  });

  // electrons around the external wire
  const electrons = Array.from({length: 10}).map((_, i) => {
    const t = (sec / 1.7 + i / 10) % 1;
    const p = isCharge ? t : 1 - t;
    const [x, y] = along(p);
    const inBadge = y < 101 && x > 368 && x < 592;
    const edge = Math.min(1, t / 0.06, (1 - t) / 0.06);
    return {x, y, o: inBadge ? 0 : Math.max(0, edge) * wireDraw};
  });

  const screen = 0.55 + 0.45 * Math.sin(sec * 7);
  const badgeScale = interpolate(badgePop, [0, 1], [0.4, 1]);
  const chevronShift = ((sec * 60) % 30) * (isCharge ? 1 : -1);

  return (
    <svg width={960} height={450} viewBox="0 0 960 450" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`${id}-cath`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef2ff" />
          <stop offset="1" stopColor="#e0e7ff" />
        </linearGradient>
        <linearGradient id={`${id}-an`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id={`${id}-ely`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={ACC} stopOpacity="0.05" />
          <stop offset="0.5" stopColor={ACC} stopOpacity="0.13" />
          <stop offset="1" stopColor={ACC} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`${id}-gr`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#475569" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <radialGradient id={`${id}-ion`} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#a5f3fc" />
          <stop offset="0.6" stopColor={ACC} />
          <stop offset="1" stopColor="#0891b2" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${id}-shadow`} x="-30%" y="-60%" width="160%" height="220%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.16" />
        </filter>
      </defs>

      {/* header */}
      <rect x={28} y={24} width={56} height={34} rx={17} fill={isCharge ? TXT : PRI} />
      <text x={56} y={47} textAnchor="middle" fontFamily="Arial" fontWeight={800} fontSize={17} fill="#fff">
        {isCharge ? '01' : '02'}
      </text>
      <text x={98} y={49} fontFamily="Arial" fontSize={23} fill={TXT} fontWeight={800} letterSpacing={2}>
        {isCharge ? 'CHARGING' : 'DISCHARGING'}
        <tspan fontWeight={400} fill={MUTED} letterSpacing={0.5}>
          {isCharge ? '  ·  energy stored' : '  ·  energy released'}
        </tspan>
      </text>

      {/* meter */}
      <text x={740} y={36} fontFamily="Arial" fontSize={12} fontWeight={700} letterSpacing={2} fill={MUTED}>
        {isCharge ? 'STORED' : 'BATTERY'}
      </text>
      <rect x={740} y={44} width={130} height={12} rx={6} fill="#e2e8f0" />
      <rect
        x={740}
        y={44}
        width={130 * meter * enter}
        height={12}
        rx={6}
        fill={isCharge ? ACC : PRI}
      />
      <text x={934} y={57} textAnchor="end" fontFamily="Arial" fontSize={22} fontWeight={800} fill={TXT}>
        {Math.round(meter * 100)}%
      </text>

      {/* electrolyte */}
      <rect x={260} y={160} width={440} height={220} fill={`url(#${id}-ely)`} />
      <line x1={480} y1={166} x2={480} y2={374} stroke={ACC} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 8" />
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const x = 300 + k * 30 + chevronShift + (isCharge ? 0 : 60);
        const o = interpolate(x, [290, 320, 640, 670], [0, 0.55, 0.55, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <text
            key={k}
            x={x + k * 30}
            y={372}
            fontFamily="Arial"
            fontSize={18}
            fontWeight={700}
            fill={ACC}
            opacity={o * enter}
          >
            {isCharge ? '›' : '‹'}
          </text>
        );
      })}

      {/* cathode: layered metal oxide */}
      <rect x={60} y={160} width={200} height={220} rx={18} fill={`url(#${id}-cath)`} stroke="#c7d2fe" strokeWidth={2} />
      {LAYERS.map((y, r) =>
        [0, 1, 2, 3, 4, 5].map((j) => (
          <circle key={`o${r}-${j}`} cx={84 + j * 30} cy={y} r={7} fill="#4338ca" opacity={0.55} />
        ))
      )}
      {SLOTS.slice(0, cathodeCount).map((s) => {
        const lane = Math.floor(s / 5);
        const col = s % 5;
        return <circle key={`cl${s}`} cx={99 + col * 30} cy={LANES[lane]} r={7} fill={ACC} stroke="#fff" strokeWidth={1.5} />;
      })}

      {/* anode: graphite sheets */}
      <rect x={700} y={160} width={200} height={220} rx={18} fill={`url(#${id}-an)`} stroke="#cbd5e1" strokeWidth={2} />
      {LAYERS.map((y, r) => (
        <rect key={`g${r}`} x={716} y={y - 4} width={168} height={8} rx={4} fill={`url(#${id}-gr)`} />
      ))}
      {SLOTS.slice(0, anodeCount).map((s) => {
        const lane = Math.floor(s / 5);
        const col = s % 5;
        return <circle key={`al${s}`} cx={736 + col * 32} cy={LANES[lane]} r={7} fill={ACC} stroke="#fff" strokeWidth={1.5} />;
      })}

      {/* moving ions */}
      {ions.map((ion, i) => (
        <g key={`ion${i}`} opacity={ion.o}>
          <circle cx={ion.x} cy={ion.y} r={14} fill={ACC} opacity={0.45} filter={`url(#${id}-glow)`} />
          <circle cx={ion.x} cy={ion.y} r={11} fill={`url(#${id}-ion)`} />
          <text x={ion.x} y={ion.y + 5} textAnchor="middle" fontFamily="Arial" fontSize={15} fontWeight={800} fill="#fff">
            +
          </text>
        </g>
      ))}

      {/* wire */}
      <path
        d="M160 160 L160 100 L380 100 M580 100 L800 100 L800 160"
        fill="none"
        stroke="#cbd5e1"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - wireDraw}
      />
      <path
        d="M160 160 L160 100 L380 100 M580 100 L800 100 L800 160"
        fill="none"
        stroke={PRI}
        strokeOpacity={0.35}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - wireDraw}
      />
      <text x={138} y={140} textAnchor="end" fontFamily="Arial" fontSize={24} fontWeight={800} fill={PRI} opacity={wireDraw}>
        +
      </text>
      <text x={822} y={140} fontFamily="Arial" fontSize={26} fontWeight={800} fill={TXT} opacity={wireDraw}>
        −
      </text>

      {electrons.map((e, i) => (
        <g key={`e${i}`} opacity={e.o}>
          <circle cx={e.x} cy={e.y} r={9} fill={PRI} opacity={0.4} filter={`url(#${id}-glow)`} />
          <circle cx={e.x} cy={e.y} r={6} fill={PRI} stroke="#fff" strokeWidth={2} />
        </g>
      ))}

      {/* device badge, terminals sit on the badge edges outside the text */}
      <g transform={`translate(480 100) scale(${badgeScale}) translate(-480 -100)`} opacity={badgePop}>
        <rect x={380} y={72} width={200} height={56} rx={28} fill="#ffffff" filter={`url(#${id}-shadow)`} />
        <rect x={380} y={72} width={200} height={56} rx={28} fill="none" stroke={isCharge ? '#cbd5e1' : PRI} strokeOpacity={isCharge ? 1 : 0.5} strokeWidth={2} />
        {isCharge ? (
          <g>
            <rect x={402} y={88} width={20} height={20} rx={5} fill={TXT} />
            <rect x={406} y={80} width={3} height={9} rx={1.5} fill={TXT} />
            <rect x={415} y={80} width={3} height={9} rx={1.5} fill={TXT} />
            <rect x={410} y={107} width={4} height={10} rx={2} fill={TXT} />
            <text x={496} y={107} textAnchor="middle" fontFamily="Arial" fontSize={19} fontWeight={800} letterSpacing={1.5} fill={TXT}>
              CHARGER
            </text>
          </g>
        ) : (
          <g>
            <rect x={400} y={81} width={22} height={38} rx={5} fill={TXT} />
            <rect x={403} y={85} width={16} height={28} rx={2} fill={ACC} opacity={0.35 + 0.65 * screen * wireDraw} />
            <path d="M412 88 L407 100 L411 100 L409 109 L415 96 L411 96 Z" fill="#fff" opacity={wireDraw} />
            <text x={498} y={106} textAnchor="middle" fontFamily="Arial" fontSize={17} fontWeight={800} letterSpacing={1.2} fill={TXT}>
              YOUR PHONE
            </text>
          </g>
        )}
        <circle cx={380} cy={100} r={7} fill="#fff" stroke={PRI} strokeWidth={3} />
        <circle cx={580} cy={100} r={7} fill="#fff" stroke={PRI} strokeWidth={3} />
      </g>

      {/* labels */}
      {[
        {x: 160, t: 'CATHODE', s: 'metal oxide'},
        {x: 480, t: 'ELECTROLYTE', s: 'ions only'},
        {x: 800, t: 'ANODE', s: 'graphite'},
      ].map((l) => (
        <g key={l.t}>
          <text x={l.x} y={410} textAnchor="middle" fontFamily="Arial" fontSize={16} fontWeight={800} letterSpacing={3} fill={TXT}>
            {l.t}
          </text>
          <text x={l.x} y={432} textAnchor="middle" fontFamily="Arial" fontSize={15} fill={MUTED}>
            {l.s}
          </text>
        </g>
      ))}
    </svg>
  );
};

export default function Scene(props: {frame: number; fps: number; durationInFrames: number; theme: any}) {
  const {frame, fps, theme} = props;
  const bg = theme?.background ?? BG;
  const sec = frame / fps;

  const sp = (delay: number, damping = 13, stiffness = 150) =>
    spring({frame: frame - delay, fps, config: {damping, stiffness}});

  const kicker = sp(0, 14, 160);
  const w1 = sp(3);
  const w2 = sp(7);
  const sub = sp(12, 15, 130);
  const p1 = sp(10, 14, 140);
  const p2 = sp(20, 14, 140);
  const b1 = sp(32, 11, 170);
  const b2 = sp(36, 11, 170);
  const legend = sp(44, 14, 150);

  const wire1 = interpolate(frame, [18, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const wire2 = interpolate(frame, [28, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const pulse = 0.5 + 0.5 * Math.sin(sec * 4);
  const drift = Math.sin(sec * 0.9);

  const panelShadow =
    '0 1px 2px rgba(15,23,42,0.06), 0 12px 28px rgba(15,23,42,0.08), 0 32px 64px rgba(99,102,241,0.08)';

  const word = (s: number): React.CSSProperties => ({
    display: 'inline-block',
    transform: `translateY(${(1 - s) * 60}px)`,
    opacity: Math.min(1, s * 1.4),
  });

  return (
    <div style={{width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: bg, fontFamily: 'Arial'}}>
      {/* ambient depth */}
      <div
        style={{
          position: 'absolute',
          left: -180 + drift * 40,
          top: 260,
          width: 620,
          height: 620,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${PRI}22 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -200 - drift * 40,
          top: 820,
          width: 680,
          height: 680,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${ACC}22 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />

      {/* headline block */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 106,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 6,
          color: ACC,
          opacity: kicker,
          transform: `translateX(${(1 - kicker) * -30}px)`,
        }}
      >
        07 · ONE CELL, TWO DIRECTIONS
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 144,
          width: 960,
          fontSize: 68,
          fontWeight: 800,
          lineHeight: 1.06,
          letterSpacing: -1.5,
          color: TXT,
        }}
      >
        <span style={word(w1)}>Charge stores,</span>
        <br />
        <span style={word(w2)}>
          discharge <span style={{color: PRI}}>releases</span>
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 312,
          width: 900,
          fontSize: 26,
          lineHeight: 1.35,
          color: '#475569',
          opacity: sub,
          transform: `translateY(${(1 - sub) * 20}px)`,
        }}
      >
        Energy sits as chemical potential; letting ions return sends electrons through your device.
      </div>

      {/* charging panel */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 410,
          width: 960,
          height: 450,
          borderRadius: 32,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          border: '1.5px solid #e2e8f0',
          boxShadow: panelShadow,
          opacity: Math.min(1, p1 * 1.3),
          transform: `translateX(${(1 - p1) * -120}px) translateY(${drift * -3}px)`,
          overflow: 'hidden',
        }}
      >
        <Panel mode="charge" frame={frame} fps={fps} enter={p1} badgePop={b1} wireDraw={wire1} />
      </div>

      {/* discharging panel: the narrated moment, emphasised */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 880,
          width: 960,
          height: 450,
          borderRadius: 32,
          background: 'linear-gradient(180deg, #ffffff 0%, #eef2ff 100%)',
          border: `2px solid rgba(99,102,241,${0.3 + 0.3 * pulse * wire2})`,
          boxShadow: `${panelShadow}, 0 0 ${24 + 20 * pulse * wire2}px rgba(99,102,241,${0.12 + 0.1 * pulse * wire2})`,
          opacity: Math.min(1, p2 * 1.3),
          transform: `translateX(${(1 - p2) * 120}px) translateY(${drift * 3}px)`,
          overflow: 'hidden',
        }}
      >
        <Panel mode="discharge" frame={frame} fps={fps} enter={p2} badgePop={b2} wireDraw={wire2} />
      </div>

      {/* legend */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 1352,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          opacity: legend,
          transform: `translateY(${(1 - legend) * 24}px)`,
        }}
      >
        {[
          {c: ACC, t: 'Li⁺ through electrolyte'},
          {c: PRI, t: 'e⁻ through the wire & your phone'},
        ].map((l) => (
          <div
            key={l.t}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              height: 56,
              padding: '0 24px',
              borderRadius: 28,
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 6px 18px rgba(15,23,42,0.08)',
              fontSize: 22,
              fontWeight: 700,
              color: TXT,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                background: l.c,
                boxShadow: `0 0 ${8 + 6 * pulse}px ${l.c}`,
              }}
            />
            {l.t}
          </div>
        ))}
      </div>
    </div>
  );
}