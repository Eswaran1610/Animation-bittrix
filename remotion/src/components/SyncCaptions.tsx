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
}> = ({ scene, words: directWords, currentFrame, accentColor = "#FFE066", bottom = 400, fontSize = 60 }) => {
  const currentRemotionFrame = useCurrentFrame();
  const frame = currentFrame !== undefined ? currentFrame : currentRemotionFrame;
  const wordList = directWords || scene?.words || [];

  // Responsive font scaling: automatically adjust if sentence is long to prevent multi-line overflow
  const responsiveFontSize = wordList.length > 12 ? Math.max(42, fontSize - 14) : wordList.length > 8 ? Math.max(48, fontSize - 8) : fontSize;
  
  const active = wordList.findIndex(
    (w) => frame >= w.startFrame && frame <= w.endFrame,
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
        fontWeight: 800,
        fontSize: responsiveFontSize,
        lineHeight: 1.25,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        textShadow: "0 4px 24px rgba(0,0,0,0.85)",
        zIndex: 50,
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
