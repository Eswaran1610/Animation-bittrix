import React from "react";
import { interpolate, spring, Easing } from "remotion";

export const soundEvents = [
  { "frame": 4, "role": "whoosh", "description": "headline slides up into place" },
  { "frame": 16, "role": "pop", "description": "first carbon atom pops into the hexagon ring" },
  { "frame": 50, "role": "impact", "description": "lithium ion drops into the center of the carbon ring" },
  { "frame": 60, "role": "count", "description": "ratio badge locks to 1 : 6" },
  { "frame": 76, "role": "ding", "description": "LiC6 chip snaps in" }
];

export default function Scene(props: { frame: number; fps: number; durationInFrames: number; theme: any }) {
  const { frame, fps, durationInFrames } = props;
  const theme = props.theme || {};
  const BG = theme.background || theme.backgroundColor || "#f8fafc";
  const PRIMARY = theme.primary || theme.primaryColor || "#6366f1";
  const ACCENT = theme.accent || theme.accentColor || "#06b6d4";
  const TEXT = theme.text || theme.textColor || "#0f172a";
  const HEAD = (theme.headingFont || "Arial") + ", Helvetica, sans-serif";
  const BODY = (theme.bodyFont || "Arial") + ", Helvetica, sans-serif";

  const sp = (delay: number, damping = 13, stiffness = 150) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness } });
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
  const t = frame / fps;

  // ---------- Headline ----------
  const kickerIn = sp(0, 14, 170);
  const headIn = sp(4, 13, 140);
  const subIn = sp(10, 15, 140);

  // ---------- Hexagon geometry ----------
  const SVG_W = 900;
  const SVG_H = 680;
  const CX = SVG_W / 2;
  const CY = SVG_H / 2;
  const R = 210;
  const C_R = 46;
  const carbonDelay = (i: number) => 14 + i * 5;
  const carbons = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a), i };
  });

  // continuous gentle rotation + breathing of the ring
  const ringRot = interpolate(frame, [0, durationInFrames], [-6, 6], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const breathe = 1 + 0.012 * Math.sin(t * 2.4);

  // Lithium drop
  const LI_DELAY = 46;
  const liSpring = sp(LI_DELAY, 11, 160);
  const liY = interpolate(liSpring, [0, 1], [-300, 0]);
  const liScale = interpolate(liSpring, [0, 1], [0.6, 1]);
  const liOpacity = interpolate(frame, [LI_DELAY, LI_DELAY + 5], [0, 1], clamp);
  const landed = frame >= LI_DELAY + 4;
  const squash = interpolate(frame, [LI_DELAY + 4, LI_DELAY + 8, LI_DELAY + 14], [1, 0.9, 1], clamp);

  // Coordination lines Li -> C
  const coord = interpolate(frame, [LI_DELAY + 8, LI_DELAY + 22], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // Pulse rings (continuous after landing)
  const pulsePhase = (offset: number) => {
    if (!landed) return 0;
    const local = (frame - LI_DELAY - 4 + offset) % 36;
    return local / 36;
  };

  // ---------- Ratio counter ----------
  const cCount = carbons.filter((c) => frame >= carbonDelay(c.i) + 2).length;
  const liCount = landed ? 1 : 0;
  const lockPop = sp(LI_DELAY + 12, 11, 170);
  const badgeIn = sp(8, 14, 140);
  const chipIn = sp(74, 11, 170);
  const capIn = sp(84, 14, 150);

  // card float (parallax)
  const cardIn = sp(6, 15, 130);
  const cardFloat = Math.sin(t * 1.6) * 6;
  const bgDrift = frame * 0.35;

  const bondPath = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  const bondLen = R; // hexagon edge length equals radius

  // faint ghost hexagons in background (decorative, very low contrast)
  const ghostHex = (cx: number, cy: number, r: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = ((-90 + i * 60) * Math.PI) / 180;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");
    return pts;
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(1200px 900px at 50% 42%, #ffffff 0%, ${BG} 60%, #eef2f7 100%)`,
        fontFamily: BODY,
        color: TEXT,
      }}
    >
      {/* Background ghost lattice (parallax, very faint, stays in upper band) */}
      <svg
        width={1080}
        height={1340}
        style={{ position: "absolute", left: 0, top: 100, opacity: 0.5 }}
      >
        {[
          [120, 300, 70],
          [960, 420, 90],
          [90, 1050, 80],
          [990, 1160, 60],
          [880, 180, 50],
        ].map(([x, y, r], k) => (
          <polygon
            key={k}
            points={ghostHex(x, y + Math.sin((frame + k * 20) / 30) * 10 - bgDrift * (k % 2 ? 0.4 : -0.3), r)}
            fill="none"
            stroke={PRIMARY}
            strokeOpacity={0.12}
            strokeWidth={3}
          />
        ))}
      </svg>

      {/* ---------- Headline block (y ~130-390) ---------- */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 130 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            borderRadius: 999,
            background: "rgba(99,102,241,0.10)",
            border: `2px solid rgba(99,102,241,0.25)`,
            color: PRIMARY,
            fontFamily: HEAD,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: kickerIn,
            transform: `translateY(${(1 - kickerIn) * 24}px)`,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: ACCENT,
              boxShadow: `0 0 ${10 + 6 * Math.sin(t * 5)}px ${ACCENT}`,
            }}
          />
          Fully charged anode
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 80,
            lineHeight: 1.04,
            letterSpacing: -2,
            opacity: headIn,
            transform: `translateY(${(1 - headIn) * 50}px)`,
          }}
        >
          One lithium per{" "}
          <span
            style={{
              background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            six carbons
          </span>
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 32,
            lineHeight: 1.35,
            color: "#475569",
            maxWidth: 860,
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 30}px)`,
          }}
        >
          A fully charged graphite anode approaches LiC₆: one Li for every six C atoms.
        </div>
      </div>

      {/* ---------- Focal hexagon card (y ~450-1130) ---------- */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 450 + (1 - cardIn) * 60 + cardFloat,
          width: SVG_W,
          height: SVG_H,
          borderRadius: 40,
          background: "linear-gradient(160deg, #ffffff 0%, #f1f5f9 100%)",
          boxShadow:
            "0 40px 80px -30px rgba(15,23,42,0.30), 0 12px 24px -12px rgba(99,102,241,0.25), inset 0 1px 0 #ffffff",
          border: "1px solid rgba(15,23,42,0.06)",
          opacity: cardIn,
          overflow: "hidden",
        }}
      >
        {/* card label */}
        <div
          style={{
            position: "absolute",
            left: 36,
            top: 30,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            color: "#64748b",
            textTransform: "uppercase",
          }}
        >
          One graphite ring · top view
        </div>

        <svg width={SVG_W} height={SVG_H} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <radialGradient id="liGrad" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="55%" stopColor={ACCENT} />
              <stop offset="100%" stopColor="#0e7490" />
            </radialGradient>
            <radialGradient id="cGrad" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor={TEXT} />
            </radialGradient>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </radialGradient>
            <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.28" />
            </filter>
          </defs>

          <g
            transform={`translate(${CX} ${CY + 20}) rotate(${ringRot}) scale(${breathe}) translate(${-CX} ${-CY})`}
          >
            {/* hexagon fill hint */}
            <polygon
              points={carbons.map((c) => `${c.x},${c.y}`).join(" ")}
              fill={PRIMARY}
              fillOpacity={interpolate(frame, [40, 60], [0, 0.06], clamp)}
            />

            {/* bonds */}
            {carbons.map((c, i) => {
              const n = carbons[(i + 1) % 6];
              const d0 = carbonDelay(i) + 4;
              const prog = interpolate(frame, [d0, d0 + 9], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.cubic),
              });
              return (
                <path
                  key={`b${i}`}
                  d={bondPath(c, n)}
                  stroke={TEXT}
                  strokeOpacity={0.7}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={bondLen}
                  strokeDashoffset={bondLen * (1 - prog)}
                  fill="none"
                />
              );
            })}

            {/* coordination lines Li -> C */}
            {carbons.map((c, i) => {
              const dx = c.x - CX;
              const dy = c.y - CY;
              const shimmer = 0.45 + 0.25 * Math.sin(t * 6 + i);
              return (
                <line
                  key={`k${i}`}
                  x1={CX}
                  y1={CY}
                  x2={CX + dx * coord * 0.78}
                  y2={CY + dy * coord * 0.78}
                  stroke={ACCENT}
                  strokeWidth={4}
                  strokeDasharray="10 10"
                  strokeDashoffset={-frame * 1.5}
                  strokeOpacity={coord * shimmer}
                  strokeLinecap="round"
                />
              );
            })}

            {/* carbon atoms */}
            {carbons.map((c) => {
              const s = sp(carbonDelay(c.i), 11, 170);
              const bob = Math.sin(t * 3 + c.i) * 2;
              return (
                <g
                  key={`c${c.i}`}
                  transform={`translate(${c.x} ${c.y + bob}) rotate(${-ringRot}) scale(${s})`}
                  opacity={Math.min(1, s * 1.5)}
                >
                  <circle r={C_R} fill="url(#cGrad)" filter="url(#soft)" />
                  <circle r={C_R - 3} fill="none" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={2} />
                  <text
                    y={12}
                    textAnchor="middle"
                    fontFamily={HEAD}
                    fontWeight={800}
                    fontSize={34}
                    fill="#ffffff"
                  >
                    C
                  </text>
                </g>
              );
            })}

            {/* lithium */}
            <g transform={`translate(${CX} ${CY}) rotate(${-ringRot})`}>
              {/* static glow */}
              <circle r={150} fill="url(#glow)" opacity={liOpacity * (0.8 + 0.2 * Math.sin(t * 4))} />
              {/* pulse rings */}
              {[0, 18].map((o) => {
                const p = pulsePhase(o);
                return (
                  <circle
                    key={o}
                    r={70 + p * 90}
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth={3}
                    strokeOpacity={landed ? (1 - p) * 0.5 : 0}
                  />
                );
              })}
              <g
                transform={`translate(0 ${liY}) scale(${liScale * (2 - squash)} ${liScale * squash})`}
                opacity={liOpacity}
              >
                <circle r={68} fill="url(#liGrad)" filter="url(#soft)" />
                <ellipse cx={-20} cy={-26} rx={22} ry={12} fill="#ffffff" fillOpacity={0.45} />
                <text
                  y={14}
                  textAnchor="middle"
                  fontFamily={HEAD}
                  fontWeight={800}
                  fontSize={44}
                  fill="#ffffff"
                >
                  Li
                </text>
                <text
                  x={40}
                  y={-30}
                  textAnchor="middle"
                  fontFamily={HEAD}
                  fontWeight={800}
                  fontSize={26}
                  fill="#ffffff"
                >
                  +
                </text>
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* ---------- Ratio badge row (y ~1180-1420) ---------- */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1180,
          width: 900,
          height: 230,
          display: "flex",
          gap: 24,
          opacity: badgeIn,
          transform: `translateY(${(1 - badgeIn) * 40}px)`,
        }}
      >
        {/* counter */}
        <div
          style={{
            flex: 1.35,
            borderRadius: 32,
            background: TEXT,
            color: "#ffffff",
            padding: "26px 36px",
            boxShadow: "0 30px 60px -25px rgba(15,23,42,0.55)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(400px 200px at ${20 + 60 * ((Math.sin(t * 1.2) + 1) / 2)}% 0%, rgba(99,102,241,0.35), transparent 70%)`,
            }}
          />
          <div
            style={{
              position: "relative",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
              color: "#94a3b8",
              textTransform: "uppercase",
            }}
          >
            Li : C ratio
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-end",
              gap: 26,
              marginTop: 10,
              fontFamily: HEAD,
              fontWeight: 800,
              transform: `scale(${1 + 0.06 * Math.max(0, lockPop - 1) + (landed ? 0 : 0)})`,
              transformOrigin: "left center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 104,
                  lineHeight: 1,
                  color: liCount ? ACCENT : "#475569",
                  transform: `scale(${landed ? interpolate(lockPop, [0, 1], [1.3, 1]) : 1})`,
                }}
              >
                {liCount}
              </div>
              <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 6, letterSpacing: 2 }}>LITHIUM</div>
            </div>
            <div style={{ fontSize: 84, lineHeight: 1.1, color: "#64748b", paddingBottom: 36 }}>:</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 104, lineHeight: 1, color: "#ffffff" }}>{cCount}</div>
              <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 6, letterSpacing: 2 }}>CARBON</div>
            </div>
          </div>
        </div>

        {/* LiC6 chip + capacity */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              flex: 1.2,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${PRIMARY}, #4f46e5)`,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: HEAD,
              fontWeight: 800,
              fontSize: 64,
              boxShadow: `0 24px 40px -18px ${PRIMARY}`,
              opacity: Math.min(1, chipIn * 1.4),
              transform: `scale(${interpolate(chipIn, [0, 1], [0.6, 1])}) rotate(${(1 - chipIn) * -6}deg)`,
            }}
          >
            LiC<span style={{ fontSize: 38, marginTop: 30 }}>6</span>
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 24,
              background: "#ffffff",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 16px 30px -18px rgba(15,23,42,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              opacity: capIn,
              transform: `translateX(${(1 - capIn) * 40}px)`,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 700, color: "#64748b", letterSpacing: 2 }}>MAX</span>
            <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 32, color: TEXT }}>
              {Math.round(interpolate(capIn, [0, 1], [0, 372]))}
              <span style={{ fontSize: 20, color: "#64748b", fontWeight: 700 }}> mAh/g</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}