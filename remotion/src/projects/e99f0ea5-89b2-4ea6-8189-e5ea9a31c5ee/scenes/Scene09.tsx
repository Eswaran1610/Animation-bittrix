import React from "react";
import { interpolate, spring, Easing } from "remotion";

export const soundEvents = [
  { "frame": 4, "role": "whoosh", "description": "indigo 'Charge gently.' block springs in" },
  { "frame": 30, "role": "count", "description": "battery state of charge counts up toward 75%" },
  { "frame": 72, "role": "ding", "description": "charge settles in the 20-80% sweet spot" },
  { "frame": 98, "role": "slide", "description": "Bittrix Technologies end card rises into place" },
  { "frame": 121, "role": "click", "description": "cursor presses the Follow button" }
];

export default function Scene(props: { frame: number; fps: number; durationInFrames: number; theme: any }) {
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
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

  // ---------- Timeline ----------
  const eyebrowIn = sp(0, 14, 160);
  const blockIn = sp(3, 11, 150);
  const line2In = sp(14, 13, 140);
  const underline = interpolate(frame, [30, 56], [0, 1], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  const cardIn = sp(20, 14, 130);
  const charge = spring({ frame: frame - 28, fps, config: { damping: 16, stiffness: 120 } });
  const pct = interpolate(charge, [0, 1], [18, 75]);
  const pctShown = Math.max(0, Math.min(100, Math.round(pct)));
  const settledGlow = interpolate(frame, [66, 80], [0, 1], clamp);
  const subIn = sp(60, 15, 130);
  const endIn = sp(94, 12, 140);
  const btnIn = sp(104, 11, 170);

  // Cursor + click
  const cursorT = interpolate(frame, [106, 120], [0, 1], { ...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1) });
  const press = frame >= 119 && frame <= 125 ? interpolate(frame, [119, 121, 125], [1, 0.92, 1], clamp) : 1;
  const clicked = frame >= 121;
  const followSwap = spring({ frame: frame - 121, fps, config: { damping: 12, stiffness: 170 } });
  const ripple = interpolate(frame, [121, 150], [0, 1], clamp);
  const cursorFade = interpolate(frame, [132, 146], [1, 0], clamp);

  // Ambient, continuous
  const t = frame / fps;
  const breathe = Math.sin(t * 2.2);
  const bgDriftA = Math.sin(t * 0.7) * 40;
  const bgDriftB = Math.cos(t * 0.55) * 50;

  // ---------- Battery geometry ----------
  const BAT_W = 230;
  const BAT_H = 360;
  const INNER_PAD = 14;
  const innerW = BAT_W - INNER_PAD * 2;
  const innerH = BAT_H - INNER_PAD * 2;
  const fillH = (innerH * pct) / 100;

  const wavePath = (w: number, amp: number, phase: number) => {
    let d = `M 0 ${amp * 2}`;
    for (let x = 0; x <= w; x += 6) {
      const y = amp + Math.sin((x / w) * Math.PI * 3 + phase) * amp;
      d += ` L ${x} ${y.toFixed(2)}`;
    }
    d += ` L ${w} ${amp * 2 + 4} L 0 ${amp * 2 + 4} Z`;
    return d;
  };

  const ions = Array.from({ length: 8 }).map((_, i) => {
    const x = 18 + ((i * 47) % (innerW - 36));
    const speed = 0.9 + (i % 3) * 0.35;
    const travel = Math.max(1, fillH - 26);
    const y = ((frame * speed + i * 61) % travel);
    const op = interpolate(y, [0, travel * 0.15, travel * 0.8, travel], [0, 0.9, 0.9, 0], clamp);
    return { x, y, op, r: 5 + (i % 2) * 2 };
  });

  // Range bar marker
  const TRACK_W = 420;
  const markerX = (TRACK_W * pct) / 100;

  // Logo ion bounce
  const logoIon = Math.sin(t * 3) * 0.5 + 0.5;

  // Button colors
  const btnBg = clicked ? TEXT : PRIMARY;

  // Cursor path (screen coords)
  const cursorX = interpolate(cursorT, [0, 1], [1010, 640]);
  const cursorY = interpolate(cursorT, [0, 1], [1460, 1378]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: BG,
        fontFamily: BODY,
        color: TEXT,
      }}
    >
      {/* ---------- Background depth ---------- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(${TEXT}14 1.6px, transparent 1.6px)`,
          backgroundSize: "36px 36px",
          backgroundPosition: `${(frame * 0.25) % 36}px ${(frame * 0.4) % 36}px`,
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          left: -260 + bgDriftA,
          top: 120 + bgDriftB * 0.6,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${PRIMARY}2e 0%, ${PRIMARY}00 65%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          right: -280 - bgDriftB * 0.5,
          top: 760 + bgDriftA * 0.5,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}29 0%, ${ACCENT}00 65%)`,
          filter: "blur(30px)",
        }}
      />

      {/* ---------- Eyebrow ---------- */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 80,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: eyebrowIn,
          transform: `translateY(${(1 - eyebrowIn) * -24}px)`,
        }}
      >
        <div
          style={{
            fontFamily: HEAD,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 4,
            color: PRIMARY,
            background: `${PRIMARY}14`,
            border: `2px solid ${PRIMARY}33`,
            borderRadius: 999,
            padding: "8px 18px",
          }}
        >
          09 · THE TAKEAWAY
        </div>
        <div style={{ width: 120 * eyebrowIn, height: 2, background: `${TEXT}26` }} />
      </div>

      {/* ---------- Headline ---------- */}
      <div
        style={{
          position: "absolute",
          top: 214,
          left: 80,
          transform: `translateX(${(1 - blockIn) * -140}px) scale(${0.9 + blockIn * 0.1}) rotate(${(1 - blockIn) * -3}deg)`,
          transformOrigin: "left center",
          opacity: Math.min(1, blockIn * 1.4),
        }}
      >
        <div
          style={{
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 98,
            lineHeight: 1,
            color: "#ffffff",
            letterSpacing: -2,
            padding: "26px 40px 30px",
            borderRadius: 30,
            whiteSpace: "nowrap",
            background: `linear-gradient(135deg, ${PRIMARY} 0%, #4f46e5 100%)`,
            boxShadow: `0 24px 50px -16px ${PRIMARY}99, 0 6px 14px -6px ${TEXT}40, inset 0 2px 0 #ffffff33`,
          }}
        >
          Charge gently.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 392,
          left: 86,
          opacity: line2In,
          transform: `translateY(${(1 - line2In) * 50}px)`,
        }}
      >
        <div
          style={{
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 84,
            lineHeight: 1.05,
            letterSpacing: -2,
            color: TEXT,
            whiteSpace: "nowrap",
            position: "relative",
          }}
        >
          Follow for{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            more.
            <span
              style={{
                position: "absolute",
                left: 0,
                bottom: -6,
                height: 10,
                width: `${underline * 100}%`,
                borderRadius: 6,
                background: `linear-gradient(90deg, ${ACCENT}, ${PRIMARY})`,
              }}
            />
          </span>
        </div>
      </div>

      {/* ---------- Battery data card ---------- */}
      <div
        style={{
          position: "absolute",
          top: 540,
          left: 80,
          width: 920,
          height: 460,
          borderRadius: 36,
          background: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
          border: `1.5px solid ${TEXT}12`,
          boxShadow: `0 40px 80px -40px ${TEXT}55, 0 10px 24px -12px ${TEXT}22`,
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 80}px) scale(${0.94 + cardIn * 0.06})`,
        }}
      >
        {/* Battery */}
        <div style={{ position: "absolute", left: 70, top: 62 }}>
          {/* cap */}
          <div
            style={{
              position: "absolute",
              left: BAT_W / 2 - 46,
              top: -20,
              width: 92,
              height: 26,
              borderRadius: "12px 12px 4px 4px",
              background: `linear-gradient(180deg, #334155, ${TEXT})`,
            }}
          />
          <div
            style={{
              position: "relative",
              width: BAT_W,
              height: BAT_H,
              borderRadius: 34,
              background: TEXT,
              boxShadow: `0 24px 40px -18px ${TEXT}99, 0 0 ${40 * settledGlow * (0.7 + 0.3 * breathe)}px ${ACCENT}55`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: INNER_PAD,
                top: INNER_PAD,
                width: innerW,
                height: innerH,
                borderRadius: 22,
                background: "linear-gradient(180deg, #1e293b, #111827)",
                overflow: "hidden",
              }}
            >
              {/* sweet-spot guides at 20% and 80% */}
              {[20, 80].map((g) => (
                <div
                  key={g}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: (innerH * g) / 100,
                    borderTop: `2px dashed #ffffff30`,
                  }}
                />
              ))}
              {/* fill */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  width: innerW,
                  height: fillH,
                  background: `linear-gradient(180deg, ${ACCENT} 0%, ${PRIMARY} 100%)`,
                }}
              >
                <svg
                  width={innerW}
                  height={20}
                  style={{ position: "absolute", left: 0, top: -12 }}
                >
                  <path d={wavePath(innerW, 6, t * 4)} fill={ACCENT} />
                  <path d={wavePath(innerW, 5, -t * 3 + 1.4)} fill="#ffffff" opacity={0.25} />
                </svg>
                {ions.map((ion, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: ion.x,
                      bottom: ion.y + 6,
                      width: ion.r * 2,
                      height: ion.r * 2,
                      borderRadius: "50%",
                      background: "#ffffff",
                      opacity: ion.op * 0.85,
                      boxShadow: "0 0 10px #ffffffaa",
                    }}
                  />
                ))}
                {/* glass sheen */}
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    top: 0,
                    bottom: 0,
                    width: 26,
                    background: "linear-gradient(90deg, #ffffff40, #ffffff00)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Readout column */}
        <div style={{ position: "absolute", left: 380, top: 58, width: 500 }}>
          <div
            style={{
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 4,
              color: `${TEXT}99`,
            }}
          >
            STATE OF CHARGE
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 4,
              whiteSpace: "nowrap",
              fontFamily: HEAD,
              fontWeight: 800,
              color: TEXT,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: -4,
            }}
          >
            <span style={{ fontSize: 168, lineHeight: 1 }}>{pctShown}</span>
            <span style={{ fontSize: 96, lineHeight: 1, color: PRIMARY, marginLeft: 6, paddingRight: 12 }}>%</span>
          </div>

          {/* Range track */}
          <div style={{ position: "relative", marginTop: 30, width: TRACK_W, height: 22 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 11, background: `${TEXT}12` }} />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: TRACK_W * 0.2,
                width: TRACK_W * 0.6,
                borderRadius: 11,
                background: `linear-gradient(90deg, ${ACCENT}aa, ${PRIMARY}aa)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -9,
                left: markerX - 20,
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#ffffff",
                border: `6px solid ${PRIMARY}`,
                boxShadow: `0 8px 16px -6px ${PRIMARY}aa`,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: TRACK_W,
              marginTop: 18,
              fontSize: 22,
              fontWeight: 700,
              color: `${TEXT}80`,
            }}
          >
            <span>0</span>
            <span style={{ marginLeft: 40 }}>20</span>
            <span style={{ marginRight: 40 }}>80</span>
            <span>100</span>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              marginTop: 26,
              padding: "12px 22px",
              borderRadius: 999,
              background: `${ACCENT}1f`,
              border: `2px solid ${ACCENT}55`,
              fontSize: 26,
              fontWeight: 700,
              color: TEXT,
              opacity: settledGlow,
              transform: `scale(${0.85 + 0.15 * spring({ frame: frame - 70, fps, config: { damping: 11, stiffness: 170 } })})`,
              transformOrigin: "left center",
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: ACCENT,
                boxShadow: `0 0 ${10 + 6 * breathe}px ${ACCENT}`,
              }}
            />
            Sweet spot: 20–80%
          </div>
        </div>
      </div>

      {/* ---------- Subtitle ---------- */}
      <div
        style={{
          position: "absolute",
          top: 1036,
          left: 80,
          width: 920,
          fontFamily: BODY,
          fontSize: 32,
          lineHeight: 1.3,
          fontWeight: 400,
          color: `${TEXT}b3`,
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 20}px)`,
        }}
      >
        Follow for more science explained{" "}
        <span style={{ color: TEXT, fontWeight: 700 }}>one moving part at a time.</span>
      </div>

      {/* ---------- Bittrix end card ---------- */}
      <div
        style={{
          position: "absolute",
          top: 1150,
          left: 80,
          width: 920,
          height: 280,
          borderRadius: 36,
          background: `linear-gradient(135deg, ${TEXT} 0%, #1e1b4b 100%)`,
          boxShadow: `0 40px 70px -30px ${TEXT}aa, inset 0 1px 0 #ffffff1f`,
          opacity: Math.min(1, endIn * 1.3),
          transform: `translateY(${(1 - endIn) * 120}px)`,
          overflow: "hidden",
        }}
      >
        {/* sheen sweep */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: interpolate(frame, [100, 167], [-300, 1100], clamp),
            width: 160,
            height: 500,
            transform: "rotate(20deg)",
            background: "linear-gradient(90deg, #ffffff00, #ffffff14, #ffffff00)",
          }}
        />

        {/* Logo + brand */}
        <div style={{ position: "absolute", left: 40, top: 32, display: "flex", alignItems: "center", gap: 26 }}>
          <svg width={104} height={104} viewBox="0 0 100 100">
            <defs>
              <linearGradient id="bxg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={PRIMARY} />
                <stop offset="100%" stopColor={ACCENT} />
              </linearGradient>
            </defs>
            <polygon
              points="50,4 90,27 90,73 50,96 10,73 10,27"
              fill="url(#bxg)"
              transform={`rotate(${(1 - endIn) * -60} 50 50)`}
            />
            {[36, 50, 64].map((y) => (
              <rect key={y} x={28} y={y - 2.5} width={44} height={5} rx={2.5} fill="#ffffff" opacity={0.92} />
            ))}
            <circle cx={30 + logoIon * 40} cy={43} r={4.5} fill={TEXT} />
            <circle cx={70 - logoIon * 40} cy={57} r={4.5} fill={TEXT} />
          </svg>
          <div>
            <div
              style={{
                fontFamily: HEAD,
                fontWeight: 800,
                fontSize: 46,
                letterSpacing: -1,
                color: "#ffffff",
                whiteSpace: "nowrap",
              }}
            >
              Bittrix Technologies
            </div>
            <div style={{ fontSize: 24, color: "#cbd5e1", marginTop: 6, letterSpacing: 1 }}>
              Science, one moving part at a time
            </div>
          </div>
        </div>

        {/* Follow button */}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 168,
            width: 840,
            height: 84,
            transform: `scale(${(0.6 + 0.4 * btnIn) * press})`,
            opacity: btnIn,
          }}
        >
          {clicked && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                border: `3px solid ${ACCENT}`,
                transform: `scale(${1 + ripple * 0.12}, ${1 + ripple * 0.6})`,
                opacity: 1 - ripple,
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              background: clicked
                ? `linear-gradient(90deg, ${ACCENT}, ${PRIMARY})`
                : `linear-gradient(90deg, ${PRIMARY}, #4f46e5)`,
              boxShadow: `0 14px 30px -10px ${clicked ? ACCENT : PRIMARY}cc, 0 0 ${clicked ? 18 + 10 * breathe : 0}px ${ACCENT}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              fontFamily: HEAD,
              fontWeight: 800,
              fontSize: 36,
              color: "#ffffff",
              letterSpacing: 1,
            }}
          >
            {!clicked ? (
              <>
                <span style={{ fontSize: 42, lineHeight: 1, marginTop: -4 }}>+</span>
                <span>Follow</span>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transform: `translateY(${(1 - followSwap) * 30}px)`,
                  opacity: followSwap,
                }}
              >
                <svg width={34} height={34} viewBox="0 0 24 24">
                  <circle cx={12} cy={12} r={11} fill={btnBg} opacity={0.35} />
                  <path
                    d="M6.5 12.5 L10.5 16 L17.5 8.5"
                    stroke="#ffffff"
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={20}
                    strokeDashoffset={20 * (1 - followSwap)}
                  />
                </svg>
                <span>Following — more science soon</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Cursor ---------- */}
      {frame >= 104 && (
        <svg
          width={52}
          height={60}
          viewBox="0 0 26 30"
          style={{
            position: "absolute",
            left: cursorX,
            top: Math.min(cursorY, 1380),
            opacity: cursorFade * interpolate(frame, [104, 110], [0, 1], clamp),
            transform: `scale(${press})`,
            transformOrigin: "top left",
            filter: `drop-shadow(0 6px 8px ${TEXT}66)`,
          }}
        >
          <path d="M2 2 L2 24 L8 18.5 L12 27 L16 25.2 L12 16.8 L20 16.8 Z" fill="#ffffff" stroke={TEXT} strokeWidth={1.8} strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}