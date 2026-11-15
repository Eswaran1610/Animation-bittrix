import React from "react";
import { interpolate, spring, Easing } from "remotion";

export const soundEvents = [
  { "frame": 3, "role": "whoosh", "description": "headline words sweep in" },
  { "frame": 16, "role": "pop", "description": "battery cell lands with overshoot" },
  { "frame": 26, "role": "draw", "description": "charging cable draws from plug to cell" },
  { "frame": 44, "role": "sparkle", "description": "question mark ignites inside the cell" },
  { "frame": 60, "role": "count", "description": "energy-in counter starts ticking up" }
];

export default function Scene(props: {
  frame: number;
  fps: number;
  durationInFrames: number;
  theme: any;
}) {
  const { frame, fps } = props;
  const t = props.theme || {};
  const BG = t.background || t.backgroundColor || "#f8fafc";
  const PRIMARY = t.primary || t.primaryColor || "#6366f1";
  const ACCENT = t.accent || t.accentColor || "#06b6d4";
  const TEXT = t.text || t.textColor || "#0f172a";
  const HEAD = "Arial, Helvetica, sans-serif";
  const BODY = "Arial, Helvetica, sans-serif";

  const sp = (delay: number, damping = 13, stiffness = 150) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 1 } });
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

  // ---------- Headline ----------
  const eyebrowIn = sp(0, 16, 160);
  const words1 = ["Where", "does", "the"];
  const words2 = ["energy", "go?"];
  const subIn = sp(14, 15, 130);

  // ---------- Battery ----------
  const cellIn = sp(10, 11, 140);
  const cellY = interpolate(cellIn, [0, 1], [160, 0]);
  const cellScale = interpolate(cellIn, [0, 1], [0.82, 1]);
  const float = Math.sin(frame / 13) * 6;
  const cellX = 540;
  const cellTop = 820;
  const cellH = 500;
  const cellW = 290;
  const cellLeft = cellX - cellW / 2;
  const cellBottom = cellTop + cellH;

  // Fill level rises continuously the whole scene
  const level = interpolate(frame, [18, 105], [0.1, 0.66], {
    ...clamp,
    easing: Easing.bezier(0.33, 0, 0.25, 1),
  });
  const innerPad = 18;
  const innerTop = cellTop + innerPad;
  const innerBottom = cellBottom - innerPad;
  const innerH = innerBottom - innerTop;
  const surfaceY = innerBottom - innerH * level;
  const waveAmp = 9;
  const wavePts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const x = cellLeft + innerPad + ((cellW - innerPad * 2) * i) / 24;
    const y = surfaceY + Math.sin(i * 0.7 + frame * 0.22) * waveAmp * Math.min(1, level * 3);
    wavePts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const wavePath =
    wavePts.join(" ") +
    ` L ${cellLeft + cellW - innerPad} ${innerBottom} L ${cellLeft + innerPad} ${innerBottom} Z`;

  // ---------- Cable ----------
  const cableDraw = interpolate(frame, [22, 44], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const plugIn = sp(18, 12, 170);
  const cablePath = "M 210 690 C 210 780, 330 700, 420 700 C 520 700, 540 720, 540 782";
  const pulseOn = interpolate(frame, [40, 50], [0, 1], clamp);
  const pulseOffset = -frame * 0.028;

  // ---------- Question mark ----------
  const qIn = sp(42, 10, 160);
  const qPulse = 1 + Math.sin(frame / 7) * 0.04;
  const qGlow = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(frame / 6));

  // ---------- Particles inside cell ----------
  const particles = Array.from({ length: 14 }).map((_, i) => {
    const seed = (i * 97.13) % 1;
    const speed = 1.4 + ((i * 37) % 10) / 6;
    const cycle = innerH + 40;
    const prog = ((frame * speed + i * 53) % cycle) / cycle;
    const y = innerTop - 20 + prog * cycle;
    const x =
      cellLeft + innerPad + 20 + (((i * 61) % 100) / 100) * (cellW - innerPad * 2 - 40) +
      Math.sin(frame / 9 + i) * 8;
    const r = 4 + ((i * 13) % 5);
    const op = interpolate(prog, [0, 0.15, 0.8, 1], [0, 0.9, 0.7, 0], clamp) * pulseOn;
    return { x, y, r, op, seed };
  });

  // ---------- Data chips ----------
  const chipR = sp(54, 13, 150);
  const chipL = sp(64, 13, 150);
  const whValue = interpolate(frame, [58, 105], [0, 11.4], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const pct = Math.round(level * 100);

  // ---------- Background parallax ----------
  const gridShift = (frame * 0.6) % 60;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: BG,
        overflow: "hidden",
        fontFamily: BODY,
      }}
    >
      {/* ambient gradient glows */}
      <div
        style={{
          position: "absolute",
          left: -200 + Math.sin(frame / 30) * 30,
          top: 700,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${PRIMARY}22 0%, ${PRIMARY}00 65%)`,
          filter: "blur(20px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -260 + Math.cos(frame / 26) * 30,
          top: 380,
          width: 820,
          height: 820,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}1f 0%, ${ACCENT}00 65%)`,
          filter: "blur(20px)",
        }}
      />
      {/* faint drifting grid */}
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0, opacity: 0.5 }}
      >
        <defs>
          <pattern
            id="hookGrid"
            width={60}
            height={60}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(0 ${gridShift})`}
          >
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e2e8f0" strokeWidth={1.2} />
          </pattern>
          <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.35" stopColor="#fff" stopOpacity={1} />
            <stop offset="0.75" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="gridMask">
            <rect width={1080} height={1920} fill="url(#gridFade)" />
          </mask>
        </defs>
        <rect width={1080} height={1920} fill="url(#hookGrid)" mask="url(#gridMask)" />
      </svg>

      {/* ---------- Headline block (y 140 - 560) ---------- */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 150,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: eyebrowIn,
          transform: `translateX(${interpolate(eyebrowIn, [0, 1], [-40, 0])}px)`,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            background: ACCENT,
            boxShadow: `0 0 ${10 + 8 * Math.sin(frame / 5)}px ${ACCENT}`,
          }}
        />
        <div
          style={{
            fontFamily: HEAD,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 6,
            color: PRIMARY,
          }}
        >
          LITHIUM-ION · 01
        </div>
      </div>

      <div style={{ position: "absolute", left: 80, top: 205, right: 80 }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "nowrap" }}>
          {words1.map((w, i) => {
            const s = sp(2 + i * 3, 13, 170);
            return (
              <span
                key={w}
                style={{
                  display: "inline-block",
                  fontFamily: HEAD,
                  fontSize: 100,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: -3,
                  color: TEXT,
                  opacity: Math.min(1, s * 1.4),
                  transform: `translateY(${interpolate(s, [0, 1], [70, 0])}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 4 }}>
          {words2.map((w, i) => {
            const s = sp(10 + i * 3, 12, 170);
            const isKey = w === "energy";
            return (
              <span
                key={w}
                style={{
                  position: "relative",
                  display: "inline-block",
                  fontFamily: HEAD,
                  fontSize: 100,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: -3,
                  color: isKey ? PRIMARY : TEXT,
                  opacity: Math.min(1, s * 1.4),
                  transform: `translateY(${interpolate(s, [0, 1], [70, 0])}px)`,
                }}
              >
                {w}
                {isKey && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      bottom: 4,
                      height: 12,
                      borderRadius: 6,
                      width: `${interpolate(frame, [20, 40], [0, 100], clamp)}%`,
                      background: `linear-gradient(90deg, ${PRIMARY}55, ${ACCENT}88)`,
                      zIndex: -1,
                    }}
                  />
                )}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 30,
            maxWidth: 820,
            fontFamily: BODY,
            fontSize: 38,
            lineHeight: 1.35,
            fontWeight: 400,
            color: "#475569",
            opacity: subIn,
            transform: `translateY(${interpolate(subIn, [0, 1], [24, 0])}px)`,
          }}
        >
          Plugging in fills your battery, but{" "}
          <span style={{ color: TEXT, fontWeight: 700 }}>with what exactly?</span>
        </div>
      </div>

      {/* ---------- Illustration (y 600 - 1430) ---------- */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id="cellShell" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#cbd5e1" />
            <stop offset="0.22" stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="cellFill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={PRIMARY} />
            <stop offset="1" stopColor={ACCENT} />
          </linearGradient>
          <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#64748b" />
            <stop offset="0.4" stopColor="#e2e8f0" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
          <clipPath id="cellInner">
            <rect
              x={cellLeft + innerPad}
              y={innerTop}
              width={cellW - innerPad * 2}
              height={innerH}
              rx={30}
            />
          </clipPath>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="24" stdDeviation="26" floodColor="#0f172a" floodOpacity="0.18" />
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* floor shadow */}
        <ellipse
          cx={cellX}
          cy={cellBottom + 52}
          rx={190 * cellIn}
          ry={22}
          fill="#0f172a"
          opacity={0.1 * cellIn}
        />

        {/* Plug + cable */}
        <g
          opacity={plugIn}
          transform={`translate(0 ${interpolate(plugIn, [0, 1], [-60, 0]) + float * 0.4})`}
        >
          {/* cable base */}
          <path
            d={cablePath}
            fill="none"
            stroke="#334155"
            strokeWidth={14}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - cableDraw}
          />
          {/* energy pulses */}
          <path
            d={cablePath}
            fill="none"
            stroke={ACCENT}
            strokeWidth={8}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="0.05 0.09"
            strokeDashoffset={pulseOffset}
            opacity={pulseOn * cableDraw}
            filter="url(#glow)"
          />
          {/* plug body */}
          <g filter="url(#softShadow)">
            <rect x={150} y={600} width={120} height={96} rx={22} fill={TEXT} />
            <rect x={150} y={600} width={120} height={30} rx={15} fill="#1e293b" />
            <rect x={178} y={566} width={14} height={40} rx={4} fill="#94a3b8" />
            <rect x={228} y={566} width={14} height={40} rx={4} fill="#94a3b8" />
            <circle
              cx={210}
              cy={660}
              r={8}
              fill={ACCENT}
              opacity={0.5 + 0.5 * Math.sin(frame / 4)}
            />
          </g>
        </g>

        {/* Battery cell */}
        <g
          transform={`translate(${cellX} ${cellTop + cellH / 2 + cellY + float}) scale(${cellScale}) translate(${-cellX} ${-(cellTop + cellH / 2)})`}
          opacity={Math.min(1, cellIn * 1.5)}
        >
          {/* + cap */}
          <rect x={cellX - 52} y={cellTop - 40} width={104} height={50} rx={12} fill="url(#capGrad)" />
          {/* shell */}
          <g filter="url(#softShadow)">
            <rect x={cellLeft} y={cellTop} width={cellW} height={cellH} rx={44} fill="url(#cellShell)" />
          </g>
          {/* inner well */}
          <rect
            x={cellLeft + innerPad}
            y={innerTop}
            width={cellW - innerPad * 2}
            height={innerH}
            rx={30}
            fill="#0f172a"
            opacity={0.92}
          />
          <g clipPath="url(#cellInner)">
            {/* energy fill */}
            <path d={wavePath} fill="url(#cellFill)" opacity={0.9} />
            <path
              d={wavePts.join(" ")}
              fill="none"
              stroke="#ffffff"
              strokeOpacity={0.55}
              strokeWidth={3}
            />
            {/* incoming energy particles */}
            {particles.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={ACCENT} opacity={p.op} filter="url(#glow)" />
            ))}
            {/* scan stripes */}
            {Array.from({ length: 6 }).map((_, i) => (
              <rect
                key={i}
                x={cellLeft + innerPad}
                y={innerTop + ((i * 90 + frame * 2.4) % innerH)}
                width={cellW - innerPad * 2}
                height={2}
                fill="#ffffff"
                opacity={0.06}
              />
            ))}
          </g>
          {/* glass highlight */}
          <rect
            x={cellLeft + 36}
            y={cellTop + 30}
            width={22}
            height={cellH - 60}
            rx={11}
            fill="#ffffff"
            opacity={0.22}
          />
          {/* plus sign */}
          <text
            x={cellX}
            y={cellTop - 8}
            textAnchor="middle"
            fontFamily={HEAD}
            fontWeight={800}
            fontSize={34}
            fill={TEXT}
          >
            +
          </text>
          {/* question mark */}
          <g
            transform={`translate(${cellX} ${cellTop + cellH * 0.44}) scale(${qIn * qPulse}) rotate(${interpolate(qIn, [0, 1], [-25, 0])})`}
          >
            <circle r={92} fill="#ffffff" opacity={qGlow * 0.25} filter="url(#glow)" />
            <text
              y={58}
              textAnchor="middle"
              fontFamily={HEAD}
              fontWeight={800}
              fontSize={180}
              fill="#ffffff"
            >
              ?
            </text>
          </g>
        </g>
      </svg>

      {/* Right chip: energy in */}
      <div
        style={{
          position: "absolute",
          left: 742,
          top: 900 + float * 0.6,
          width: 270,
          padding: "22px 26px",
          borderRadius: 26,
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 18px 40px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.06)",
          border: "1px solid #e2e8f0",
          opacity: chipR,
          transform: `translateX(${interpolate(chipR, [0, 1], [80, 0])}px) scale(${interpolate(chipR, [0, 1], [0.9, 1])})`,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: "#64748b" }}>
          ENERGY IN
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
          <span style={{ fontFamily: HEAD, fontSize: 64, fontWeight: 800, color: TEXT, letterSpacing: -2 }}>
            {whValue.toFixed(1)}
          </span>
          <span style={{ fontSize: 30, fontWeight: 700, color: ACCENT }}>Wh</span>
        </div>
        <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: "#e2e8f0", overflow: "hidden" }}>
          <div
            style={{
              width: `${(whValue / 11.4) * 100}%`,
              height: "100%",
              borderRadius: 4,
              background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`,
            }}
          />
        </div>
      </div>

      {/* Left chip: stored as ? */}
      <div
        style={{
          position: "absolute",
          left: 66,
          top: 1090 - float * 0.5,
          width: 260,
          padding: "22px 26px",
          borderRadius: 26,
          background: TEXT,
          boxShadow: "0 18px 40px rgba(15,23,42,0.25)",
          opacity: chipL,
          transform: `translateX(${interpolate(chipL, [0, 1], [-80, 0])}px) scale(${interpolate(chipL, [0, 1], [0.9, 1])})`,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: "#94a3b8" }}>
          STORED AS
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span style={{ fontFamily: HEAD, fontSize: 56, fontWeight: 800, color: "#ffffff" }}>
            ???
          </span>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: ACCENT,
              opacity: 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame / 4)),
            }}
          />
        </div>
      </div>

      {/* Charge readout under the cell (ends by y ~1430) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1366,
          display: "flex",
          justifyContent: "center",
          opacity: cellIn,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 28px",
            borderRadius: 999,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: "#64748b" }}>
            CHARGING
          </span>
          <span style={{ fontFamily: HEAD, fontSize: 36, fontWeight: 800, color: PRIMARY, minWidth: 80, textAlign: "right" }}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}