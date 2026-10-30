import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { springPresets } from '../theme';

// Kinetic Typography with Spring Entrance and Glow
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
    config: springPresets.snappy
  });

  const subtitleSpring = spring({
    frame: frame - delayFrames - 8,
    fps,
    config: springPresets.soft
  });

  const underlineWidth = interpolate(frame - delayFrames, [10, 40], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <div style={{ textAlign: 'center', zIndex: 10, maxWidth: '1100px', padding: '0 20px' }}>
      {badge && (
        <div style={{
          fontSize: '18px',
          fontWeight: 700,
          color,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          marginBottom: '14px',
          opacity: Math.min(1, Math.max(0, (frame - delayFrames) / 15))
        }}>
          {badge}
        </div>
      )}

      <h1 style={{
        fontSize: '56px',
        fontWeight: 900,
        color: '#ffffff',
        lineHeight: 1.15,
        margin: 0,
        transform: `scale(${titleSpring}) translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
        textShadow: `0 10px 40px rgba(0,0,0,0.8), 0 0 30px ${color}40`
      }}>
        {title}
      </h1>

      {/* Dynamic Animated Underline */}
      <div style={{
        margin: '16px auto 0',
        height: '4px',
        width: `${underlineWidth}%`,
        maxWidth: '300px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        borderRadius: '2px',
        boxShadow: `0 0 16px ${color}`
      }} />

      {subtitle && (
        <p style={{
          fontSize: '22px',
          color: '#94a3b8',
          marginTop: '20px',
          lineHeight: 1.5,
          transform: `scale(${subtitleSpring}) translateY(${interpolate(subtitleSpring, [0, 1], [20, 0])}px)`,
          opacity: Math.min(1, Math.max(0, subtitleSpring))
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

// Orbital Rings Motion Element
export const OrbitalRings: React.FC<{ color?: string }> = ({ color = '#38bdf8' }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '420px',
        height: '420px',
        borderRadius: '50%',
        border: `3px solid ${color}80`,
        boxShadow: `0 0 60px ${color}40, inset 0 0 40px ${color}30`,
        transform: `rotate(${frame * 0.8}deg) rotateX(55deg)`
      }} />
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        border: `2px dashed ${color}60`,
        transform: `rotate(${frame * -1.2}deg) rotateY(45deg)`
      }} />
      <div style={{
        position: 'absolute',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        backgroundColor: '#000000',
        boxShadow: `0 0 50px ${color}60`
      }} />
    </div>
  );
};

export interface DynamicNode {
  label: string;
  sub?: string;
}

// Fully Dynamic Network Flow Nodes Motion Element (Zero Hardcoding)
export const NetworkNodes: React.FC<{ color?: string; nodes?: DynamicNode[] }> = ({ color = '#818cf8', nodes = [] }) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * 0.1) * 0.15 + 1;

  const defaultPositions = [
    { x: -300, y: -40 },
    { x: -100, y: -120 },
    { x: 100, y: -40 },
    { x: 300, y: 80 }
  ];

  const displayNodes = (nodes.length > 0 ? nodes : [
    { label: 'Initial State', sub: 'Input vector' },
    { label: 'Active Transformation', sub: 'Core mechanism' },
    { label: 'Feedback Loop', sub: 'Target verification' },
    { label: 'Target Resolved', sub: 'Result state' }
  ]).slice(0, 4);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Central Connector Lines */}
      <svg style={{ position: 'absolute', width: '900px', height: '400px', overflow: 'visible' }}>
        <line x1="150" y1="160" x2="350" y2="80" stroke={color} strokeWidth="3" strokeDasharray="6 6" />
        <line x1="350" y1="80" x2="550" y2="160" stroke={color} strokeWidth="3" strokeDasharray="6 6" />
        <line x1="550" y1="160" x2="750" y2="280" stroke={color} strokeWidth="3" />
        <line x1="150" y1="160" x2="550" y2="160" stroke={`${color}40`} strokeWidth="1.5" />
      </svg>

      {/* Nodes */}
      {displayNodes.map((node, idx) => {
        const pos = defaultPositions[idx] || { x: (idx - 1.5) * 200, y: 0 };
        return (
          <div key={idx} style={{
            position: 'absolute',
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${pulse})`,
            background: 'rgba(9, 13, 22, 0.9)',
            border: `2px solid ${color}`,
            borderRadius: '12px',
            padding: '12px 24px',
            boxShadow: `0 0 35px ${color}40`,
            color: '#ffffff',
            textAlign: 'center',
            minWidth: '160px'
          }}>
            <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '1px' }}>{node.label}</div>
            {node.sub && (
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{node.sub}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Fully Dynamic Infographic Metric Progress Bar (Zero Hardcoding)
export const MetricBar: React.FC<{ color?: string; label?: string; value?: number; unit?: string }> = ({
  color = '#10b981',
  label = 'QUANTITATIVE METRIC',
  value = 92,
  unit = '%'
}) => {
  const frame = useCurrentFrame();
  const targetVal = Math.min(100, Math.max(0, value));
  const progress = Math.min(targetVal, Math.floor(interpolate(frame, [10, 70], [0, targetVal], { extrapolateRight: 'clamp' })));

  return (
    <div style={{
      position: 'absolute',
      width: '650px',
      background: 'rgba(15, 23, 42, 0.85)',
      border: `1px solid ${color}60`,
      borderRadius: '16px',
      padding: '28px',
      boxShadow: `0 20px 40px rgba(0,0,0,0.6), 0 0 40px ${color}25`,
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '18px', color: '#cbd5e1', fontWeight: 700, letterSpacing: '1px' }}>{label}</span>
        <span style={{ fontSize: '32px', color, fontWeight: 900 }}>{progress}{unit}</span>
      </div>
      <div style={{ width: '100%', height: '14px', background: '#1e293b', borderRadius: '7px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(progress / targetVal) * 100}%`,
          background: `linear-gradient(90deg, #38bdf8, ${color})`,
          borderRadius: '7px',
          boxShadow: `0 0 16px ${color}`
        }} />
      </div>
    </div>
  );
};

// Kinetic Takeaway List for Step-by-Step Educational Explanation
export const KineticTakeawayList: React.FC<{ items: string[]; color?: string }> = ({ items, color = '#38bdf8' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginTop: '24px',
      maxWidth: '850px',
      width: '100%',
      zIndex: 10
    }}>
      {items.map((item, idx) => {
        const itemSpring = spring({
          frame: frame - (idx * 10 + 10),
          fps,
          config: springPresets.snappy
        });
        const opacity = interpolate(itemSpring, [0, 1], [0, 1]);
        const translateY = interpolate(itemSpring, [0, 1], [30, 0]);

        return (
          <div key={idx} style={{
            opacity,
            transform: `translateY(${translateY}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderLeft: `4px solid ${color}`,
            borderRadius: '8px',
            padding: '12px 20px',
            boxShadow: `0 8px 24px rgba(0,0,0,0.5)`,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`
            }} />
            <span style={{
              fontSize: '20px',
              color: '#f8fafc',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              {item}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Dynamic Animated Diagram & Technical Vector Blueprint
export const DynamicDiagram: React.FC<{ color?: string; title?: string }> = ({ color = '#818cf8', title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const diagramSpring = spring({
    frame,
    fps,
    config: springPresets.snappy
  });

  const pathDraw = interpolate(frame, [0, 45], [500, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const rotation = frame * 0.5;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `scale(${diagramSpring})`
    }}>
      <svg width="600" height="400" viewBox="0 0 600 400" style={{ overflow: 'visible' }}>
        {/* Background coordinate grid */}
        <defs>
          <pattern id="diag-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={`${color}15`} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="600" height="400" fill="url(#diag-grid)" rx="16" />

        {/* Outer Tech Blueprint Border */}
        <rect
          x="10"
          y="10"
          width="580"
          height="380"
          fill="none"
          stroke={`${color}40`}
          strokeWidth="1.5"
          strokeDasharray="500"
          strokeDashoffset={pathDraw}
          rx="12"
        />

        {/* Central Rotating Target Ring */}
        <circle
          cx="300"
          cy="200"
          r="90"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="8 6"
          transform={`rotate(${rotation} 300 200)`}
        />
        <circle
          cx="300"
          cy="200"
          r="60"
          fill={`${color}10`}
          stroke={`${color}80`}
          strokeWidth="1.5"
        />

        {/* Precision Crosshair Lines */}
        <line x1="160" y1="200" x2="440" y2="200" stroke={`${color}50`} strokeWidth="1" strokeDasharray="4 4" />
        <line x1="300" y1="80" x2="300" y2="320" stroke={`${color}50`} strokeWidth="1" strokeDasharray="4 4" />

        {/* Corner Calipers */}
        <path d="M 25 45 L 25 25 L 45 25" fill="none" stroke={color} strokeWidth="3" />
        <path d="M 575 45 L 575 25 L 555 25" fill="none" stroke={color} strokeWidth="3" />
        <path d="M 25 355 L 25 375 L 45 375" fill="none" stroke={color} strokeWidth="3" />
        <path d="M 575 355 L 575 375 L 555 375" fill="none" stroke={color} strokeWidth="3" />

        {/* Central Data Metric Dot */}
        <circle cx="300" cy="200" r="8" fill={color} />
        <circle cx="300" cy="200" r="18" fill="none" stroke={color} strokeWidth="2" opacity={Math.sin(frame * 0.15) * 0.5 + 0.5} />
      </svg>
    </div>
  );
};

// Dynamic Asset Image Card with Motion Entrance
export const AssetImageCard: React.FC<{ imageUrl: string; color?: string; label?: string }> = ({ imageUrl, color = '#38bdf8', label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame,
    fps,
    config: springPresets.bouncy
  });

  return (
    <div style={{
      position: 'absolute',
      top: '200px',
      transform: `scale(${cardSpring})`,
      padding: '8px',
      borderRadius: '20px',
      background: `linear-gradient(135deg, ${color}40, transparent)`,
      boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 40px ${color}30`
    }}>
      <div style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        width: '480px',
        height: '270px',
        backgroundColor: '#090d16'
      }}>
        <img
          src={imageUrl}
          alt={label || 'Dynamic Scene Asset'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {label && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '10px 16px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '1px'
          }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
};
