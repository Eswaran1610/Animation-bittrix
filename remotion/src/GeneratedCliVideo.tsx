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
  start?: number;
  startFrame?: number;
  voiceStart?: number;
  visualStart?: number;
  frames?: number;
  role?: string;
  template?: string;
  visual_type?: '3d-showcase' | 'image-hero' | 'concept-diagram' | 'process-flow' | 'split-compare' | 'timeline' | 'callout' | 'stat-counter' | 'outro';
  durationInFrames: number;
  duration_sec?: number;
  durationSec?: number;
  narration?: string;
  narrationAudio?: string;
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
    "id": "scene-1",
    "scene_number": 1,
    "role": "hook",
    "template": "question-hook",
    "visual_type": "concept-diagram",
    "themeColor": "#38bdf8",
    "start": 0,
    "startFrame": 0,
    "voiceStart": 0,
    "visualStart": 0,
    "frames": 193,
    "durationInFrames": 193,
    "duration_sec": 6.433333333333334,
    "narration": "PostgreSQL implements Lehman-Yao B-link trees to enable concurrent index lookups without read locks.",
    "narrationAudio": "audio/ba2927d5-2788-453d-a91e-cc006a579ddf_sc1_voice.mp3",
    "title": "PostgreSQL implements Lehman-Yao B-link",
    "on_screen_text": "PostgreSQL implements Lehman-Yao B-link trees to enable concurrent index lookups without read locks.",
    "emphasis_word": "enable",
    "audioCues": [
      {
        "frame": 1,
        "hitFrame": 1,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/whoosh_01.wav",
        "role": "whoosh",
        "volume": 0.45,
        "durationFrames": 25
      },
      {
        "frame": 90,
        "hitFrame": 90,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/pop_01.wav",
        "role": "pop",
        "volume": 0.55,
        "durationFrames": 25
      }
    ],
    "nodes": [
      {
        "label": "PostgreSQL implements Lehman-Yao B-link trees to enable",
        "sub": "Core Engine",
        "icon": "⚡"
      },
      {
        "label": "concurrent index lookups without read locks",
        "sub": "High Throughput",
        "icon": "🚀"
      }
    ],
    "labels": [
      "PostgreSQL",
      "implements",
      "Lehman-Yao"
    ],
    "words": [
      {
        "word": "PostgreSQL",
        "startFrame": 3,
        "endFrame": 31
      },
      {
        "word": "implements",
        "startFrame": 31,
        "endFrame": 45
      },
      {
        "word": "Lehman-Yao",
        "startFrame": 46,
        "endFrame": 62
      },
      {
        "word": "B-link",
        "startFrame": 62,
        "endFrame": 76
      },
      {
        "word": "trees",
        "startFrame": 76,
        "endFrame": 87
      },
      {
        "word": "to",
        "startFrame": 88,
        "endFrame": 92
      },
      {
        "word": "enable",
        "startFrame": 92,
        "endFrame": 104
      },
      {
        "word": "concurrent",
        "startFrame": 104,
        "endFrame": 118
      },
      {
        "word": "index",
        "startFrame": 119,
        "endFrame": 132
      },
      {
        "word": "lookups",
        "startFrame": 132,
        "endFrame": 146
      },
      {
        "word": "without",
        "startFrame": 146,
        "endFrame": 157
      },
      {
        "word": "read",
        "startFrame": 158,
        "endFrame": 164
      },
      {
        "word": "locks",
        "startFrame": 164,
        "endFrame": 180
      }
    ]
  },
  {
    "id": "scene-2",
    "scene_number": 2,
    "role": "body",
    "template": "steps-numbered",
    "visual_type": "process-flow",
    "themeColor": "#38bdf8",
    "start": 193,
    "startFrame": 193,
    "voiceStart": 193,
    "visualStart": 193,
    "frames": 155,
    "durationInFrames": 155,
    "duration_sec": 5.166666666666667,
    "narration": "Every interior and leaf page contains a high key and right-link sibling pointer.",
    "narrationAudio": "audio/ba2927d5-2788-453d-a91e-cc006a579ddf_sc2_voice.mp3",
    "title": "Every interior and leaf",
    "on_screen_text": "Every interior and leaf page contains a high key and right-link sibling pointer.",
    "emphasis_word": "a",
    "audioCues": [
      {
        "frame": 1,
        "hitFrame": 1,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/whoosh_01.wav",
        "role": "whoosh",
        "volume": 0.45,
        "durationFrames": 25
      },
      {
        "frame": 69,
        "hitFrame": 69,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/impact_01.wav",
        "role": "impact",
        "volume": 0.55,
        "durationFrames": 25
      }
    ],
    "nodes": [
      {
        "label": "Every interior and leaf page contains a",
        "sub": "Core Engine",
        "icon": "🛡️"
      },
      {
        "label": "high key and right-link sibling pointer",
        "sub": "High Throughput",
        "icon": "🎯"
      }
    ],
    "labels": [
      "Every",
      "interior",
      "and"
    ],
    "words": [
      {
        "word": "Every",
        "startFrame": 3,
        "endFrame": 14
      },
      {
        "word": "interior",
        "startFrame": 14,
        "endFrame": 34
      },
      {
        "word": "and",
        "startFrame": 35,
        "endFrame": 38
      },
      {
        "word": "leaf",
        "startFrame": 39,
        "endFrame": 46
      },
      {
        "word": "page",
        "startFrame": 46,
        "endFrame": 57
      },
      {
        "word": "contains",
        "startFrame": 57,
        "endFrame": 70
      },
      {
        "word": "a",
        "startFrame": 71,
        "endFrame": 72
      },
      {
        "word": "high",
        "startFrame": 73,
        "endFrame": 82
      },
      {
        "word": "key",
        "startFrame": 83,
        "endFrame": 94
      },
      {
        "word": "and",
        "startFrame": 94,
        "endFrame": 99
      },
      {
        "word": "right-link",
        "startFrame": 100,
        "endFrame": 113
      },
      {
        "word": "sibling",
        "startFrame": 113,
        "endFrame": 127
      },
      {
        "word": "pointer",
        "startFrame": 127,
        "endFrame": 142
      }
    ]
  },
  {
    "id": "scene-3",
    "scene_number": 3,
    "role": "body",
    "template": "steps-numbered",
    "visual_type": "concept-diagram",
    "themeColor": "#38bdf8",
    "start": 348,
    "startFrame": 348,
    "voiceStart": 348,
    "visualStart": 348,
    "frames": 179,
    "durationInFrames": 179,
    "duration_sec": 5.966666666666667,
    "narration": "Readers traverse downlink pointers downward through shared buffer pool memory buffers without pin locks.",
    "narrationAudio": "audio/ba2927d5-2788-453d-a91e-cc006a579ddf_sc3_voice.mp3",
    "title": "Readers traverse downlink pointers",
    "on_screen_text": "Readers traverse downlink pointers downward through shared buffer pool memory buffers without pin locks.",
    "emphasis_word": "buffer",
    "audioCues": [
      {
        "frame": 1,
        "hitFrame": 1,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/whoosh_01.wav",
        "role": "whoosh",
        "volume": 0.45,
        "durationFrames": 25
      },
      {
        "frame": 86,
        "hitFrame": 86,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/pop_01.wav",
        "role": "pop",
        "volume": 0.55,
        "durationFrames": 25
      }
    ],
    "nodes": [
      {
        "label": "Readers traverse downlink pointers downward through shared",
        "sub": "Core Engine",
        "icon": "⚙️"
      },
      {
        "label": "buffer pool memory buffers without pin locks",
        "sub": "High Throughput",
        "icon": "💡"
      }
    ],
    "labels": [
      "Readers",
      "traverse",
      "downlink"
    ],
    "words": [
      {
        "word": "Readers",
        "startFrame": 3,
        "endFrame": 16
      },
      {
        "word": "traverse",
        "startFrame": 16,
        "endFrame": 29
      },
      {
        "word": "downlink",
        "startFrame": 29,
        "endFrame": 44
      },
      {
        "word": "pointers",
        "startFrame": 44,
        "endFrame": 57
      },
      {
        "word": "downward",
        "startFrame": 57,
        "endFrame": 71
      },
      {
        "word": "through",
        "startFrame": 71,
        "endFrame": 76
      },
      {
        "word": "shared",
        "startFrame": 77,
        "endFrame": 88
      },
      {
        "word": "buffer",
        "startFrame": 88,
        "endFrame": 98
      },
      {
        "word": "pool",
        "startFrame": 99,
        "endFrame": 108
      },
      {
        "word": "memory",
        "startFrame": 108,
        "endFrame": 117
      },
      {
        "word": "buffers",
        "startFrame": 118,
        "endFrame": 131
      },
      {
        "word": "without",
        "startFrame": 132,
        "endFrame": 142
      },
      {
        "word": "pin",
        "startFrame": 142,
        "endFrame": 150
      },
      {
        "word": "locks",
        "startFrame": 150,
        "endFrame": 167
      }
    ]
  },
  {
    "id": "scene-4",
    "scene_number": 4,
    "role": "body",
    "template": "steps-numbered",
    "visual_type": "process-flow",
    "themeColor": "#38bdf8",
    "start": 527,
    "startFrame": 527,
    "voiceStart": 527,
    "visualStart": 527,
    "frames": 165,
    "durationInFrames": 165,
    "duration_sec": 5.5,
    "narration": "When an inserting worker detects page overflow, it allocates a new right-sibling buffer.",
    "narrationAudio": "audio/ba2927d5-2788-453d-a91e-cc006a579ddf_sc4_voice.mp3",
    "title": "When an inserting worker",
    "on_screen_text": "When an inserting worker detects page overflow, it allocates a new right-sibling buffer.",
    "emphasis_word": "overflow",
    "audioCues": [
      {
        "frame": 1,
        "hitFrame": 1,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/whoosh_01.wav",
        "role": "whoosh",
        "volume": 0.45,
        "durationFrames": 25
      },
      {
        "frame": 60,
        "hitFrame": 60,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/impact_01.wav",
        "role": "impact",
        "volume": 0.55,
        "durationFrames": 25
      }
    ],
    "nodes": [
      {
        "label": "When an inserting worker detects page overflow",
        "sub": "Core Engine",
        "icon": "🚀"
      },
      {
        "label": "it allocates a new right-sibling buffer",
        "sub": "High Throughput",
        "icon": "🔍"
      }
    ],
    "labels": [
      "When",
      "an",
      "inserting"
    ],
    "words": [
      {
        "word": "When",
        "startFrame": 3,
        "endFrame": 9
      },
      {
        "word": "an",
        "startFrame": 9,
        "endFrame": 12
      },
      {
        "word": "inserting",
        "startFrame": 12,
        "endFrame": 27
      },
      {
        "word": "worker",
        "startFrame": 27,
        "endFrame": 37
      },
      {
        "word": "detects",
        "startFrame": 37,
        "endFrame": 51
      },
      {
        "word": "page",
        "startFrame": 51,
        "endFrame": 61
      },
      {
        "word": "overflow",
        "startFrame": 62,
        "endFrame": 80
      },
      {
        "word": "it",
        "startFrame": 90,
        "endFrame": 94
      },
      {
        "word": "allocates",
        "startFrame": 94,
        "endFrame": 110
      },
      {
        "word": "a",
        "startFrame": 110,
        "endFrame": 111
      },
      {
        "word": "new",
        "startFrame": 112,
        "endFrame": 119
      },
      {
        "word": "right-sibling",
        "startFrame": 120,
        "endFrame": 138
      },
      {
        "word": "buffer",
        "startFrame": 138,
        "endFrame": 153
      }
    ]
  },
  {
    "id": "scene-5",
    "scene_number": 5,
    "role": "body",
    "template": "steps-numbered",
    "visual_type": "concept-diagram",
    "themeColor": "#38bdf8",
    "start": 692,
    "startFrame": 692,
    "voiceStart": 692,
    "visualStart": 692,
    "frames": 171,
    "durationInFrames": 171,
    "duration_sec": 5.7,
    "narration": "The inserting backend moves upper-half tuples into the right child while holding exclusive locks.",
    "narrationAudio": "audio/ba2927d5-2788-453d-a91e-cc006a579ddf_sc5_voice.mp3",
    "title": "The inserting backend moves",
    "on_screen_text": "The inserting backend moves upper-half tuples into the right child while holding exclusive locks.",
    "emphasis_word": "the",
    "audioCues": [
      {
        "frame": 1,
        "hitFrame": 1,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/whoosh_01.wav",
        "role": "whoosh",
        "volume": 0.45,
        "durationFrames": 25
      },
      {
        "frame": 79,
        "hitFrame": 79,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/pop_01.wav",
        "role": "pop",
        "volume": 0.55,
        "durationFrames": 25
      }
    ],
    "nodes": [
      {
        "label": "The inserting backend moves upper-half tuples into",
        "sub": "Core Engine",
        "icon": "🎯"
      },
      {
        "label": "the right child while holding exclusive locks",
        "sub": "High Throughput",
        "icon": "🌐"
      }
    ],
    "labels": [
      "The",
      "inserting",
      "backend"
    ],
    "words": [
      {
        "word": "The",
        "startFrame": 3,
        "endFrame": 6
      },
      {
        "word": "inserting",
        "startFrame": 7,
        "endFrame": 23
      },
      {
        "word": "backend",
        "startFrame": 23,
        "endFrame": 38
      },
      {
        "word": "moves",
        "startFrame": 38,
        "endFrame": 48
      },
      {
        "word": "upper-half",
        "startFrame": 48,
        "endFrame": 63
      },
      {
        "word": "tuples",
        "startFrame": 63,
        "endFrame": 75
      },
      {
        "word": "into",
        "startFrame": 76,
        "endFrame": 81
      },
      {
        "word": "the",
        "startFrame": 81,
        "endFrame": 85
      },
      {
        "word": "right",
        "startFrame": 85,
        "endFrame": 93
      },
      {
        "word": "child",
        "startFrame": 94,
        "endFrame": 107
      },
      {
        "word": "while",
        "startFrame": 107,
        "endFrame": 112
      },
      {
        "word": "holding",
        "startFrame": 113,
        "endFrame": 123
      },
      {
        "word": "exclusive",
        "startFrame": 123,
        "endFrame": 141
      },
      {
        "word": "locks",
        "startFrame": 141,
        "endFrame": 158
      }
    ]
  },
  {
    "id": "scene-6",
    "scene_number": 6,
    "role": "body",
    "template": "steps-numbered",
    "visual_type": "process-flow",
    "themeColor": "#38bdf8",
    "start": 863,
    "startFrame": 863,
    "voiceStart": 863,
    "visualStart": 863,
    "frames": 172,
    "durationInFrames": 172,
    "duration_sec": 5.733333333333333,
    "narration": "The original page updates its right-link pointer to point directly to the newly allocated page.",
    "narrationAudio": "audio/ba2927d5-2788-453d-a91e-cc006a579ddf_sc6_voice.mp3",
    "title": "The original page updates",
    "on_screen_text": "The original page updates its right-link pointer to point directly to the newly allocated page.",
    "emphasis_word": "to",
    "audioCues": [
      {
        "frame": 1,
        "hitFrame": 1,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/whoosh_01.wav",
        "role": "whoosh",
        "volume": 0.45,
        "durationFrames": 25
      },
      {
        "frame": 78,
        "hitFrame": 78,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/impact_01.wav",
        "role": "impact",
        "volume": 0.55,
        "durationFrames": 25
      }
    ],
    "nodes": [
      {
        "label": "The original page updates its right-link pointer to",
        "sub": "Core Engine",
        "icon": "💡"
      },
      {
        "label": "point directly to the newly allocated page",
        "sub": "High Throughput",
        "icon": "⚡"
      }
    ],
    "labels": [
      "The",
      "original",
      "page"
    ],
    "words": [
      {
        "word": "The",
        "startFrame": 3,
        "endFrame": 6
      },
      {
        "word": "original",
        "startFrame": 7,
        "endFrame": 21
      },
      {
        "word": "page",
        "startFrame": 22,
        "endFrame": 32
      },
      {
        "word": "updates",
        "startFrame": 33,
        "endFrame": 46
      },
      {
        "word": "its",
        "startFrame": 47,
        "endFrame": 51
      },
      {
        "word": "right-link",
        "startFrame": 51,
        "endFrame": 66
      },
      {
        "word": "pointer",
        "startFrame": 67,
        "endFrame": 79
      },
      {
        "word": "to",
        "startFrame": 80,
        "endFrame": 83
      },
      {
        "word": "point",
        "startFrame": 83,
        "endFrame": 92
      },
      {
        "word": "directly",
        "startFrame": 92,
        "endFrame": 107
      },
      {
        "word": "to",
        "startFrame": 108,
        "endFrame": 111
      },
      {
        "word": "the",
        "startFrame": 111,
        "endFrame": 114
      },
      {
        "word": "newly",
        "startFrame": 114,
        "endFrame": 125
      },
      {
        "word": "allocated",
        "startFrame": 126,
        "endFrame": 143
      },
      {
        "word": "page",
        "startFrame": 144,
        "endFrame": 159
      }
    ]
  },
  {
    "id": "scene-7",
    "scene_number": 7,
    "role": "body",
    "template": "steps-numbered",
    "visual_type": "concept-diagram",
    "themeColor": "#38bdf8",
    "start": 1035,
    "startFrame": 1035,
    "voiceStart": 1035,
    "visualStart": 1035,
    "frames": 160,
    "durationInFrames": 160,
    "duration_sec": 5.333333333333333,
    "narration": "A concurrent reader observing a key exceeding the high key steps right across right-links.",
    "narrationAudio": "audio/ba2927d5-2788-453d-a91e-cc006a579ddf_sc7_voice.mp3",
    "title": "A concurrent reader observing",
    "on_screen_text": "A concurrent reader observing a key exceeding the high key steps right across right-links.",
    "emphasis_word": "the",
    "audioCues": [
      {
        "frame": 1,
        "hitFrame": 1,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/whoosh_01.wav",
        "role": "whoosh",
        "volume": 0.45,
        "durationFrames": 25
      },
      {
        "frame": 73,
        "hitFrame": 73,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/pop_01.wav",
        "role": "pop",
        "volume": 0.55,
        "durationFrames": 25
      }
    ],
    "nodes": [
      {
        "label": "A concurrent reader observing a key exceeding",
        "sub": "Core Engine",
        "icon": "🔍"
      },
      {
        "label": "the high key steps right across right-links",
        "sub": "High Throughput",
        "icon": "🛡️"
      }
    ],
    "labels": [
      "A",
      "concurrent",
      "reader"
    ],
    "words": [
      {
        "word": "A",
        "startFrame": 3,
        "endFrame": 7
      },
      {
        "word": "concurrent",
        "startFrame": 7,
        "endFrame": 22
      },
      {
        "word": "reader",
        "startFrame": 22,
        "endFrame": 31
      },
      {
        "word": "observing",
        "startFrame": 32,
        "endFrame": 45
      },
      {
        "word": "a",
        "startFrame": 46,
        "endFrame": 48
      },
      {
        "word": "key",
        "startFrame": 48,
        "endFrame": 59
      },
      {
        "word": "exceeding",
        "startFrame": 59,
        "endFrame": 74
      },
      {
        "word": "the",
        "startFrame": 75,
        "endFrame": 77
      },
      {
        "word": "high",
        "startFrame": 77,
        "endFrame": 87
      },
      {
        "word": "key",
        "startFrame": 87,
        "endFrame": 94
      },
      {
        "word": "steps",
        "startFrame": 95,
        "endFrame": 107
      },
      {
        "word": "right",
        "startFrame": 108,
        "endFrame": 114
      },
      {
        "word": "across",
        "startFrame": 114,
        "endFrame": 127
      },
      {
        "word": "right-links",
        "startFrame": 127,
        "endFrame": 148
      }
    ]
  },
  {
    "id": "scene-8",
    "scene_number": 8,
    "role": "body",
    "template": "steps-numbered",
    "visual_type": "process-flow",
    "themeColor": "#38bdf8",
    "start": 1195,
    "startFrame": 1195,
    "voiceStart": 1195,
    "visualStart": 1195,
    "frames": 182,
    "durationInFrames": 182,
    "duration_sec": 6.066666666666666,
    "narration": "Concurrent reads continue uninterrupted even before parent downlink pointers are updated by inserts.",
    "narrationAudio": "audio/ba2927d5-2788-453d-a91e-cc006a579ddf_sc8_voice.mp3",
    "title": "Concurrent reads continue uninterrupted",
    "on_screen_text": "Concurrent reads continue uninterrupted even before parent downlink pointers are updated by inserts.",
    "emphasis_word": "parent",
    "audioCues": [
      {
        "frame": 1,
        "hitFrame": 1,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/whoosh_01.wav",
        "role": "whoosh",
        "volume": 0.45,
        "durationFrames": 25
      },
      {
        "frame": 84,
        "hitFrame": 84,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/impact_01.wav",
        "role": "impact",
        "volume": 0.55,
        "durationFrames": 25
      }
    ],
    "nodes": [
      {
        "label": "Concurrent reads continue uninterrupted even before parent",
        "sub": "Core Engine",
        "icon": "🌐"
      },
      {
        "label": "downlink pointers are updated by inserts",
        "sub": "High Throughput",
        "icon": "⚙️"
      }
    ],
    "labels": [
      "Concurrent",
      "reads",
      "continue"
    ],
    "words": [
      {
        "word": "Concurrent",
        "startFrame": 3,
        "endFrame": 19
      },
      {
        "word": "reads",
        "startFrame": 19,
        "endFrame": 28
      },
      {
        "word": "continue",
        "startFrame": 29,
        "endFrame": 44
      },
      {
        "word": "uninterrupted",
        "startFrame": 45,
        "endFrame": 66
      },
      {
        "word": "even",
        "startFrame": 66,
        "endFrame": 74
      },
      {
        "word": "before",
        "startFrame": 75,
        "endFrame": 85
      },
      {
        "word": "parent",
        "startFrame": 86,
        "endFrame": 96
      },
      {
        "word": "downlink",
        "startFrame": 96,
        "endFrame": 110
      },
      {
        "word": "pointers",
        "startFrame": 111,
        "endFrame": 124
      },
      {
        "word": "are",
        "startFrame": 124,
        "endFrame": 129
      },
      {
        "word": "updated",
        "startFrame": 130,
        "endFrame": 143
      },
      {
        "word": "by",
        "startFrame": 143,
        "endFrame": 148
      },
      {
        "word": "inserts",
        "startFrame": 148,
        "endFrame": 169
      }
    ]
  },
  {
    "id": "scene-9",
    "scene_number": 9,
    "role": "body",
    "template": "steps-numbered",
    "visual_type": "concept-diagram",
    "themeColor": "#38bdf8",
    "start": 1377,
    "startFrame": 1377,
    "voiceStart": 1377,
    "visualStart": 1377,
    "frames": 151,
    "durationInFrames": 151,
    "duration_sec": 5.033333333333333,
    "narration": "The worker writes a split write-ahead log record before inserting the new parent downlink.",
    "narrationAudio": "audio/ba2927d5-2788-453d-a91e-cc006a579ddf_sc9_voice.mp3",
    "title": "The worker writes a",
    "on_screen_text": "The worker writes a split write-ahead log record before inserting the new parent downlink.",
    "emphasis_word": "record",
    "audioCues": [
      {
        "frame": 1,
        "hitFrame": 1,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/whoosh_01.wav",
        "role": "whoosh",
        "volume": 0.45,
        "durationFrames": 25
      },
      {
        "frame": 65,
        "hitFrame": 65,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/pop_01.wav",
        "role": "pop",
        "volume": 0.55,
        "durationFrames": 25
      }
    ],
    "nodes": [
      {
        "label": "The worker writes a split write-ahead log",
        "sub": "Core Engine",
        "icon": "⚡"
      },
      {
        "label": "record before inserting the new parent downlink",
        "sub": "High Throughput",
        "icon": "🚀"
      }
    ],
    "labels": [
      "The",
      "worker",
      "writes"
    ],
    "words": [
      {
        "word": "The",
        "startFrame": 3,
        "endFrame": 7
      },
      {
        "word": "worker",
        "startFrame": 8,
        "endFrame": 19
      },
      {
        "word": "writes",
        "startFrame": 19,
        "endFrame": 27
      },
      {
        "word": "a",
        "startFrame": 27,
        "endFrame": 29
      },
      {
        "word": "split",
        "startFrame": 30,
        "endFrame": 41
      },
      {
        "word": "write-ahead",
        "startFrame": 42,
        "endFrame": 57
      },
      {
        "word": "log",
        "startFrame": 57,
        "endFrame": 66
      },
      {
        "word": "record",
        "startFrame": 67,
        "endFrame": 77
      },
      {
        "word": "before",
        "startFrame": 78,
        "endFrame": 88
      },
      {
        "word": "inserting",
        "startFrame": 88,
        "endFrame": 102
      },
      {
        "word": "the",
        "startFrame": 102,
        "endFrame": 105
      },
      {
        "word": "new",
        "startFrame": 105,
        "endFrame": 110
      },
      {
        "word": "parent",
        "startFrame": 111,
        "endFrame": 121
      },
      {
        "word": "downlink",
        "startFrame": 121,
        "endFrame": 139
      }
    ]
  },
  {
    "id": "scene-10",
    "scene_number": 10,
    "role": "cta",
    "template": "cta-outro",
    "visual_type": "outro",
    "themeColor": "#5b1a78",
    "start": 1528,
    "startFrame": 1528,
    "voiceStart": 1528,
    "visualStart": 1528,
    "frames": 135,
    "durationInFrames": 135,
    "duration_sec": 4.5,
    "narration": "Accelerate your engineering with Bittrix Technologies.",
    "narrationAudio": "audio/ba2927d5-2788-453d-a91e-cc006a579ddf_sc10_voice.mp3",
    "title": "Accelerate your engineering with",
    "on_screen_text": "Accelerate your engineering with Bittrix Technologies.",
    "emphasis_word": "with",
    "audioCues": [
      {
        "frame": 1,
        "hitFrame": 1,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/whoosh_01.wav",
        "role": "whoosh",
        "volume": 0.45,
        "durationFrames": 25
      },
      {
        "frame": 46,
        "hitFrame": 46,
        "src": "sfx/ba2927d5-2788-453d-a91e-cc006a579ddf/chime_01.wav",
        "role": "chime",
        "volume": 0.55,
        "durationFrames": 25
      }
    ],
    "nodes": [
      {
        "label": "Accelerate your engineering",
        "sub": "Core Engine",
        "icon": "🛡️"
      },
      {
        "label": "with Bittrix Technologies",
        "sub": "High Throughput",
        "icon": "🎯"
      }
    ],
    "labels": [
      "Accelerate",
      "your",
      "engineering"
    ],
    "words": [
      {
        "word": "Accelerate",
        "startFrame": 3,
        "endFrame": 24
      },
      {
        "word": "your",
        "startFrame": 24,
        "endFrame": 30
      },
      {
        "word": "engineering",
        "startFrame": 30,
        "endFrame": 47
      },
      {
        "word": "with",
        "startFrame": 48,
        "endFrame": 53
      },
      {
        "word": "Bittrix",
        "startFrame": 53,
        "endFrame": 65
      },
      {
        "word": "Technologies",
        "startFrame": 65,
        "endFrame": 93
      }
    ]
  }
];

// Synchronized Kinetic Karaoke Captions — safe zone strictly above bottom 20% (>= 384px in 1080x1920)
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
        bottom: 400,
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
  const color = scene.themeColor || '#38bdf8';
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
        padding: '120px 60px 440px',
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
            borderRadius: 32,
            border: `2px solid ${color}55`,
            background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
            transform: 'translateZ(-40px)',
            boxShadow: `0 0 80px ${color}33`,
          }}
        />

        {/* Silicon Wafer Substrate & Traces (Zero circular orbits) */}
        <div
          style={{
            position: 'absolute',
            inset: -40,
            borderRadius: 24,
            border: `2px solid ${color}44`,
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
            transform: 'translateZ(-40px)',
            boxShadow: `0 0 80px ${color}33`,
            overflow: 'hidden',
          }}
        >
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <line x1="10%" y1="50%" x2="90%" y2="50%" stroke={color} strokeWidth="3" strokeDasharray="8 6" strokeDashoffset={-frame * 2} />
            <line x1="50%" y1="10%" x2="50%" y2="90%" stroke={color} strokeWidth="3" strokeDasharray="8 6" strokeDashoffset={frame * 2} />
          </svg>
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
  const color = scene.themeColor || '#38bdf8';
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
        padding: '120px 60px 440px',
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
  const color = scene.themeColor || '#38bdf8';
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
        padding: '120px 60px 440px',
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
          <div style={{ fontSize: 36, fontWeight: 900, color: '#00f5d4' }}>{nodeB.label}</div>
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
  const color = scene.themeColor || '#38bdf8';
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
        padding: '120px 60px 440px',
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
                  width: 56,
                  height: 44,
                  borderRadius: 12,
                  background: isCurrent ? color : isPassed ? '#00f5d4' : '#1e293b',
                  border: isCurrent ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'monospace',
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
  const color = scene.themeColor || '#38bdf8';
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
        padding: '120px 60px 440px',
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
              border: '2px solid #00f5d4',
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
  const color = scene.themeColor || '#38bdf8';
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
        padding: '120px 60px 440px',
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

        {/* Architectural Tech Module (Zero circular orbs) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            padding: '24px 36px',
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.85)',
            border: `1px solid ${color}44`,
            boxShadow: `0 20px 50px rgba(0,0,0,0.6), inset 0 0 30px ${color}15`,
            position: 'relative',
          }}
        >
          {/* Corner brackets */}
          <div style={{ position: 'absolute', top: -1, left: -1, width: 14, height: 14, borderTop: `3px solid ${color}`, borderLeft: `3px solid ${color}` }} />
          <div style={{ position: 'absolute', top: -1, right: -1, width: 14, height: 14, borderTop: `3px solid ${color}`, borderRight: `3px solid ${color}` }} />
          <div style={{ position: 'absolute', bottom: -1, left: -1, width: 14, height: 14, borderBottom: `3px solid ${color}`, borderLeft: `3px solid ${color}` }} />
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderBottom: `3px solid ${color}`, borderRight: `3px solid ${color}` }} />

          {/* Monospace System Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'monospace', fontSize: 18, color: '#94a3b8', letterSpacing: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
            <span>CORE_TELEMETRY // VERIFIED</span>
          </div>

          {/* Dynamic Oscillating Signal Bars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44 }}>
            {[18, 32, 24, 40, 28, 36, 20, 30].map((h, i) => {
              const dynH = Math.max(8, h + Math.sin(frame * 0.18 + i * 0.8) * 14);
              return (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: dynH,
                    borderRadius: 3,
                    background: i % 2 === 0 ? color : '#38bdf8',
                    boxShadow: `0 0 10px ${color}66`,
                  }}
                />
              );
            })}
          </div>

          {scene.emphasis_word && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 24px',
                borderRadius: 8,
                background: `${color}25`,
                border: `1px solid ${color}`,
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color }}>▶</span> {scene.emphasis_word}
            </div>
          )}
        </div>
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
  const color = scene.themeColor || '#38bdf8';
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
        padding: '120px 60px 440px',
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

        {/* Linear Segmented Progress Meter (Zero circular gauges) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            padding: '32px 48px',
            borderRadius: 20,
            background: 'rgba(15, 23, 42, 0.9)',
            border: `1px solid ${color}55`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.7), inset 0 0 30px ${color}15`,
            width: '100%',
            maxWidth: 780,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 80, fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>
              {scene.stat_value || '+' + Math.min(100, Math.floor(frame * 2)) + '%'}
            </span>
            <span style={{ fontSize: 24, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2 }}>
              ▲ METRIC_INDEX
            </span>
          </div>

          {/* 12-Segment Tech Bar */}
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            {[...Array(12)].map((_, i) => {
              const activeCount = Math.min(12, Math.floor((frame / 45) * 12));
              const isActive = i < activeCount;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 18,
                    borderRadius: 4,
                    background: isActive ? color : 'rgba(255,255,255,0.1)',
                    boxShadow: isActive ? `0 0 12px ${color}` : 'none',
                    transition: 'background 0.1s ease',
                  }}
                />
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontFamily: 'monospace', fontSize: 16, color: '#94a3b8' }}>
            <span>MIN: 0.00</span>
            <span>TARGET_OPTIMIZED</span>
            <span>MAX: 100.00</span>
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

// Bittrix Outro Mathematical Physics Grounded in /home/eswaran/Downloads/bittrix-reel(1).html
const clOutro = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const segOutro = (t: number, a: number, b: number) => clOutro((t - a) / (b - a));
const eoOutro = (u: number) => 1 - Math.pow(1 - u, 3);
const ebOutro = (u: number) => {
  const s = 1.70158;
  const u1 = u - 1;
  return u1 * u1 * ((s + 1) * u1 + s) + 1;
};

const CX_O = 540;
const CY_O = 720;
const R_O = 250;
const P_O = '#5b1a78';
const D_O = '#1d1a1a';
const BG_O = '#fdf3d0';

const hvOutro = (r: number): [number, number][] =>
  [0, 1, 2, 3, 4, 5].map((i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180;
    return [r * Math.cos(a), r * Math.sin(a)];
  });

const HX_O = hvOutro(R_O);
const CH_O = hvOutro(R_O + 48).map((p) => [p[0] + CX_O, p[1] + CY_O]);
const NODES_O = [5, 1, 3].map((i) => [CX_O + HX_O[i][0] * 1.04, CY_O + HX_O[i][1] * 1.04]);

// 6. OutroView: Grounded in /home/eswaran/Downloads/bittrix-reel(1).html
const OutroView: React.FC<{
  scene: ScenePayload;
  frame: number;
  fps: number;
}> = ({ scene, frame, fps }) => {
  const t = Math.min(3, Math.max(0, frame / fps));

  // Hexagon scale and rotation
  const hs = ebOutro(segOutro(t, 0, 0.7));
  const hexRot = (1 - eoOutro(segOutro(t, 0, 0.8))) * -60;

  // Rolling chain alpha
  const ca = segOutro(t, 0.3, 0.6) * (1 - segOutro(t, 2, 2.45));
  const ph = 0.6 * t + 0.25 * t * t;
  const N = 42;

  // Gear & B scale
  const gs = ebOutro(segOutro(t, 0.6, 1.3));
  const gearRot = t * 2.2 * (180 / Math.PI);

  // Underline expansion
  const bw = 520 * eoOutro(segOutro(t, 2.1, 2.6));

  // Light shine sweep
  const sh = segOutro(t, 2.35, 2.95);
  const shineX = -400 + (1080 + 800) * sh;

  return (
    <AbsoluteFill
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 540px 720px, #fff9e2 0%, #fdf3d0 80%)',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="hexRadialOutro" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7a2ba3" />
            <stop offset="100%" stopColor="#5b1a78" />
          </radialGradient>
        </defs>

        {/* 1. Main Hexagon */}
        <g transform={`translate(${CX_O}, ${CY_O}) rotate(${hexRot}) scale(${Math.max(0, hs)})`}>
          <polygon
            points={HX_O.map((p) => `${p[0]},${p[1]}`).join(' ')}
            fill="url(#hexRadialOutro)"
            filter="drop-shadow(0 0 35px rgba(91, 26, 120, 0.45))"
          />
        </g>

        {/* 2. Spokes and Outer Nodes */}
        {NODES_O.map((n, i) => {
          const u = eoOutro(segOutro(t, 0.5 + i * 0.12, 1.0 + i * 0.12));
          const ex = n[0] + (CX_O - n[0]) * 0.5 * u;
          const ey = n[1] + (CY_O - n[1]) * 0.5 * u;
          const s = ebOutro(segOutro(t, 0.5 + i * 0.12, 0.9 + i * 0.12)) * (1 + 0.07 * Math.sin(t * 7 + i));

          return (
            <g key={i}>
              <line x1={n[0]} y1={n[1]} x2={ex} y2={ey} stroke={P_O} strokeWidth={9} strokeLinecap="round" />
              <circle
                cx={n[0]}
                cy={n[1]}
                r={Math.max(0, 36 * s)}
                fill={P_O}
                stroke="#9a4cc2"
                strokeWidth={7}
                filter="drop-shadow(0 0 15px rgba(154, 76, 194, 0.6))"
              />
            </g>
          );
        })}

        {/* 3. Rolling Chain Track */}
        {ca > 0 && (
          <g opacity={ca}>
            {[...Array(N)].map((_, k) => {
              const e = ((k / N + ph) % 1) * 6;
              const idx = Math.floor(e);
              const f = e - idx;
              const A = CH_O[idx];
              const B = CH_O[(idx + 1) % 6];
              const px = A[0] + (B[0] - A[0]) * f;
              const py = A[1] + (B[1] - A[1]) * f;
              const angle = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
              const isFilled = k % 2 === 1;

              return (
                <g key={k} transform={`translate(${px}, ${py}) rotate(${angle})`}>
                  {isFilled ? (
                    <rect x={-9} y={-9} width={18} height={18} rx={6} fill={P_O} />
                  ) : (
                    <rect x={-21} y={-11} width={42} height={22} rx={11} fill="none" stroke={P_O} strokeWidth={6} />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* 4. Gear + Central B */}
        <g transform={`translate(${CX_O}, ${CY_O}) scale(${Math.max(0, gs)})`}>
          <g transform={`rotate(${gearRot})`}>
            {(() => {
              const n = 12;
              const w = (Math.PI * 2) / n;
              const r0 = 100;
              const r1 = 128;
              let d = '';
              for (let k = 0; k < n; k++) {
                const a = k * w;
                const pts = [
                  [a, r0],
                  [a + w * 0.15, r1],
                  [a + w * 0.42, r1],
                  [a + w * 0.57, r0],
                ];
                pts.forEach((pt, pIdx) => {
                  const px = pt[1] * Math.cos(pt[0]);
                  const py = pt[1] * Math.sin(pt[0]);
                  d += (k === 0 && pIdx === 0 ? 'M ' : 'L ') + `${px} ${py} `;
                });
              }
              d += 'Z';
              return <path d={d} fill={BG_O} stroke="#9a4cc2" strokeWidth={2} />;
            })()}
          </g>

          <circle cx={0} cy={0} r={76} fill={P_O} filter="drop-shadow(0 0 20px rgba(91, 26, 120, 0.8))" />

          <text
            x={0}
            y={8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Georgia, serif"
            fontWeight={700}
            fontSize={130}
            fill={BG_O}
          >
            B
          </text>
        </g>

        {/* 5. Expanding Purple Underline Bar */}
        {bw > 0 && (
          <rect
            x={CX_O - bw / 2}
            y={1316}
            width={bw}
            height={7}
            rx={3.5}
            fill={P_O}
            filter="drop-shadow(0 0 10px rgba(91, 26, 120, 0.8))"
          />
        )}
      </svg>

      {/* 6. Wordmark BITTRIX */}
      <div
        style={{
          position: 'absolute',
          top: 1040,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          fontFamily: 'Arial Black, Impact, Arial, sans-serif',
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 168,
          color: P_O,
          textShadow: '0 8px 30px rgba(91, 26, 120, 0.4)',
        }}
      >
        {'BITTRIX'.split('').map((letter, i) => {
          const u = eoOutro(segOutro(t, 1.4 + i * 0.07, 1.9 + i * 0.07));
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: u,
                transform: `translateX(${(1 - u) * -110}px)`,
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* 7. Subtitle TECHNOLOGIES */}
      <div
        style={{
          position: 'absolute',
          top: 1230,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 600,
          fontSize: 46,
          color: D_O,
          opacity: eoOutro(segOutro(t, 1.9, 2.5)),
          letterSpacing: `${10 + 16 * eoOutro(segOutro(t, 1.9, 2.5))}px`,
          textTransform: 'uppercase',
        }}
      >
        TECHNOLOGIES
      </div>

      {/* 8. Spoken CTA Kinetic Karaoke Captions */}
      <KineticCaptions words={scene.words || []} currentFrame={frame} accentColor={P_O} />
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

  const isLastOutroScene = scenes.length > 0 && (scenes[scenes.length - 1].visual_type === 'outro' || scenes[scenes.length - 1].role === 'cta' || scenes[scenes.length - 1].template === 'cta-outro');
  const contentFramesTotal = isLastOutroScene
    ? scenes.slice(0, -1).reduce((acc, s) => acc + (s.durationInFrames || (s as any).frames || Math.round(fps * 3.5)), 0)
    : 999999;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#090d16',
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
            background: `radial-gradient(circle at ${bgShiftX}% ${bgShiftY}%, #38bdf82e 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {scenes.map((scene, index) => {
        const fromFrame = (scene as any).start !== undefined
          ? (scene as any).start
          : ((scene as any).startFrame !== undefined ? (scene as any).startFrame : accumulatedFrame);
        const durationFrames = scene.durationInFrames || (scene as any).frames || Math.round(fps * 3.5);
        accumulatedFrame = fromFrame + durationFrames;

        return (
          <Sequence
            key={scene.scene_number || index}
            from={fromFrame}
            durationInFrames={durationFrames}
          >
            <SceneContent scene={scene} fps={fps} index={index} />

            {/* Embedded Per-Scene Voice Audio when not using master audio (Both Sequence and Audio read from this same timeline array) */}
            {scene.narrationAudio && !props?.video?.audioUrl && (
              <Audio
                src={scene.narrationAudio.startsWith('http') || scene.narrationAudio.startsWith('/') ? scene.narrationAudio : staticFile(scene.narrationAudio)}
                volume={1.0}
              />
            )}

            {/* Embedded Audio SFX Cues Synchronized at Exact Frame Timestamps */}
            {scene.audioCues?.map((cue, cIdx) => (
              cue.src ? (
                <Sequence
                  key={`sfx-${scene.scene_number || index}-${cIdx}`}
                  from={cue.hitFrame ?? cue.frame ?? 0}
                  durationInFrames={cue.durationFrames ?? Math.round(fps * 1.5)}
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
