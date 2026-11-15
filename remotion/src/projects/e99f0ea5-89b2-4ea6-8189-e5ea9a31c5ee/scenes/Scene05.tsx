import React from "react";
import { interpolate, spring, Easing } from "remotion";

export const soundEvents = [
  {"frame": 4, "role": "whoosh", "description": "headline sweeps in"},
  {"frame": 16, "role": "slide", "description": "first lithium ion slides between graphite sheets"},
  {"frame": 34, "role": "pop", "description": "intercalation tag card lands"},
  {"frame": 44, "role": "count", "description": "interlayer spacing readout starts counting"},
  {"frame": 88, "role": "ding", "description": "spacing settles at 3.70 angstrom"}
];

export default function Scene(props: { frame: number; fps: number; durationInFrames: number; theme: any }) {
  const { frame, fps, theme } = props;
  const BG = theme?.background ?? theme?.colors?.background ?? "#f8fafc";
  const PRIMARY = theme?.primary ?? theme?.colors?.primary ?? "#6366f1";
  const ACCENT = theme?.accent ?? theme?.colors?.accent ?? "#06b6d4";
  const TEXT = theme?.text ?? theme?.colors?.text ?? "#0f172a";
  const FONT = "Arial, Helvetica, sans-serif";

  const sp = (delay: number, damping = 13, stiffness = 150) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness } });

  // ---------- Header ----------
  const eyebrowIn = sp(0, 14, 160);
  const headWords = ["Slotting", "between", "graphite", "layers"];
  const subIn = sp(12, 15, 130);

  // ---------- Graphite stack ----------
  const cardIn = sp(6, 14, 140);
  const floatY = Math.sin(frame / 18) * 4;
  const expand = spring({
    frame: frame - 24,
    fps,
    config: { damping: 15, stiffness: 120 },
    durationInFrames: 64,
  });
  const spacingVal = 3.35 + 0.35 * expand;
  const basePitch = 84;
  const pitch = basePitch * (1 + 0.1045 * expand);
  const svgW = 920;
  const svgH = 520;
  const cy = 262;
  const sheetCount = 5;
  const sheetY = (i: number) => cy + (i - (sheetCount - 1) / 2) * pitch;
  const sheetX0 = 120;
  const sheetX1 = 880;
  const step = 30;

  const sheets = Array.from({ length: sheetCount }, (_, i) => {
    const y0 = sheetY(i) + Math.sin(frame / 7 + i * 1.3) * 1.4;
    const pts: { x: number; y: number }[] = [];
    let k = 0;
    for (let x = sheetX0; x <= sheetX1; x += step) {
      const thermal = Math.sin(frame / 5 + x / 40 + i) * 0.9;
      pts.push({ x, y: y0 + (k % 2 === 0 ? -7 : 7) + thermal });
      k++;
    }
    const sheetIn = sp(8 + i * 3, 14, 150);
    return { pts, y0, sheetIn, i };
  });

  // Ions: 3 per gap, 4 gaps
  const gapTargets = [
    [250, 470, 690],
    [360, 580, 800],
    [250, 470, 690],
    [360, 580, 800],
  ];
  const ions: { x: number; y: number; o: number; s: number; key: string }[] = [];
  gapTargets.forEach((targets, g) => {
    targets.forEach((tx, k) => {
      const delay = 14 + k * 9 + g * 4;
      const p = sp(delay, 13, 130);
      const x = interpolate(p, [0, 1], [40, tx]);
      const gy = (sheetY(g) + sheetY(g + 1)) / 2;
      const bob = Math.sin(frame / 9 + g * 2 + k) * 2.4;
      const o = interpolate(frame - delay, [-2, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const s = interpolate(p, [0, 0.6, 1], [0.6, 1.08, 1], { extrapolateRight: "clamp" });
      ions.push({ x, y: gy + bob, o, s, key: `${g}-${k}` });
    });
  });

  // Shimmer sweep across card
  const shimmerX = interpolate(frame, [0, 112], [-300, 1200], { easing: Easing.inOut(Easing.cubic) });

  // Dimension bracket (right side, gap 1-2)
  const bTop = sheetY(1);
  const bBot = sheetY(2);
  const bracketIn = sp(30, 14, 150);

  // ---------- Bottom row ----------
  const tagIn = sp(32, 12, 160);
  const readIn = sp(40, 12, 160);
  const settle = sp(86, 11, 180);
  const pct = Math.round(((spacingVal - 3.35) / 3.35) * 100);
  const barW = interpolate(expand, [0, 1], [0.905, 1]);
  const pulse = 1 + 0.04 * Math.sin(frame / 6) * (1 - settle * 0.5);

  // Background parallax
  const gridShift = (frame * 0.4) % 60;

  const card: React.CSSProperties = {
    position: "absolute",
    background: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
    borderRadius: 32,
    boxShadow:
      "0 1px 2px rgba(15,23,42,0.06), 0 12px 28px rgba(15,23,42,0.08), 0 40px 80px rgba(99,102,241,0.10)",
    border: "1px solid rgba(15,23,42,0.06)",
    overflow: "hidden",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: BG,
        overflow: "hidden",
        fontFamily: FONT,
        color: TEXT,
      }}
    >
      {/* Parallax dot grid */}
      <div
        style={{
          position: "absolute",
          inset: -60,
          backgroundImage: "radial-gradient(rgba(99,102,241,0.13) 2px, transparent 2px)",
          backgroundSize: "60px 60px",
          transform: `translate(${-gridShift}px, ${-gridShift * 0.5}px)`,
          opacity: 0.7,
        }}
      />
      {/* Soft glow blobs */}
      <div
        style={{
          position: "absolute",
          left: 620 + Math.sin(frame / 30) * 30,
          top: 420,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -200 + Math.cos(frame / 34) * 30,
          top: 900,
          width: 640,
          height: 640,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${PRIMARY}1f 0%, transparent 70%)`,
          filter: "blur(30px)",
        }}
      />

      {/* Eyebrow */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 140,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: eyebrowIn,
          transform: `translateY(${(1 - eyebrowIn) * 20}px)`,
        }}
      >
        <div style={{ width: 44 * eyebrowIn, height: 4, borderRadius: 2, background: PRIMARY }} />
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 5, color: PRIMARY }}>
          05 · INSIDE THE ANODE
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 190,
          width: 920,
          fontSize: 82,
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: -2,
        }}
      >
        {headWords.map((w, i) => {
          const p = sp(2 + i * 4, 12, 170);
          const isKey = w === "graphite";
          return (
            <span
              key={w}
              style={{
                display: "inline-block",
                marginRight: 22,
                opacity: Math.min(1, p * 1.4),
                transform: `translateY(${(1 - p) * 50}px) rotate(${(1 - p) * 4}deg)`,
                color: isKey ? PRIMARY : TEXT,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 388,
          width: 860,
          fontSize: 31,
          lineHeight: 1.38,
          color: "#475569",
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 24}px)`,
        }}
      >
        Ions slide in between carbon sheets, called{" "}
        <span style={{ color: TEXT, fontWeight: 700 }}>intercalation</span>, without forming a new bulk compound.
      </div>

      {/* Graphite stack card */}
      <div
        style={{
          ...card,
          left: 80,
          top: 510,
          width: svgW,
          height: svgH,
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 60 + floatY}px) scale(${0.94 + 0.06 * cardIn})`,
        }}
      >
        {/* Electrolyte inlet band */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 96,
            height: "100%",
            background: `linear-gradient(90deg, ${ACCENT}30 0%, ${ACCENT}08 100%)`,
            borderRight: `2px dashed ${ACCENT}55`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 22,
            top: svgH / 2,
            transform: "translateY(-50%) rotate(-90deg)",
            transformOrigin: "left center",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#0e7490",
            whiteSpace: "nowrap",
            marginLeft: 6,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 20,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#0e7490",
            width: 72,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          FROM ELECTROLYTE
        </div>
        <div
          style={{
            position: "absolute",
            right: 26,
            top: 22,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            color: "#64748b",
          }}
        >
          GRAPHITE · SIDE VIEW
        </div>

        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <radialGradient id="ionG" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="55%" stopColor={ACCENT} />
              <stop offset="100%" stopColor="#0e7490" />
            </radialGradient>
            <linearGradient id="sheetFade" x1="0" x2="1">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.55" />
              <stop offset="15%" stopColor="#1e293b" stopOpacity="1" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="1" />
            </linearGradient>
            <filter id="ionGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Gap highlight bands */}
          {[0, 1, 2, 3].map((g) => {
            const y1 = sheetY(g);
            const y2 = sheetY(g + 1);
            return (
              <rect
                key={`gap${g}`}
                x={sheetX0}
                y={y1 + 9}
                width={(sheetX1 - sheetX0) * cardIn}
                height={Math.max(0, y2 - y1 - 18)}
                rx={8}
                fill={ACCENT}
                opacity={0.05 + 0.05 * expand}
              />
            );
          })}

          {/* Graphene sheets */}
          {sheets.map(({ pts, sheetIn, i }) => {
            const visibleCount = Math.ceil(pts.length * Math.min(1, sheetIn));
            const vis = pts.slice(0, Math.max(1, visibleCount));
            return (
              <g key={`s${i}`} opacity={Math.min(1, sheetIn * 1.3)}>
                <polyline
                  points={vis.map((p) => `${p.x},${p.y + 3}`).join(" ")}
                  fill="none"
                  stroke="rgba(15,23,42,0.12)"
                  strokeWidth={5}
                  strokeLinejoin="round"
                />
                <polyline
                  points={vis.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="url(#sheetFade)"
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
                {vis.map((p, j) => (
                  <circle key={j} cx={p.x} cy={p.y} r={5} fill="#334155" stroke="#0f172a" strokeWidth={1} />
                ))}
              </g>
            );
          })}

          {/* Lithium ions */}
          {ions.map((ion) => (
            <g key={ion.key} opacity={ion.o} transform={`translate(${ion.x},${ion.y}) scale(${ion.s})`}>
              <circle r={22} fill={ACCENT} opacity={0.35} filter="url(#ionGlow)" />
              <circle r={17} fill="url(#ionG)" stroke="#ffffff" strokeWidth={2.5} />
              <text
                x={0}
                y={6}
                textAnchor="middle"
                fontSize={15}
                fontWeight={800}
                fill="#ffffff"
                fontFamily={FONT}
              >
                Li⁺
              </text>
            </g>
          ))}

          {/* Dimension bracket */}
          <g opacity={bracketIn} transform={`translate(${(1 - bracketIn) * 20},0)`}>
            <line x1={892} y1={bTop} x2={892} y2={bBot} stroke={PRIMARY} strokeWidth={3} />
            <line x1={884} y1={bTop} x2={900} y2={bTop} stroke={PRIMARY} strokeWidth={3} />
            <line x1={884} y1={bBot} x2={900} y2={bBot} stroke={PRIMARY} strokeWidth={3} />
            <text
              x={872}
              y={(bTop + bBot) / 2 + 7}
              textAnchor="end"
              fontSize={22}
              fontWeight={800}
              fill={PRIMARY}
              fontFamily={FONT}
            >
              d
            </text>
          </g>
        </svg>

        {/* Shimmer */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: shimmerX,
            width: 180,
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
            transform: "skewX(-18deg)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Intercalation tag card */}
      <div
        style={{
          ...card,
          left: 80,
          top: 1072,
          width: 440,
          height: 300,
          padding: "34px 34px",
          boxSizing: "border-box",
          opacity: tagIn,
          transform: `translateY(${(1 - tagIn) * 70 + Math.sin(frame / 20 + 1) * 3}px) scale(${0.9 + 0.1 * tagIn})`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 999,
            background: `linear-gradient(135deg, ${PRIMARY}, #4f46e5)`,
            color: "#ffffff",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 3,
            boxShadow: `0 8px 20px ${PRIMARY}55`,
          }}
        >
          INTERCALATION
        </div>
        <div style={{ marginTop: 24, fontSize: 30, fontWeight: 700, lineHeight: 1.25, color: TEXT }}>
          Li⁺ slips into the gaps
        </div>
        <div style={{ marginTop: 10, fontSize: 23, lineHeight: 1.35, color: "#475569" }}>
          The carbon sheets stay intact — no new bulk compound forms.
        </div>
      </div>

      {/* Spacing readout card */}
      <div
        style={{
          ...card,
          left: 560,
          top: 1072,
          width: 440,
          height: 300,
          padding: "34px 34px",
          boxSizing: "border-box",
          opacity: readIn,
          transform: `translateY(${(1 - readIn) * 70 + Math.sin(frame / 20 + 2.2) * 3}px) scale(${0.9 + 0.1 * readIn})`,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: "#64748b" }}>INTERLAYER SPACING d</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 14 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -3,
              color: TEXT,
              transform: `scale(${pulse})`,
              transformOrigin: "left bottom",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {spacingVal.toFixed(2)}
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: PRIMARY }}>Å</div>
        </div>
        <div
          style={{
            marginTop: 14,
            height: 14,
            borderRadius: 7,
            background: "#e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${barW * 100 * readIn}%`,
              height: "100%",
              borderRadius: 7,
              background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`,
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 21, color: "#64748b" }}>
          <span>empty graphite</span>
          <span
            style={{
              fontWeight: 800,
              color: "#0e7490",
              transform: `scale(${1 + 0.15 * settle * Math.max(0, 1 - (frame - 86) / 20)})`,
              display: "inline-block",
            }}
          >
            +{pct}% swell
          </span>
        </div>
      </div>
    </div>
  );
}