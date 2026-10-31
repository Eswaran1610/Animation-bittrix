import React from 'react';
import { AbsoluteFill, Sequence, Audio, interpolate, staticFile } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { DynamicScene } from './components/DynamicScene';
import { SceneDataPayload } from './data/sceneTypes';

export const MainVideo: React.FC<{ sceneData: SceneDataPayload }> = ({ sceneData }) => {
  const scenes = sceneData.scenes;
  const fps = sceneData.video.fps;
  const audioUrl = sceneData.video.audioUrl;
  const backgroundAudioUrl = sceneData.video.backgroundAudioUrl;

  let currentOffset = 0;
  // Use one absolute clock for picture and sound. A cue's frame is authored
  // relative to its scene, then converted once here for the whole timeline.
  const timedCues = scenes.flatMap((scene) => {
    const sceneStart = currentOffset;
    currentOffset += scene.durationInFrames - (scene.transitionOutFrames || 0);
    return (scene.audioCues || []).map((cue) => ({
      ...cue,
      frame: sceneStart + cue.frame,
    }));
  });

  const narrationVolume = (frame: number) => {
    // Let the small movement/appearance hits cut through the narration. The
    // dip begins just before the visual hit and recovers smoothly afterward.
    const duck = timedCues.reduce((amount, cue) => {
      const distance = frame - cue.frame;
      if (distance < -3 || distance > 10) return amount;
      return Math.max(amount, interpolate(distance, [-3, 0, 10], [0, 0.34, 0]));
    }, 0);
    return 1 - duck;
  };

  currentOffset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070f' }}>
      {/* Synchronized Neural Voiceover Narration Track */}
      {audioUrl && (
        <Audio src={staticFile(audioUrl)} volume={narrationVolume} />
      )}
      {backgroundAudioUrl && (
        <Audio src={staticFile(backgroundAudioUrl)} volume={(frame) => 0.5 * narrationVolume(frame)} />
      )}

      {/* Object sounds are rendered from the same absolute timeline as the
          visuals, so scene boundaries cannot shift their timing. */}
      {timedCues.map((cue, cueIndex) => (
        <Sequence key={`cue-${cueIndex}`} from={cue.frame}>
          <Audio src={staticFile(cue.src)} volume={cue.volume ?? 0.7} />
        </Sequence>
      ))}

      <TransitionSeries>
        {scenes.flatMap((scene, idx) => {
          const durationFrames = scene.durationInFrames;
          const transitionFrames = scene.transitionOutFrames || 0;
          const direction = idx % 2 === 0 ? 'from-right' : 'from-bottom';
          const parts = [
            <TransitionSeries.Sequence key={scene.id || idx} durationInFrames={durationFrames}>
            <DynamicScene
              scene={scene}
              index={idx}
              totalScenes={scenes.length}
              styleProfile={sceneData.video.styleProfile}
            />
            </TransitionSeries.Sequence>
          ];
          if (idx < scenes.length - 1 && transitionFrames > 0) {
            parts.push(<TransitionSeries.Transition key={`${scene.id}-transition`} presentation={slide({ direction })} timing={linearTiming({ durationInFrames: transitionFrames })} />);
          }
          return parts;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
