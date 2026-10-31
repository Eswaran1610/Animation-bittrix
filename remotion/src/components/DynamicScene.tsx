import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
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
  const durationInFrames = scene.durationInFrames;
  const camera = scene.visualBlueprint?.camera_motion || scene.motion_cue;
  const cameraDrift = /left|pan/i.test(camera) ? -22 : /right/i.test(camera) ? 22 : 0;
  const cameraScale = interpolate(frame, [0, durationInFrames], [1, /zoom|push|dolly/i.test(camera) ? 1.075 : 1.025], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const color = scene.themeColor;

  // Clean, readable subtitle without dumping raw direction paragraphs
  const cleanSubtitle = scene.subtitle;

  return (
    <AbsoluteFill style={{
      transform: `translateX(${interpolate(frame, [0, durationInFrames], [0, cameraDrift], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px) scale(${cameraScale})`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: styleProfile?.background || '#05070f',
      overflow: 'hidden'
    }}>
      {/* Persistent animated atmosphere: no scene is visually frozen. */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle at 50% 50%, ${(styleProfile?.primary || color)}22 0%, transparent 65%)`,
        opacity: styleProfile?.family === 'editorial-paper' ? 0.35 : 1,
        transform: `scale(${1.05 + Math.sin(frame * 0.025) * 0.035}) translate(${Math.sin(frame * 0.018) * 18}px, ${Math.cos(frame * 0.015) * 14}px)`
      }} />

      {/* Render Dynamic Motion Element based on Topic-Specific Plan */}
      <div style={{
        position: 'absolute',
        // Reserve the top for readable copy and use the centre as a large,
        // always-moving hero stage. This keeps the bottom platform-controls
        // safe zone completely clear.
        top: '690px',
        right: '120px',
        bottom: '350px',
        left: '120px',
        overflow: 'hidden',
        transform: `translateY(${Math.sin(frame * 0.03) * 12}px)`
      }}>
        {scene.visualBlueprint?.website_view
          ? <WebsiteVisitVisual view={scene.visualBlueprint.website_view} accent={color} imageAssets={scene.image_assets} styleProfile={styleProfile} />
          : scene.visualBlueprint && <BlueprintVisual blueprint={scene.visualBlueprint} imageAssets={scene.image_assets} durationInFrames={scene.durationInFrames} />}
      </div>

      {/* Hero Kinetic Typography */}
      <div style={{
        position: 'absolute',
        left: '120px',
        right: '120px',
        top: '250px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxHeight: '520px'
      }}>
        <KineticTitle
          title={scene.on_screen_text}
          subtitle={cleanSubtitle}
          color={color}
          delayFrames={5}
        />

        {/* Dynamic Kinetic Takeaways if provided for this scene */}
        {scene.key_takeaways && scene.key_takeaways.length > 0 && (
          <KineticTakeawayList items={scene.key_takeaways.slice(0, 3)} color={color} />
        )}
      </div>
    </AbsoluteFill>
  );
};
