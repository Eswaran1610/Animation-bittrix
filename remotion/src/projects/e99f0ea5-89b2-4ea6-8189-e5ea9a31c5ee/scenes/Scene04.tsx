import React from "react";
import { interpolate, spring, Easing } from "remotion";

export const soundEvents = [
  { "frame": 12, "role": "pop", "description": "charger badge lands with overshoot" },
  { "frame": 24, "role": "draw", "description": "external wire draws from cathode to anode" },
  { "frame": 40, "role": "whoosh", "description": "first lithium ions stream through electrolyte" },
  { "frame": 62, "role": "count", "description": "state-of-charge readout starts counting up" },
  { "frame": 112, "role": "ding", "description": "charge bar reaches target and glows" }
];

type Pt = [number, number];

const polyLen = (pts: Pt[]) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return L;
};

const pointOn = (pts: Pt[], t: number): Pt => {
  const total = polyLen(pts);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= seg || i === pts.length - 1) {
      const k = seg === 0 ? 0 : Math.min(1, d / seg);
      return [
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k,
      ];
    }
    d -= seg;
  }
  return pts[pts.length - 1];
};

const mod = (a: number, p: number) => ((a % p) + p) % p;

export default function Scene(props: {
  frame: number;
  fps: number;
  durationInFrames: number;
  theme: any;
}) {
  const { frame, fps } = props;
  const theme = props.theme || {};
  const BG = theme.background || "#f8fafc";
  const PRIMARY = theme.primary || "#6366f1";
  const ACCENT = theme.accent || "#06b6d4";
  const TEXT = theme.text || "#0f172a";
  const HEAD = theme.headingFont || "Arial, Helvetica, sans-serif";
  const BODY = theme.bodyFont || "Arial, Helvetica, sans-serif";

  const sp = (delay: number, damping = 13, stiffness = 150) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 1 } });

  // Entrances
  const eyebrowIn = sp(0, 14, 160);
  const headIn = sp(3, 12, 140);
  const subIn = sp(8, 14, 130);
  const badgeIn = sp(10, 11, 170);
  const cellIn = sp(6, 14, 120);
  const legendIn = sp(30, 13, 150);
  const socIn = sp(36, 13, 140);

  const wireDraw = interpolate(frame, [16, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

  // Continuous ambient motion
  const floatY = Math.sin(frame / 22) * 5;
  const parallax = Math.sin(frame / 30) * 3;
  const boltPulse = 0.5 + 0.5 * Math.sin(frame / 4.5);

  // State of charge
  const socT = interpolate(frame, [44, 128], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const soc = 18 + socT * 46; // 18% -> 64%
  const socDone = sp(110, 12, 160);

  // Geometry
  const cellX = 120, cellY = 700, cellW = 840, cellH = 440;
  const bandTop = 770, bandBot = 1112;
  const cathX0 = 144, cathX1 = 384;
  const elecX0 = 400, elecX1 = 680;
  const anX0 = 696, anX1 = 936;

  const graphiteYs = Array.from({ length: 8 }, (_, k) => 786 + k * 46);
  const laneYs = graphiteYs.slice(0, 7).map((y) => y + 23);

  // Wire: cathode (+) -> charger + terminal ... charger − terminal -> anode
  const badgeL = 340, badgeR = 740, wireY = 590;
  const wireA: Pt[] = [[264, cellY], [264, wireY], [badgeL, wireY]];
  const wireB: Pt[] = [[badgeR, wireY], [816, wireY], [816, cellY]];
  const lenA = polyLen(wireA);
  const lenB = polyLen(wireB);

  // Electrons along the wire
  const electrons = Array.from({ length: 10 }, (_, i) => {
    const period = 46;
    const u = mod(frame - 30 - i * (period / 10) * 2, period * 2) / (period * 2);
    const visible = frame > 30 && wireDraw > 0.95;
    let p: Pt;
    let op = 1;
    if (u < 0.46) {
      p = pointOn(wireA, u / 0.46);
    } else if (u < 0.54) {
      p = [badgeL, wireY];
      op = 0;
    } else {
      p = pointOn(wireB, (u - 0.54) / 0.46);
    }
    const fadeEdge = interpolate(u, [0, 0.04, 0.96, 1], [0, 1, 1, 0]);
    return { x: p[0], y: p[1], op: visible ? op * fadeEdge : 0, key: i };
  });

  // Lithium ions streaming cathode -> anode through electrolyte
  const ions = Array.from({ length: 9 }, (_, i) => {
    const period = 60;
    const start = 34 + i * 7;
    const local = frame - start;
    if (local < 0) return null;
    const t = mod(local, period) / period;
    const lane = laneYs[(i * 3) % laneYs.length];
    const targetX = anX0 + 40 + ((i * 2) % 4) * 48;
    const startX = cathX0 + 60 + ((i * 5) % 3) * 50;
    const e = Easing.bezier(0.45, 0, 0.2, 1)(Math.min(1, t / 0.82));
    const x = startX + (targetX - startX) * e;
    const wob = Math.sin(t * Math.PI * 3 + i) * 10 * (1 - Math.abs(e - 0.5) * 2);
    const op = interpolate(t, [0, 0.08, 0.86, 1], [0, 1, 1, 0]);
    const scale = interpolate(t, [0, 0.1, 0.82, 0.9, 1], [0.4, 1, 1, 1.25, 0.8]);
    return { x, y: lane + wob, op, scale, key: i };
  });

  // Stored ions in graphite grow with SoC; cathode Li depletes
  const storedSlots: Pt[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 4; c++) {
      storedSlots.push([anX0 + 36 + c * 56, laneYs[r]]);
    }
  }
  const storedCount = Math.floor(interpolate(soc, [18, 64], [3, storedSlots.length]));
  const cathodeSlots: Pt[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 4; c++) {
      cathodeSlots.push([cathX0 + 36 + c * 56, laneYs[r]]);
    }
  }
  const cathodeRemaining = cathodeSlots.length - storedCount + 3;

  const wireDash = (len: number) => ({
    strokeDasharray: len,
    strokeDashoffset: len * (1 - wireDraw),
  });

  const headY = interpolate(headIn, [0, 1], [50, 0]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: `radial-gradient(1200px 900px at 50% 38%, #ffffff 0%, ${BG} 60%, #eef2ff 100%)`,
        overflow: "hidden",
        fontFamily: BODY,
      }}
    >
      {/* soft background blobs for depth */}
      <div
        style={{
          position: "absolute",
          left: -180 + parallax * 4,
          top: 640,
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${PRIMARY}22 0%, transparent 70%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -200 - parallax * 4,
          top: 820,
          width: 660,
          height: 660,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
          filter: "blur(34px)",
        }}
      />

      {/* Header */}
      <div style={{ position: "absolute", left: 80, right: 80, top: 150 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            borderRadius: 999,
            background: `${PRIMARY}14`,
            border: `1.5px solid ${PRIMARY}40`,
            color: PRIMARY,
            fontFamily: HEAD,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 4,
            opacity: eyebrowIn,
            transform: `translateY(${(1 - eyebrowIn) * 20}px)`,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: PRIMARY,
              opacity: 0.5 + boltPulse * 0.5,
            }}
          />
          STEP 03 · CHARGING
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 78,
            lineHeight: 1.04,
            letterSpacing: -2,
            color: TEXT,
            opacity: headIn,
            transform: `translateY(${headY}px)`,
          }}
        >
          Charging pushes
          <br />
          <span
            style={{
              background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            lithium
          </span>{" "}
          across
        </div>
        <div
          style={{
            marginTop: 18,
            maxWidth: 860,
            fontSize: 30,
            lineHeight: 1.35,
            color: "#475569",
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 24}px)`,
          }}
        >
          The charger pulls ions through the electrolyte while electrons travel
          the outside wire.
        </div>
      </div>

      {/* Main SVG diagram */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <defs>
          <linearGradient id="s4-cell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          <linearGradient id="s4-cath" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`${PRIMARY}26`} />
            <stop offset="100%" stopColor={`${PRIMARY}10`} />
          </linearGradient>
          <linearGradient id="s4-elec" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={`${ACCENT}10`} />
            <stop offset="50%" stopColor={`${ACCENT}24`} />
            <stop offset="100%" stopColor={`${ACCENT}10`} />
          </linearGradient>
          <linearGradient id="s4-anode" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <radialGradient id="s4-ion" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="100%" stopColor={ACCENT} />
          </radialGradient>
          <radialGradient id="s4-elec-dot" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#c7d2fe" />
            <stop offset="100%" stopColor={PRIMARY} />
          </radialGradient>
          <filter id="s4-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#0f172a" floodOpacity="0.14" />
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
          <filter id="s4-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="s4-cellclip">
            <rect x={cellX} y={cellY} width={cellW} height={cellH} rx={36} />
          </clipPath>
        </defs>

        <g transform={`translate(0 ${floatY * 0.4})`}>
          {/* Wires */}
          <g opacity={cellIn}>
            <polyline
              points={wireA.map((p) => p.join(",")).join(" ")}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={14}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={wireDash(lenA)}
            />
            <polyline
              points={wireB.map((p) => p.join(",")).join(" ")}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={14}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={wireDash(lenB)}
            />
            <polyline
              points={wireA.map((p) => p.join(",")).join(" ")}
              fill="none"
              stroke={PRIMARY}
              strokeOpacity={0.35}
              strokeWidth={4}
              strokeLinejoin="round"
              style={wireDash(lenA)}
            />
            <polyline
              points={wireB.map((p) => p.join(",")).join(" ")}
              fill="none"
              stroke={PRIMARY}
              strokeOpacity={0.35}
              strokeWidth={4}
              strokeLinejoin="round"
              style={wireDash(lenB)}
            />
            {/* cell tabs */}
            <rect x={244} y={cellY - 18} width={40} height={22} rx={6} fill={TEXT} />
            <rect x={796} y={cellY - 18} width={40} height={22} rx={6} fill={TEXT} />
          </g>

          {/* Electrons on the wire */}
          {electrons.map((e) => (
            <g key={`e${e.key}`} opacity={e.op} filter="url(#s4-glow)">
              <circle cx={e.x} cy={e.y} r={10} fill="url(#s4-elec-dot)" />
            </g>
          ))}

          {/* Cell body */}
          <g
            opacity={cellIn}
            transform={`translate(0 ${(1 - cellIn) * 80}) translate(540 920) scale(${0.94 + cellIn * 0.06}) translate(-540 -920)`}
          >
            <rect
              x={cellX}
              y={cellY}
              width={cellW}
              height={cellH}
              rx={36}
              fill="url(#s4-cell)"
              stroke="#e2e8f0"
              strokeWidth={2}
              filter="url(#s4-shadow)"
            />
            <g clipPath="url(#s4-cellclip)">
              {/* Band labels (above bands) */}
              {[
                { x: (cathX0 + cathX1) / 2, t: "CATHODE", c: PRIMARY },
                { x: (elecX0 + elecX1) / 2, t: "ELECTROLYTE", c: "#0e7490" },
                { x: (anX0 + anX1) / 2, t: "GRAPHITE ANODE", c: TEXT },
              ].map((l) => (
                <text
                  key={l.t}
                  x={l.x}
                  y={748}
                  textAnchor="middle"
                  fontFamily={HEAD}
                  fontWeight={700}
                  fontSize={20}
                  letterSpacing={3}
                  fill={l.c}
                >
                  {l.t}
                </text>
              ))}

              {/* Cathode: layered metal oxide */}
              <rect x={cathX0} y={bandTop} width={cathX1 - cathX0} height={bandBot - bandTop} rx={18} fill="url(#s4-cath)" stroke={`${PRIMARY}40`} strokeWidth={2} />
              {graphiteYs.map((y, r) => (
                <g key={`co${r}`}>
                  {Array.from({ length: 9 }, (_, c) => (
                    <rect
                      key={c}
                      x={cathX0 + 12 + c * 25.5}
                      y={y - 5}
                      width={14}
                      height={10}
                      rx={3}
                      fill={PRIMARY}
                      opacity={0.32}
                    />
                  ))}
                </g>
              ))}
              {cathodeSlots.map((p, i) =>
                i < cathodeRemaining ? (
                  <circle key={`cl${i}`} cx={p[0]} cy={p[1]} r={9} fill={ACCENT} opacity={0.55} />
                ) : (
                  <circle key={`cl${i}`} cx={p[0]} cy={p[1]} r={9} fill="none" stroke={ACCENT} strokeOpacity={0.35} strokeDasharray="3 4" strokeWidth={2} />
                )
              )}

              {/* Electrolyte + separator */}
              <rect x={elecX0} y={bandTop} width={elecX1 - elecX0} height={bandBot - bandTop} rx={18} fill="url(#s4-elec)" />
              <line
                x1={(elecX0 + elecX1) / 2}
                y1={bandTop + 10}
                x2={(elecX0 + elecX1) / 2}
                y2={bandBot - 10}
                stroke="#0e7490"
                strokeOpacity={0.35}
                strokeWidth={3}
                strokeDasharray="10 10"
                strokeDashoffset={-frame * 1.2}
              />
              {/* flow chevrons */}
              {[0, 1, 2].map((k) => {
                const cx = elecX0 + 50 + mod(frame * 2.2 + k * 70, 190);
                return (
                  <path
                    key={`ch${k}`}
                    d={`M ${cx} ${bandBot - 44} l 14 12 l -14 12`}
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.5 * legendIn}
                  />
                );
              })}

              {/* Anode: graphite layers */}
              <rect x={anX0} y={bandTop} width={anX1 - anX0} height={bandBot - bandTop} rx={18} fill="url(#s4-anode)" />
              {graphiteYs.map((y, r) => {
                const breathe = Math.sin(frame / 10 + r) * 1.2;
                return (
                  <g key={`g${r}`}>
                    <rect x={anX0 + 12} y={y - 4 + breathe * 0.3} width={anX1 - anX0 - 24} height={8} rx={4} fill="#334155" opacity={0.85} />
                    {Array.from({ length: 8 }, (_, c) => (
                      <circle key={c} cx={anX0 + 26 + c * 27} cy={y + breathe * 0.3} r={3} fill="#94a3b8" />
                    ))}
                  </g>
                );
              })}
              {storedSlots.map((p, i) => {
                if (i >= storedCount) return null;
                const age = sp(44 + i * 3, 11, 180);
                return (
                  <circle
                    key={`st${i}`}
                    cx={p[0]}
                    cy={p[1]}
                    r={9 * Math.min(1.1, 0.4 + age * 0.6)}
                    fill="url(#s4-ion)"
                    opacity={0.9}
                  />
                );
              })}

              {/* Ions in flight */}
              {ions.map((ion) =>
                ion ? (
                  <g key={`i${ion.key}`} opacity={ion.op} filter="url(#s4-glow)">
                    <circle cx={ion.x} cy={ion.y} r={13 * ion.scale} fill="url(#s4-ion)" stroke="#ffffff" strokeWidth={2} />
                    <text
                      x={ion.x}
                      y={ion.y + 6}
                      textAnchor="middle"
                      fontFamily={HEAD}
                      fontWeight={800}
                      fontSize={16}
                      fill="#ffffff"
                    >
                      +
                    </text>
                  </g>
                ) : null
              )}
            </g>
          </g>
        </g>
      </svg>

      {/* Charger badge with terminals OUTSIDE the text */}
      <div
        style={{
          position: "absolute",
          left: badgeL,
          top: wireY - 42 + floatY * 0.4,
          width: badgeR - badgeL,
          height: 84,
          borderRadius: 24,
          background: `linear-gradient(180deg, #1e293b 0%, ${TEXT} 100%)`,
          boxShadow: `0 18px 40px rgba(15,23,42,0.28), 0 0 ${18 + boltPulse * 22}px ${PRIMARY}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "0 70px",
          boxSizing: "border-box",
          opacity: badgeIn,
          transform: `scale(${0.6 + badgeIn * 0.4})`,
        }}
      >
        <svg width={30} height={40} viewBox="0 0 30 40">
          <path d="M18 0 L2 23 H13 L10 40 L28 15 H17 Z" fill="#fde68a" opacity={0.7 + boltPulse * 0.3} />
        </svg>
        <span
          style={{
            color: "#ffffff",
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: 5,
          }}
        >
          CHARGER
        </span>
      </div>
      {/* terminal markers sit outside the badge, on the wire */}
      {[
        { x: badgeL, sign: "+", lx: badgeL - 46 },
        { x: badgeR, sign: "−", lx: badgeR + 22 },
      ].map((t) => (
        <React.Fragment key={t.sign}>
          <div
            style={{
              position: "absolute",
              left: t.x - 11,
              top: wireY - 11 + floatY * 0.4,
              width: 22,
              height: 22,
              borderRadius: 11,
              background: "#ffffff",
              border: `4px solid ${PRIMARY}`,
              boxSizing: "border-box",
              opacity: badgeIn,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: t.lx,
              top: wireY - 64 + floatY * 0.4,
              width: 26,
              textAlign: "center",
              fontFamily: HEAD,
              fontWeight: 800,
              fontSize: 34,
              color: PRIMARY,
              opacity: badgeIn,
            }}
          >
            {t.sign}
          </div>
        </React.Fragment>
      ))}

      {/* Legend pills */}
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 1170,
          display: "flex",
          gap: 20,
          justifyContent: "center",
          opacity: legendIn,
          transform: `translateY(${(1 - legendIn) * 30}px)`,
        }}
      >
        {[
          { c: ACCENT, label: "Li⁺", desc: "through electrolyte" },
          { c: PRIMARY, label: "e⁻", desc: "around the wire" },
        ].map((p) => (
          <div
            key={p.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 24px",
              borderRadius: 999,
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
            }}
          >
            <span style={{ width: 18, height: 18, borderRadius: 9, background: p.c, boxShadow: `0 0 12px ${p.c}` }} />
            <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 26, color: TEXT }}>{p.label}</span>
            <span style={{ fontSize: 24, color: "#475569" }}>{p.desc}</span>
          </div>
        ))}
      </div>

      {/* State of charge card (ends at y ≈ 1392, clear of caption band) */}
      <div
        style={{
          position: "absolute",
          left: 120,
          width: 840,
          top: 1252,
          height: 140,
          borderRadius: 28,
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 20px 44px rgba(15,23,42,0.10)",
          padding: "20px 32px",
          boxSizing: "border-box",
          opacity: socIn,
          transform: `translateY(${(1 - socIn) * 40}px)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: "#64748b" }}>
            STATE OF CHARGE
          </span>
          <span
            style={{
              fontFamily: HEAD,
              fontWeight: 800,
              fontSize: 48,
              color: TEXT,
              fontVariantNumeric: "tabular-nums",
              transform: `scale(${1 + socDone * 0.06 * Math.max(0, Math.sin((frame - 110) / 3))})`,
              transformOrigin: "right center",
              paddingRight: 4,
            }}
          >
            {Math.round(soc)}
            <span style={{ fontSize: 30, color: PRIMARY }}>%</span>
          </span>
        </div>
        <div
          style={{
            marginTop: 12,
            height: 22,
            borderRadius: 11,
            background: "#e2e8f0",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${soc}%`,
              height: "100%",
              borderRadius: 11,
              background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`,
              boxShadow: `0 0 ${10 + socDone * 16}px ${ACCENT}88`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 120,
                left: `${mod(frame * 6, 900) - 120}px`,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}