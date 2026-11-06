#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const topic = "VPN vs ZTNA: Zero Trust Architecture";
const fps = 60; // 60 FPS Professional Motion Graphics Upgrade
const projectId = "vpn-vs-ztna-60fps";
const outDir = path.join(root, 'backend', 'media', 'done', projectId);
await fs.mkdir(outDir, { recursive: true });

console.log('====================================================');
console.log('🚀 GENERATING 60 FPS PROFESSIONAL MOTION VIDEO');
console.log(`Topic       : "${topic}"`);
console.log(`Target FPS  : ${fps} FPS (Ultra-smooth 60fps)`);
console.log(`Project ID  : ${projectId}`);
console.log(`Output Dir  : ${outDir}`);
console.log('====================================================\n');

// 1. Script Narration for ~28-30s
const sceneDefinitions = [
  {
    role: 'hook',
    visual_type: '3d-showcase',
    icon: '🛡️',
    title: 'VPN or Zero Trust?',
    on_screen_text: 'Is Your VPN a Security Blind Spot?',
    narration: 'Is your traditional corporate VPN creating hidden security blind spots?',
    emphasis_word: 'blind',
    themeColor: '#38bdf8',
    nodes: [
      { label: 'Corporate Perimeter', sub: 'Castle-and-Moat Vulnerability' }
    ]
  },
  {
    role: 'body',
    visual_type: 'concept-diagram',
    title: 'The Perimeter Problem',
    on_screen_text: 'VPNs Grant Unchecked Lateral Movement',
    narration: 'Traditional VPNs grant perimeter-wide access once inside network boundaries.',
    emphasis_word: 'perimeter',
    themeColor: '#f43f5e',
    nodes: [
      { label: 'VPN Gateway', sub: 'Broad Network Access' },
      { label: 'Internal Servers', sub: 'Exposed to Lateral Moves' }
    ]
  },
  {
    role: 'body',
    visual_type: 'split-compare',
    title: 'Architecture Contrast',
    on_screen_text: 'VPN Perimeter vs ZTNA Zero Trust',
    narration: 'Zero Trust Network Access never trusts and continuously verifies every request.',
    emphasis_word: 'verifies',
    themeColor: '#06b6d4',
    nodes: [
      { label: 'VPN: Castle & Moat', sub: 'Trust once, traverse anywhere' },
      { label: 'ZTNA: Zero Trust', sub: 'Verify identity for every packet' }
    ]
  },
  {
    role: 'body',
    visual_type: '3d-showcase',
    icon: '🔐',
    title: 'Micro-Tunnel Isolation',
    on_screen_text: 'Application-Level Micro-Tunnels',
    narration: 'ZTNA micro-tunnels connect authenticated users directly to specific apps, never the subnet.',
    emphasis_word: 'micro-tunnels',
    themeColor: '#22c55e',
    nodes: [
      { label: 'Zero Trust Proxy', sub: 'Direct 1-to-1 App Tunneling' }
    ]
  },
  {
    role: 'body',
    visual_type: 'stat-counter',
    title: 'Threat Surface Reduction',
    on_screen_text: '80% Reduction in Lateral Threat Surface',
    stat_value: '-80%',
    source_url: 'https://cisa.gov/zero-trust-guidance',
    narration: 'Organizations adopting ZTNA reduce unauthorized lateral threat movement by 80 percent.',
    emphasis_word: 'lateral',
    themeColor: '#10b981'
  },
  {
    role: 'body',
    visual_type: 'process-flow',
    title: 'Continuous Verification',
    on_screen_text: 'Continuous Dynamic Trust Engine',
    narration: 'Access is determined dynamically by user identity, device health, and real-time context.',
    emphasis_word: 'identity',
    themeColor: '#a855f7',
    labels: [
      '1. Cryptographic Identity',
      '2. Device Posture Check',
      '3. Ephemeral Micro-Session'
    ]
  },
  {
    role: 'cta',
    visual_type: 'outro',
    title: 'Zero Trust Ready',
    on_screen_text: 'Bittrix Technologies. Enterprise Zero Trust Solutions.',
    narration: 'Bittrix Technologies. Modernize your architecture with Zero Trust today.',
    emphasis_word: 'Technologies',
    themeColor: '#5b1a78'
  }
];

// 2. Synthesize Audio with Edge-TTS
console.log('🎙️ [1/4] Synthesizing Voiceover Audio with Word Alignment...');
const pythonBin = path.join(root, '.venv-motion-checks', 'bin', 'python');
const ttsScript = path.join(root, 'backend', 'src', 'modules', 'audio', 'edgeTtsAlign.py');

const publicAudioDir = path.join(root, 'remotion', 'public', 'audio');
await fs.mkdir(publicAudioDir, { recursive: true });
const audioFileName = `${projectId}_master.mp3`;
const audioPublicPath = path.join(publicAudioDir, audioFileName);
const audioFile = path.join(outDir, 'master_audio.mp3');
const alignFile = path.join(outDir, 'alignment.json');

const fullScriptText = sceneDefinitions.map(s => s.narration).join(' ');
await execFileAsync(pythonBin, [
  ttsScript,
  '--text', fullScriptText,
  '--audio', audioFile,
  '--alignment', alignFile,
  '--voice', 'en-US-ChristopherNeural',
  '--speed', '1.0'
]);

await fs.copyFile(audioFile, audioPublicPath);

let alignment = { duration: 29.5, words: [] };
try {
  alignment = JSON.parse(await fs.readFile(alignFile, 'utf8'));
} catch (e) {
  console.warn('Alignment read error, using fallback duration');
}

const totalAudioSec = Number(alignment.duration || 29.5);
const totalFrames = Math.round(totalAudioSec * fps);
console.log(`✅ Narration synthesized: ${totalAudioSec.toFixed(2)}s (${totalFrames} frames at ${fps} FPS)`);

// 3. Assemble 60 FPS Scenes with Embedded Audio Cues
console.log('📐 [2/4] Distributing 60 FPS Scene Timelines & Synchronized SFX Cues...');
const perSceneDurationFrames = Math.floor(totalFrames / sceneDefinitions.length);

const scenes = sceneDefinitions.map((def, idx) => {
  const isOutro = idx === sceneDefinitions.length - 1;
  const isHook = idx === 0;
  const durationInFrames = isOutro
    ? totalFrames - perSceneDurationFrames * (sceneDefinitions.length - 1)
    : perSceneDurationFrames;

  const words = def.narration.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  // Synchronized SFX cues for 60 FPS
  const audioCues = [
    {
      frame: Math.min(6, durationInFrames - 12),
      hitFrame: Math.min(10, durationInFrames - 12),
      src: 'sfx/whoosh_01.wav',
      role: 'whoosh',
      volume: 0.45,
      durationFrames: 30,
    },
    {
      frame: Math.min(24, durationInFrames - 16),
      hitFrame: Math.min(26, durationInFrames - 16),
      src: isOutro ? 'sfx/chime_01.wav' : (def.visual_type === '3d-showcase' ? 'sfx/pop_01.wav' : 'sfx/ding_01.wav'),
      role: isOutro ? 'chime' : 'pop',
      volume: 0.5,
      durationFrames: 25,
    }
  ];

  const wordDuration = durationInFrames / (words.length + 1);
  const mappedWords = words.map((w, wIdx) => ({
    word: w,
    startFrame: Math.round(wIdx * wordDuration),
    endFrame: Math.round((wIdx + 1) * wordDuration),
  }));

  return {
    ...def,
    scene_number: idx + 1,
    role: isHook ? 'hook' : isOutro ? 'cta' : 'body',
    template: isHook ? 'question-hook' : isOutro ? 'cta-outro' : 'steps-numbered',
    durationInFrames,
    durationSec: Number((durationInFrames / fps).toFixed(2)),
    words: mappedWords,
    audioCues,
  };
});

const props = {
  video: {
    title: "VPN vs ZTNA",
    width: 1080,
    height: 1920,
    fps,
    durationInFrames: totalFrames,
    targetDurationSec: totalAudioSec,
    audioUrl: `audio/${audioFileName}`,
  },
  scenes
};

const propsPath = path.join(outDir, 'props.json');
await fs.writeFile(propsPath, JSON.stringify(props, null, 2), 'utf8');

// 4. Generate Single 60 FPS TSX File
console.log('⚛️ [3/4] Generating Single 60 FPS Remotion TSX File with 3D & Audio...');
const { buildAuthoritativeTsx } = await import('../backend/dist/modules/production/authoritativeTsxBuilder.js');
const tsxSource = buildAuthoritativeTsx(topic, scenes, {
  palette: { primary: '#38bdf8', accent: '#f59e0b', bg: '#080d1a' }
});

const tsxPath = path.join(outDir, 'GeneratedCliVideo.tsx');
await fs.writeFile(tsxPath, tsxSource, 'utf8');

// Save directly to Remotion src
const remotionLiveTsxPath = path.join(root, 'remotion', 'src', 'GeneratedCliVideo.tsx');
await fs.writeFile(remotionLiveTsxPath, tsxSource, 'utf8');
console.log(`✅ Single TSX file saved at: ${remotionLiveTsxPath}`);

// 5. Render Video via Remotion CLI at 60 FPS
console.log('🎬 [4/4] Rendering 1080x1920 60 FPS MP4 via Remotion Engine...');
const outputVideo = path.join(outDir, 'vpn_vs_ztna_60fps.mp4');

const remotionHost = path.join(root, 'remotion', 'scripts', 'remotion-host.mjs');
await execFileAsync(process.execPath, [
  remotionHost,
  'render',
  'src/index.ts',
  'MainComposition',
  outputVideo,
  `--props=${propsPath}`,
  '--scale=1',
  '--gl=angle',
  '--concurrency=2',
  '--overwrite'
], {
  cwd: path.join(root, 'remotion'),
  maxBuffer: 32 * 1024 * 1024
});

// Also save to global media videos
const globalVideoPath = path.join(root, 'backend', 'media', 'videos', 'vpn_vs_ztna_final.mp4');
await fs.mkdir(path.dirname(globalVideoPath), { recursive: true });
await fs.copyFile(outputVideo, globalVideoPath);

console.log('\n====================================================');
console.log('🎉 60 FPS VIDEO GENERATION COMPLETE!');
console.log(`Video File (Done Path)  : ${outputVideo}`);
console.log(`Video File (Global)     : ${globalVideoPath}`);
console.log(`Single TSX File Staged  : ${remotionLiveTsxPath}`);
console.log(`Duration & FPS          : ${totalAudioSec.toFixed(2)}s @ ${fps} FPS`);
console.log('====================================================\n');
