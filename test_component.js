const { tsxValidator } = require("./backend/dist/modules/production/tsxValidator.js");

const code = `import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Interfaces
interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface AudioCue {
  frame: number;
  hitFrame?: number;
  role?: string;
  volume?: number;
}

const SCENE_1_WORDS: WordTiming[] = [
  { word: "Hash", startFrame: 3, endFrame: 11 },
  { word: "functions", startFrame: 12, endFrame: 27 },
  { word: "transform", startFrame: 27, endFrame: 47 },
  { word: "search", startFrame: 47, endFrame: 57 },
  { word: "keys", startFrame: 57, endFrame: 71 },
  { word: "into", startFrame: 75, endFrame: 81 },
  { word: "deterministic", startFrame: 81, endFrame: 103 },
  { word: "memory", startFrame: 104, endFrame: 116 },
  { word: "offsets", startFrame: 116, endFrame: 132 },
  { word: "within", startFrame: 133, endFrame: 143 },
  { word: "bucket", startFrame: 143, endFrame: 153 },
  { word: "arrays", startFrame: 154, endFrame: 170 },
];

const SCENE_2_WORDS: WordTiming[] = [
  { word: "Chained", startFrame: 3, endFrame: 11 },
  { word: "pointers", startFrame: 11, endFrame: 28 },
  { word: "or", startFrame: 33, endFrame: 37 },
  { word: "linear", startFrame: 38, endFrame: 50 },
  { word: "probing", startFrame: 51, endFrame: 63 },
  { word: "resolve", startFrame: 64, endFrame: 74 },
  { word: "collisions", startFrame: 74, endFrame: 92 },
  { word: "to", startFrame: 98, endFrame: 102 },
  { word: "verify", startFrame: 102, endFrame: 120 },
  { word: "matching", startFrame: 126, endFrame: 139 },
  { word: "key", startFrame: 139, endFrame: 144 },
  { word: "nodes", startFrame: 144, endFrame: 159 },
];

const SCENE_3_WORDS: WordTiming[] = [
  { word: "Accelerate", startFrame: 3, endFrame: 22 },
  { word: "your", startFrame: 22, endFrame: 28 },
  { word: "engineering", startFrame: 28, endFrame: 46 },
  { word: "with", startFrame: 51, endFrame: 56 },
  { word: "Bittrix", startFrame: 59, endFrame: 70 },
  { word: "Technologies", startFrame: 71, endFrame: 95 },
];

export default function GeneratedCliVideo(props: any) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#060a12", color: "#fff" }}>
      <div>Frame {frame}</div>
    </AbsoluteFill>
  );
}
`;

tsxValidator.validate(code).then(r => console.log("Validated:", r));
