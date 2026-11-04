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
 * 4. Dynamic Network Flow Nodes with Animated Connecting Circuits
 */
export const NetworkNodes: React.FC<{ color?: string; nodes?: DynamicNode[] }> = ({
  color = '#818cf8',
  nodes = [],
}) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * 0.1) * 0.1 + 1;

  const defaultPositions = [
    { x: -220, y: -80 },
    { x: 120, y: -110 },
    { x: -140, y: 70 },
    { x: 180, y: 80 },
  ];

  const displayNodes = (
    nodes.length > 0
      ? nodes
      : [
          { label: 'Initial State', sub: 'Input vector' },
          { label: 'Core Mechanism', sub: 'Active transformation' },
          { label: 'Feedback Loop', sub: 'Target verification' },
          { label: 'Target State', sub: 'Result resolved' },
        ]
  ).slice(0, 4);

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
      {/* Animated SVG Connector Lines */}
      <svg
        style={{
          position: 'absolute',
          width: '700px',
          height: '420px',
          overflow: 'visible',
        }}
      >
        <line x1="160" y1="120" x2="380" y2="90" stroke={color} strokeWidth="3" strokeDasharray="6 6" />
        <line x1="380" y1="90" x2="540" y2="280" stroke={color} strokeWidth="3" strokeDasharray="6 6" />
        <line x1="160" y1="120" x2="240" y2="270" stroke={color} strokeWidth="3" />
        <line x1="240" y1="270" x2="540" y2="280" stroke={`${color}40`} strokeWidth="1.5" />
      </svg>

      {/* Pulsing Nodes */}
      {displayNodes.map((node, idx) => {
        const pos = defaultPositions[idx] || { x: (idx - 1.5) * 160, y: 0 };
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${pulse})`,
              background: 'rgba(9, 13, 22, 0.92)',
              border: `2px solid ${color}`,
              borderRadius: '12px',
              padding: '12px 20px',
              boxShadow: `0 0 35px ${color}40`,
              color: '#ffffff',
              textAlign: 'center',
              minWidth: '150px',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '0.8px' }}>
              {node.label}
            </div>
            {node.sub && (
              <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
                {node.sub}
              </div>
            )}
          </div>
        );
      })}
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
 * 6. Dynamic Animated Technical Vector Blueprint with Laser Path Draw-on
 */
export const DynamicDiagram: React.FC<{ color?: string; title?: string }> = ({
  color = '#818cf8',
  title,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const diagramSpring = spring({
    frame,
    fps,
    config: springPresets.snappy,
  });

  const pathDraw = interpolate(frame, [0, 45], [500, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const rotation = frame * 0.5;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${diagramSpring})`,
      }}
    >
      <svg width="680" height="420" viewBox="0 0 680 420" style={{ overflow: 'visible' }}>
        <defs>
          <pattern id="diag-grid-p" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={`${color}15`} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="680" height="420" fill="url(#diag-grid-p)" rx="16" />

        {/* Laser Path Draw-on Outer Border */}
        <rect
          x="10"
          y="10"
          width="660"
          height="400"
          fill="none"
          stroke={`${color}50`}
          strokeWidth="2"
          strokeDasharray="500"
          strokeDashoffset={pathDraw}
          rx="12"
        />

        {/* Central Rotating Target Reticle */}
        <circle
          cx="340"
          cy="210"
          r="95"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="8 6"
          transform={`rotate(${rotation} 340 210)`}
        />
        <circle
          cx="340"
          cy="210"
          r="65"
          fill={`${color}12`}
          stroke={`${color}80`}
          strokeWidth="1.5"
        />

        {/* Precision Crosshair Lines */}
        <line x1="180" y1="210" x2="500" y2="210" stroke={`${color}50`} strokeWidth="1" strokeDasharray="4 4" />
        <line x1="340" y1="90" x2="340" y2="330" stroke={`${color}50`} strokeWidth="1" strokeDasharray="4 4" />

        {/* Corner Calipers */}
        <path d="M 30 50 L 30 30 L 50 30" fill="none" stroke={color} strokeWidth="3" />
        <path d="M 650 50 L 650 30 L 630 30" fill="none" stroke={color} strokeWidth="3" />
        <path d="M 30 370 L 30 390 L 50 390" fill="none" stroke={color} strokeWidth="3" />
        <path d="M 650 370 L 650 390 L 630 390" fill="none" stroke={color} strokeWidth="3" />

        {/* Center Pulsing Metric Node */}
        <circle cx="340" cy="210" r="9" fill={color} />
        <circle
          cx="340"
          cy="210"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity={Math.sin(frame * 0.15) * 0.5 + 0.5}
        />
      </svg>
    </div>
  );
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
