import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  Video,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

export interface ScenePayload {
  id?: string;
  title?: string;
  scene_number: number;
  role?: string;
  template?: string;
  visual_type?: '3d-showcase' | 'image-hero' | 'concept-diagram' | 'process-flow' | 'split-compare' | 'timeline' | 'callout' | 'stat-counter' | 'outro';
  durationInFrames: number;
  duration_sec?: number;
  durationSec?: number;
  narration?: string;
  on_screen_text?: string;
  subtitle?: string;
  visual_direction?: string;
  themeColor?: string;
  emphasis_word?: string;
  icon?: string;
  image_url?: string;
  asset_url?: string;
  nodes?: Array<{ id?: string; label: string; sub?: string; icon?: string }>;
  edges?: Array<{ from: string | number; to: string | number; label?: string; dashed?: boolean }>;
  labels?: string[];
  stat_value?: string;
  source_url?: string;
  audioCues?: Array<{ hitFrame?: number; frame?: number; src?: string; volume?: number; role?: string; durationFrames?: number }>;
  words?: WordTiming[];
}

const BAKED_SCENES: ScenePayload[] = [
  {
    "scene_number": 1,
    "role": "hook",
    "durationInFrames": 137,
    "duration_sec": 4.57,
    "narration": "How does code become your website?",
    "on_screen_text": "How Do Browsers Build Websites?",
    "visual_direction": "Centered neo-brutalist viewport window with bold 4px black borders and an active glowing URL bar.",
    "template": "question-hook",
    "themeColor": "#ffe600",
    "words": [
      {
        "word": "How",
        "startFrame": 3,
        "endFrame": 8
      },
      {
        "word": "does",
        "startFrame": 9,
        "endFrame": 14
      },
      {
        "word": "code",
        "startFrame": 14,
        "endFrame": 22
      },
      {
        "word": "become",
        "startFrame": 23,
        "endFrame": 32
      },
      {
        "word": "your",
        "startFrame": 32,
        "endFrame": 36
      },
      {
        "word": "website",
        "startFrame": 36,
        "endFrame": 56
      }
    ],
    "visual_type": "3d-showcase",
    "icon": "🌐",
    "emphasis_word": "website",
    "nodes": [
      {
        "label": "Code",
        "sub": "Raw files"
      },
      {
        "label": "Website",
        "sub": "Interactive browser page"
      }
    ],
    "edges": [
      {
        "from": 0,
        "to": 1,
        "label": "becomes",
        "dashed": false
      }
    ],
    "labels": [
      "Code",
      "Website"
    ]
  },
  {
    "scene_number": 2,
    "role": "body",
    "durationInFrames": 137,
    "duration_sec": 4.57,
    "narration": "HTML parses tags into DOM nodes.",
    "on_screen_text": "HTML Creates The DOM Tree",
    "visual_direction": "Vibrant tree diagram with heavy boxed nodes cascading down from Document to Body and Children.",
    "template": "hero-object",
    "themeColor": "#ffe600",
    "words": [
      {
        "word": "HTML",
        "startFrame": 3,
        "endFrame": 24
      },
      {
        "word": "parses",
        "startFrame": 25,
        "endFrame": 37
      },
      {
        "word": "tags",
        "startFrame": 37,
        "endFrame": 48
      },
      {
        "word": "into",
        "startFrame": 49,
        "endFrame": 55
      },
      {
        "word": "DOM",
        "startFrame": 55,
        "endFrame": 68
      },
      {
        "word": "nodes",
        "startFrame": 69,
        "endFrame": 84
      }
    ],
    "visual_type": "concept-diagram",
    "emphasis_word": "DOM",
    "nodes": [
      {
        "label": "HTML Tags",
        "sub": "Raw markup tags"
      },
      {
        "label": "DOM Nodes",
        "sub": "Structured tree hierarchy"
      }
    ],
    "edges": [
      {
        "from": 0,
        "to": 1,
        "label": "parses into",
        "dashed": false
      }
    ],
    "labels": [
      "HTML",
      "Tags",
      "DOM Nodes"
    ]
  },
  {
    "scene_number": 3,
    "role": "body",
    "durationInFrames": 137,
    "duration_sec": 4.57,
    "narration": "CSSOM recalculates style cascades concurrently.",
    "on_screen_text": "CSSOM Blocks Until Styles Compute",
    "visual_direction": "Split dual-card neo-brutalist comparison: unstyled tree on the left versus calculated CSSOM cascade on the right.",
    "template": "split-compare",
    "themeColor": "#ff0055",
    "words": [
      {
        "word": "CSSOM",
        "startFrame": 3,
        "endFrame": 12
      },
      {
        "word": "recalculates",
        "startFrame": 13,
        "endFrame": 35
      },
      {
        "word": "style",
        "startFrame": 35,
        "endFrame": 44
      },
      {
        "word": "cascades",
        "startFrame": 45,
        "endFrame": 61
      },
      {
        "word": "concurrently",
        "startFrame": 61,
        "endFrame": 83
      }
    ],
    "visual_type": "split-compare",
    "emphasis_word": "cascades",
    "nodes": [
      {
        "label": "CSSOM",
        "sub": "Recalculates rules"
      },
      {
        "label": "Style Cascades",
        "sub": "Concurrent computation"
      }
    ],
    "edges": [
      {
        "from": 0,
        "to": 1,
        "label": "computes concurrently",
        "dashed": true
      }
    ],
    "labels": [
      "CSSOM",
      "Cascades",
      "Concurrent"
    ]
  },
  {
    "scene_number": 4,
    "role": "body",
    "durationInFrames": 137,
    "duration_sec": 4.57,
    "narration": "Styles snap onto matching layout nodes.",
    "on_screen_text": "CSS Rules Cascade And Bind",
    "visual_direction": "Stacked overlapping cards showing CSS rule specificity (#id, .class, tag) slamming down into a locked bundle.",
    "template": "card-stack",
    "themeColor": "#ffe600",
    "words": [
      {
        "word": "Styles",
        "startFrame": 3,
        "endFrame": 15
      },
      {
        "word": "snap",
        "startFrame": 16,
        "endFrame": 25
      },
      {
        "word": "onto",
        "startFrame": 26,
        "endFrame": 33
      },
      {
        "word": "matching",
        "startFrame": 33,
        "endFrame": 45
      },
      {
        "word": "layout",
        "startFrame": 45,
        "endFrame": 54
      },
      {
        "word": "nodes",
        "startFrame": 55,
        "endFrame": 71
      }
    ],
    "visual_type": "process-flow",
    "emphasis_word": "snap",
    "nodes": [
      {
        "label": "Styles",
        "sub": "Calculated cascade rules"
      },
      {
        "label": "Layout Nodes",
        "sub": "Matched element tree"
      }
    ],
    "edges": [
      {
        "from": 0,
        "to": 1,
        "label": "snap onto",
        "dashed": false
      }
    ],
    "labels": [
      "Styles",
      "Snap",
      "Layout Nodes"
    ]
  },
  {
    "scene_number": 5,
    "role": "body",
    "durationInFrames": 137,
    "duration_sec": 4.57,
    "narration": "Render trees layout and paint pixels.",
    "on_screen_text": "Render Tree Drives Layout Paint",
    "visual_direction": "Two converging directional arrow pathways uniting into a central glowing Render Tree diamond.",
    "template": "flow-path",
    "themeColor": "#ff0055",
    "words": [
      {
        "word": "Render",
        "startFrame": 3,
        "endFrame": 14
      },
      {
        "word": "trees",
        "startFrame": 14,
        "endFrame": 23
      },
      {
        "word": "layout",
        "startFrame": 23,
        "endFrame": 35
      },
      {
        "word": "and",
        "startFrame": 36,
        "endFrame": 39
      },
      {
        "word": "paint",
        "startFrame": 39,
        "endFrame": 47
      },
      {
        "word": "pixels",
        "startFrame": 47,
        "endFrame": 68
      }
    ],
    "visual_type": "3d-showcase",
    "icon": "⚡",
    "emphasis_word": "paint",
    "nodes": [
      {
        "label": "Render Trees",
        "sub": "Combined DOM & CSSOM"
      },
      {
        "label": "Pixels",
        "sub": "Layout and paint"
      }
    ],
    "edges": [
      {
        "from": 0,
        "to": 1,
        "label": "paint",
        "dashed": false
      }
    ],
    "labels": [
      "Render Trees",
      "Layout",
      "Paint Pixels"
    ]
  },
  {
    "scene_number": 6,
    "role": "body",
    "durationInFrames": 137,
    "duration_sec": 4.57,
    "narration": "JavaScript triggers real-time DOM mutations.",
    "on_screen_text": "JavaScript Mutates Living DOM Nodes",
    "visual_direction": "Neo-brutalist performance gauge badge showing 16.6ms counter next to an official JavaScript logo badge.",
    "template": "data-badge",
    "themeColor": "#ffe600",
    "words": [
      {
        "word": "JavaScript",
        "startFrame": 3,
        "endFrame": 22
      },
      {
        "word": "triggers",
        "startFrame": 22,
        "endFrame": 35
      },
      {
        "word": "real-time",
        "startFrame": 35,
        "endFrame": 49
      },
      {
        "word": "DOM",
        "startFrame": 50,
        "endFrame": 61
      },
      {
        "word": "mutations",
        "startFrame": 61,
        "endFrame": 88
      }
    ],
    "visual_type": "concept-diagram",
    "emphasis_word": "mutations",
    "nodes": [
      {
        "label": "JavaScript",
        "sub": "Script execution"
      },
      {
        "label": "DOM Mutations",
        "sub": "Real-time updates"
      }
    ],
    "edges": [
      {
        "from": 0,
        "to": 1,
        "label": "triggers",
        "dashed": false
      }
    ],
    "labels": [
      "JavaScript",
      "Real-time",
      "DOM Mutations"
    ]
  },
  {
    "scene_number": 7,
    "role": "cta",
    "durationInFrames": 137,
    "duration_sec": 4.57,
    "narration": "Follow to learn deep web engineering.",
    "on_screen_text": "Follow To Master Web Engineering",
    "visual_direction": "Central triumphant trio badge grouping HTML, CSS, and JS into a unified golden button with animated follow arrows.",
    "template": "cta-outro",
    "themeColor": "#ffe600",
    "words": [
      {
        "word": "Follow",
        "startFrame": 3,
        "endFrame": 14
      },
      {
        "word": "to",
        "startFrame": 14,
        "endFrame": 18
      },
      {
        "word": "learn",
        "startFrame": 18,
        "endFrame": 26
      },
      {
        "word": "deep",
        "startFrame": 26,
        "endFrame": 33
      },
      {
        "word": "web",
        "startFrame": 33,
        "endFrame": 39
      },
      {
        "word": "engineering",
        "startFrame": 40,
        "endFrame": 60
      }
    ],
    "visual_type": "outro",
    "emphasis_word": "engineering",
    "nodes": [
      {
        "label": "Web Engineering",
        "sub": "HTML, CSS, JavaScript"
      }
    ],
    "edges": [],
    "labels": [
      "Learn",
      "Deep Web",
      "Engineering"
    ]
  }
];

// Synchronized Kinetic Karaoke Captions
const KineticCaptions: React.FC<{
  words: WordTiming[];
  currentFrame: number;
  accentColor: string;
}> = ({ words = [], currentFrame, accentColor }) => {
  if (!words.length) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 110,
        left: 60,
        right: 60,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px 14px',
        padding: '24px 32px',
        borderRadius: 24,
        background: 'rgba(9, 13, 22, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        zIndex: 50,
      }}
    >
      {words.map((item, idx) => {
        const isActive = currentFrame >= item.startFrame && currentFrame <= item.endFrame;
        const isPast = currentFrame > item.endFrame;

        return (
          <span
            key={idx}
            style={{
              fontSize: 34,
              fontWeight: isActive ? 800 : isPast ? 600 : 500,
              color: isActive ? '#ffffff' : isPast ? '#94a3b8' : 'rgba(255,255,255,0.45)',
              transform: isActive ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.08s ease, color 0.08s ease',
              textShadow: isActive ? `0 0 18px ${accentColor}` : 'none',
              padding: '2px 8px',
              borderRadius: 8,
              background: isActive ? `${accentColor}26` : 'transparent',
            }}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
};

// 1. 3D-SHOWCASE: High-Fidelity 60 FPS 3D Floating Stage with Isometric Orbital Perspective
const ThreeDShowcaseView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '#ffe600';
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 120, mass: 0.9 } });
  const opacity = interpolate(frame, [0, Math.round(fps * 0.2)], [0, 1], { extrapolateRight: 'clamp' });
  
  // 60 FPS ultra-smooth orbital rotation
  const rotY = (frame * 0.75) % 360;
  const rotX = 22 + Math.sin(frame * 0.035) * 6;
  const floatZ = Math.sin(frame * 0.045) * 14;

  const emphasisTrigger = scene.words?.find(w => w.word.toLowerCase() === scene.emphasis_word?.toLowerCase())?.startFrame ?? 20;
  const emphasisPop = spring({ frame: frame - emphasisTrigger, fps, config: { damping: 14, stiffness: 220 } });
  const popScale = 1 + Math.max(0, emphasisPop) * 0.12;

  const node = scene.nodes?.[0] || { label: scene.emphasis_word || scene.on_screen_text || 'Core Engine' };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '160px 60px 220px',
        perspective: 1200,
        opacity,
      }}
    >
      <h2
        style={{
          fontSize: 48,
          fontWeight: 900,
          textAlign: 'center',
          color: '#ffffff',
          margin: '0 0 32px 0',
          lineHeight: 1.25,
          textShadow: '0 4px 20px rgba(0,0,0,0.6)',
          transform: `translateY(${(1 - entrance) * 30}px)`,
        }}
      >
        {scene.on_screen_text || scene.narration}
      </h2>

      <div
        style={{
          width: 520,
          height: 520,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `scale(${entrance * popScale}) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${floatZ}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -40,
            borderRadius: '50%',
            border: `2px solid ${color}55`,
            background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
            transform: 'translateZ(-40px)',
            boxShadow: `0 0 80px ${color}33`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'rgba(30, 41, 59, 0.9)',
            border: `2px solid ${color}`,
            boxShadow: `0 0 30px ${color}66`,
            transform: `rotateZ(${frame * 1.2}deg) translateX(220px) rotateZ(-${frame * 1.2}deg) translateZ(40px)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}
        >
          ⚡
        </div>

        <div
          style={{
            position: 'absolute',
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'rgba(30, 41, 59, 0.9)',
            border: `2px solid ${color}`,
            boxShadow: `0 0 30px ${color}66`,
            transform: `rotateZ(${frame * 1.2 + 180}deg) translateX(220px) rotateZ(-${frame * 1.2 + 180}deg) translateZ(40px)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}
        >
          🔐
        </div>

        <div
          style={{
            width: 380,
            height: 380,
            borderRadius: 36,
            background: `radial-gradient(circle at 30% 30%, ${color}33 0%, rgba(15, 23, 42, 0.96) 80%)`,
            border: `3px solid ${color}`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.8), 0 0 60px ${color}55, inset 0 0 40px ${color}22`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateZ(60px)',
            padding: 32,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 96, marginBottom: 16 }}>{scene.icon || '🌐'}</span>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#ffffff', letterSpacing: 1 }}>
            {node.label}
          </div>
          {node.sub && (
            <div style={{ fontSize: 22, color: '#94a3b8', marginTop: 8 }}>
              {node.sub}
            </div>
          )}
        </div>
      </div>

      <KineticCaptions words={scene.words || []} currentFrame={frame} accentColor={color} />
    </AbsoluteFill>
  );
};

// 2. IMAGE-HERO: Cinematic Ken Burns Motion with Glassmorphic Floating Frame
const ImageHeroView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '#ffe600';
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 120, mass: 0.9 } });
  const zoom = interpolate(frame, [0, scene.durationInFrames || Math.round(fps * 3.5)], [1.0, 1.12], { extrapolateRight: 'clamp' });
  const panX = Math.sin(frame * 0.02) * 12;
  const panY = Math.cos(frame * 0.025) * 8;
  const opacity = interpolate(frame, [0, Math.round(fps * 0.2)], [0, 1], { extrapolateRight: 'clamp' });

  const rawSrc = scene.image_url || scene.asset_url;
  const imgSrc = rawSrc ? (rawSrc.startsWith('http') || rawSrc.startsWith('/') ? rawSrc : staticFile(rawSrc)) : null;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '140px 60px 220px',
        opacity,
      }}
    >
      <h2
        style={{
          fontSize: 48,
          fontWeight: 900,
          textAlign: 'center',
          color: '#ffffff',
          margin: '0 0 28px 0',
          lineHeight: 1.25,
          textShadow: '0 4px 24px rgba(0,0,0,0.7)',
          transform: `translateY(${(1 - entrance) * 24}px)`,
        }}
      >
        {scene.on_screen_text || scene.narration}
      </h2>

      <div
        style={{
          width: 900,
          height: 520,
          borderRadius: 32,
          overflow: 'hidden',
          position: 'relative',
          border: `2px solid ${color}aa`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.75), 0 0 50px ${color}44`,
          transform: `scale(${entrance})`,
          background: 'rgba(15, 23, 42, 0.95)',
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: `radial-gradient(circle at 50% 50%, ${color}33 0%, #0b1120 100%)`,
              gap: 20,
            }}
          >
            <span style={{ fontSize: 96, transform: `scale(${1 + Math.sin(frame * 0.08) * 0.05})` }}>
              {scene.icon || '🖼️'}
            </span>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>
              {scene.emphasis_word || scene.on_screen_text}
            </div>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(9, 13, 22, 0.85) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        {scene.subtitle && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 32,
              right: 32,
              fontSize: 24,
              fontWeight: 600,
              color: '#f8fafc',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            {scene.subtitle}
          </div>
        )}
      </div>

      <KineticCaptions words={scene.words || []} currentFrame={frame} accentColor={color} />
    </AbsoluteFill>
  );
};

// 3. ConceptDiagram: Layered organic motion with springs (damping 12, stiffness 120), parallax & no card box
const ConceptDiagramView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '#ffe600';
  const springCfg = { damping: 12, stiffness: 120 };

  // Rule 11: Parallax camera drift (Background 2%, Foreground 6%)
  const bgDrift = Math.sin(frame * 0.015) * 12;
  const fgDrift = Math.cos(frame * 0.02) * 24;

  // Rule 9 & 10: Staggered entry with anticipation pullback & overshoot
  const enterA = spring({ frame: Math.max(0, frame - 4), fps, config: springCfg });
  const pullA = interpolate(frame, [0, 4], [0, -14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  const enterB = spring({ frame: Math.max(0, frame - 12), fps, config: springCfg });
  const pullB = interpolate(frame, [8, 12], [0, -14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Rule 12: Subtle idle motion (float, breathe, rotate +-2 deg)
  const idleFloatA = Math.sin(frame * 0.07) * 7;
  const idleRotA = Math.sin(frame * 0.05) * 2;
  const idleFloatB = Math.cos(frame * 0.07) * 7;
  const idleRotB = -Math.sin(frame * 0.05) * 2;

  const nodes = scene.nodes && scene.nodes.length ? scene.nodes : [{ label: scene.on_screen_text || scene.narration || '' }];
  const nodeA = nodes[0] || { label: 'Source' };
  const nodeB = nodes[1] || { label: 'Target' };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 60px 220px',
        transform: `translateY(${bgDrift}px)`,
      }}
    >
      {/* Layer 4: Kinetic Typography Hero Headline */}
      <h2
        style={{
          fontSize: 52,
          fontWeight: 900,
          color: '#ffffff',
          margin: '0 0 50px 0',
          textAlign: 'center',
          lineHeight: 1.22,
          maxWidth: 960,
          textShadow: '0 8px 30px rgba(0,0,0,0.85)',
          transform: `translateY(${(1 - enterA) * 30}px)`,
        }}
      >
        {scene.on_screen_text || scene.narration}
      </h2>

      {/* Layer 2 & 3: Floating Midground / Foreground Nodes with Soft Drop Shadows */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          width: '100%',
          maxWidth: 980,
          transform: `translateY(${fgDrift}px)`,
        }}
      >
        {/* Node 1 */}
        <div
          style={{
            flex: 1,
            padding: '36px 28px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border: `2px solid ${color}`,
            textAlign: 'center',
            boxShadow: `0 25px 50px rgba(0,0,0,0.7), 0 0 40px ${color}55`,
            filter: 'drop-shadow(0 20px 25px rgba(0,0,0,0.5))',
            transform: `scale(${enterA}) translateY(${pullA + idleFloatA}px) rotate(${idleRotA}deg)`,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 900, color: '#ffffff' }}>{nodeA.label}</div>
          {nodeA.sub && <div style={{ fontSize: 22, color: '#94a3b8', marginTop: 10, fontWeight: 500 }}>{nodeA.sub}</div>}
        </div>

        {/* Animated Connecting Vector Track */}
        <div style={{ width: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="140" height="36" viewBox="0 0 140 36">
            <line
              x1="0"
              y1="18"
              x2="120"
              y2="18"
              stroke={color}
              strokeWidth="5"
              strokeDasharray="10 8"
              strokeDashoffset={-frame * 4}
            />
            <polygon
              points="120,8 138,18 120,28"
              fill={color}
              transform={`translate(${Math.sin(frame * 0.15) * 4}, 0)`}
            />
          </svg>
        </div>

        {/* Node 2 */}
        <div
          style={{
            flex: 1,
            padding: '36px 28px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.28)',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0,0,0,0.7), 0 0 35px rgba(245, 158, 11, 0.4)',
            filter: 'drop-shadow(0 20px 25px rgba(0,0,0,0.5))',
            transform: `scale(${enterB}) translateY(${pullB + idleFloatB}px) rotate(${idleRotB}deg)`,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 900, color: '#ff0055' }}>{nodeB.label}</div>
          {nodeB.sub && <div style={{ fontSize: 22, color: '#94a3b8', marginTop: 10, fontWeight: 500 }}>{nodeB.sub}</div>}
        </div>
      </div>

      <KineticCaptions words={scene.words || []} currentFrame={frame} accentColor={color} />
    </AbsoluteFill>
  );
};

// 2. ProcessFlow: Sequential steps from the plan with animated progress pulse
const ProcessFlowView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '#ffe600';
  const steps = scene.labels && scene.labels.length ? scene.labels : (scene.nodes?.map(n => n.label) || [scene.on_screen_text || '']);
  const activeStep = Math.floor(interpolate(frame, [8, scene.durationInFrames - 15], [0, Math.max(0.1, steps.length - 0.01)], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '160px 60px 220px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, width: 880 }}>
        <h2 style={{ fontSize: 46, fontWeight: 800, textAlign: 'center', color: '#ffffff', margin: 0, lineHeight: 1.25 }}>
          {scene.on_screen_text || scene.narration}
        </h2>

        {steps.map((label, idx) => {
          const isCurrent = activeStep === idx;
          const isPassed = activeStep > idx;
          const stepSpring = spring({ frame: frame - idx * 8, fps, config: { damping: 14, mass: 0.7 } });
          const pulse = isCurrent ? Math.sin(frame * 0.15) * 6 : 0;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '24px 32px',
                borderRadius: 20,
                background: isCurrent ? `${color}22` : isPassed ? 'rgba(30, 41, 59, 0.75)' : 'rgba(15, 23, 42, 0.6)',
                border: isCurrent ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.12)',
                transform: `scale(${Math.max(0, stepSpring)}) translateY(${pulse}px)`,
                boxShadow: isCurrent ? `0 10px 35px ${color}44` : 'none',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: isCurrent ? color : isPassed ? '#ff0055' : '#334155',
                  color: isCurrent ? '#020617' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 24,
                }}
              >
                {idx + 1}
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: isCurrent ? '#ffffff' : '#94a3b8' }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <KineticCaptions words={scene.words || []} currentFrame={frame} accentColor={color} />
    </AbsoluteFill>
  );
};

// 3. SplitCompare: Dynamic side-by-side comparison cards with oscillating laser beam
const SplitCompareView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '#ffe600';
  const entrance = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const laserPos = Math.sin(frame * 0.08) * 100;
  const nodes = scene.nodes && scene.nodes.length >= 2 ? scene.nodes : [
    { label: 'Aspect A' },
    { label: 'Aspect B' }
  ];

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '160px 60px 220px',
      }}
    >
      <div
        style={{
          transform: `scale(${entrance})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          width: 920,
        }}
      >
        <h2 style={{ fontSize: 46, fontWeight: 800, textAlign: 'center', color: '#ffffff', margin: 0, lineHeight: 1.25 }}>
          {scene.on_screen_text || scene.narration}
        </h2>

        <div style={{ position: 'relative', display: 'flex', gap: 24, width: '100%' }}>
          {/* Side A */}
          <div
            style={{
              flex: 1,
              padding: 36,
              borderRadius: 24,
              background: `${color}18`,
              border: `2px solid ${color}`,
              boxShadow: `0 10px 30px ${color}33`,
              transform: `translateY(${Math.sin(frame * 0.06) * 8}px)`,
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 800, color: '#ffffff' }}>{nodes[0]?.label}</div>
            {nodes[0]?.sub && <div style={{ fontSize: 22, color: '#94a3b8', marginTop: 10 }}>{nodes[0]?.sub}</div>}
          </div>

          {/* Side B */}
          <div
            style={{
              flex: 1,
              padding: 36,
              borderRadius: 24,
              background: 'rgba(245, 158, 11, 0.12)',
              border: '2px solid #ff0055',
              boxShadow: '0 10px 30px rgba(245, 158, 11, 0.25)',
              transform: `translateY(${-Math.sin(frame * 0.06) * 8}px)`,
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 800, color: '#ffffff' }}>{nodes[1]?.label}</div>
            {nodes[1]?.sub && <div style={{ fontSize: 22, color: '#94a3b8', marginTop: 10 }}>{nodes[1]?.sub}</div>}
          </div>

          {/* Central Laser Divider */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              bottom: '10%',
              left: '50%',
              width: 3,
              background: '#ffffff',
              boxShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
              transform: `translateX(-50%) translateY(${laserPos}px)`,
            }}
          />
        </div>
      </div>

      <KineticCaptions words={scene.words || []} currentFrame={frame} accentColor={color} />
    </AbsoluteFill>
  );
};

// 4. Callout / Hero Focus View: High-impact keyword presentation with rotating orbitals
const CalloutView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '#ffe600';
  const entrance = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const pulse = Math.sin(frame * 0.08) * 8;
  const cameraZoom = 1.0 + (frame / (scene.durationInFrames || 90)) * 0.06;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '160px 60px 220px',
        transform: `scale(${cameraZoom})`,
      }}
    >
      <div
        style={{
          transform: `scale(${entrance}) translateY(${(1 - entrance) * 60 + pulse}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          maxWidth: 900,
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 900,
            textAlign: 'center',
            color: '#ffffff',
            lineHeight: 1.2,
            margin: 0,
            textShadow: '0 4px 24px rgba(0,0,0,0.6)',
          }}
        >
          {scene.on_screen_text || scene.narration}
        </h1>

        {/* Orbitals & Focus Node */}
        <div style={{ position: 'relative', width: 180, height: 180, marginTop: 16 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px dashed ${color}88`,
              transform: `rotate(${frame * 1.8}deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 20,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${color} 50%, #030712 100%)`,
              boxShadow: `0 0 60px ${color}aa`,
              transform: `scale(${1 + Math.sin(frame * 0.1) * 0.08}) rotate(-${frame * 1.2}deg)`,
            }}
          />
        </div>

        {scene.emphasis_word && (
          <div
            style={{
              padding: '10px 28px',
              borderRadius: 999,
              background: `${color}22`,
              border: `2px solid ${color}`,
              color: color,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: 'uppercase',
              boxShadow: `0 0 30px ${color}44`,
            }}
          >
            {scene.emphasis_word}
          </div>
        )}
      </div>

      <KineticCaptions words={scene.words || []} currentFrame={frame} accentColor={color} />
    </AbsoluteFill>
  );
};

// 5. StatCounterView: Quantitative display with verified source citation
const StatCounterView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '#ffe600';
  const entrance = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const dialRotation = frame * 2.2;
  const pulse = Math.sin(frame * 0.1) * 6;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '160px 60px 220px',
      }}
    >
      <div
        style={{
          transform: `scale(${entrance}) translateY(${pulse}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          width: 900,
        }}
      >
        <h2 style={{ fontSize: 50, fontWeight: 900, textAlign: 'center', color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
          {scene.on_screen_text || scene.narration}
        </h2>

        {/* Circular Gauge */}
        <div style={{ position: 'relative', width: 240, height: 240 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `4px dashed ${color}`,
              boxShadow: `0 0 40px ${color}66`,
              transform: `rotate(${dialRotation}deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 60, fontWeight: 900, color: '#ffffff' }}>
              {scene.stat_value || '+' + Math.min(100, Math.floor(frame * 2)) + '%'}
            </div>
          </div>
        </div>

        {scene.source_url && (
          <div style={{ fontSize: 18, color: '#94a3b8', fontFamily: 'monospace' }}>
            Source: {scene.source_url}
          </div>
        )}
      </div>

      <KineticCaptions words={scene.words || []} currentFrame={frame} accentColor={color} />
    </AbsoluteFill>
  );
};

// 6. OutroView: Clean brand resolution
const OutroView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const brandPurple = '#5b1a78';
  const brandPurpleLight = '#9a4cc2';
  const brandDark = '#1d1a1a';
  const brandCream = '#fdf3d0';

  const entrance = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const pulse = Math.sin(frame * 0.1) * 0.05;
  const gearRot = frame * 2.2;
  const orbitRot = frame * 1.5;
  const shinePos = interpolate(frame, [25, 65], [-300, 700], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: brandCream,
      }}
    >
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Video
          src={staticFile('bittrix-logo.mp4')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          bottom: 260,
          left: 60,
          right: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 24, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 4, color: brandPurpleLight }}>
          Engineering Innovation
        </span>
      </div>

      <KineticCaptions words={scene.words || []} currentFrame={frame} accentColor={brandPurple} />
    </AbsoluteFill>
  );
};

// Scene Dispatcher
const SceneRouter: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
  index: number;
}> = ({ scene, frame, fps, index }) => {
  const vType = scene.visual_type || 'callout';

  switch (vType) {
    case 'outro':
      return <OutroView scene={scene} frame={frame} fps={fps} />;
    case '3d-showcase':
      return <ThreeDShowcaseView scene={scene} frame={frame} fps={fps} />;
    case 'image-hero':
      return <ImageHeroView scene={scene} frame={frame} fps={fps} />;
    case 'concept-diagram':
      return <ConceptDiagramView scene={scene} frame={frame} fps={fps} />;
    case 'process-flow':
    case 'timeline':
      return <ProcessFlowView scene={scene} frame={frame} fps={fps} />;
    case 'split-compare':
      return <SplitCompareView scene={scene} frame={frame} fps={fps} />;
    case 'stat-counter':
      return <StatCounterView scene={scene} frame={frame} fps={fps} />;
    case 'callout':
    default:
      return <CalloutView scene={scene} frame={frame} fps={fps} />;
  }
};

export default function GeneratedCliVideo(props: any) {
  const { fps } = useVideoConfig();
  const globalFrame = useCurrentFrame();

  const scenes = useMemo(() => {
    if (props?.scenes && Array.isArray(props.scenes) && props.scenes.length > 0) {
      return props.scenes as ScenePayload[];
    }
    return BAKED_SCENES;
  }, [props?.scenes]);

  let accumulatedFrame = 0;

  // Global Continuous Animated Ambient Lighting (60 FPS Smooth Flow)
  const bgShiftX = 50 + Math.sin(globalFrame * 0.015) * 18;
  const bgShiftY = 35 + Math.cos(globalFrame * 0.02) * 14;

  const isLastOutroScene = scenes.length > 0 && scenes[scenes.length - 1].visual_type === 'outro';
  const contentFramesTotal = isLastOutroScene
    ? scenes.slice(0, -1).reduce((acc, s) => acc + (s.durationInFrames || Math.round(fps * 3.5)), 0)
    : 999999;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#fffdf0',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Themed ambient glow: strictly active during content scenes only, never touches or occludes Outro */}
      {globalFrame < contentFramesTotal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${bgShiftX}% ${bgShiftY}%, #ffe6002e 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {scenes.map((scene, index) => {
        const fromFrame = accumulatedFrame;
        const durationFrames = scene.durationInFrames || Math.round(fps * 3.5);
        accumulatedFrame += durationFrames;

        return (
          <Sequence
            key={scene.scene_number || index}
            from={fromFrame}
            durationInFrames={durationFrames}
          >
            <SceneContent scene={scene} fps={fps} index={index} />

            {/* Embedded Audio SFX Cues Synchronized at Exact Frame Timestamps */}
            {scene.audioCues?.map((cue, cIdx) => (
              cue.src ? (
                <Sequence
                  key={`sfx-${scene.scene_number || index}-${cIdx}`}
                  from={cue.hitFrame ?? cue.frame ?? 0}
                  durationInFrames={Math.round(fps * 1.5)}
                >
                  <Audio
                    src={cue.src.startsWith('http') || cue.src.startsWith('/') ? cue.src : staticFile(cue.src)}
                    volume={cue.volume ?? 0.4}
                  />
                </Sequence>
              ) : null
            ))}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

const SceneContent: React.FC<{
  scene: ScenePayload;
  fps: number;
  index: number;
}> = ({ scene, fps, index }) => {
  const frame = useCurrentFrame();
  return <SceneRouter scene={scene} frame={frame} fps={fps} index={index} />;
};
