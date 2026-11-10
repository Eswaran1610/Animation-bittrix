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
  role?: string;
  template?: string;
  visual_type?: '3d-showcase' | 'image-hero' | 'concept-diagram' | 'process-flow' | 'split-compare' | 'timeline' | 'callout' | 'stat-counter' | 'outro';
  durationInFrames: number;
  duration_sec?: number;
  durationSec?: number;
  narration?: string;
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
    "id": "S01",
    "scene_number": 1,
    "role": "hook",
    "template": "question-hook",
    "title": "Why Did Nvidia Stock Stumble?",
    "on_screen_text": "Why Did Nvidia Stock Stumble?",
    "subtitle": "Sudden premarket selling triggered by corporate governance headlines.",
    "key_takeaways": [
      "Shares dropped four to five percent",
      "Premarket reaction to leadership probe",
      "Investors react to key-person exposure"
    ],
    "concept_nodes": [
      {
        "sub": "Premarket Selloff",
        "label": "Market Shock"
      },
      {
        "sub": "Governance In Focus",
        "label": "Nvidia NVDA"
      }
    ],
    "metric_data": null,
    "visual_direction": "Translucent glass card floating in deep space with soft indigo radial gradients. Camera executes a subtle 1.05x push-in.",
    "duration_sec": 4.566666666666666,
    "durationInFrames": 137,
    "transitionOutFrames": 10,
    "visualType": "blueprint",
    "visual_type": "blueprint",
    "themeColor": "#818cf8",
    "narration": "Why did Nvidia stock suddenly stumble?",
    "narrationAudio": "audio/a737a950-e614-494f-9c08-e1e932e74d23_preview_v1_scene_01_narration.mp3",
    "narrationDurationSec": 3.096,
    "words": [
      {
        "word": "Why",
        "startSec": 0.1,
        "endSec": 0.312,
        "startMs": 100,
        "endMs": 312,
        "startFrame": 3,
        "endFrame": 9
      },
      {
        "word": "did",
        "startSec": 0.325,
        "endSec": 0.488,
        "startMs": 325,
        "endMs": 488,
        "startFrame": 10,
        "endFrame": 15
      },
      {
        "word": "Nvidia",
        "startSec": 0.5,
        "endSec": 0.938,
        "startMs": 500,
        "endMs": 938,
        "startFrame": 15,
        "endFrame": 28
      },
      {
        "word": "stock",
        "startSec": 0.95,
        "endSec": 1.275,
        "startMs": 950,
        "endMs": 1275,
        "startFrame": 29,
        "endFrame": 38
      },
      {
        "word": "suddenly",
        "startSec": 1.288,
        "endSec": 1.676,
        "startMs": 1288,
        "endMs": 1676,
        "startFrame": 39,
        "endFrame": 50
      },
      {
        "word": "stumble",
        "startSec": 1.688,
        "endSec": 2.225,
        "startMs": 1688,
        "endMs": 2225,
        "startFrame": 51,
        "endFrame": 67
      }
    ],
    "audioCues": [
      {
        "hitFrame": 12,
        "role": "whoosh",
        "object_id": "",
        "reason": "Scene visual entrance"
      },
      {
        "hitFrame": 29,
        "role": "pop",
        "object_id": "",
        "reason": "Key emphasis word"
      }
    ],
    "nodes": [
      {
        "label": "Market Shock Card",
        "sub": "Frosted glass container framing the stock stumble question"
      },
      {
        "label": "Nvidia Badge",
        "sub": "Verified corporate logo emblem anchored in upper safe area"
      }
    ],
    "labels": [
      "Why Did Nvidia Stock Stumble?"
    ],
    "image_assets": {},
    "visualBlueprint": {
      "layout": "Centered glassmorphic card with neon glow border and market delta glyph.",
      "objects": [
        {
          "x": 0.5,
          "y": 0.48,
          "id": "s01-glass-panel",
          "to_x": 0.5,
          "to_y": 0.46,
          "color": "#818cf8",
          "label": "Market Shock Card",
          "scale": 1,
          "detail": "Frosted glass container framing the stock stumble question",
          "motion": "SPRING_BOUNCE spring entrance with mass 0.5, stiffness 160, damping 12 settling at frame 24",
          "rotation": 0,
          "motion_plan": {
            "idle": "pulse",
            "focal": true,
            "easing": "spring",
            "exit_frame": 135,
            "enter_frame": 6,
            "hold_end_frame": 120,
            "stagger_frames": 3,
            "hold_start_frame": 24
          },
          "render_spec": {
            "type": "vector",
            "paths": [
              {
                "d": "M 250 210 L 400 320 L 550 210",
                "fill": "none",
                "stroke": "#c084fc",
                "strokeWidth": 8
              }
            ],
            "rects": [
              {
                "x": 40,
                "y": 30,
                "rx": 24,
                "fill": "rgba(255, 255, 255, 0.05)",
                "width": 720,
                "height": 440,
                "stroke": "#818cf8",
                "strokeWidth": 3
              }
            ],
            "circles": [
              {
                "r": 14,
                "cx": 400,
                "cy": 320,
                "fill": "#c084fc"
              }
            ],
            "viewBox": [
              0,
              0,
              800,
              500
            ]
          }
        },
        {
          "x": 0.5,
          "y": 0.22,
          "id": "s01-logo-badge",
          "to_x": 0.5,
          "to_y": 0.22,
          "color": "#818cf8",
          "label": "Nvidia Badge",
          "scale": 0.85,
          "detail": "Verified corporate logo emblem anchored in upper safe area",
          "motion": "FADE_SLIDE_UP 15-frame smoothstep entrance from Y +40px to 0 with SFX whoosh",
          "rotation": 0,
          "motion_plan": {
            "idle": "shimmer",
            "focal": false,
            "easing": "easeOut",
            "exit_frame": 135,
            "enter_frame": 12,
            "hold_end_frame": 125,
            "stagger_frames": 2,
            "hold_start_frame": 27
          },
          "render_spec": {
            "type": "vector",
            "asset_license": "Public Domain / Trademark",
            "asset_source_url": "https://commons.wikimedia.org/wiki/File:Nvidia_logo.svg",
            "asset_attribution": "Nvidia Corporation",
            "viewBox": [
              0,
              0,
              600,
              400
            ],
            "rects": [
              {
                "x": 30,
                "y": 30,
                "width": 540,
                "height": 340,
                "rx": 24,
                "fill": "hsla(67, 70%, 15%, 0.85)",
                "stroke": "hsl(67, 80%, 65%)",
                "strokeWidth": 4
              }
            ],
            "circles": [
              {
                "cx": 300,
                "cy": 180,
                "r": 65,
                "fill": "hsla(67, 85%, 55%, 0.25)",
                "stroke": "hsl(67, 90%, 65%)",
                "strokeWidth": 5
              },
              {
                "cx": 180,
                "cy": 260,
                "r": 28,
                "fill": "hsla(107, 80%, 50%, 0.4)",
                "stroke": "hsl(107, 85%, 65%)",
                "strokeWidth": 3
              },
              {
                "cx": 420,
                "cy": 260,
                "r": 28,
                "fill": "hsla(107, 80%, 50%, 0.4)",
                "stroke": "hsl(107, 85%, 65%)",
                "strokeWidth": 3
              }
            ],
            "lines": [
              {
                "x1": 180,
                "y1": 260,
                "x2": 300,
                "y2": 180,
                "stroke": "hsl(67, 80%, 60%)",
                "strokeWidth": 4,
                "dash": "8 6"
              },
              {
                "x1": 420,
                "y1": 260,
                "x2": 300,
                "y2": 180,
                "stroke": "hsl(67, 80%, 60%)",
                "strokeWidth": 4,
                "dash": "8 6"
              }
            ],
            "text": "Nvidia Badge"
          }
        }
      ],
      "purpose": "Hook the viewer with the unexpected valuation shock on tech giant Nvidia.",
      "asset_queries": [
        "Nvidia corporate logo vector SVG",
        "Stock market volatility ticker downward delta"
      ],
      "camera_motion": "Slow forward dolly scale from 1.00 to 1.04 over 135 frames."
    },
    "styleBrief": {
      "fonts": {
        "body": "Arial",
        "heading": "Arial"
      },
      "bedMood": "ethereal ambient shimmer",
      "palette": {
        "bg": "#080c16",
        "text": "#f1f5f9",
        "accent": "#c084fc",
        "primary": "#818cf8"
      },
      "sfxPack": "cinematic",
      "archetype": "glass-ui",
      "background": "gradient-flow",
      "transitionSet": [
        "wipe"
      ],
      "motionPersonality": "fluid"
    },
    "motion_cue": "SPRING_BOUNCE entrance on hero card at frame 6 with downward chevron pulse and low cinematic sub-riser.",
    "continuity_to_next": "Central glass badge rotates 4 degrees clockwise while transitioning into the executive card frame.",
    "motion": [],
    "continuity": {
      "fromPrevious": "opening",
      "toNext": "Central glass badge rotates 4 degrees clockwise while transitioning into the executive card frame."
    },
    "production_audio_design": {
      "scene_number": 1,
      "cues": [
        {
          "hitFrame": 12,
          "role": "whoosh",
          "object_id": "",
          "reason": "Scene visual entrance"
        },
        {
          "hitFrame": 29,
          "role": "pop",
          "object_id": "",
          "reason": "Key emphasis word"
        }
      ]
    },
    "emphasis_word": "stock"
  },
  {
    "id": "S02",
    "scene_number": 2,
    "role": "body",
    "template": "fact-card",
    "title": "Independent Board Launches Inquiry",
    "on_screen_text": "Independent Board Launches Inquiry",
    "subtitle": "Special director committee examines CEO personal disclosure.",
    "key_takeaways": [
      "Independent board committee formed",
      "Governance review initiated immediately",
      "CEO pledges full transparent cooperation"
    ],
    "concept_nodes": [
      {
        "sub": "Independent Oversight",
        "label": "Special Committee"
      },
      {
        "sub": "Full Cooperation",
        "label": "Jensen Huang"
      }
    ],
    "metric_data": null,
    "visual_direction": "Framed photographic portrait of CEO Jensen Huang embedded in a glowing frosted glass dossier card.",
    "duration_sec": 4.566666666666666,
    "durationInFrames": 137,
    "transitionOutFrames": 10,
    "visualType": "blueprint",
    "visual_type": "blueprint",
    "themeColor": "#c084fc",
    "narration": "A board inquiry examined leadership disclosures.",
    "narrationAudio": "audio/a737a950-e614-494f-9c08-e1e932e74d23_preview_v1_scene_02_narration.mp3",
    "narrationDurationSec": 3.72,
    "words": [
      {
        "word": "A",
        "startSec": 0.1,
        "endSec": 0.238,
        "startMs": 100,
        "endMs": 238,
        "startFrame": 3,
        "endFrame": 7
      },
      {
        "word": "board",
        "startSec": 0.25,
        "endSec": 0.525,
        "startMs": 250,
        "endMs": 525,
        "startFrame": 8,
        "endFrame": 16
      },
      {
        "word": "inquiry",
        "startSec": 0.537,
        "endSec": 1,
        "startMs": 537,
        "endMs": 1000,
        "startFrame": 16,
        "endFrame": 30
      },
      {
        "word": "examined",
        "startSec": 1.012,
        "endSec": 1.524,
        "startMs": 1012,
        "endMs": 1524,
        "startFrame": 30,
        "endFrame": 46
      },
      {
        "word": "leadership",
        "startSec": 1.538,
        "endSec": 1.963,
        "startMs": 1538,
        "endMs": 1963,
        "startFrame": 46,
        "endFrame": 59
      },
      {
        "word": "disclosures",
        "startSec": 1.975,
        "endSec": 2.85,
        "startMs": 1975,
        "endMs": 2850,
        "startFrame": 59,
        "endFrame": 86
      }
    ],
    "audioCues": [
      {
        "hitFrame": 12,
        "role": "whoosh",
        "object_id": "",
        "reason": "Scene visual entrance"
      },
      {
        "hitFrame": 30,
        "role": "pop",
        "object_id": "",
        "reason": "Key emphasis word"
      }
    ],
    "nodes": [
      {
        "label": "Executive Portrait Card",
        "sub": "Verified photograph of Nvidia CEO Jensen Huang inside glassmorphic bezel"
      },
      {
        "label": "Governance Audit Seal",
        "sub": "Vector stamp confirming active independent board review committee"
      }
    ],
    "labels": [
      "Independent Board Launches Inquiry"
    ],
    "image_assets": {},
    "visualBlueprint": {
      "layout": "Split vertical glass bento container featuring executive imagery and governance audit badge.",
      "objects": [
        {
          "x": 0.5,
          "y": 0.44,
          "id": "s02-huang-portrait",
          "to_x": 0.5,
          "to_y": 0.42,
          "color": "#818cf8",
          "label": "Executive Portrait Card",
          "scale": 0.9,
          "detail": "Verified photograph of Nvidia CEO Jensen Huang inside glassmorphic bezel",
          "motion": "SPRING_BOUNCE entrance from Y offset +60px with mechanical latch impact sound",
          "rotation": 0,
          "motion_plan": {
            "idle": "float",
            "focal": true,
            "easing": "spring",
            "exit_frame": 135,
            "enter_frame": 8,
            "hold_end_frame": 120,
            "stagger_frames": 4,
            "hold_start_frame": 24
          },
          "render_spec": {
            "type": "vector",
            "asset_license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "asset_source_url": "https://commons.wikimedia.org/wiki/File:Jensen_Huang_%28cropped%29_%282024%29.jpg",
            "asset_attribution": "Photo by Peter Dasilva / European Commission Audiovisual Service via Wikimedia Commons",
            "viewBox": [
              0,
              0,
              600,
              400
            ],
            "rects": [
              {
                "x": 30,
                "y": 30,
                "width": 540,
                "height": 340,
                "rx": 24,
                "fill": "hsla(134, 70%, 15%, 0.85)",
                "stroke": "hsl(134, 80%, 65%)",
                "strokeWidth": 4
              }
            ],
            "circles": [
              {
                "cx": 300,
                "cy": 180,
                "r": 65,
                "fill": "hsla(134, 85%, 55%, 0.25)",
                "stroke": "hsl(134, 90%, 65%)",
                "strokeWidth": 5
              },
              {
                "cx": 180,
                "cy": 260,
                "r": 28,
                "fill": "hsla(174, 80%, 50%, 0.4)",
                "stroke": "hsl(174, 85%, 65%)",
                "strokeWidth": 3
              },
              {
                "cx": 420,
                "cy": 260,
                "r": 28,
                "fill": "hsla(174, 80%, 50%, 0.4)",
                "stroke": "hsl(174, 85%, 65%)",
                "strokeWidth": 3
              }
            ],
            "lines": [
              {
                "x1": 180,
                "y1": 260,
                "x2": 300,
                "y2": 180,
                "stroke": "hsl(134, 80%, 60%)",
                "strokeWidth": 4,
                "dash": "8 6"
              },
              {
                "x1": 420,
                "y1": 260,
                "x2": 300,
                "y2": 180,
                "stroke": "hsl(134, 80%, 60%)",
                "strokeWidth": 4,
                "dash": "8 6"
              }
            ],
            "text": "Executive Portrait Card"
          }
        },
        {
          "x": 0.5,
          "y": 0.76,
          "id": "s02-audit-seal",
          "to_x": 0.5,
          "to_y": 0.74,
          "color": "#c084fc",
          "label": "Governance Audit Seal",
          "scale": 1,
          "detail": "Vector stamp confirming active independent board review committee",
          "motion": "FADE_SLIDE_UP text and badge entrance across 15 frames with clean click SFX",
          "rotation": 0,
          "motion_plan": {
            "idle": "pulse",
            "focal": false,
            "easing": "easeOut",
            "exit_frame": 135,
            "enter_frame": 18,
            "hold_end_frame": 125,
            "stagger_frames": 2,
            "hold_start_frame": 33
          },
          "render_spec": {
            "type": "vector",
            "paths": [
              {
                "d": "M 80 80 L 110 110 L 170 50",
                "fill": "none",
                "stroke": "#818cf8",
                "strokeWidth": 6
              }
            ],
            "rects": [
              {
                "x": 20,
                "y": 10,
                "rx": 16,
                "fill": "rgba(255, 255, 255, 0.04)",
                "width": 560,
                "height": 140,
                "stroke": "#c084fc",
                "strokeWidth": 2
              }
            ],
            "viewBox": [
              0,
              0,
              600,
              160
            ]
          }
        }
      ],
      "purpose": "Establish the factual premise of the independent board inquiry and executive cooperation.",
      "asset_queries": [
        "Jensen Huang verified Wikimedia portrait photo",
        "Corporate governance audit check icon vector"
      ],
      "camera_motion": "Slow tilt upwards 0.02 normalized units with gentle 1.02x zoom."
    },
    "styleBrief": {
      "fonts": {
        "body": "Arial",
        "heading": "Arial"
      },
      "bedMood": "ethereal ambient shimmer",
      "palette": {
        "bg": "#080c16",
        "text": "#f1f5f9",
        "accent": "#c084fc",
        "primary": "#818cf8"
      },
      "sfxPack": "cinematic",
      "archetype": "glass-ui",
      "background": "gradient-flow",
      "transitionSet": [
        "wipe"
      ],
      "motionPersonality": "fluid"
    },
    "motion_cue": "SPRING_BOUNCE slide-in of executive dossier card with metallic latch snap sound cue at frame 10.",
    "continuity_to_next": "Audit stamp graphic scales out while intelligence alert node expands into network path.",
    "motion": [],
    "continuity": {
      "fromPrevious": "carried from previous scene as specified by the active CLI",
      "toNext": "Audit stamp graphic scales out while intelligence alert node expands into network path."
    },
    "production_audio_design": {
      "scene_number": 2,
      "cues": [
        {
          "hitFrame": 12,
          "role": "whoosh",
          "object_id": "",
          "reason": "Scene visual entrance"
        },
        {
          "hitFrame": 30,
          "role": "pop",
          "object_id": "",
          "reason": "Key emphasis word"
        }
      ]
    },
    "emphasis_word": "examined"
  },
  {
    "id": "S03",
    "scene_number": 3,
    "role": "body",
    "template": "flow-path",
    "title": "Foreign Intelligence Scrutiny Emerg",
    "on_screen_text": "Foreign Intelligence Scrutiny Emerges",
    "subtitle": "Counter-intelligence questions prompted deep governance examination.",
    "key_takeaways": [
      "Inquiry evaluated targeting risks",
      "Executive association closely audited",
      "Independent verification mandated"
    ],
    "concept_nodes": [
      {
        "sub": "Counter-Espionage Check",
        "label": "Intelligence Scrutiny"
      },
      {
        "sub": "External Verification",
        "label": "Compliance Audit"
      }
    ],
    "metric_data": null,
    "visual_direction": "Connected network flow diagram illustrating executive scrutiny linking into strict corporate oversight nodes.",
    "duration_sec": 4.566666666666666,
    "durationInFrames": 137,
    "transitionOutFrames": 10,
    "visualType": "blueprint",
    "visual_type": "blueprint",
    "themeColor": "#818cf8",
    "narration": "Foreign intelligence questions sparked market jitters.",
    "narrationAudio": "audio/a737a950-e614-494f-9c08-e1e932e74d23_preview_v1_scene_03_narration.mp3",
    "narrationDurationSec": 0.72,
    "words": [
      {
        "word": "Foreign",
        "startSec": 0.1,
        "endSec": 0.45,
        "startMs": 100,
        "endMs": 450,
        "startFrame": 3,
        "endFrame": 14
      },
      {
        "word": "intelligence",
        "startSec": 0.463,
        "endSec": 1.088,
        "startMs": 463,
        "endMs": 1088,
        "startFrame": 14,
        "endFrame": 33
      },
      {
        "word": "questions",
        "startSec": 1.1,
        "endSec": 1.637,
        "startMs": 1100,
        "endMs": 1637,
        "startFrame": 33,
        "endFrame": 49
      },
      {
        "word": "sparked",
        "startSec": 1.65,
        "endSec": 2.012,
        "startMs": 1650,
        "endMs": 2012,
        "startFrame": 50,
        "endFrame": 60
      },
      {
        "word": "market",
        "startSec": 2.025,
        "endSec": 2.35,
        "startMs": 2025,
        "endMs": 2350,
        "startFrame": 61,
        "endFrame": 71
      },
      {
        "word": "jitters",
        "startSec": 2.362,
        "endSec": 2.937,
        "startMs": 2362,
        "endMs": 2937,
        "startFrame": 71,
        "endFrame": 88
      }
    ],
    "audioCues": [
      {
        "hitFrame": 12,
        "role": "whoosh",
        "object_id": "",
        "reason": "Scene visual entrance"
      },
      {
        "hitFrame": 50,
        "role": "pop",
        "object_id": "",
        "reason": "Key emphasis word"
      }
    ],
    "nodes": [
      {
        "label": "Audit Flow Path",
        "sub": "Bento nodes connecting disclosure review to security committee"
      },
      {
        "label": "Audit Security Node",
        "sub": "Glowing audit status badge indicating formal board review"
      }
    ],
    "labels": [
      "Foreign Intelligence Scrutiny Emerges"
    ],
    "image_assets": {},
    "visualBlueprint": {
      "layout": "Dual horizontal glass bento cards connected by an animated glowing spline path.",
      "objects": [
        {
          "x": 0.5,
          "y": 0.46,
          "id": "s03-flow-nodes",
          "to_x": 0.5,
          "to_y": 0.46,
          "color": "#818cf8",
          "label": "Audit Flow Path",
          "scale": 1,
          "detail": "Bento nodes connecting disclosure review to security committee",
          "motion": "SPRING_BOUNCE entrance of cards followed by active stroke draw-on over 18 frames",
          "rotation": 0,
          "motion_plan": {
            "idle": "drift",
            "focal": true,
            "easing": "spring",
            "exit_frame": 135,
            "enter_frame": 6,
            "hold_end_frame": 120,
            "stagger_frames": 4,
            "hold_start_frame": 24
          },
          "render_spec": {
            "type": "vector",
            "paths": [
              {
                "d": "M 360 240 C 420 180, 480 300, 540 240",
                "fill": "none",
                "stroke": "#f1f5f9",
                "strokeWidth": 4
              }
            ],
            "rects": [
              {
                "x": 40,
                "y": 140,
                "rx": 20,
                "fill": "rgba(255, 255, 255, 0.05)",
                "width": 320,
                "height": 200,
                "stroke": "#818cf8",
                "strokeWidth": 2
              },
              {
                "x": 540,
                "y": 140,
                "rx": 20,
                "fill": "rgba(255, 255, 255, 0.05)",
                "width": 320,
                "height": 200,
                "stroke": "#c084fc",
                "strokeWidth": 2
              }
            ],
            "circles": [
              {
                "r": 8,
                "cx": 450,
                "cy": 240,
                "fill": "#c084fc"
              }
            ],
            "viewBox": [
              0,
              0,
              900,
              480
            ]
          }
        },
        {
          "x": 0.5,
          "y": 0.78,
          "id": "s03-status-indicator",
          "to_x": 0.5,
          "to_y": 0.78,
          "color": "#c084fc",
          "label": "Audit Security Node",
          "scale": 1,
          "detail": "Glowing audit status badge indicating formal board review",
          "motion": "FADE_SLIDE_UP text reveal synchronized to narration trigger",
          "rotation": 0,
          "motion_plan": {
            "idle": "pulse",
            "focal": false,
            "easing": "easeOut",
            "exit_frame": 135,
            "enter_frame": 16,
            "hold_end_frame": 125,
            "stagger_frames": 2,
            "hold_start_frame": 31
          },
          "render_spec": {
            "type": "vector",
            "rects": [
              {
                "x": 10,
                "y": 10,
                "rx": 24,
                "fill": "rgba(192, 132, 252, 0.1)",
                "width": 480,
                "height": 80,
                "stroke": "#c084fc",
                "strokeWidth": 2
              }
            ],
            "circles": [
              {
                "r": 12,
                "cx": 60,
                "cy": 50,
                "fill": "#818cf8"
              }
            ],
            "viewBox": [
              0,
              0,
              500,
              100
            ]
          }
        }
      ],
      "purpose": "Visualize the causal mechanism connecting external intelligence scrutiny to corporate audit steps.",
      "asset_queries": [
        "Security network flow nodes vector",
        "Cybersecurity compliance audit shield SVG"
      ],
      "camera_motion": "Horizontal pan left to right from x: 0.48 to 0.52."
    },
    "styleBrief": {
      "fonts": {
        "body": "Arial",
        "heading": "Arial"
      },
      "bedMood": "ethereal ambient shimmer",
      "palette": {
        "bg": "#080c16",
        "text": "#f1f5f9",
        "accent": "#c084fc",
        "primary": "#818cf8"
      },
      "sfxPack": "cinematic",
      "archetype": "glass-ui",
      "background": "gradient-flow",
      "transitionSet": [
        "wipe"
      ],
      "motionPersonality": "fluid"
    },
    "motion_cue": "Animated vector draw-on of connecting dashed data flow path with traveling pulse dot and digital tick SFX.",
    "continuity_to_next": "The compliance audit shield morphs into the central numeric percentage badge.",
    "motion": [],
    "continuity": {
      "fromPrevious": "carried from previous scene as specified by the active CLI",
      "toNext": "The compliance audit shield morphs into the central numeric percentage badge."
    },
    "production_audio_design": {
      "scene_number": 3,
      "cues": [
        {
          "hitFrame": 12,
          "role": "whoosh",
          "object_id": "",
          "reason": "Scene visual entrance"
        },
        {
          "hitFrame": 50,
          "role": "pop",
          "object_id": "",
          "reason": "Key emphasis word"
        }
      ]
    },
    "emphasis_word": "sparked"
  },
  {
    "id": "S04",
    "scene_number": 4,
    "role": "body",
    "template": "stat-callout",
    "title": "Shares Drop Five Percent Premarket",
    "on_screen_text": "Shares Drop Five Percent Premarket",
    "subtitle": "Market prices in sudden key-person leadership uncertainty.",
    "key_takeaways": [
      "Premarket drop of 4.8 percent",
      "Key-person governance risk priced",
      "Broad semiconductor index fluctuates"
    ],
    "concept_nodes": [
      {
        "sub": "-4.8% Premarket",
        "label": "Valuation Impact"
      },
      {
        "sub": "Leadership Uncertainty",
        "label": "Key-Person Risk"
      }
    ],
    "metric_data": {
      "unit": "%",
      "label": "Premarket Drop",
      "value": 4.8
    },
    "visual_direction": "High-contrast frosted glass stat callout featuring a glowing numeric counter and downward market delta trendline.",
    "duration_sec": 4.566666666666666,
    "durationInFrames": 137,
    "transitionOutFrames": 10,
    "visualType": "blueprint",
    "visual_type": "blueprint",
    "themeColor": "#c084fc",
    "narration": "Shares dropped five percent on uncertainty.",
    "narrationAudio": "audio/a737a950-e614-494f-9c08-e1e932e74d23_preview_v1_scene_04_narration.mp3",
    "narrationDurationSec": 3.24,
    "words": [
      {
        "word": "Shares",
        "startSec": 0.1,
        "endSec": 0.45,
        "startMs": 100,
        "endMs": 450,
        "startFrame": 3,
        "endFrame": 14
      },
      {
        "word": "dropped",
        "startSec": 0.463,
        "endSec": 0.75,
        "startMs": 463,
        "endMs": 750,
        "startFrame": 14,
        "endFrame": 23
      },
      {
        "word": "five",
        "startSec": 0.762,
        "endSec": 1.037,
        "startMs": 762,
        "endMs": 1037,
        "startFrame": 23,
        "endFrame": 31
      },
      {
        "word": "percent",
        "startSec": 1.05,
        "endSec": 1.5,
        "startMs": 1050,
        "endMs": 1500,
        "startFrame": 32,
        "endFrame": 45
      },
      {
        "word": "on",
        "startSec": 1.512,
        "endSec": 1.625,
        "startMs": 1512,
        "endMs": 1625,
        "startFrame": 45,
        "endFrame": 49
      },
      {
        "word": "uncertainty",
        "startSec": 1.637,
        "endSec": 2.375,
        "startMs": 1637,
        "endMs": 2375,
        "startFrame": 49,
        "endFrame": 71
      }
    ],
    "audioCues": [
      {
        "hitFrame": 12,
        "role": "whoosh",
        "object_id": "",
        "reason": "Scene visual entrance"
      },
      {
        "hitFrame": 32,
        "role": "pop",
        "object_id": "",
        "reason": "Key emphasis word"
      }
    ],
    "nodes": [
      {
        "label": "Premarket Volatility Pill",
        "sub": "Large glowing pill container framing the -4.8% valuation drop"
      },
      {
        "label": "Governance Label",
        "sub": "Glass callout describing key-man risk factor"
      }
    ],
    "labels": [
      "Shares Drop Five Percent Premarket"
    ],
    "image_assets": {},
    "visualBlueprint": {
      "layout": "Massive central data badge with glowing typography and descending trendline.",
      "objects": [
        {
          "x": 0.5,
          "y": 0.45,
          "id": "s04-metric-pill",
          "to_x": 0.5,
          "to_y": 0.45,
          "color": "#c084fc",
          "label": "Premarket Volatility Pill",
          "scale": 1.05,
          "detail": "Large glowing pill container framing the -4.8% valuation drop",
          "motion": "SPRING_BOUNCE explosive 12-frame spring entrance with 4% overshoot settle",
          "rotation": 0,
          "motion_plan": {
            "idle": "pulse",
            "focal": true,
            "easing": "spring",
            "exit_frame": 135,
            "enter_frame": 6,
            "hold_end_frame": 120,
            "stagger_frames": 3,
            "hold_start_frame": 22
          },
          "render_spec": {
            "type": "vector",
            "paths": [
              {
                "d": "M 80 120 L 220 120 L 340 220 L 480 180 L 620 280",
                "fill": "none",
                "stroke": "#818cf8",
                "strokeWidth": 6
              }
            ],
            "rects": [
              {
                "x": 30,
                "y": 20,
                "rx": 28,
                "fill": "rgba(255, 255, 255, 0.05)",
                "width": 640,
                "height": 320,
                "stroke": "#c084fc",
                "strokeWidth": 3
              }
            ],
            "circles": [
              {
                "r": 12,
                "cx": 620,
                "cy": 280,
                "fill": "#c084fc"
              }
            ],
            "viewBox": [
              0,
              0,
              700,
              360
            ]
          }
        },
        {
          "x": 0.5,
          "y": 0.76,
          "id": "s04-risk-descriptor",
          "to_x": 0.5,
          "to_y": 0.76,
          "color": "#818cf8",
          "label": "Governance Label",
          "scale": 1,
          "detail": "Glass callout describing key-man risk factor",
          "motion": "FADE_SLIDE_UP 15-frame slide up from +40px with high-frequency tick sound",
          "rotation": 0,
          "motion_plan": {
            "idle": "shimmer",
            "focal": false,
            "easing": "easeOut",
            "exit_frame": 135,
            "enter_frame": 18,
            "hold_end_frame": 125,
            "stagger_frames": 2,
            "hold_start_frame": 33
          },
          "render_spec": {
            "type": "vector",
            "rects": [
              {
                "x": 10,
                "y": 10,
                "rx": 18,
                "fill": "rgba(129, 140, 248, 0.08)",
                "width": 500,
                "height": 70,
                "stroke": "#818cf8",
                "strokeWidth": 2
              }
            ],
            "viewBox": [
              0,
              0,
              520,
              90
            ]
          }
        }
      ],
      "purpose": "Communicate the exact quantitative market drop (-4.8%) driven by key-person risk.",
      "asset_queries": [
        "Financial ticker percentage counter downward trend vector",
        "Market volatility candlestick chart SVG"
      ],
      "camera_motion": "Rapid micro-punch zoom from scale 0.95 to 1.02."
    },
    "styleBrief": {
      "fonts": {
        "body": "Arial",
        "heading": "Arial"
      },
      "bedMood": "ethereal ambient shimmer",
      "palette": {
        "bg": "#080c16",
        "text": "#f1f5f9",
        "accent": "#c084fc",
        "primary": "#818cf8"
      },
      "sfxPack": "cinematic",
      "archetype": "glass-ui",
      "background": "gradient-flow",
      "transitionSet": [
        "wipe"
      ],
      "motionPersonality": "fluid"
    },
    "motion_cue": "SPRING_BOUNCE badge zoom with rapid digital ticker count clicks from frames 6 to 22 resolving into a subtle bass thud.",
    "continuity_to_next": "The downward delta vector locks and transitions into the split compliance shield.",
    "motion": [],
    "continuity": {
      "fromPrevious": "carried from previous scene as specified by the active CLI",
      "toNext": "The downward delta vector locks and transitions into the split compliance shield."
    },
    "production_audio_design": {
      "scene_number": 4,
      "cues": [
        {
          "hitFrame": 12,
          "role": "whoosh",
          "object_id": "",
          "reason": "Scene visual entrance"
        },
        {
          "hitFrame": 32,
          "role": "pop",
          "object_id": "",
          "reason": "Key emphasis word"
        }
      ]
    },
    "emphasis_word": "percent"
  },
  {
    "id": "S05",
    "scene_number": 5,
    "role": "body",
    "template": "split-compare",
    "title": "Zero Intellectual Property Compromi",
    "on_screen_text": "Zero Intellectual Property Compromised",
    "subtitle": "Clear contrast: executive personal probe versus complete commercial security.",
    "key_takeaways": [
      "Executive conduct under review",
      "Zero trade secrets or IP breached"
    ],
    "concept_nodes": [
      {
        "sub": "Personal Disclosures",
        "label": "Board Inquiry"
      },
      {
        "sub": "100% Secure & Intact",
        "label": "Company Core"
      }
    ],
    "metric_data": null,
    "visual_direction": "Bilateral split comparison glass panels contrasting the governance inquiry against confirmed intellectual property safety.",
    "duration_sec": 4.766666666666667,
    "durationInFrames": 143,
    "transitionOutFrames": 10,
    "visualType": "blueprint",
    "visual_type": "blueprint",
    "themeColor": "#818cf8",
    "narration": "Crucially, proprietary AI technology remained secure.",
    "narrationAudio": "audio/a737a950-e614-494f-9c08-e1e932e74d23_preview_v1_scene_05_narration.mp3",
    "narrationDurationSec": 4.488,
    "words": [
      {
        "word": "Crucially",
        "startSec": 0.1,
        "endSec": 0.737,
        "startMs": 100,
        "endMs": 737,
        "startFrame": 3,
        "endFrame": 22
      },
      {
        "word": "proprietary",
        "startSec": 0.85,
        "endSec": 1.612,
        "startMs": 850,
        "endMs": 1612,
        "startFrame": 26,
        "endFrame": 48
      },
      {
        "word": "AI",
        "startSec": 1.625,
        "endSec": 1.888,
        "startMs": 1625,
        "endMs": 1888,
        "startFrame": 49,
        "endFrame": 57
      },
      {
        "word": "technology",
        "startSec": 1.9,
        "endSec": 2.625,
        "startMs": 1900,
        "endMs": 2625,
        "startFrame": 57,
        "endFrame": 79
      },
      {
        "word": "remained",
        "startSec": 2.638,
        "endSec": 2.976,
        "startMs": 2638,
        "endMs": 2976,
        "startFrame": 79,
        "endFrame": 89
      },
      {
        "word": "secure",
        "startSec": 2.987,
        "endSec": 3.612,
        "startMs": 2987,
        "endMs": 3612,
        "startFrame": 90,
        "endFrame": 108
      }
    ],
    "audioCues": [
      {
        "hitFrame": 12,
        "role": "whoosh",
        "object_id": "",
        "reason": "Scene visual entrance"
      },
      {
        "hitFrame": 57,
        "role": "pop",
        "object_id": "",
        "reason": "Key emphasis word"
      }
    ],
    "nodes": [
      {
        "label": "Inquiry Scope Card",
        "sub": "Left card detailing the personal disclosure governance review"
      },
      {
        "label": "Integrity Shield Card",
        "sub": "Right card displaying 100% verified IP and national security clearance"
      }
    ],
    "labels": [
      "Zero Intellectual Property Compromised"
    ],
    "image_assets": {},
    "visualBlueprint": {
      "layout": "Two symmetrical vertical frosted glass cards locking along a central dividing axis.",
      "objects": [
        {
          "x": 0.28,
          "y": 0.5,
          "id": "s05-left-panel",
          "to_x": 0.3,
          "to_y": 0.5,
          "color": "#c084fc",
          "label": "Inquiry Scope Card",
          "scale": 1,
          "detail": "Left card detailing the personal disclosure governance review",
          "motion": "SPRING_BOUNCE horizontal slide from left edge with damping settle at frame 20",
          "rotation": 0,
          "motion_plan": {
            "idle": "drift",
            "focal": false,
            "easing": "spring",
            "exit_frame": 135,
            "enter_frame": 6,
            "hold_end_frame": 120,
            "stagger_frames": 3,
            "hold_start_frame": 22
          },
          "render_spec": {
            "type": "vector",
            "rects": [
              {
                "x": 20,
                "y": 20,
                "rx": 20,
                "fill": "rgba(255, 255, 255, 0.04)",
                "width": 320,
                "height": 440,
                "stroke": "#c084fc",
                "strokeWidth": 2
              }
            ],
            "circles": [
              {
                "r": 40,
                "cx": 180,
                "cy": 160,
                "fill": "rgba(192, 132, 252, 0.15)"
              }
            ],
            "viewBox": [
              0,
              0,
              360,
              480
            ]
          }
        },
        {
          "x": 0.72,
          "y": 0.5,
          "id": "s05-right-panel",
          "to_x": 0.7,
          "to_y": 0.5,
          "color": "#818cf8",
          "label": "Integrity Shield Card",
          "scale": 1,
          "detail": "Right card displaying 100% verified IP and national security clearance",
          "motion": "SPRING_BOUNCE horizontal slide from right edge locking onto center axis at frame 20",
          "rotation": 0,
          "motion_plan": {
            "idle": "pulse",
            "focal": true,
            "easing": "spring",
            "exit_frame": 135,
            "enter_frame": 6,
            "hold_end_frame": 120,
            "stagger_frames": 3,
            "hold_start_frame": 22
          },
          "render_spec": {
            "type": "vector",
            "paths": [
              {
                "d": "M 180 120 L 220 140 L 220 200 C 220 230, 180 250, 180 250 C 180 250, 140 230, 140 200 L 140 140 Z",
                "fill": "none",
                "stroke": "#818cf8",
                "strokeWidth": 4
              },
              {
                "d": "M 165 195 L 175 205 L 195 185",
                "fill": "none",
                "stroke": "#f1f5f9",
                "strokeWidth": 4
              }
            ],
            "rects": [
              {
                "x": 20,
                "y": 20,
                "rx": 20,
                "fill": "rgba(129, 140, 248, 0.08)",
                "width": 320,
                "height": 440,
                "stroke": "#818cf8",
                "strokeWidth": 3
              }
            ],
            "viewBox": [
              0,
              0,
              360,
              480
            ]
          }
        }
      ],
      "purpose": "Deliver the pivotal contrast: executive probe underway, yet zero intellectual property compromised.",
      "asset_queries": [
        "Split comparison corporate shield vector",
        "Verified security shield checkmark SVG"
      ],
      "camera_motion": "Slight camera push-in scale 1.00 to 1.03 with centered focal lock."
    },
    "styleBrief": {
      "fonts": {
        "body": "Arial",
        "heading": "Arial"
      },
      "bedMood": "ethereal ambient shimmer",
      "palette": {
        "bg": "#080c16",
        "text": "#f1f5f9",
        "accent": "#c084fc",
        "primary": "#818cf8"
      },
      "sfxPack": "cinematic",
      "archetype": "glass-ui",
      "background": "gradient-flow",
      "transitionSet": [
        "wipe"
      ],
      "motionPersonality": "fluid"
    },
    "motion_cue": "Symmetrical sliding panels locking together on the center axis with snap settle and crisp metal lock sound cue.",
    "continuity_to_next": "The right-hand security shield expands into the 3D isometric silicon microarchitecture hero.",
    "motion": [],
    "continuity": {
      "fromPrevious": "carried from previous scene as specified by the active CLI",
      "toNext": "The right-hand security shield expands into the 3D isometric silicon microarchitecture hero."
    },
    "production_audio_design": {
      "scene_number": 5,
      "cues": [
        {
          "hitFrame": 12,
          "role": "whoosh",
          "object_id": "",
          "reason": "Scene visual entrance"
        },
        {
          "hitFrame": 57,
          "role": "pop",
          "object_id": "",
          "reason": "Key emphasis word"
        }
      ]
    },
    "emphasis_word": "technology"
  },
  {
    "id": "S06",
    "scene_number": 6,
    "role": "body",
    "template": "hero-center",
    "title": "Silicon Architecture Remains Untouc",
    "on_screen_text": "Silicon Architecture Remains Untouched",
    "subtitle": "Blackwell hardware, production nodes, and customer pipelines stay robust.",
    "key_takeaways": [
      "Semiconductor designs fully protected",
      "Data center revenue pipeline intact",
      "Foundry partnerships proceed normally"
    ],
    "concept_nodes": [
      {
        "sub": "Blackwell & Hopper",
        "label": "AI Architecture"
      },
      {
        "sub": "Unbroken Execution",
        "label": "Enterprise Moat"
      }
    ],
    "metric_data": null,
    "visual_direction": "Hero isometric silicon wafer microchip die surrounded by concentric neon glass rings and metallic circuit paths.",
    "duration_sec": 4.566666666666666,
    "durationInFrames": 137,
    "transitionOutFrames": 10,
    "visualType": "blueprint",
    "visual_type": "blueprint",
    "themeColor": "#818cf8",
    "narration": "Core hardware fundamentals held completely firm.",
    "narrationAudio": "audio/a737a950-e614-494f-9c08-e1e932e74d23_preview_v1_scene_06_narration.mp3",
    "narrationDurationSec": 3.528,
    "words": [
      {
        "word": "Core",
        "startSec": 0.1,
        "endSec": 0.325,
        "startMs": 100,
        "endMs": 325,
        "startFrame": 3,
        "endFrame": 10
      },
      {
        "word": "hardware",
        "startSec": 0.338,
        "endSec": 0.726,
        "startMs": 338,
        "endMs": 726,
        "startFrame": 10,
        "endFrame": 22
      },
      {
        "word": "fundamentals",
        "startSec": 0.738,
        "endSec": 1.4,
        "startMs": 738,
        "endMs": 1400,
        "startFrame": 22,
        "endFrame": 42
      },
      {
        "word": "held",
        "startSec": 1.413,
        "endSec": 1.613,
        "startMs": 1413,
        "endMs": 1613,
        "startFrame": 42,
        "endFrame": 48
      },
      {
        "word": "completely",
        "startSec": 1.625,
        "endSec": 2.15,
        "startMs": 1625,
        "endMs": 2150,
        "startFrame": 49,
        "endFrame": 65
      },
      {
        "word": "firm",
        "startSec": 2.163,
        "endSec": 2.65,
        "startMs": 2163,
        "endMs": 2650,
        "startFrame": 65,
        "endFrame": 80
      }
    ],
    "audioCues": [
      {
        "hitFrame": 12,
        "role": "whoosh",
        "object_id": "",
        "reason": "Scene visual entrance"
      },
      {
        "hitFrame": 42,
        "role": "pop",
        "object_id": "",
        "reason": "Key emphasis word"
      }
    ],
    "nodes": [
      {
        "label": "Silicon GPU Die",
        "sub": "Isometric vector representation of Nvidia's secure GPU architecture"
      },
      {
        "label": "Security Clearance Pill",
        "sub": "Floating glass pill certifying hardware architecture integrity"
      }
    ],
    "labels": [
      "Silicon Architecture Remains Untouched"
    ],
    "image_assets": {},
    "visualBlueprint": {
      "layout": "Centered isometric silicon die with radial microcircuit traces and floating metadata tags.",
      "objects": [
        {
          "x": 0.5,
          "y": 0.46,
          "id": "s06-silicon-core",
          "to_x": 0.5,
          "to_y": 0.45,
          "color": "#818cf8",
          "label": "Silicon GPU Die",
          "scale": 1,
          "detail": "Isometric vector representation of Nvidia's secure GPU architecture",
          "motion": "SPRING_BOUNCE entrance from center with continuous 2-degree oscillation loop",
          "rotation": 0,
          "motion_plan": {
            "idle": "orbit",
            "focal": true,
            "easing": "spring",
            "exit_frame": 135,
            "enter_frame": 6,
            "hold_end_frame": 120,
            "stagger_frames": 3,
            "hold_start_frame": 24
          },
          "render_spec": {
            "type": "vector",
            "paths": [
              {
                "d": "M 250 200 L 450 280 M 450 200 L 250 280",
                "fill": "none",
                "stroke": "#c084fc",
                "strokeWidth": 3
              }
            ],
            "viewBox": [
              0,
              0,
              700,
              600
            ],
            "polygons": [
              {
                "fill": "rgba(129, 140, 248, 0.12)",
                "points": "350,120 580,240 350,360 120,240",
                "stroke": "#818cf8",
                "strokeWidth": 4
              },
              {
                "fill": "rgba(15, 23, 42, 0.8)",
                "points": "120,240 350,360 350,440 120,320",
                "stroke": "#818cf8",
                "strokeWidth": 2
              },
              {
                "fill": "rgba(30, 41, 59, 0.8)",
                "points": "580,240 350,360 350,440 580,320",
                "stroke": "#c084fc",
                "strokeWidth": 2
              }
            ]
          }
        },
        {
          "x": 0.5,
          "y": 0.78,
          "id": "s06-status-pill",
          "to_x": 0.5,
          "to_y": 0.78,
          "color": "#c084fc",
          "label": "Security Clearance Pill",
          "scale": 1,
          "detail": "Floating glass pill certifying hardware architecture integrity",
          "motion": "FADE_SLIDE_UP text entrance with subtle shimmer idle effect",
          "rotation": 0,
          "motion_plan": {
            "idle": "shimmer",
            "focal": false,
            "easing": "easeOut",
            "exit_frame": 135,
            "enter_frame": 18,
            "hold_end_frame": 125,
            "stagger_frames": 2,
            "hold_start_frame": 33
          },
          "render_spec": {
            "type": "vector",
            "rects": [
              {
                "x": 10,
                "y": 10,
                "rx": 20,
                "fill": "rgba(255, 255, 255, 0.05)",
                "width": 500,
                "height": 60,
                "stroke": "#c084fc",
                "strokeWidth": 2
              }
            ],
            "viewBox": [
              0,
              0,
              520,
              80
            ]
          }
        }
      ],
      "purpose": "Anchor viewer confidence on Nvidia's physical hardware fundamentals and enterprise moat.",
      "asset_queries": [
        "Isometric semiconductor wafer die SVG",
        "AI microchip silicon processor vector"
      ],
      "camera_motion": "Slow 360-degree orbit with subtle scale elevation 1.00 to 1.04."
    },
    "styleBrief": {
      "fonts": {
        "body": "Arial",
        "heading": "Arial"
      },
      "bedMood": "ethereal ambient shimmer",
      "palette": {
        "bg": "#080c16",
        "text": "#f1f5f9",
        "accent": "#c084fc",
        "primary": "#818cf8"
      },
      "sfxPack": "cinematic",
      "archetype": "glass-ui",
      "background": "gradient-flow",
      "transitionSet": [
        "wipe"
      ],
      "motionPersonality": "fluid"
    },
    "motion_cue": "Centric spring pop-in with continuous 3-degree gyroscopic rotation loop and resonant metallic chime sound at frame 6.",
    "continuity_to_next": "Center silicon core simplifies into the glowing interactive CTA button in the finale.",
    "motion": [],
    "continuity": {
      "fromPrevious": "carried from previous scene as specified by the active CLI",
      "toNext": "Center silicon core simplifies into the glowing interactive CTA button in the finale."
    },
    "production_audio_design": {
      "scene_number": 6,
      "cues": [
        {
          "hitFrame": 12,
          "role": "whoosh",
          "object_id": "",
          "reason": "Scene visual entrance"
        },
        {
          "hitFrame": 42,
          "role": "pop",
          "object_id": "",
          "reason": "Key emphasis word"
        }
      ]
    },
    "emphasis_word": "held"
  },
  {
    "id": "S07",
    "scene_number": 7,
    "role": "cta",
    "template": "cta-outro",
    "title": "Follow For Tech Market Updates",
    "on_screen_text": "Follow For Tech Market Updates",
    "subtitle": "Follow for daily visual breakdowns of corporate governance and tech volatility.",
    "key_takeaways": [
      "Follow for rapid tech analysis",
      "Save and share with investors",
      "Stay ahead of market shifts"
    ],
    "concept_nodes": [
      {
        "sub": "Daily Tech Coverage",
        "label": "Market Intelligence"
      },
      {
        "sub": "Follow & Subscribe",
        "label": "Investor Action"
      }
    ],
    "metric_data": null,
    "visual_direction": "Polished minimalist luxury glass call-to-action terminal with glowing interactive follow pill button.",
    "duration_sec": 4.366666666666666,
    "durationInFrames": 131,
    "transitionOutFrames": 0,
    "visualType": "blueprint",
    "visual_type": "outro",
    "themeColor": "#5b1a78",
    "narration": "Follow Bittrix Technologies for more interesting concepts.",
    "narrationAudio": "audio/a737a950-e614-494f-9c08-e1e932e74d23_preview_v1_scene_07_narration.mp3",
    "narrationDurationSec": 3.312,
    "words": [
      {
        "word": "Follow",
        "startSec": 0.1,
        "endSec": 0.45,
        "startMs": 100,
        "endMs": 450,
        "startFrame": 3,
        "endFrame": 14
      },
      {
        "word": "for",
        "startSec": 0.463,
        "endSec": 0.626,
        "startMs": 463,
        "endMs": 626,
        "startFrame": 14,
        "endFrame": 19
      },
      {
        "word": "sharp",
        "startSec": 0.637,
        "endSec": 0.912,
        "startMs": 637,
        "endMs": 912,
        "startFrame": 19,
        "endFrame": 27
      },
      {
        "word": "market",
        "startSec": 0.925,
        "endSec": 1.287,
        "startMs": 925,
        "endMs": 1287,
        "startFrame": 28,
        "endFrame": 39
      },
      {
        "word": "governance",
        "startSec": 1.3,
        "endSec": 1.738,
        "startMs": 1300,
        "endMs": 1738,
        "startFrame": 39,
        "endFrame": 52
      },
      {
        "word": "insights",
        "startSec": 1.75,
        "endSec": 2.438,
        "startMs": 1750,
        "endMs": 2438,
        "startFrame": 53,
        "endFrame": 73
      }
    ],
    "audioCues": [
      {
        "hitFrame": 12,
        "role": "whoosh",
        "object_id": "",
        "reason": "Scene visual entrance"
      },
      {
        "hitFrame": 28,
        "role": "pop",
        "object_id": "",
        "reason": "Key emphasis word"
      }
    ],
    "nodes": [
      {
        "label": "Follow CTA Terminal",
        "sub": "Frosted glass card prompting viewer follow action"
      },
      {
        "label": "Market Intelligence Pill",
        "sub": "Secondary badge reminding viewers to save and share"
      }
    ],
    "labels": [
      "Follow For Tech Market Updates"
    ],
    "image_assets": {},
    "visualBlueprint": {
      "layout": "Hero centered glass CTA container with high-contrast glowing neon pill button.",
      "objects": [
        {
          "x": 0.5,
          "y": 0.46,
          "id": "s07-cta-card",
          "to_x": 0.5,
          "to_y": 0.46,
          "color": "#818cf8",
          "label": "Follow CTA Terminal",
          "scale": 1,
          "detail": "Frosted glass card prompting viewer follow action",
          "motion": "SPRING_BOUNCE kinetic punch entrance with 8-frame elastic settle",
          "rotation": 0,
          "motion_plan": {
            "idle": "pulse",
            "focal": true,
            "easing": "spring",
            "exit_frame": 150,
            "enter_frame": 8,
            "hold_end_frame": 140,
            "stagger_frames": 3,
            "hold_start_frame": 26
          },
          "render_spec": {
            "type": "vector",
            "rects": [
              {
                "x": 30,
                "y": 30,
                "rx": 28,
                "fill": "rgba(255, 255, 255, 0.05)",
                "width": 660,
                "height": 360,
                "stroke": "#818cf8",
                "strokeWidth": 3
              },
              {
                "x": 160,
                "y": 230,
                "rx": 45,
                "fill": "rgba(192, 132, 252, 0.2)",
                "width": 400,
                "height": 90,
                "stroke": "#c084fc",
                "strokeWidth": 3
              }
            ],
            "circles": [
              {
                "r": 36,
                "cx": 360,
                "cy": 130,
                "fill": "#818cf8"
              }
            ],
            "viewBox": [
              0,
              0,
              720,
              420
            ]
          }
        },
        {
          "x": 0.5,
          "y": 0.78,
          "id": "s07-action-indicator",
          "to_x": 0.5,
          "to_y": 0.78,
          "color": "#c084fc",
          "label": "Market Intelligence Pill",
          "scale": 1,
          "detail": "Secondary badge reminding viewers to save and share",
          "motion": "FADE_SLIDE_UP text entrance with smoothstep easing",
          "rotation": 0,
          "motion_plan": {
            "idle": "shimmer",
            "focal": false,
            "easing": "easeOut",
            "exit_frame": 150,
            "enter_frame": 20,
            "hold_end_frame": 145,
            "stagger_frames": 2,
            "hold_start_frame": 35
          },
          "render_spec": {
            "type": "vector",
            "rects": [
              {
                "x": 10,
                "y": 10,
                "rx": 20,
                "fill": "rgba(129, 140, 248, 0.08)",
                "width": 500,
                "height": 60,
                "stroke": "#818cf8",
                "strokeWidth": 2
              }
            ],
            "viewBox": [
              0,
              0,
              520,
              80
            ]
          }
        }
      ],
      "purpose": "Drive explicit viewer engagement and retention on technology governance intelligence.",
      "asset_queries": [
        "Modern CTA button interactive terminal vector",
        "Tech finance notification bell icon SVG"
      ],
      "camera_motion": "Slow continuous pull-back scale 1.03 to 1.00 settling on final frame."
    },
    "styleBrief": {
      "fonts": {
        "body": "Arial",
        "heading": "Arial"
      },
      "bedMood": "ethereal ambient shimmer",
      "palette": {
        "bg": "#080c16",
        "text": "#f1f5f9",
        "accent": "#c084fc",
        "primary": "#818cf8"
      },
      "sfxPack": "cinematic",
      "archetype": "glass-ui",
      "background": "gradient-flow",
      "transitionSet": [
        "wipe"
      ],
      "motionPersonality": "fluid"
    },
    "motion_cue": "Punch zoom from 0.88 to 1.00 with heavy cinematic punch impact and ambient shimmer tail at frame 0.",
    "continuity_to_next": "None (final scene)",
    "motion": [],
    "continuity": {
      "fromPrevious": "carried from previous scene as specified by the active CLI",
      "toNext": "None (final scene)"
    },
    "production_audio_design": {
      "scene_number": 7,
      "cues": [
        {
          "hitFrame": 12,
          "role": "whoosh",
          "object_id": "",
          "reason": "Scene visual entrance"
        },
        {
          "hitFrame": 28,
          "role": "pop",
          "object_id": "",
          "reason": "Key emphasis word"
        }
      ]
    },
    "emphasis_word": "market"
  }
];

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
        bottom: 110,
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
  const color = scene.themeColor || '#818cf8';
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
        padding: '160px 60px 220px',
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
  const color = scene.themeColor || '#818cf8';
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
        padding: '140px 60px 220px',
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
  const color = scene.themeColor || '#818cf8';
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
        padding: '120px 60px 220px',
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
          <div style={{ fontSize: 36, fontWeight: 900, color: '#c084fc' }}>{nodeB.label}</div>
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
  const color = scene.themeColor || '#818cf8';
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
        padding: '160px 60px 220px',
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
                  background: isCurrent ? color : isPassed ? '#c084fc' : '#1e293b',
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
  const color = scene.themeColor || '#818cf8';
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
        padding: '160px 60px 220px',
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
              border: '2px solid #c084fc',
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
  const color = scene.themeColor || '#818cf8';
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
        padding: '160px 60px 220px',
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
  const color = scene.themeColor || '#818cf8';
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
        padding: '160px 60px 220px',
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

  const isLastOutroScene = scenes.length > 0 && scenes[scenes.length - 1].visual_type === 'outro';
  const contentFramesTotal = isLastOutroScene
    ? scenes.slice(0, -1).reduce((acc, s) => acc + (s.durationInFrames || Math.round(fps * 3.5)), 0)
    : 999999;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#080c16',
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
            background: `radial-gradient(circle at ${bgShiftX}% ${bgShiftY}%, #818cf82e 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {scenes.map((scene, index) => {
        const fromFrame = accumulatedFrame;
        const durationFrames = scene.durationInFrames || Math.round(fps * 3.5);
        accumulatedFrame += durationFrames;

        return (
          <Sequence
            key={scene.scene_number || index}
            from={fromFrame}
            durationInFrames={durationFrames}
          >
            <SceneContent scene={scene} fps={fps} index={index} />

            {/* Embedded Audio SFX Cues Synchronized at Exact Frame Timestamps */}
            {scene.audioCues?.map((cue, cIdx) => (
              cue.src ? (
                <Sequence
                  key={`sfx-${scene.scene_number || index}-${cIdx}`}
                  from={cue.hitFrame ?? cue.frame ?? 0}
                  durationInFrames={Math.round(fps * 1.5)}
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
