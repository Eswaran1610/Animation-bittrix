#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const topic = process.argv[2];
const targetDuration = Number(process.argv[3] || 20);
const fps = Number(process.argv[4] || 30);
const requestedThemeId = process.argv[5];

if (!topic) {
  console.error('Usage: node scripts/cli-generate.mjs "<Topic>" [durationSeconds] [fps] [themeId]');
  process.exit(1);
}

const { THEME_CATALOG, getThemeById } = await import('../backend/dist/modules/themes/themeCatalog.js');
const activeTheme = getThemeById(requestedThemeId);

const projectId = crypto.randomUUID();
const outDir = path.join(root, 'backend', 'media', 'done', projectId);
await fs.mkdir(outDir, { recursive: true });

console.log('====================================================');
console.log('🚀 STANDALONE CLI MOTION PIPELINE');
console.log(`Topic       : "${topic}"`);
console.log(`Duration    : ${targetDuration}s @ ${fps} FPS`);
console.log(`Theme       : "${activeTheme.name}" (${activeTheme.id})`);
console.log(`Archetype   : ${activeTheme.archetype}`);
console.log(`Project ID  : ${projectId}`);
console.log(`Output Dir  : ${outDir}`);
console.log('====================================================\n');

// 1. CLI Audio Generation & Alignment via edgeTtsAlign.py
console.log('🎙️ [1/4] Running Python Audio CLI (TTS + Word Alignments)...');
const pythonBin = path.join(root, '.venv-motion-checks', 'bin', 'python');
const ttsScript = path.join(root, 'backend', 'src', 'modules', 'audio', 'edgeTtsAlign.py');

const publicAudioDir = path.join(root, 'remotion', 'public', 'audio');
await fs.mkdir(publicAudioDir, { recursive: true });
const audioFileName = `${projectId}_master.mp3`;
const audioPublicPath = path.join(publicAudioDir, audioFileName);
const audioFile = path.join(outDir, 'master_audio.mp3');
const alignFile = path.join(outDir, 'alignment.json');

// 20s Content + 3s Bittrix Outro = ~23s Total Runtime with Continuous Voice
const outroText = `Accelerate your engineering with Bittrix Technologies.`;
const sentences = [
  `How does ${topic} actually function?`,
  `First, core components initialize state and process inbound requests.`,
  `Next, the architecture coordinates workflows across modular distributed layers.`,
  `Data flows deterministically through verified cryptographic pipelines.`,
  `The overall structure delivers unprecedented performance and guaranteed reliability.`,
  outroText
];

const fullScriptText = sentences.join(' ');
await execFileAsync(pythonBin, [
  ttsScript,
  '--text', fullScriptText,
  '--audio', audioFile,
  '--alignment', alignFile,
  '--voice', 'en-US-ChristopherNeural',
  '--speed', '1.0'
]);

await fs.copyFile(audioFile, audioPublicPath);

const alignment = JSON.parse(await fs.readFile(alignFile, 'utf8'));
const totalAudioSec = Number(alignment.duration || targetDuration);
const totalFrames = Math.round(totalAudioSec * fps);
const outroDurationFrames = Math.round(fps * 3.0); // Exactly 3.0s (90f @ 30fps)
const contentFramesTotal = Math.max(1, totalFrames - outroDurationFrames);
const contentScenesCount = sentences.length - 1;
const perContentSceneFrames = Math.floor(contentFramesTotal / contentScenesCount);

console.log(`✅ Continuous Audio synthesized: ${totalAudioSec.toFixed(2)}s (${totalFrames} frames)`);
console.log(`   Content: ${(contentFramesTotal / fps).toFixed(2)}s | Bittrix Outro: ${(outroDurationFrames / fps).toFixed(2)}s (90 frames)`);

// 2. Build Authoritative Scene Plan & Remotion Props
console.log('📐 [2/4] Assembling Structured Scene Plan & Audio Timestamps...');

const scenes = sentences.map((narration, idx) => {
  const isOutro = idx === sentences.length - 1;
  const isHook = idx === 0;
  const durationInFrames = isOutro
    ? outroDurationFrames
    : idx === contentScenesCount - 1
      ? contentFramesTotal - perContentSceneFrames * (contentScenesCount - 1)
      : perContentSceneFrames;

  const words = narration.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const visualType = isOutro ? 'outro' : (idx % 2 === 0 ? 'concept-diagram' : 'process-flow');

  const audioCues = [
    {
      frame: Math.min(10, durationInFrames - 8),
      hitFrame: Math.min(12, durationInFrames - 8),
      src: 'sfx/whoosh_01.wav',
      role: 'whoosh',
      volume: 0.5,
      durationFrames: 25,
    },
    {
      frame: Math.min(25, durationInFrames - 8),
      hitFrame: Math.min(26, durationInFrames - 8),
      src: isOutro ? 'sfx/chime_01.wav' : 'sfx/pop_01.wav',
      role: isOutro ? 'chime' : 'pop',
      volume: 0.6,
      durationFrames: 20,
    }
  ];

  return {
    id: `scene-${idx + 1}`,
    scene_number: idx + 1,
    role: isHook ? 'hook' : isOutro ? 'cta' : 'body',
    template: isHook ? 'question-hook' : isOutro ? 'cta-outro' : 'steps-numbered',
    visual_type: visualType,
    themeColor: activeTheme.palette.primary,
    durationInFrames,
    narration,
    title: words.slice(0, 4).join(' '),
    on_screen_text: narration,
    emphasis_word: words[Math.floor(words.length / 2)] || words[0],
    audioCues,
    nodes: [
      { label: words.slice(0, Math.ceil(words.length / 2)).join(' '), sub: 'Layer 1' },
      { label: words.slice(Math.ceil(words.length / 2)).join(' '), sub: 'Layer 2' }
    ],
    labels: words.slice(0, 3),
    words: words.map((w, wIdx) => ({
      word: w,
      startFrame: Math.round(wIdx * (durationInFrames / (words.length + 1))),
      endFrame: Math.round((wIdx + 1) * (durationInFrames / (words.length + 1)))
    }))
  };
});

const props = {
  video: {
    title: topic.slice(0, 30),
    width: 1080,
    height: 1920,
    fps,
    durationInFrames: totalFrames,
    targetDurationSec: totalAudioSec,
    audioUrl: `audio/${audioFileName}`,
  },
  theme: activeTheme,
  scenes
};

const propsPath = path.join(outDir, 'props.json');
await fs.writeFile(propsPath, JSON.stringify(props, null, 2), 'utf8');

// 3. Generate authoritative TSX
console.log('⚛️ [3/4] Generating Authoritative Remotion TSX File...');
const { buildAuthoritativeTsx } = await import('../backend/dist/modules/production/authoritativeTsxBuilder.js');
const tsxSource = buildAuthoritativeTsx(topic, scenes, {
  palette: activeTheme.palette,
  fonts: activeTheme.fonts,
  archetype: activeTheme.archetype,
  motionPersonality: activeTheme.motionPersonality,
  background: activeTheme.background
});

const tsxPath = path.join(outDir, 'composition.tsx');
await fs.writeFile(tsxPath, tsxSource, 'utf8');
await fs.writeFile(path.join(root, 'remotion', 'src', 'GeneratedCliVideo.tsx'), tsxSource, 'utf8');

// 4. Render Video via Remotion CLI
console.log('🎬 [4/4] Rendering Final MP4 via Remotion CLI...');
const outputVideo = path.join(outDir, 'video.mp4');

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
  '--overwrite'
], {
  cwd: path.join(root, 'remotion'),
  maxBuffer: 16 * 1024 * 1024
});

// 5. Manifest & Saved Path Output
const manifest = {
  projectId,
  topic,
  fps,
  durationSeconds: totalAudioSec,
  status: 'ready',
  paths: {
    video: outputVideo,
    audio: audioFile,
    props: propsPath,
    tsx: tsxPath
  }
};
await fs.writeFile(path.join(outDir, 'done-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log('\n====================================================');
console.log('🎉 CLI VIDEO GENERATION COMPLETE!');
console.log(`Video File Saved At : ${outputVideo}`);
console.log(`Manifest File       : ${path.join(outDir, 'done-manifest.json')}`);
console.log('====================================================');

// Output strictly the saved path on the final line for CLI scripting
console.log(outputVideo);
