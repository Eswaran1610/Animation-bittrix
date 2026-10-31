import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticTitle, KineticTakeawayList } from './MotionElements';
import { BlueprintVisual } from './BlueprintVisual';
import { WebsiteVisitVisual } from './WebsiteVisitVisual';
import { SceneData, StyleProfile } from '../data/sceneTypes';

export const DynamicScene: React.FC<{
  scene: SceneData;
  index: number;
  totalScenes: number;
  styleProfile?: StyleProfile;
}> = ({ scene, index, totalScenes, styleProfile }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Smooth scene fade in and out transition
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const color = scene.themeColor;

  // Clean, readable subtitle without dumping raw direction paragraphs
  const cleanSubtitle = scene.subtitle;

  return (
    <AbsoluteFill style={{
      opacity,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: styleProfile?.background || '#05070f',
      overflow: 'hidden'
    }}>
      {/* Background Animated Atmosphere */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle at 50% 50%, ${(styleProfile?.primary || color)}22 0%, transparent 65%)`,
        opacity: styleProfile?.family === 'editorial-paper' ? 0.35 : 1
      }} />

      {/* Render Dynamic Motion Element based on Topic-Specific Plan */}
      <div style={{
        position: 'absolute',
        top: '28px',
        right: '54px',
        bottom: '390px',
        left: '54px',
        overflow: 'hidden',
        transform: 'translateY(-12px)'
      }}>
        {scene.visualBlueprint?.website_view
          ? <WebsiteVisitVisual view={scene.visualBlueprint.website_view} accent={color} imageAssets={scene.image_assets} styleProfile={styleProfile} />
          : scene.visualBlueprint && <BlueprintVisual blueprint={scene.visualBlueprint} imageAssets={scene.image_assets} />}
      </div>

      {/* Hero Kinetic Typography */}
      <div style={{
        position: 'absolute',
        left: '72px',
        right: '72px',
        bottom: '42px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxHeight: '330px'
      }}>
        <KineticTitle
          badge={`Scene ${String(scene.scene_number).padStart(2, '0')} of ${String(totalScenes).padStart(2, '0')} • ${scene.title}`}
          title={scene.on_screen_text}
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
