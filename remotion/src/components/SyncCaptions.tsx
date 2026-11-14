import React from "react";
import { useCurrentFrame } from "remotion";
import type { TimelineScene } from "../lib/motionSyncTypes";

/**
 * Caption block that is layout-stable:
 *  - every word is an inline-block followed by a REAL space text node, so spacing can never be lost
 *  - active word changes only colour / glow, never font-size or weight -> no reflow
 *  - fixed width, fixed alignment, fixed line-height: text never jumps between frames
 */
export const SyncCaptions: React.FC<{
  scene?: TimelineScene;
  words?: Array<{ word?: string; text?: string; startFrame: number; endFrame: number }>;
  currentFrame?: number;
  accentColor?: string;
  bottom?: number;
  fontSize?: number;
}> = ({ scene, words: directWords, currentFrame, accentColor = "#FFE066", bottom = 220, fontSize = 64 }) => {
  const currentRemotionFrame = useCurrentFrame();
  const frame = currentFrame !== undefined ? currentFrame : currentRemotionFrame;
  const wordList = directWords || scene?.words || [];
  
  const active = wordList.findIndex(
    (w) => frame >= w.startFrame && frame < w.endFrame,
  );
  const lastSpoken = wordList.reduce(
    (acc, w, i) => (frame >= w.startFrame ? i : acc),
    -1,
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        bottom,
        textAlign: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 700,
        fontSize,
        lineHeight: 1.25,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        textShadow: "0 4px 24px rgba(0,0,0,0.65)",
      }}
    >
      {wordList.map((w: any, i) => {
        const text = w.word || w.text || '';
        const isActive = i === active;
        const spoken = i <= lastSpoken;
        return (
          <React.Fragment key={i}>
            <span
              style={{
                display: "inline-block",
                color: isActive ? accentColor : spoken ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                textShadow: isActive ? `0 0 22px ${accentColor}b3` : undefined,
                transform: isActive ? "translateY(-3px) scale(1.04)" : "none",
              }}
            >
              {text}
            </span>
            {i < wordList.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Captions = SyncCaptions;
export default SyncCaptions;
