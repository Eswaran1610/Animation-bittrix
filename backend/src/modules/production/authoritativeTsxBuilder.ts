/**
 * Authoritative Remotion TSX Builder
 *
 * Generates modular, high-production scene animations in pure Remotion TSX
 * strictly synchronized to measured word-level audio alignment timestamps.
 */

export interface AuthoritativeSceneData {
  scene_number: number;
  role?: string;
  template?: string;
  durationInFrames: number;
  durationSec?: number;
  narration?: string;
  on_screen_text?: string;
  subtitle?: string;
  visual_direction?: string;
  themeColor?: string;
  words?: Array<{
    word: string;
    startFrame: number;
    endFrame: number;
    startSec?: number;
    endSec?: number;
  }>;
}

export function buildAuthoritativeTsx(
  projectTitle: string,
  scenes: AuthoritativeSceneData[],
  styleBrief?: any
): string {
  const primaryColor = styleBrief?.palette?.primary || '#22d3ee';
  const accentColor = styleBrief?.palette?.accent || '#f59e0b';
  const bgColor = styleBrief?.palette?.bg || '#090d16';

  const serializedScenes = JSON.stringify(scenes, null, 2);

  return `import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

export interface ScenePayload {
  scene_number: number;
  role?: string;
  template?: string;
  durationInFrames: number;
  duration_sec?: number;
  durationSec?: number;
  narration?: string;
  on_screen_text?: string;
  subtitle?: string;
  visual_direction?: string;
  themeColor?: string;
  words?: WordTiming[];
}

const BAKED_SCENES: ScenePayload[] = ${serializedScenes};

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
        bottom: 140,
        left: 60,
        right: 60,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px 14px',
        padding: '24px 32px',
        borderRadius: 24,
        background: 'rgba(9, 13, 22, 0.82)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
      }}
    >
      {words.map((item, idx) => {
        const isActive =
          currentFrame >= item.startFrame && currentFrame <= item.endFrame;
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
              textShadow: isActive ? \`0 0 18px \${accentColor}\` : 'none',
              padding: '2px 8px',
              borderRadius: 8,
              background: isActive ? \`\${accentColor}26\` : 'transparent',
            }}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
};

// Scene 1: Opening Hook with Kinetic Hero Badge
const HookSceneView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '${primaryColor}';
  const entrance = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const pulse = Math.sin(frame * 0.08) * 8;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          transform: \`scale(\${entrance}) translateY(\${(1 - entrance) * 60 + pulse}px)\`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            padding: '10px 28px',
            borderRadius: 999,
            background: \`\${color}22\`,
            border: \`2px solid \${color}\`,
            color: color,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            boxShadow: \`0 0 30px \${color}44\`,
          }}
        >
          {scene.role || 'CORE EXPLAINER'}
        </div>

        <h1
          style={{
            fontSize: 64,
            fontWeight: 900,
            textAlign: 'center',
            color: '#ffffff',
            lineHeight: 1.15,
            maxWidth: 900,
            margin: 0,
            textShadow: '0 4px 24px rgba(0,0,0,0.6)',
          }}
        >
          {scene.on_screen_text || '${projectTitle}'}
        </h1>

        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: \`radial-gradient(circle at 35% 35%, #ffffff 0%, \${color} 50%, #030712 100%)\`,
            boxShadow: \`0 0 60px \${color}aa\`,
            marginTop: 20,
            transform: \`rotate(\${frame * 1.5}deg)\`,
          }}
        />
      </div>

      <KineticCaptions
        words={scene.words || []}
        currentFrame={frame}
        accentColor={color}
      />
    </AbsoluteFill>
  );
};

// Scene 2: Interactive Terminal / Code Console Stage
const TerminalSceneView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '${primaryColor}';
  const entrance = spring({ frame, fps, config: { damping: 15, mass: 0.9 } });
  const typingChars = Math.min(
    scene.on_screen_text?.length || 40,
    Math.max(0, Math.floor((frame - 10) * 1.8))
  );

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          width: 940,
          borderRadius: 24,
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.65)',
          overflow: 'hidden',
          transform: \`scale(\${entrance}) translateY(\${(1 - entrance) * 50}px)\`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '18px 24px',
            background: 'rgba(2, 6, 23, 0.65)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#27c93f' }} />
          <span style={{ marginLeft: 16, color: '#64748b', fontSize: 18, fontFamily: 'monospace' }}>
            ~/pipeline/runtime.tsx
          </span>
        </div>

        <div style={{ padding: 36, fontFamily: 'monospace', fontSize: 30, color: '#e2e8f0', lineHeight: 1.5 }}>
          <div style={{ color: '#94a3b8' }}>// Active Audio-Synced Animation Execution</div>
          <div style={{ marginTop: 14 }}>
            <span style={{ color: '${accentColor}' }}>const </span>
            <span style={{ color: color }}>engine </span>
            <span>= </span>
            <span style={{ color: '#38bdf8' }}>Remotion</span>
            <span>.init();</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <span style={{ color: '#a855f7' }}>await </span>
            <span style={{ color: color }}>engine</span>
            <span>.render(</span>
            <span style={{ color: '#4ade80' }}>
              "{(scene.on_screen_text || 'Compiling scene...').slice(0, typingChars)}"
            </span>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 28,
                background: color,
                marginLeft: 4,
                verticalAlign: 'middle',
                opacity: Math.sin(frame * 0.25) > 0 ? 1 : 0,
              }}
            />
            <span>);</span>
          </div>
        </div>
      </div>

      <KineticCaptions
        words={scene.words || []}
        currentFrame={frame}
        accentColor={color}
      />
    </AbsoluteFill>
  );
};

// Scene 3: Connected Node Flow & Pipeline Architecture
const FlowSceneView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '${primaryColor}';
  const nodes = ['Research & Story', 'Audio & Speech', 'TSX Generation', 'Remotion Render'];
  const progress = interpolate(frame, [10, scene.durationInFrames - 15], [0, 3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          width: 880,
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          {scene.on_screen_text || 'Pipeline Execution Graph'}
        </h2>

        {nodes.map((label, idx) => {
          const isReached = progress >= idx;
          const nodeSpring = spring({
            frame: frame - idx * 8,
            fps,
            config: { damping: 14, mass: 0.7 },
          });

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '22px 32px',
                borderRadius: 20,
                background: isReached ? \`\${color}18\` : 'rgba(15, 23, 42, 0.65)',
                border: isReached ? \`2px solid \${color}\` : '1px solid rgba(255,255,255,0.1)',
                transform: \`scale(\${Math.max(0, nodeSpring)})\`,
                boxShadow: isReached ? \`0 10px 30px \${color}33\` : 'none',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: isReached ? color : '#334155',
                  color: isReached ? '#020617' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 22,
                }}
              >
                {idx + 1}
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: isReached ? '#ffffff' : '#94a3b8' }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <KineticCaptions
        words={scene.words || []}
        currentFrame={frame}
        accentColor={color}
      />
    </AbsoluteFill>
  );
};

// Scene 4: Key Metrics & Data Cards
const MetricSceneView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const color = scene.themeColor || '${primaryColor}';
  const entrance = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const count = Math.min(100, Math.floor(interpolate(frame, [5, 45], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          transform: \`scale(\${entrance})\`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1,
            textShadow: \`0 0 50px \${color}88\`,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {count}%
        </div>

        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: color,
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          {scene.on_screen_text || '100% Deterministic Video Generation'}
        </div>
      </div>

      <KineticCaptions
        words={scene.words || []}
        currentFrame={frame}
        accentColor={color}
      />
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
  const template = scene.template || '';

  if (template.includes('terminal') || template.includes('code') || index % 4 === 1) {
    return <TerminalSceneView scene={scene} frame={frame} fps={fps} />;
  }
  if (template.includes('flow') || template.includes('path') || index % 4 === 2) {
    return <FlowSceneView scene={scene} frame={frame} fps={fps} />;
  }
  if (template.includes('metric') || template.includes('badge') || index % 4 === 3) {
    return <MetricSceneView scene={scene} frame={frame} fps={fps} />;
  }
  return <HookSceneView scene={scene} frame={frame} fps={fps} />;
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

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '${bgColor}',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 30%, rgba(34, 211, 238, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {scenes.map((scene, index) => {
        const fromFrame = accumulatedFrame;
        const durationFrames = scene.durationInFrames || 90;
        accumulatedFrame += durationFrames;

        return (
          <Sequence
            key={scene.scene_number || index}
            from={fromFrame}
            durationInFrames={durationFrames}
          >
            <SceneContent scene={scene} fps={fps} index={index} />
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
`;
}
