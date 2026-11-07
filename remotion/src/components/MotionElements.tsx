import React from 'react';
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { springPresets } from '../theme';
import { assetSource } from '../assetSource';

export interface DynamicNode {
  label: string;
  sub?: string;
}

/**
 * 1. Kinetic Typography with Spring Entrance, Scale Pop, and Glowing Underline
 */
export const KineticTitle: React.FC<{
  title: string;
  badge?: string;
  subtitle?: string;
  color?: string;
  delayFrames?: number;
}> = ({ title, badge, subtitle, color = '#38bdf8', delayFrames = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame: frame - delayFrames,
    fps,
    config: springPresets.snappy,
  });

  const subtitleSpring = spring({
    frame: frame - delayFrames - 8,
    fps,
    config: springPresets.soft,
  });

  const underlineWidth = interpolate(frame - delayFrames, [10, 40], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ textAlign: 'center', zIndex: 10, maxWidth: '1100px', padding: '0 20px' }}>
      {badge && (
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            marginBottom: '14px',
            opacity: Math.min(1, Math.max(0, (frame - delayFrames) / 15)),
          }}
        >
          {badge}
        </div>
      )}

      <h1
        style={{
          fontSize: '76px',
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1.12,
          margin: 0,
          transform: `scale(${titleSpring}) translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
          textShadow: `0 10px 40px rgba(0,0,0,.8), 0 0 30px ${color}40`,
        }}
      >
        {title}
      </h1>

      {/* Dynamic Animated Underline */}
      <div
        style={{
          margin: '16px auto 0',
          height: '4px',
          width: `${underlineWidth}%`,
          maxWidth: '300px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          borderRadius: '2px',
          boxShadow: `0 0 16px ${color}`,
        }}
      />

      {subtitle && (
        <p
          style={{
            fontSize: '36px',
            color: '#94a3b8',
            marginTop: '20px',
            lineHeight: 1.35,
            transform: `scale(${subtitleSpring}) translateY(${interpolate(subtitleSpring, [0, 1], [20, 0])}px)`,
            opacity: Math.min(1, Math.max(0, subtitleSpring)),
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

/**
 * 2. Kinetic Takeaways List with Staggered Entrance and Sweeping Laser Highlights
 */
export const KineticTakeawayList: React.FC<{ items: string[]; color?: string }> = ({
  items,
  color = '#38bdf8',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '24px',
        maxWidth: '850px',
        width: '100%',
        zIndex: 10,
      }}
    >
      {items.map((item, idx) => {
        const entrance = spring({
          frame: frame - (idx * 10 + 10),
          fps,
          config: springPresets.snappy,
        });
        const sweep = interpolate(frame - idx * 10, [0, 24], [-100, 100], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={`${item}-${idx}`}
            style={{
              opacity: entrance,
              transform: `translateY(${interpolate(entrance, [0, 1], [30, 0])}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 20px',
              width: '100%',
              background: 'rgba(15, 23, 42, 0.75)',
              borderLeft: `4px solid ${color}`,
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: idx % 2 ? '2px' : '50%',
                background: `linear-gradient(135deg, ${color}, transparent)`,
                boxShadow: `0 0 14px ${color}`,
                transform: `rotate(${idx * 45 + frame * 0.7}deg)`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '34px',
                color: '#f8fafc',
                fontWeight: 600,
                letterSpacing: '.5px',
                textShadow: `0 0 18px ${color}55`,
              }}
            >
              {item}
            </span>
            <div
              style={{
                position: 'absolute',
                left: `${sweep}%`,
                bottom: 0,
                width: '30%',
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                boxShadow: `0 0 12px ${color}`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/**
 * 3. Multi-Axis 3D Orbital Rings Motion Element
 */
export const OrbitalRings: React.FC<{ color?: string }> = ({ color = '#38bdf8' }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer 3D Ring */}
      <div
        style={{
          width: '440px',
          height: '440px',
          borderRadius: '50%',
          border: `3px solid ${color}80`,
          boxShadow: `0 0 60px ${color}40, inset 0 0 40px ${color}30`,
          transform: `rotate(${frame * 0.8}deg) rotateX(55deg)`,
        }}
      />
      {/* Middle Counter-Rotating Dashed Ring */}
      <div
        style={{
          position: 'absolute',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          border: `2px dashed ${color}60`,
          transform: `rotate(${frame * -1.2}deg) rotateY(45deg)`,
        }}
      />
      {/* Dynamic Glowing Nucleus */}
      <div
        style={{
          position: 'absolute',
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          backgroundColor: '#05070f',
          border: `2px solid ${color}`,
          boxShadow: `0 0 50px ${color}80`,
          transform: `scale(${1 + Math.sin(frame * 0.08) * 0.08})`,
        }}
      />
    </div>
  );
};

/**
 * 4. Node-link diagram: nodes spring in one after another, links draw on between
 * them, and small data packets travel along every link. Node cards carry their own
 * dark background so text stays readable on any stage colour.
 */
export const NetworkNodes: React.FC<{ color?: string; nodes?: DynamicNode[] }> = ({
  color = '#818cf8',
  nodes = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const list = (nodes.length > 0 ? nodes : [{ label: 'Input' }, { label: 'Process' }, { label: 'Output' }]).slice(0, 6);
  const W = 960;
  const H = 1100;
  const pts = list.map((_, i) => ({
    x: list.length === 1 ? W / 2 : i % 2 === 0 ? 260 : 700,
    y: list.length === 1 ? H / 2 : 130 + i * ((H - 260) / (list.length - 1)),
  }));
  const NODE_STAGGER = 9;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {pts.slice(0, -1).map((from, i) => {
            const to = pts[i + 1];
            const start = i * NODE_STAGGER + 8;
            const draw = interpolate(frame, [start, start + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const cycle = 42;
            const t = frame > start + 18 ? ((frame - start - 18 + i * 11) % cycle) / cycle : -1;
            const eased = t < 0 ? 0 : t * t * (3 - 2 * t);
            return (
              <g key={i}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={`${color}33`} strokeWidth={6} strokeLinecap="round" />
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={color} strokeWidth={6} strokeLinecap="round"
                  pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw}
                />
                {t >= 0 && (
                  <g transform={`translate(${from.x + (to.x - from.x) * eased} ${from.y + (to.y - from.y) * eased})`}>
                    <rect x={-14} y={-10} width={28} height={20} rx={5} fill="#ffffff" stroke={color} strokeWidth={3} />
                    <path d="M -9 -5 L 0 2 L 9 -5" fill="none" stroke={color} strokeWidth={2} />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {list.map((node, idx) => {
          const pos = pts[idx];
          const enter = spring({ frame: frame - idx * NODE_STAGGER, fps, config: { damping: 14, stiffness: 140 } });
          const bob = Math.sin(frame * 0.06 + idx * 1.3) * 5;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y + bob,
                transform: `translate(-50%, -50%) scale(${enter})`,
                opacity: Math.min(1, enter),
                background: '#0b1220',
                border: `3px solid ${color}`,
                borderRadius: 22,
                padding: '22px 30px',
                boxShadow: `0 0 40px ${color}55, 0 14px 30px rgba(0,0,0,0.35)`,
                color: '#f8fafc',
                textAlign: 'center',
                minWidth: 250,
                maxWidth: 380,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 34, lineHeight: 1.15, letterSpacing: 0.3 }}>{node.label}</div>
              {node.sub && <div style={{ fontSize: 24, color: '#cbd5e1', marginTop: 8 }}>{node.sub}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 5. Dynamic Infographic Metric Progress Bar with Live Counting
 */
export const MetricBar: React.FC<{
  color?: string;
  label?: string;
  value?: number;
  unit?: string;
}> = ({
  color = '#10b981',
  label = 'QUANTITATIVE METRIC',
  value = 92,
  unit = '%',
}) => {
  const frame = useCurrentFrame();
  const targetVal = Math.min(100, Math.max(0, value));
  const progress = Math.min(
    targetVal,
    Math.floor(interpolate(frame, [10, 65], [0, targetVal], { extrapolateRight: 'clamp' }))
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '85%',
        maxWidth: '680px',
        background: 'rgba(15, 23, 42, 0.9)',
        border: `2px solid ${color}80`,
        borderRadius: '20px',
        padding: '32px',
        boxShadow: `0 20px 40px rgba(0,0,0,0.7), 0 0 45px ${color}30`,
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '24px', color: '#cbd5e1', fontWeight: 700, letterSpacing: '1px' }}>
          {label}
        </span>
        <span style={{ fontSize: '48px', color, fontWeight: 900 }}>
          {progress}{unit}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '20px',
          background: '#1e293b',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(progress / Math.max(1, targetVal)) * 100}%`,
            background: `linear-gradient(90deg, #38bdf8, ${color})`,
            borderRadius: '10px',
            boxShadow: `0 0 20px ${color}`,
          }}
        />
      </div>
    </div>
  );
};

/**
 * 6. Fallback diagram when a scene has no blueprint, image, metric or nodes.
 * It splits the scene title into 2-4 labelled nodes and animates data flowing
 * between them (instead of the old static target reticle).
 */
export const DynamicDiagram: React.FC<{ color?: string; title?: string }> = ({
  color = '#818cf8',
  title,
}) => {
  const words = (title || '').split(/\s+/).filter(Boolean);
  const groups = Math.min(4, Math.max(1, Math.round(words.length / 2)));
  const size = Math.ceil(words.length / groups) || 1;
  const labels: DynamicNode[] = [];
  for (let i = 0; i < words.length; i += size) labels.push({ label: words.slice(i, i + size).join(' ') });
  return <NetworkNodes color={color} nodes={labels.length ? labels : undefined} />;
};

/**
 * 7. Cinematic Ken Burns AssetImageCard with Smooth Pan, Dynamic Zoom & Glow Frame
 */
export const AssetImageCard: React.FC<{
  imageUrl: string;
  color?: string;
  label?: string;
  motionVariant?: 'pan-right' | 'pan-left' | 'zoom-in' | 'zoom-out';
}> = ({ imageUrl, color = '#38bdf8', label, motionVariant = 'zoom-in' }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const cardSpring = spring({
    frame,
    fps,
    config: springPresets.snappy,
  });

  const progress = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = motionVariant === 'zoom-out'
    ? interpolate(progress, [0, 1], [1.22, 1.05])
    : interpolate(progress, [0, 1], [1.05, 1.22]);

  const panX = motionVariant === 'pan-left'
    ? interpolate(progress, [0, 1], [25, -25])
    : interpolate(progress, [0, 1], [-25, 25]);

  const panY = interpolate(progress, [0, 1], [-12, 12]);
  const breathe = Math.sin(frame * 0.05) * 3;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${cardSpring})`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '92%',
          height: '88%',
          borderRadius: 24,
          overflow: 'hidden',
          background: 'rgba(9, 13, 22, 0.95)',
          border: `2px solid ${color}88`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.85), 0 0 45px ${color}35`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Img
            src={assetSource(imageUrl)}
            alt={label || 'Scene Motion Asset'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale}) translate3d(${panX}px, ${panY + breathe}px, 0)`,
              transformOrigin: 'center center',
              filter: 'contrast(1.08) saturate(1.15)',
            }}
          />
        </div>

        {/* Ambient Gradient Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Dynamic Label Badge */}
        {label && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 24px',
              background: 'linear-gradient(transparent, rgba(5,7,15,0.92))',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 12px ${color}`,
              }}
            />
            <span
              style={{
                color: '#ffffff',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.8px',
                textShadow: '0 2px 10px rgba(0,0,0,0.9)',
              }}
            >
              {label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
