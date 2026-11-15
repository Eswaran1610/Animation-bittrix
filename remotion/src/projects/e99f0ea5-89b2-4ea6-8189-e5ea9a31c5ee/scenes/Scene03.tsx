import React from "react";
import { interpolate, spring, Easing } from "remotion";

export const soundEvents = [
  {"frame": 4, "role": "whoosh", "description": "headline sweeps in"},
  {"frame": 16, "role": "slide", "description": "cathode crystal card slides up and settles"},
  {"frame": 30, "role": "pop", "description": "first lithium ions pop into the oxide layers"},
  {"frame": 66, "role": "sparkle", "description": "Li+ callout ring locks onto an ion"},
  {"frame": 84, "role": "count", "description": "cathode lithium meter counts up to 100%"}
];

export default function Scene(props: { frame: number; fps: number; durationInFrames: number; theme: any }) {
  const { frame, fps, theme } = props;
  const BG = theme?.background ?? theme?.colors?.background ?? "#f8fafc";
  const PRIMARY = theme?.primary ?? theme?.colors?.primary ?? "#6366f1";
  const ACCENT = theme?.accent ?? theme?.colors?.accent ?? "#06b6d4";
  const TEXT = theme?.text ?? theme?.colors?.text ?? "#0f172a";
  const HEAD = theme?.headingFont ?? theme?.fonts?.heading ?? "Arial, Helvetica, sans-serif";
  const BODY = theme?.bodyFont ?? theme?.fonts?.body ?? "Arial, Helvetica, sans-serif";

  const sp = (delay: number, damping = 13, stiffness = 150) =>
    spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 1 } });
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

  // ---- Entrances ----
  const tagIn = sp(0, 14, 170);
  const headIn = sp(4, 12, 140);
  const subIn = sp(10, 15, 130);
  const cardIn = sp(16, 13, 120);
  const legendIn = sp(48, 14, 160);
  const statusIn = sp(78, 14, 160);
  const calloutIn = sp(66, 11, 170);

  // anticipation: card dips slightly before rising
  const cardAnticip = interpolate(frame, [12, 16], [0, 12], clamp) * (1 - Math.min(1, cardIn * 1.4));
  const cardY = interpolate(cardIn, [0, 1], [160, 0]) + cardAnticip;
  const cardTilt = interpolate(cardIn, [0, 1], [18, 0]);

  // ---- Continuous ambient motion ----
  const t = frame / fps;
  const driftX = Math.sin(t * 1.3) * 6;
  const driftY = Math.cos(t * 1.1) * 4;
  const crystalRot = Math.sin(t * 0.9) * 0.8;
  const shimmerX = interpolate(frame, [20, 116], [-300, 1100], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const glowPulse = 0.55 + 0.45 * Math.sin(t * 4.2);

  // ---- Crystal geometry (SVG 900 x 640) ----
  const W = 900;
  const H = 640;
  const slabYs = [95, 245, 395, 545];
  const ionRowYs = [170, 320, 470];
  const diamondCols = 10;
  const ionCols = 9;

  // Li meter
  const meter = interpolate(frame, [84, 108], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });

  // callout target ion (row 1, col 5)
  const targetX = 90 + 5 * 90;
  const targetY = ionRowYs[1];

  const words = ["Lithium", "starts", "in", "the", "cathode"];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(ellipse 120% 70% at 50% 40%, #ffffff 0%, ${BG} 55%, #eef2f7 100%)`,
        fontFamily: BODY,
        color: TEXT,
      }}
    >
      {/* soft background blobs for depth */}
      <div
        style={{
          position: "absolute",
          left: 540 - 420 + driftX * 3,
          top: 780 - 420 + driftY * 3,
          width: 840,
          height: 840,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${PRIMARY}22 0%, ${PRIMARY}00 65%)`,
          filter: "blur(20px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 760 - driftX * 2,
          top: 1020 + driftY * 2,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}26 0%, ${ACCENT}00 65%)`,
          filter: "blur(24px)",
        }}
      />

      {/* ---- Tag ---- */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 150,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: tagIn,
          transform: `translateX(${interpolate(tagIn, [0, 1], [-40, 0])}px)`,
        }}
      >
        <div
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            background: PRIMARY,
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            boxShadow: `0 6px 18px ${PRIMARY}55`,
          }}
        >
          01
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 5, color: `${TEXT}99` }}>
          CATHODE · DISCHARGED STATE
        </div>
      </div>

      {/* ---- Headline ---- */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 215,
          width: 900,
          fontFamily: HEAD,
          fontSize: 82,
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: -2,
          display: "flex",
          flexWrap: "wrap",
          columnGap: 22,
        }}
      >
        {words.map((w, i) => {
          const s = sp(4 + i * 3, 12, 150);
          const isKey = w === "cathode";
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: Math.min(1, s * 1.3),
                transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px)`,
                color: isKey ? PRIMARY : TEXT,
                position: "relative",
              }}
            >
              {w}
              {isKey && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 2,
                    height: 10,
                    borderRadius: 6,
                    width: `${interpolate(frame, [22, 44], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) })}%`,
                    background: `linear-gradient(90deg, ${ACCENT}, ${PRIMARY})`,
                    opacity: 0.35,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>

      {/* ---- Subtitle ---- */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 410,
          width: 860,
          fontSize: 33,
          lineHeight: 1.35,
          color: `${TEXT}b3`,
          opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0, 1], [24, 0])}px)`,
        }}
      >
        Discharged, the lithium ions sit inside the cathode's{" "}
        <span style={{ color: TEXT, fontWeight: 700 }}>metal-oxide crystal</span>.
      </div>

      {/* ---- Crystal card ---- */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 530,
          width: W,
          height: H,
          perspective: 1400,
          opacity: Math.min(1, cardIn * 1.5),
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 36,
            position: "relative",
            overflow: "hidden",
            transform: `translateY(${cardY}px) rotateX(${cardTilt}deg)`,
            transformOrigin: "50% 100%",
            background: "linear-gradient(160deg, #ffffff 0%, #f1f5ff 100%)",
            border: `1.5px solid ${PRIMARY}22`,
            boxShadow: `0 2px 4px ${TEXT}0d, 0 24px 60px ${PRIMARY}2e, 0 60px 120px ${TEXT}14`,
          }}
        >
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <linearGradient id="oct" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" />
                <stop offset="55%" stopColor={PRIMARY} />
                <stop offset="100%" stopColor="#4338ca" />
              </linearGradient>
              <radialGradient id="ion" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#cffafe" />
                <stop offset="45%" stopColor={ACCENT} />
                <stop offset="100%" stopColor="#0e7490" />
              </radialGradient>
              <radialGradient id="ionGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={ACCENT} stopOpacity="0.55" />
                <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </radialGradient>
              <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M30 0H0V30" fill="none" stroke={PRIMARY} strokeOpacity="0.06" strokeWidth="1" />
              </pattern>
            </defs>

            <rect width={W} height={H} fill="url(#grid)" />

            <g transform={`translate(${driftX} ${driftY}) rotate(${crystalRot} ${W / 2} ${H / 2})`}>
              {/* Metal-oxide slabs (CoO2 octahedra, edge-on) */}
              {slabYs.map((sy, r) => {
                const slabS = sp(18 + r * 4, 14, 160);
                return (
                  <g
                    key={`slab-${r}`}
                    opacity={Math.min(1, slabS * 1.4)}
                    transform={`translate(${interpolate(slabS, [0, 1], [r % 2 ? 120 : -120, 0])} 0)`}
                  >
                    <rect x={20} y={sy - 4} width={W - 40} height={8} rx={4} fill={PRIMARY} opacity={0.12} />
                    {Array.from({ length: diamondCols }).map((_, c) => {
                      const cx = 45 + c * 90 + (r % 2 ? 0 : 0);
                      const bob = Math.sin(t * 2.2 + c * 0.6 + r) * 1.5;
                      return (
                        <g key={c} transform={`translate(${cx} ${sy + bob})`}>
                          <path d="M0 -34 L40 0 L0 34 L-40 0 Z" fill="url(#oct)" opacity={0.92} />
                          <path d="M0 -34 L40 0 L0 0 Z" fill="#ffffff" opacity={0.18} />
                          <circle r={9} fill="#312e81" />
                          <circle cx={-2.5} cy={-2.5} r={3} fill="#c7d2fe" />
                          {[[-40, 0], [40, 0], [0, -34], [0, 34]].map(([ox, oy], k) => (
                            <circle key={k} cx={ox} cy={oy} r={5} fill="#e0e7ff" stroke={PRIMARY} strokeWidth={1.5} />
                          ))}
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Lithium ions between layers */}
              {ionRowYs.map((iy, r) =>
                Array.from({ length: ionCols }).map((_, c) => {
                  const delay = 30 + r * 5 + Math.abs(c - 4) * 2;
                  const s = sp(delay, 11, 175);
                  const jx = Math.sin(t * 5 + c * 1.7 + r) * 2.5;
                  const jy = Math.cos(t * 4.4 + c * 1.3 + r * 2) * 2.5;
                  const x = 90 + c * 90 + jx;
                  const y = iy + jy;
                  const isTarget = r === 1 && c === 5;
                  return (
                    <g key={`ion-${r}-${c}`} transform={`translate(${x} ${y}) scale(${Math.max(0, s)})`}>
                      <circle r={30} fill="url(#ionGlow)" opacity={isTarget ? 0.6 + 0.4 * glowPulse : 0.5} />
                      <circle r={17} fill="url(#ion)" stroke="#ffffff" strokeWidth={2.5} />
                      <text
                        x={0}
                        y={6}
                        textAnchor="middle"
                        fontSize={17}
                        fontWeight={800}
                        fill="#ffffff"
                        fontFamily={BODY}
                      >
                        +
                      </text>
                    </g>
                  );
                })
              )}

              {/* Callout ring on one ion */}
              <g opacity={Math.min(1, calloutIn * 1.3)}>
                <circle
                  cx={targetX}
                  cy={targetY}
                  r={interpolate(calloutIn, [0, 1], [70, 32]) + glowPulse * 3}
                  fill="none"
                  stroke={TEXT}
                  strokeWidth={3}
                  strokeDasharray="6 6"
                  strokeDashoffset={-frame * 1.2}
                />
              </g>
            </g>

            {/* shimmer sweep */}
            <rect
              x={shimmerX}
              y={-100}
              width={180}
              height={H + 200}
              fill="url(#shine)"
              transform={`skewX(-18)`}
              opacity={0.7}
            />
          </svg>

          {/* Callout label (HTML for crisp type) */}
          <div
            style={{
              position: "absolute",
              left: targetX + 52,
              top: targetY - 128,
              opacity: Math.min(1, calloutIn * 1.3),
              transform: `translate(${driftX}px, ${driftY + interpolate(calloutIn, [0, 1], [20, 0])}px) scale(${interpolate(calloutIn, [0, 1], [0.85, 1])})`,
              transformOrigin: "0% 100%",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                borderRadius: 16,
                background: TEXT,
                color: "#fff",
                boxShadow: `0 12px 30px ${TEXT}40`,
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                Li<sup style={{ fontSize: 16 }}>+</sup> parked here
              </div>
              <div style={{ fontSize: 18, color: "#cbd5e1", marginTop: 2 }}>between CoO₂ layers</div>
            </div>
          </div>

          {/* corner label */}
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 22,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 4,
              color: `${TEXT}80`,
            }}
          >
            LiCoO₂ · LAYERED CRYSTAL
          </div>
        </div>
      </div>

      {/* ---- Legend ---- */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1210,
          width: 900,
          display: "flex",
          gap: 20,
          opacity: legendIn,
          transform: `translateY(${interpolate(legendIn, [0, 1], [30, 0])}px)`,
        }}
      >
        {[
          { label: "Metal oxide", sub: "CoO₂ framework", color: PRIMARY, shape: "diamond" },
          { label: "Lithium ion", sub: "Li⁺ · stored charge", color: ACCENT, shape: "circle" },
        ].map((l, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "16px 22px",
              borderRadius: 20,
              background: "#ffffff",
              border: `1.5px solid ${l.color}33`,
              boxShadow: `0 10px 28px ${TEXT}12`,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                background: `linear-gradient(140deg, ${l.color}aa, ${l.color})`,
                borderRadius: l.shape === "circle" ? "50%" : 4,
                transform: l.shape === "diamond" ? "rotate(45deg) scale(0.85)" : "none",
                boxShadow: `0 4px 10px ${l.color}66`,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: TEXT }}>{l.label}</div>
              <div style={{ fontSize: 20, color: `${TEXT}99` }}>{l.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ---- Status meter ---- */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 1338,
          width: 900,
          height: 76,
          borderRadius: 20,
          background: TEXT,
          display: "flex",
          alignItems: "center",
          padding: "0 26px",
          gap: 22,
          boxSizing: "border-box",
          opacity: statusIn,
          transform: `translateY(${interpolate(statusIn, [0, 1], [30, 0])}px)`,
          boxShadow: `0 16px 36px ${TEXT}33`,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, color: "#94a3b8", whiteSpace: "nowrap" }}>
          Li⁺ IN CATHODE
        </div>
        <div style={{ flex: 1, height: 14, borderRadius: 7, background: "#1e293b", overflow: "hidden" }}>
          <div
            style={{
              width: `${meter}%`,
              height: "100%",
              borderRadius: 7,
              background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`,
              boxShadow: `0 0 ${10 + glowPulse * 8}px ${ACCENT}`,
            }}
          />
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: "#ffffff",
            width: 110,
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(meter)}%
        </div>
      </div>
    </div>
  );
}