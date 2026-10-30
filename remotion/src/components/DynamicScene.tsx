import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  KineticTitle,
  OrbitalRings,
  NetworkNodes,
  MetricBar,
  DynamicDiagram,
  AssetImageCard,
  KineticTakeawayList,
  DynamicNode
} from './MotionElements';

export interface SceneData {
  id: string;
  scene_number: number;
  title: string;
  on_screen_text: string;
  subtitle?: string;
  key_takeaways?: string[];
  concept_nodes?: DynamicNode[];
  metric_data?: {
    label: string;
    value: number;
    unit: string;
  };
  visual_direction?: string;
  duration_sec: number;
  durationInFrames: number;
  visualType?: 'orbital' | 'network' | 'metric' | 'headline' | 'diagram';
  themeColor?: string;
  narration?: string;
  image_url?: string;
}

export const DynamicScene: React.FC<{
  scene: SceneData;
  index: number;
  totalScenes: number;
}> = ({ scene, index, totalScenes }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Smooth scene fade in and out transition
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const color = scene.themeColor || (index % 3 === 0 ? '#38bdf8' : index % 3 === 1 ? '#fbbf24' : '#34d399');
  const visualType = scene.visualType || (index === 0 ? 'headline' : index === 1 ? 'diagram' : index === 2 ? 'network' : 'metric');

  // Clean, readable subtitle without dumping raw direction paragraphs
  const cleanSubtitle = scene.subtitle || (scene.narration ? (scene.narration.length > 90 ? scene.narration.slice(0, 87) + '...' : scene.narration) : '');

  return (
    <AbsoluteFill style={{
      opacity,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#05070f',
      overflow: 'hidden'
    }}>
      {/* Background Animated Atmosphere */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle at 50% 50%, ${color}15 0%, transparent 65%)`
      }} />

      {/* Render Dynamic Motion Element based on Topic-Specific Plan */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {visualType === 'orbital' && <OrbitalRings color={color} />}
        {visualType === 'network' && <NetworkNodes color={color} nodes={scene.concept_nodes} />}
        {visualType === 'metric' && (
          <MetricBar
            color={color}
            label={scene.metric_data?.label || 'EFFICIENCY METRIC'}
            value={scene.metric_data?.value || 92}
            unit={scene.metric_data?.unit || '%'}
          />
        )}
        {visualType === 'diagram' && <DynamicDiagram color={color} title={scene.title} />}
        {scene.image_url && <AssetImageCard imageUrl={scene.image_url} color={color} label={scene.title} />}
      </div>

      {/* Hero Kinetic Typography */}
      <div style={{
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: (visualType === 'headline' || (!scene.image_url && visualType !== 'diagram')) ? '0' : '290px'
      }}>
        <KineticTitle
          badge={`Scene 0${scene.scene_number || index + 1} of 0${totalScenes} • ${scene.title || 'Concept'}`}
          title={scene.on_screen_text || 'Key Concept'}
          subtitle={cleanSubtitle}
          color={color}
          delayFrames={5}
        />

        {/* Dynamic Kinetic Takeaways if provided for this scene */}
        {scene.key_takeaways && scene.key_takeaways.length > 0 && (
          <KineticTakeawayList items={scene.key_takeaways} color={color} />
        )}
      </div>
    </AbsoluteFill>
  );
};
