import React from "react";
import { interpolate, spring, Easing } from "remotion";

export const soundEvents = [
  {"frame": 8, "role": "whoosh", "description": "cross-section card slides up into place"},
  {"frame": 28, "role": "count", "description": "charge rate and temperature counters start running"},
  {"frame": 46, "role": "draw", "description": "first lithium dendrites start growing off the anode surface"},
  {"frame": 62, "role": "impact", "description": "Lithium plating warning chip lands"},
  {"frame": 84, "role": "sparkle", "description": "shimmer sweeps across the plated metal film"}
];

export default function Scene(props: { frame: number; fps: number; durationInFrames: number; theme: any }) {
  const { frame, fps, theme } = props;
  const bg = theme?.background ?? theme?.colors?.background ?? "#f8fafc";
  const primary = theme?.primary ?? theme?.colors?.primary ?? "#6366f1";
  const accent = theme?.accent ?? theme?.colors?.accent ?? "#06b6d4";
  const ink = theme?.text ?? theme?.colors?.text ?? "#0f172a";
  const font = "Arial, Helvetica, sans-serif";

  const sp = (d: number, damping = 13, stiffness = 150) =>
    spring({ frame: frame - d, fps, config: { damping, stiffness } });
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

  // ---------- Entrances ----------
  const eyebrowIn = sp(0, 14, 170);
  const head1In = sp(3, 12, 150);
  const head2In = sp(8, 11, 140);
  const subIn = sp(12, 15, 150);
  const cardIn = sp(8, 14, 130);
  const statAIn = sp(24, 12, 160);
  const statBIn = sp(30, 12, 160);
  const chipIn = sp(62, 11, 170);

  const drift = Math.sin(frame / 18) * 4;
  const drift2 = Math.cos(frame / 22) * 3;

  // ---------- Physical model ----------
  const SURF = 600; // anode surface x (card coords)
  const plateP = spring({ frame: frame - 38, fps, config: { damping: 16, stiffness: 60 } });
  const thick = interpolate(plateP, [0, 1], [0, 22]) + interpolate(frame, [70, 109], [0, 6], clamp);
  const plateX = SURF - thick;

  const sheetsY = Array.from({ length: 8 }, (_, k) => 120 + k * 52);

  const dendrites = [148, 206, 262, 318, 372, 428, 478].map((y, k) => {
    const g = spring({ frame: frame - (46 + k * 5), fps, config: { damping: 13, stiffness: 120 } });
    const creep = interpolate(frame, [60 + k * 4, 109], [0, 14 + (k % 3) * 8], clamp);
    const len = g * (34 + ((k * 23) % 40)) + creep;
    const wob = Math.sin(frame / 9 + k) * 3;
    return { y, len, wob, k };
  });

  // Counters
  const countP = interpolate(frame, [28, 88], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rate = interpolate(countP, [0, 1], [0.5, 3.0]);
  const temp = Math.round(interpolate(countP, [0, 1], [25, -5]));
  const rateFrac = interpolate(rate, [0, 3.5], [0, 1], clamp);
  const tempFrac = interpolate(temp, [-10, 30], [0, 1], clamp);
  const flicker = frame > 88 ? 0.5 + 0.5 * Math.sin(frame / 3) : 1;

  // Ions: continuous looping stream
  const ions = Array.from({ length: 16 }, (_, i) => {
    const period = 30;
    const local = frame - 12 - (i % 5) * 2;
    if (local < 0) return null;
    const phase = (((local + i * 11) % period) + period) % period;
    const t = phase / period;
    const y0 = 128 + ((i * 137) % 360);
    // as charge rate climbs, graphite keeps up with fewer ions
    const intercalate = i % 3 === 0 && !(frame > 60 && i % 6 === 0);
    const k = (i * 5) % 7;
    const gapY = sheetsY[k] + 14 + 19;
    let x = 0, y = y0, op = 1, metal = 0, r = 11;
    if (intercalate) {
      if (t < 0.7) {
        const e = Easing.inOut(Easing.cubic)(t / 0.7);
        x = 30 + (SURF - 30) * e;
        y = y0 + (gapY - y0) * e;
      } else {
        const e = (t - 0.7) / 0.3;
        x = SURF + 160 * Easing.out(Easing.quad)(e);
        y = gapY;
        op = 1 - e;
        r = 11 - 3 * e;
      }
    } else {
      if (t < 0.72) {
        const e = Easing.in(Easing.quad)(t / 0.72);
        x = 30 + (plateX - 10 - 30) * e;
      } else {
        const e = (t - 0.72) / 0.28;
        x = plateX - 10;
        op = 1 - e;
        metal = e;
        r = 11 + 3 * e;
      }
    }
    const fadeIn = interpolate(t, [0, 0.08], [0, 1], clamp);
    return { i, x, y, op: op * fadeIn, metal, r, moving: t < 0.72, intercalate };
  }).filter(Boolean) as { i: number; x: number; y: number; op: number; metal: number; r: number; moving: boolean; intercalate: boolean }[];

  const shimmerY = interpolate((frame - 40) % 50, [0, 50], [60, 560]);
  const chevronShift = (frame * 3) % 40;

  const cardStyle: React.CSSProperties = {
    position: "absolute",
    background: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
    borderRadius: 32,
    boxShadow: "0 30px 60px -20px rgba(15,23,42,0.28), 0 8px 18px -8px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
    border: "1px solid rgba(15,23,42,0.06)",
    overflow: "hidden",
  };

  return (
    <div style={{ width: "100%", height: "100%", background: bg, position: "relative", overflow: "hidden", fontFamily: font }}>
      {/* Ambient depth */}
      <div style={{ position: "absolute", left: -200 + drift * 6, top: 300, width: 900, height: 900, borderRadius: "50%",
        background: `radial-gradient(circle, ${primary}22 0%, transparent 65%)`, filter: "blur(20px)" }} />
      <div style={{ position: "absolute", right: -260 - drift2 * 6, top: 900, width: 900, height: 900, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}1f 0%, transparent 65%)`, filter: "blur(24px)" }} />

      {/* ---------- Header ---------- */}
      <div style={{ position: "absolute", left: 60, top: 128, display: "flex", alignItems: "center", gap: 14,
        opacity: eyebrowIn, transform: `translateX(${(1 - eyebrowIn) * -40}px)` }}>
        <div style={{ width: 44, height: 4, borderRadius: 2, background: primary }} />
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 5, color: primary }}>08 · FAILURE MODE</div>
      </div>
      <div style={{ position: "absolute", left: 56, top: 172, fontSize: 84, fontWeight: 800, color: ink, letterSpacing: -2, lineHeight: 1,
        opacity: head1In, transform: `translateY(${(1 - head1In) * 50}px)` }}>
        Too fast or cold:
      </div>
      <div style={{ position: "absolute", left: 56, top: 268, fontSize: 104, fontWeight: 900, letterSpacing: -3, lineHeight: 1,
        backgroundImage: `linear-gradient(90deg, ${primary}, #4338ca)`, WebkitBackgroundClip: "text", color: "transparent",
        opacity: head2In, transform: `translateY(${(1 - head2In) * 60}px) scale(${0.92 + 0.08 * head2In})`, transformOrigin: "left center" }}>
        plating.
      </div>
      <div style={{ position: "absolute", left: 60, top: 392, width: 900, fontSize: 30, lineHeight: 1.38, color: "#475569",
        opacity: subIn, transform: `translateY(${(1 - subIn) * 24}px)` }}>
        If ions arrive faster than graphite can absorb them, <b style={{ color: ink }}>lithium metal coats the surface</b> instead.
      </div>

      {/* ---------- Cross-section card ---------- */}
      <div style={{ ...cardStyle, left: 60, top: 510, width: 960, height: 560,
        opacity: cardIn, transform: `translateY(${(1 - cardIn) * 120 + drift}px)` }}>
        <svg width={960} height={560} viewBox="0 0 960 560">
          <defs>
            <linearGradient id="elec" x1="0" x2="1">
              <stop offset="0" stopColor={accent} stopOpacity={0.02} />
              <stop offset="1" stopColor={accent} stopOpacity={0.14} />
            </linearGradient>
            <linearGradient id="sheet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#475569" />
              <stop offset="1" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="metal" x1="0" x2="1">
              <stop offset="0" stopColor="#e2e8f0" />
              <stop offset="0.45" stopColor="#94a3b8" />
              <stop offset="1" stopColor="#64748b" />
            </linearGradient>
            <radialGradient id="ion" cx="0.35" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#a5f3fc" />
              <stop offset="1" stopColor={accent} />
            </radialGradient>
            <linearGradient id="tail" x1="0" x2="1">
              <stop offset="0" stopColor={accent} stopOpacity={0} />
              <stop offset="1" stopColor={accent} stopOpacity={0.45} />
            </linearGradient>
            <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity={0} />
              <stop offset="0.5" stopColor="#fff" stopOpacity={0.85} />
              <stop offset="1" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* electrolyte zone */}
          <rect x={0} y={0} width={SURF} height={560} fill="url(#elec)" />
          <text x={40} y={58} fontFamily={font} fontSize={20} fontWeight={700} letterSpacing={4} fill="#0e7490">ELECTROLYTE</text>
          {[0, 1, 2].map((c) => (
            <path key={c} d={`M ${250 + c * 40 + chevronShift} 44 l 12 10 l -12 10`} stroke={accent} strokeWidth={4}
              fill="none" strokeLinecap="round" opacity={0.25 + 0.25 * c} />
          ))}
          <text x={40} y={88} fontFamily={font} fontSize={18} fill="#64748b">Li⁺ rushing in at {rate.toFixed(1)}C</text>

          {/* anode label ABOVE the stack */}
          <rect x={SURF + 40} y={30} width={280} height={44} rx={22} fill={ink} />
          <text x={SURF + 180} y={59} textAnchor="middle" fontFamily={font} fontSize={19} fontWeight={700} letterSpacing={3} fill="#fff">GRAPHITE ANODE</text>

          {/* graphite sheets */}
          {sheetsY.map((y, k) => {
            const sIn = spring({ frame: frame - (12 + k * 2), fps, config: { damping: 14, stiffness: 150 } });
            const pts = Array.from({ length: 17 }, (_, j) => `${SURF + j * 20},${y + 7 + (j % 2 ? -5 : 5)}`).join(" ");
            return (
              <g key={k} opacity={sIn} transform={`translate(${(1 - sIn) * 80},0)`}>
                <rect x={SURF} y={y} width={330} height={14} rx={4} fill="url(#sheet)" filter="url(#soft)" />
                <polyline points={pts} fill="none" stroke="#94a3b8" strokeWidth={2} opacity={0.7} />
              </g>
            );
          })}

          {/* intercalated Li slowly filling gaps (graphite can't keep up) */}
          {sheetsY.slice(0, 7).map((y, k) =>
            [0, 1, 2, 3].map((j) => {
              const a = interpolate(frame, [26 + j * 16 + k * 2, 34 + j * 16 + k * 2], [0, 1], clamp);
              return <circle key={`${k}-${j}`} cx={SURF + 40 + j * 68 + (k % 2) * 30} cy={y + 33} r={6} fill={accent} opacity={a * 0.85} />;
            })
          )}

          {/* plated metal film */}
          <rect x={plateX} y={110} width={thick} height={384} rx={3} fill="url(#metal)" />
          {thick > 1 && (
            <rect x={plateX} y={shimmerY - 40} width={thick} height={80} fill="url(#shine)" opacity={0.7} />
          )}

          {/* dendrites */}
          {dendrites.map((d) => {
            if (d.len < 1) return null;
            const tipX = plateX - d.len;
            const tipY = d.y + d.wob;
            const bx = plateX - d.len * 0.55;
            const by = d.y + (d.k % 2 ? -1 : 1) * d.len * 0.3;
            return (
              <g key={d.k} filter="url(#soft)">
                <polygon points={`${plateX + 1},${d.y - 9} ${tipX},${tipY} ${plateX + 1},${d.y + 9}`} fill="url(#metal)" stroke="#64748b" strokeWidth={1} />
                <polygon points={`${bx + 6},${d.y - 3} ${bx - d.len * 0.25},${by} ${bx + 6},${d.y + 3}`} fill="#94a3b8" opacity={interpolate(d.len, [20, 50], [0, 1], clamp)} />
              </g>
            );
          })}

          {/* ions */}
          {ions.map((o) => (
            <g key={o.i} opacity={o.op}>
              {o.moving && <rect x={o.x - 54} y={o.y - 3} width={44} height={6} rx={3} fill="url(#tail)" />}
              <circle cx={o.x} cy={o.y} r={o.r}
                fill={o.metal > 0 ? "#94a3b8" : "url(#ion)"} filter="url(#soft)" />
              {o.metal === 0 && (
                <text x={o.x} y={o.y + 5} textAnchor="middle" fontFamily={font} fontSize={14} fontWeight={800} fill="#fff">+</text>
              )}
              {o.metal > 0 && (
                <circle cx={o.x} cy={o.y} r={o.r + 10 * o.metal} fill="none" stroke="#64748b" strokeWidth={2} opacity={1 - o.metal} />
              )}
            </g>
          ))}

          {/* plating warning chip */}
          <g opacity={chipIn} transform={`translate(${40} ${470 + (1 - chipIn) * 40}) scale(${0.8 + 0.2 * chipIn})`}>
            <rect x={0} y={0} width={380} height={58} rx={29} fill={ink} filter="url(#soft)" />
            <circle cx={30} cy={29} r={9} fill={primary} opacity={0.6 + 0.4 * Math.sin(frame / 4)} />
            <text x={52} y={37} fontFamily={font} fontSize={22} fontWeight={700} fill="#fff">Li metal plating</text>
            <text x={250} y={37} fontFamily={font} fontSize={18} fill="#94a3b8">capacity lost</text>
          </g>
        </svg>
      </div>

      {/* ---------- Stat cards (end at y ≈ 1330, clear of captions) ---------- */}
      <div style={{ ...cardStyle, left: 60, top: 1110, width: 462, height: 220, padding: "28px 32px", boxSizing: "border-box",
        opacity: statAIn, transform: `translateY(${(1 - statAIn) * 60 - drift2}px)` }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: "#64748b" }}>CHARGE RATE</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
          <div style={{ fontSize: 86, fontWeight: 900, color: ink, letterSpacing: -2, lineHeight: 1 }}>{rate.toFixed(1)}</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: primary }}>C</div>
        </div>
        <div style={{ position: "relative", marginTop: 20, height: 14, borderRadius: 7, background: "#e2e8f0" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${rateFrac * 100}%`, borderRadius: 7,
            background: `linear-gradient(90deg, ${accent}, ${primary})`, opacity: flicker * 0.4 + 0.6 }} />
          <div style={{ position: "absolute", left: `${(1 / 3.5) * 100}%`, top: -6, width: 3, height: 26, background: ink, borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 17, color: "#64748b", marginTop: 8 }}>safe ≈ 1C</div>
      </div>

      <div style={{ ...cardStyle, left: 558, top: 1110, width: 462, height: 220, padding: "28px 32px", boxSizing: "border-box",
        opacity: statBIn, transform: `translateY(${(1 - statBIn) * 60 + drift2}px)` }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: "#64748b" }}>CELL TEMP</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
          <div style={{ fontSize: 86, fontWeight: 900, color: ink, letterSpacing: -2, lineHeight: 1 }}>
            {temp < 0 ? `−${Math.abs(temp)}` : temp}
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: accent }}>°C</div>
        </div>
        <div style={{ position: "relative", marginTop: 20, height: 14, borderRadius: 7, background: "#e2e8f0" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${tempFrac * 100}%`, borderRadius: 7,
            background: `linear-gradient(90deg, ${accent}, #67e8f9)` }} />
          <div style={{ position: "absolute", left: `${(10 / 40) * 100}%`, top: -6, width: 3, height: 26, background: ink, borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 17, color: "#64748b", marginTop: 8 }}>below 0 °C, graphite absorbs slowly</div>
      </div>
    </div>
  );
}