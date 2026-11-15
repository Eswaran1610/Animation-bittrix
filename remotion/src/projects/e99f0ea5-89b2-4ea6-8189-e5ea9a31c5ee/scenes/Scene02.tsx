import React from "react";
import { interpolate, spring, Easing } from "remotion";

export const soundEvents = [
  { "frame": 0, "role": "whoosh", "description": "headline words sweep in" },
  { "frame": 14, "role": "slide", "description": "cell cross-section slides up into place" },
  { "frame": 28, "role": "pop", "description": "cathode label card lands" },
  { "frame": 44, "role": "pop", "description": "anode label card lands, completing the trio" },
  { "frame": 96, "role": "sparkle", "description": "lithium ions settle between graphite layers" }
];

export default function Scene(props: { frame: number; fps: number; durationInFrames: number; theme: any }) {
  const { frame, fps, theme } = props;

  const BG = theme?.colors?.background ?? theme?.background ?? "#f8fafc";
  const PRIMARY = theme?.colors?.primary ?? theme?.primary ?? "#6366f1";
  const ACCENT = theme?.colors?.accent ?? theme?.accent ?? "#06b6d4";
  const TEXT = theme?.colors?.text ?? theme?.text ?? "#0f172a";
  const HEAD = theme?.fonts?.heading ?? theme?.headingFont ?? "Arial";
  const BODY = theme?.fonts?.body ?? theme?.bodyFont ?? "Arial";
  const MUTED = "#475569";
  const GRAPHITE = "#334155";

  const sp = (delay: number, damping = 13, stiffness = 150) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 1 } });

  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

  // Highlight windows synced to narration: "cathode, electrolyte, graphite anode"
  const window = (a: number, b: number, hold = false) =>
    interpolate(frame, hold ? [a, a + 8] : [a, a + 8, b - 6, b], hold ? [0, 1] : [0, 1, 1, 0], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
  const hlCath = window(22, 62);
  const hlElec = window(56, 98);
  const hlAnode = window(92, 150, true);

  // ---------- Layout constants ----------
  const CELL_X = 60;
  const CELL_Y = 724;
  const CELL_W = 960;
  const CELL_H = 530;
  const bands = {
    alEnd: 20,
    cathEnd: 310,
    elecEnd: 650,
    anodeEnd: 940,
  };
  const centers = [
    (bands.alEnd + bands.cathEnd) / 2,
    (bands.cathEnd + bands.elecEnd) / 2,
    (bands.elecEnd + bands.anodeEnd) / 2,
  ];

  // ---------- Entrances ----------
  const cellIn = sp(8, 14, 130);
  const floatY = Math.sin(frame / 22) * 4;
  const legendIn = sp(48, 14, 140);

  // ---------- Headline ----------
  const words1 = ["Three", "parts"];
  const words2 = ["inside", "a", "cell"];
  const renderWord = (w: string, i: number, color: string) => {
    const s = sp(i * 3, 12, 170);
    return (
      <span
        key={w + i}
        style={{
          display: "inline-block",
          marginRight: 24,
          color,
          opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
          transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px) rotate(${interpolate(s, [0, 1], [4, 0])}deg)`,
        }}
      >
        {w}
      </span>
    );
  };

  // ---------- Cards ----------
  const cards = [
    { n: "01", title: "Cathode", desc: "Layered metal oxide", hl: hlCath, delay: 22 },
    { n: "02", title: "Electrolyte", desc: "Lets only ions pass", hl: hlElec, delay: 30 },
    { n: "03", title: "Anode", desc: "Stacked graphite sheets", hl: hlAnode, delay: 38 },
  ];
  const CARD_W = 290;
  const CARD_Y = 492;
  const CARD_H = 176;

  // ---------- Cathode lattice ----------
  const cathodeRows: React.ReactNode[] = [];
  for (let r = 0; r < 9; r++) {
    const y = 50 + r * 54;
    const rs = sp(14 + r * 2, 15, 160);
    const isOxide = r % 2 === 0;
    const dots: React.ReactNode[] = [];
    if (isOxide) {
      for (let x = 42; x <= 290; x += 28) {
        dots.push(<circle key={x} cx={x} cy={y} r={10} fill="url(#oxideGrad)" />);
      }
      dots.unshift(
        <rect key="slab" x={30} y={y - 13} width={270} height={26} rx={13} fill={PRIMARY} opacity={0.1} />
      );
    } else {
      for (let k = 0; k < 6; k++) {
        const x = 50 + k * 46 + (r % 4 === 1 ? 0 : 20);
        const pulse = 1 + Math.sin(frame / 8 + k + r) * 0.12;
        dots.push(<circle key={k} cx={x} cy={y} r={7 * pulse} fill={ACCENT} opacity={0.9} />);
      }
    }
    cathodeRows.push(
      <g
        key={r}
        opacity={interpolate(rs, [0, 0.5], [0, 1], clamp)}
        transform={`translate(${interpolate(rs, [0, 1], [-40, 0])} 0)`}
      >
        {dots}
      </g>
    );
  }

  // ---------- Electrolyte ions (continuous drift cathode -> anode) ----------
  const ionCount = 10;
  const elecW = bands.elecEnd - bands.cathEnd;
  const ions: React.ReactNode[] = [];
  for (let i = 0; i < ionCount; i++) {
    const speed = 2.1 + (i % 3) * 0.45;
    const phase = (frame * speed + i * 41) % elecW;
    const x = bands.cathEnd + phase;
    const y = 58 + ((i * 97) % 410) + Math.sin(frame / 10 + i * 1.7) * 9;
    const edgeFade = Math.min(1, phase / 28, (elecW - phase) / 28);
    const o = Math.max(0, edgeFade) * interpolate(frame, [18, 34], [0, 1], clamp);
    ions.push(
      <g key={i} opacity={o} transform={`translate(${x} ${y})`}>
        <circle r={18} fill={ACCENT} opacity={0.18} />
        <circle r={11} fill="url(#ionGrad)" />
        <text y={4.5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#fff" fontFamily={BODY}>
          +
        </text>
      </g>
    );
  }
  // Solvent texture
  const solvent: React.ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const x = bands.cathEnd + 14 + ((i * 53 + frame * 0.35) % (elecW - 28));
    const y = 30 + ((i * 131) % 470) + Math.cos(frame / 14 + i) * 5;
    solvent.push(<circle key={i} cx={x} cy={y} r={4} fill="#94a3b8" opacity={0.28} />);
  }

  // ---------- Anode graphite ----------
  const graphite: React.ReactNode[] = [];
  const liInAnode: React.ReactNode[] = [];
  for (let l = 0; l < 9; l++) {
    const y = 52 + l * 54;
    const draw = interpolate(sp(18 + l * 2.5, 16, 120), [0, 1], [0, 1], clamp);
    let d = `M ${bands.elecEnd + 18} ${y}`;
    let up = true;
    for (let x = bands.elecEnd + 18 + 16; x <= bands.anodeEnd - 14; x += 16) {
      d += ` L ${x} ${y + (up ? -6 : 6)}`;
      up = !up;
    }
    graphite.push(
      <path
        key={l}
        d={d}
        pathLength={1}
        fill="none"
        stroke={GRAPHITE}
        strokeWidth={3.5}
        strokeLinejoin="round"
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
    );
    if (l < 8) {
      for (let k = 0; k < 4; k++) {
        const s = sp(88 + l * 1.5 + k * 2, 11, 170);
        const x = bands.elecEnd + 50 + k * 64 + (l % 2) * 26;
        const pulse = 1 + Math.sin(frame / 7 + k + l) * 0.1;
        liInAnode.push(
          <circle
            key={`${l}-${k}`}
            cx={x}
            cy={y + 27}
            r={7 * s * pulse}
            fill={ACCENT}
            opacity={interpolate(s, [0, 0.4], [0, 0.95], clamp)}
          />
        );
      }
    }
  }

  const sepOffset = -frame * 1.2;

  // ---------- Background parallax ----------
  const blobA = Math.sin(frame / 40) * 30;
  const blobB = Math.cos(frame / 36) * 26;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: BG,
        overflow: "hidden",
        fontFamily: BODY,
        color: TEXT,
      }}
    >
      {/* Ambient depth */}
      <div
        style={{
          position: "absolute",
          left: -160 + blobA,
          top: 560,
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${PRIMARY}22 0%, ${PRIMARY}00 70%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -180 + blobB,
          top: 840,
          width: 640,
          height: 640,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}22 0%, ${ACCENT}00 70%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)",
          backgroundSize: "36px 36px",
          backgroundPosition: `0px ${-frame * 0.3}px`,
          opacity: 0.35,
        }}
      />

      {/* Eyebrow */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 128,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: interpolate(sp(0), [0, 0.5], [0, 1], clamp),
          transform: `translateX(${interpolate(sp(0), [0, 1], [-30, 0])}px)`,
        }}
      >
        <div style={{ width: 44, height: 4, borderRadius: 2, background: ACCENT }} />
        <div style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 700, letterSpacing: 6, color: PRIMARY }}>
          ANATOMY OF A CELL
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 170,
          width: 960,
          fontFamily: HEAD,
          fontSize: 92,
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: -2,
        }}
      >
        <div>{words1.map((w, i) => renderWord(w, i, i === 1 ? PRIMARY : TEXT))}</div>
        <div>{words2.map((w, i) => renderWord(w, i + 2, TEXT))}</div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 378,
          width: 900,
          fontSize: 30,
          lineHeight: 1.38,
          color: MUTED,
          opacity: interpolate(sp(10), [0, 0.6], [0, 1], clamp),
          transform: `translateY(${interpolate(sp(10), [0, 1], [20, 0])}px)`,
        }}
      >
        A cathode and an anode, separated by electrolyte that lets{" "}
        <span style={{ color: TEXT, fontWeight: 700 }}>only ions</span> pass.
      </div>

      {/* Label cards ABOVE each band */}
      {cards.map((c, i) => {
        const s = sp(c.delay, 12, 160);
        const left = CELL_X + centers[i] - CARD_W / 2;
        const lift = c.hl * -8;
        const lineS = sp(c.delay + 6, 15, 150);
        return (
          <React.Fragment key={c.n}>
            <div
              style={{
                position: "absolute",
                left,
                top: CARD_Y,
                width: CARD_W,
                height: CARD_H,
                boxSizing: "border-box",
                padding: "22px 24px",
                borderRadius: 22,
                background: "#ffffff",
                border: `2px solid ${c.hl > 0.05 ? PRIMARY : "#e2e8f0"}`,
                borderColor: c.hl > 0.05 ? `rgba(99,102,241,${0.25 + c.hl * 0.75})` : "#e2e8f0",
                boxShadow: `0 ${10 + c.hl * 14}px ${28 + c.hl * 20}px rgba(15,23,42,${0.07 + c.hl * 0.08}), 0 2px 6px rgba(15,23,42,0.05)`,
                opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
                transform: `translateY(${interpolate(s, [0, 1], [50, 0]) + lift}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: 5,
                  width: `${c.hl * 100}%`,
                  background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`,
                }}
              />
              <div style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 800, letterSpacing: 3, color: ACCENT }}>
                {c.n}
              </div>
              <div
                style={{
                  fontFamily: HEAD,
                  fontSize: 38,
                  fontWeight: 800,
                  marginTop: 6,
                  color: TEXT,
                  letterSpacing: -0.5,
                }}
              >
                {c.title}
              </div>
              <div style={{ fontSize: 23, lineHeight: 1.3, marginTop: 8, color: MUTED }}>{c.desc}</div>
            </div>
            {/* Connector into the band */}
            <div
              style={{
                position: "absolute",
                left: CELL_X + centers[i] - 1.5,
                top: CARD_Y + CARD_H,
                width: 3,
                height: CELL_Y - (CARD_Y + CARD_H) + 14,
                background: `linear-gradient(${c.hl > 0.05 ? PRIMARY : "#cbd5e1"}, ${ACCENT})`,
                transformOrigin: "top",
                transform: `scaleY(${lineS})`,
                borderRadius: 2,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: CELL_X + centers[i] - 8,
                top: CELL_Y + 6,
                width: 16,
                height: 16,
                borderRadius: 8,
                background: ACCENT,
                boxShadow: `0 0 0 ${5 + c.hl * 5}px rgba(6,182,212,0.2)`,
                transform: `scale(${lineS})`,
                zIndex: 3,
              }}
            />
          </React.Fragment>
        );
      })}

      {/* Cell cross-section */}
      <div
        style={{
          position: "absolute",
          left: CELL_X,
          top: CELL_Y,
          width: CELL_W,
          height: CELL_H,
          borderRadius: 30,
          overflow: "hidden",
          background: "#ffffff",
          border: "2px solid #e2e8f0",
          boxShadow:
            "0 40px 80px -30px rgba(15,23,42,0.28), 0 18px 36px -18px rgba(99,102,241,0.25), inset 0 1px 0 #fff",
          opacity: interpolate(cellIn, [0, 0.4], [0, 1], clamp),
          transform: `translateY(${interpolate(cellIn, [0, 1], [120, 0]) + floatY}px) scale(${interpolate(cellIn, [0, 1], [0.94, 1])})`,
        }}
      >
        <svg width={CELL_W} height={CELL_H} viewBox={`0 0 ${CELL_W} ${CELL_H}`}>
          <defs>
            <radialGradient id="oxideGrad" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="100%" stopColor="#4338ca" />
            </radialGradient>
            <radialGradient id="ionGrad" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#0891b2" />
            </radialGradient>
            <linearGradient id="elecGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ecfeff" />
              <stop offset="100%" stopColor="#cffafe" />
            </linearGradient>
            <linearGradient id="cathGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eef2ff" />
              <stop offset="100%" stopColor="#e0e7ff" />
            </linearGradient>
            <linearGradient id="anodeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="alGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="cuGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          {/* Band fills */}
          <rect x={0} y={0} width={bands.alEnd} height={CELL_H} fill="url(#alGrad)" />
          <rect x={bands.alEnd} y={0} width={bands.cathEnd - bands.alEnd} height={CELL_H} fill="url(#cathGrad)" />
          <rect x={bands.cathEnd} y={0} width={elecW} height={CELL_H} fill="url(#elecGrad)" />
          <rect
            x={bands.elecEnd}
            y={0}
            width={bands.anodeEnd - bands.elecEnd}
            height={CELL_H}
            fill="url(#anodeGrad)"
          />
          <rect x={bands.anodeEnd} y={0} width={CELL_W - bands.anodeEnd} height={CELL_H} fill="url(#cuGrad)" />

          {/* Electrolyte shimmer */}
          <rect
            x={bands.cathEnd + ((frame * 4) % (elecW + 200)) - 160}
            y={0}
            width={90}
            height={CELL_H}
            fill="#ffffff"
            opacity={0.35}
            transform={`skewX(-12)`}
          />

          {/* Highlights per band */}
          <rect
            x={bands.alEnd + 4}
            y={4}
            width={bands.cathEnd - bands.alEnd - 8}
            height={CELL_H - 8}
            rx={18}
            fill={PRIMARY}
            fillOpacity={hlCath * 0.07}
            stroke={PRIMARY}
            strokeOpacity={hlCath * 0.6}
            strokeWidth={3}
          />
          <rect
            x={bands.cathEnd + 4}
            y={4}
            width={elecW - 8}
            height={CELL_H - 8}
            rx={18}
            fill={ACCENT}
            fillOpacity={hlElec * 0.08}
            stroke={ACCENT}
            strokeOpacity={hlElec * 0.7}
            strokeWidth={3}
          />
          <rect
            x={bands.elecEnd + 4}
            y={4}
            width={bands.anodeEnd - bands.elecEnd - 8}
            height={CELL_H - 8}
            rx={18}
            fill={PRIMARY}
            fillOpacity={hlAnode * 0.06}
            stroke={PRIMARY}
            strokeOpacity={hlAnode * 0.6}
            strokeWidth={3}
          />

          {/* Cathode lattice */}
          {cathodeRows}

          {/* Electrolyte content */}
          {solvent}
          <line
            x1={(bands.cathEnd + bands.elecEnd) / 2}
            y1={16}
            x2={(bands.cathEnd + bands.elecEnd) / 2}
            y2={CELL_H - 44}
            stroke="#94a3b8"
            strokeWidth={4}
            strokeDasharray="12 9"
            strokeDashoffset={sepOffset}
            opacity={interpolate(cellIn, [0.3, 1], [0, 0.9], clamp)}
          />
          <text
            x={(bands.cathEnd + bands.elecEnd) / 2}
            y={CELL_H - 18}
            textAnchor="middle"
            fontSize={16}
            fontWeight={700}
            letterSpacing={3}
            fill="#64748b"
            fontFamily={BODY}
          >
            SEPARATOR
          </text>
          {ions}

          {/* Anode graphite */}
          {graphite}
          {liInAnode}

          {/* Band boundaries */}
          <line x1={bands.cathEnd} y1={0} x2={bands.cathEnd} y2={CELL_H} stroke="#c7d2fe" strokeWidth={2} />
          <line x1={bands.elecEnd} y1={0} x2={bands.elecEnd} y2={CELL_H} stroke="#cbd5e1" strokeWidth={2} />
        </svg>
      </div>

      {/* Legend row under the cell (ends well above y=1440) */}
      <div
        style={{
          position: "absolute",
          left: CELL_X,
          top: CELL_Y + CELL_H + 34,
          width: CELL_W,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: interpolate(legendIn, [0, 0.5], [0, 1], clamp),
          transform: `translateY(${interpolate(legendIn, [0, 1], [24, 0])}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, color: MUTED, fontWeight: 700 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              background: TEXT,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            +
          </div>
          Al foil
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 24px",
            borderRadius: 40,
            background: TEXT,
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
            boxShadow: "0 12px 26px -10px rgba(15,23,42,0.5)",
            transform: `scale(${1 + Math.sin(frame / 12) * 0.015})`,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              background: ACCENT,
              boxShadow: `0 0 0 ${4 + Math.sin(frame / 6) * 2}px rgba(6,182,212,0.3)`,
            }}
          />
          Li⁺ ions cross · electrons can't
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, color: MUTED, fontWeight: 700 }}>
          Cu foil
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              background: TEXT,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            −
          </div>
        </div>
      </div>
    </div>
  );
}