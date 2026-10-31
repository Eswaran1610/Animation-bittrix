import React from 'react';
import { AbsoluteFill, Sequence, Audio } from 'remotion';
import { DynamicScene } from './components/DynamicScene';
import { WordCaptions } from './components/WordCaptions';
import { SceneDataPayload } from './data/sceneTypes';
import { assetSource } from './assetSource';

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
        <Audio src={assetSource(audioUrl)} volume={1.0} />
      )}

      {/* Object sounds are rendered from the same absolute timeline as the
          visuals, so scene boundaries cannot shift their timing. */}
      {timedCues.map((cue, cueIndex) => (
        <Sequence key={`cue-${cueIndex}`} from={cue.frame}>
          <Audio src={staticFile(cue.src)} volume={cue.volume ?? 0.7} />
        </Sequence>
      ))}

        return (
          <Sequence
            key={scene.id || idx}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            {scene.audioCues?.map((cue, cueIndex) => (
              <Sequence key={`${scene.id}-cue-${cueIndex}`} from={cue.frame} durationInFrames={Math.max(1, durationFrames - cue.frame)}>
                <Audio src={assetSource(cue.src)} volume={cue.volume ?? 0.7} />
              </Sequence>
            ))}
            <DynamicScene
              scene={scene}
              index={idx}
              totalScenes={scenes.length}
              styleProfile={sceneData.video.styleProfile}
            />
          </Sequence>
        );
      })}

      <WordCaptions captions={sceneData.video.captions} color={sceneData.video.styleProfile?.primary} />
    </AbsoluteFill>
  );
};
