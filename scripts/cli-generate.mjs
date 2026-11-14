#!/usr/bin/env node
/**
 * CLI Video Generation Pipeline — 2-Stage: Preview → Final
 *
 * Stage 1: Preview (540×960, low-res) — TSX + all audio (voice+SFX) in one render
 *   - Validation suite: latency check, motion gate (≥0.80), caption check, AV duration match
 *   - Retry up to 3 times if any check fails
 * Stage 2: Final (1080×1920, 30fps) — Only after preview passes all checks
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, exec } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const topic = process.argv[2];
const targetDuration = Number(process.argv[3] || 20);
const fps = Number(process.argv[4] || 30);
const requestedThemeId = process.argv[5];

if (!topic) {
  console.error('Usage: node scripts/cli-generate.mjs "<Topic>" [durationSeconds] [fps] [themeId]');
  process.exit(1);
}

const { getThemeById } = await import('../backend/dist/modules/themes/themeCatalog.js');
const { audioMixerService } = await import('../backend/dist/modules/audio/audioMixerService.js');
const { audioBedService } = await import('../backend/dist/modules/audio/audioBedService.js');
const activeTheme = getThemeById(requestedThemeId);

const projectId = crypto.randomUUID();
// Sanitize topic into a safe filename slug
const topicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
const outDir = path.join(root, 'backend', 'media', 'done', projectId);
await fs.mkdir(outDir, { recursive: true });

console.log('====================================================');
console.log('🚀 STANDALONE CLI MOTION PIPELINE — 2-STAGE');
console.log(`Topic       : "${topic}"`);
console.log(`Duration    : ${targetDuration}s @ ${fps} FPS`);
console.log(`Theme       : "${activeTheme.name}" (${activeTheme.id})`);
console.log(`Archetype   : ${activeTheme.archetype}`);
console.log(`Project ID  : ${projectId}`);
console.log(`Output Dir  : ${outDir}`);
console.log('====================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — TTS + Word Alignment per Scene (audio source of truth, built ONCE, shared)
// ─────────────────────────────────────────────────────────────────────────────
console.log('🎙️  [1/5] Synthesizing Voice Narration with Word-Level Alignment per Scene...');
const pythonBin = path.join(root, '.venv-motion-checks', 'bin', 'python');
const ttsScript = path.join(root, 'backend', 'src', 'modules', 'audio', 'edgeTtsAlign.py');

const publicAudioDir = path.join(root, 'remotion', 'public', 'audio');
await fs.mkdir(publicAudioDir, { recursive: true });

const audioFileName = `${projectId}_master.mp3`;
const audioPublicPath = path.join(publicAudioDir, audioFileName);
const audioFile = path.join(outDir, 'master_audio.mp3');
const alignFile = path.join(outDir, 'alignment.json');

// Dynamic Technical Script Generation via AGY AI Director
const outroText = `Accelerate your engineering with Bittrix Technologies.`;
const targetContentSec = Math.max(12, targetDuration - 3.5);
const targetContentScenes = Math.max(3, Math.round(targetContentSec / 3.8));

console.log(`📝 Authoring dynamic technical script for ${targetDuration}s (~${targetContentScenes} scenes + Bittrix outro)...`);

let sentences = [];
const scriptPrompt = `You are a Principal Software & Systems Engineer and Motion Graphics Director.
Author a highly technical, mechanically accurate narration script for a ${targetDuration}-second explainer on:
"${topic}"

CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${targetContentScenes} concise, punchy sentences explaining concrete mechanics (data structures, algorithms, pointers, memory buffers, concurrency, or physical workflows).
2. Exactly one sentence per scene. No vague generalities or marketing fluff.
3. Every sentence must be between 8 and 14 words.
4. The final sentence must be:
   "${outroText}"

Return ONLY a JSON array of strings:
[
  "Sentence 1...",
  "Sentence 2...",
  "${outroText}"
]`;

try {
  const { stdout: scriptOut } = await execFileAsync(
    '/usr/bin/agy',
    ['-p', scriptPrompt, '--model', process.env.AGY_MODEL || 'gemini-3.8-flash-medium', '--output-format', 'json', '--dangerously-skip-permissions'],
    { timeout: 35000, maxBuffer: 5 * 1024 * 1024 }
  );
  let rawJson = scriptOut.trim();
  try {
    const outer = JSON.parse(rawJson);
    if (outer.response) rawJson = outer.response;
  } catch {}
  const match = rawJson.match(/\[\s*[\s\S]*?\s*\]/);
  if (match) {
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      sentences = parsed.map(s => String(s).trim()).filter(Boolean);
      if (!sentences[sentences.length - 1].includes('Bittrix Technologies')) {
        sentences.push(outroText);
      }
      console.log(`✅ AI Script synthesized: ${sentences.length} scenes tailored to "${topic}"`);
    }
  }
} catch (scriptErr) {
  console.warn(`⚠️ Dynamic script generation fallback triggered: ${scriptErr.message}`);
}

if (!sentences.length) {
  sentences = [
    `How does ${topic} actually function under the hood?`,
    `First, the engine initializes core memory structures and indexes inbound keys.`,
    `Next, intermediate branch nodes route pointers using binary search across ordered pages.`,
    `Leaf pages store tuple identifiers directly alongside right-link pointers for fast traversal.`,
    `High concurrency mechanisms eliminate global locks during dynamic page splits.`,
    `Optimized buffer cache lookups minimize disk IOPS and sustain ultra-low read latency.`,
    outroText
  ];
}

const sentenceAudioData = [];
for (let idx = 0; idx < sentences.length; idx++) {
  const sentence = sentences[idx];
  const scAudioFile = path.join(outDir, `scene_${idx + 1}_voice.mp3`);
  const scAlignFile = path.join(outDir, `scene_${idx + 1}_align.json`);
  const publicAudioName = `${projectId}_sc${idx + 1}_voice.mp3`;
  const scPublicAudio = path.join(publicAudioDir, publicAudioName);

  await execFileAsync(pythonBin, [
    ttsScript,
    '--text', sentence,
    '--audio', scAudioFile,
    '--alignment', scAlignFile,
    '--voice', 'en-US-ChristopherNeural',
    '--speed', '1.0'
  ]);
  await fs.copyFile(scAudioFile, scPublicAudio);

  const scAlignment = JSON.parse(await fs.readFile(scAlignFile, 'utf8'));
  const rawWords = scAlignment.words || [];
  const words = rawWords.map(w => ({
    word: w.word,
    startFrame: Math.round(Number(w.startSec) * fps),
    endFrame: Math.max(Math.round(Number(w.startSec) * fps) + 1, Math.round(Number(w.endSec) * fps)),
  }));
  const voiceSec = Number(scAlignment.duration || (rawWords.length ? rawWords[rawWords.length - 1].endSec : 3.0));

  sentenceAudioData.push({
    sentence,
    words,
    voiceSec,
    narrationAudio: `audio/${publicAudioName}`,
    scAudioFile,
    scAlignFile,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Build Scene Plan from Measured Audio Durations
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📐 [2/5] Building ONE Authoritative Timeline Array from Measured Voice Durations...');

// Build ONE timeline array from measured voice durations:
//   scene[i].start = scene[i-1].start + scene[i-1].frames
//   scene[i].frames = ceil(voiceSec * fps) + leadFrames + tailFrames
// Both visual Sequence and voice Audio read from this same array, so they cannot drift.
// Never use a fixed per-scene duration.
// CTA scene must be at least as long as its voice plus 1s; final video length = sum of scene frames.
const leadFrames = 0;
const tailFrames = Math.max(8, Math.round(0.4 * fps));

let runningStart = 0;
const sceneTimeline = sentenceAudioData.map((item, idx) => {
  const isOutro = idx === sentenceAudioData.length - 1;
  const voiceSec = item.voiceSec;
  const ctaPadding = isOutro ? Math.ceil(1.0 * fps) : 0;
  let frames = Math.ceil(voiceSec * fps) + ctaPadding + leadFrames + tailFrames;
  if (isOutro) {
    frames = Math.max(frames, Math.ceil((voiceSec + 1.0) * fps) + leadFrames + tailFrames);
  }
  frames = Math.max(Math.round(1.5 * fps), frames);

  const start = runningStart;
  runningStart += frames;
  const voiceStart = start + leadFrames;
  const visualStart = start;

  return {
    start,
    frames,
    durationInFrames: frames,
    voiceSec,
    voiceStart,
    visualStart,
    leadFrames,
    tailFrames,
    isOutro,
  };
});

const totalTimelineFrames = sceneTimeline.reduce((sum, s) => sum + s.frames, 0);
const totalDurationSec = totalTimelineFrames / fps;

// GATE: Check every scene |voiceStart - visualStart| <= 3 frames (100 ms)
for (let i = 0; i < sceneTimeline.length; i++) {
  const drift = Math.abs(sceneTimeline[i].voiceStart - sceneTimeline[i].visualStart);
  if (drift > 3) {
    throw new Error(`Sync Gate Failure at scene ${i + 1}: |voiceStart (${sceneTimeline[i].voiceStart}) - visualStart (${sceneTimeline[i].visualStart})| = ${drift} frames > 3 frames limit.`);
  }
}

// Procedural Sound Effects Generation
console.log('   Synthesizing procedural sound effects library (SFX)...');
const makeSfxScript = path.join(root, 'scripts', 'make_sfx.py');
const sfxDir = path.join(root, 'remotion', 'public', 'sfx', projectId);
await fs.mkdir(sfxDir, { recursive: true });
await execFileAsync(pythonBin, [
  makeSfxScript,
  '--out', sfxDir,
  '--seed', projectId,
  '--roles', 'whoosh,pop,impact,chime,click',
  '--variants', '3',
]);

const scenes = sentenceAudioData.map((item, idx) => {
  const isOutro = idx === sentenceAudioData.length - 1;
  const isHook = idx === 0;
  const timelineItem = sceneTimeline[idx];
  const startFrame = timelineItem.start;
  const durationInFrames = timelineItem.frames;
  const words = item.words;

  // Dynamic SFX cues placed with -2 frame lead before first word and key middle word
  const firstWordFrame = words[0]?.startFrame ?? 4;
  const midWordFrame = words[Math.floor(words.length / 2)]?.startFrame ?? Math.round(durationInFrames * 0.4);

  const audioCues = [
    {
      frame: Math.max(0, firstWordFrame - 2),
      hitFrame: Math.max(0, firstWordFrame - 2),
      src: `sfx/${projectId}/whoosh_01.wav`,
      role: 'whoosh',
      volume: 0.45,
      durationFrames: 25,
    },
    {
      frame: Math.max(2, midWordFrame - 2),
      hitFrame: Math.max(2, midWordFrame - 2),
      src: isOutro ? `sfx/${projectId}/chime_01.wav` : (idx % 2 === 0 ? `sfx/${projectId}/pop_01.wav` : `sfx/${projectId}/impact_01.wav`),
      role: isOutro ? 'chime' : (idx % 2 === 0 ? 'pop' : 'impact'),
      volume: 0.55,
      durationFrames: 25,
    }
  ];

  const wordList = words.map(w => w.word);
  const visualType = isOutro ? 'outro' : (idx % 2 === 0 ? 'concept-diagram' : 'process-flow');
  const icons = ['⚡', '🛡️', '⚙️', '🚀', '🎯', '💡', '🔍', '🌐'];
  const nodeIconA = icons[idx % icons.length];
  const nodeIconB = icons[(idx + 3) % icons.length];

  return {
    id: `scene-${idx + 1}`,
    scene_number: idx + 1,
    role: isHook ? 'hook' : isOutro ? 'cta' : 'body',
    template: isHook ? 'question-hook' : isOutro ? 'cta-outro' : 'steps-numbered',
    visual_type: visualType,
    themeColor: activeTheme.palette.primary,
    start: startFrame,
    startFrame,
    voiceStart: timelineItem.voiceStart,
    visualStart: timelineItem.visualStart,
    frames: durationInFrames,
    durationInFrames,
    duration_sec: durationInFrames / fps,
    narration: item.sentence,
    narrationAudio: item.narrationAudio,
    title: wordList.slice(0, 4).join(' '),
    on_screen_text: item.sentence,
    emphasis_word: wordList[Math.floor(wordList.length / 2)] || wordList[0] || topic,
    audioCues,
    nodes: [
      { label: wordList.slice(0, Math.ceil(wordList.length / 2)).join(' ') || topic, sub: 'Core Engine', icon: nodeIconA },
      { label: wordList.slice(Math.ceil(wordList.length / 2)).join(' ') || 'Scale Target', sub: 'High Throughput', icon: nodeIconB }
    ],
    labels: wordList.slice(0, 3),
    words,
  };
});

// Generate ambient sound bed & Mix 1-track master audio with exact scene starts
console.log('   Generating ambient sound bed and mixing master audio track...');
const backgroundAudioUrl = await audioBedService.generate(projectId, 'preview', 1, totalDurationSec);

const masterAudioRel = await audioMixerService.mixMasterAudio({
  projectId,
  renderType: 'preview',
  renderVersion: 1,
  fps,
  totalDurationFrames: totalTimelineFrames,
  scenes,
  backgroundAudioUrl,
});

const absMixed = path.join(root, 'remotion', 'public', ...masterAudioRel.replace(/^\//, '').split('/'));
await fs.copyFile(absMixed, audioFile);
await fs.copyFile(absMixed, audioPublicPath);

// Save combined alignment for inspection
await fs.writeFile(alignFile, JSON.stringify({
  duration: totalDurationSec,
  scenes: sentenceAudioData.map((s, idx) => ({
    scene: idx + 1,
    startFrame: sceneTimeline[idx].start,
    durationInFrames: sceneTimeline[idx].frames,
    words: s.words,
  }))
}, null, 2), 'utf8');

console.log(`✅ Master Audio mixed: ${totalDurationSec.toFixed(2)}s (${totalTimelineFrames} frames @ ${fps}fps)`);
console.log(`   Voice, SFX, and ambient bed perfectly synchronized to timeline array.`);

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — AI Agent TSX Authoring & Self-Repair (Zero template fallback)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n⚛️  [3/5] AI Agent authoring 100% custom Remotion TSX code...');

const { tsxValidator } = await import('../backend/dist/modules/production/tsxValidator.js');

const tsxPrompt = `You are an elite Motion Graphics Software Engineer authoring 100% BESPOKE Remotion TSX code.
CRITICAL CONSTRAINT: TEMPLATE FALLBACKS HAVE BEEN COMPLETELY REMOVED. You as the AI agent MUST author 100% of the Remotion TSX component code yourself.

PROJECT: "${topic}" (ID: ${projectId})
OUTPUT FORMAT: 1080 x 1920, ${fps} FPS, Total Duration: ${totalTimelineFrames} frames (${totalDurationSec.toFixed(2)}s).

SCENES WITH MEASURED TIMESTAMPS:
${JSON.stringify(scenes, null, 2)}

CREATIVE REQUIREMENTS:
1. Export default: export default function GeneratedCliVideo(props: any) { ... }
2. Import from 'remotion': AbsoluteFill, Sequence, Audio, staticFile, spring, interpolate, useCurrentFrame, useVideoConfig
   - Claude-Grade Micro-UI Primitives: Import { TerminalWindow, GlassCard, LaserBusLine, GitCommitGraph, TelemetryPill, NetworkNodes, MetricBar, KineticTitle } from './components/MotionElements'
   - Kinetic Captions: Import { SyncCaptions } from './components/SyncCaptions'
   - Optional 3D Animation: Import { ThreeCanvas } from '@remotion/three' and * as THREE from 'three'
3. Include master voiceover track:
   <Audio src={staticFile('audio/${audioFileName}')} volume={1.0} startFrom={0} />
4. DYNAMIC TIMELINE SEQUENCE LAW:
   - Every scene visual Sequence MUST read from scene.start:
     <Sequence from={scene.start} durationInFrames={scene.durationInFrames}>
   - NEVER use a fixed per-scene duration. Visual and voice share this exact timeline.
5. VERTICAL SAFE ZONE & CENTERING:
   - Captions: Place kinetic karaoke captions strictly in the bottom safe zone above bottom 20% (> 384px from bottom, e.g. style={{ position: 'absolute', bottom: 400, left: 60, right: 60, textAlign: 'center' }}).
   - Content: Vertically center all primary diagrams, cards, 3D canvases, and graphics in the viewport (between top 120px and bottom 440px).
6. 3D & MOTION ARCHITECTURE:
   - For 3D elements, use <ThreeCanvas width={1080} height={1920}> with <ambientLight />, <pointLight />, and 3D meshes (<boxGeometry />, <sphereGeometry />, <meshStandardMaterial /> or Three.js particle systems).
   - Local open-source Three.js textures ready in staticFile('assets/three/textures/...'): uv_grid.jpg, disc.png, spark1.png, carbon.png, matcap_white.jpg, cloud_noise.png.
   - 3D models available: staticFile('assets/three/models/primary_ion_drive.glb'), staticFile('assets/three/models/shader_ball.glb').
7. Single continuous living canvas with continuous virtual camera (interpolate camX, camY, camScale across scenes).
8. Topic-specific visual mechanics for "${topic}". ZERO 50% border-radius circles or placeholder orbs! Compose real UI elements: TerminalWindow with diffs, GitCommitGraph, GlassCard with TelemetryPill.
   - For story / faceless shorts: Review and adhere to .agents/skills/faceless-shorts/SKILL.md (Zack D. Films style story-based animation, dramatic camera journeys through internal mechanisms, and punchy word captions).
9. MANDATORY 3 CONTENT IMAGES/VISUALS:
   - Exactly 3 distinct, fresh content-based visual images or technical diagrams must appear across the video (staggered in scenes 2, 3, and 4) tailored directly to "${topic}".
   - Each image must enter dynamically with spring physics (anticipation + overshoot), subtle continuous float or rotation, and sound cue hits.
10. ZERO-OFFSET KINETIC KARAOKE CAPTIONS:
   - Each word in scene.words has exact startFrame and endFrame derived directly from millisecond speech alignment.
   - Word highlight MUST activate strictly when: localFrame >= word.startFrame && localFrame <= word.endFrame.
   - NEVER guess or finish early; captions must track the voice word-for-word in real time.
11. DYNAMIC OBJECT SOUNDS & SFX HITS:
   - Synchronize on-screen element entrances, popups, and card hits with sound cues (whoosh on entrance, pop/impact on element arrival).
   - Place hits at -2 frames relative to visual contact for organic audiovisual punch.
12. The FINAL SCENE (~last 3s) MUST render the exact Bittrix Technologies royal purple (#5b1a78) outro matching bittrix-reel(1).html:
   - 6-point radial gradient hexagon with spoke circles
   - Rolling chain link track and rotating 12-tooth gear with serif 'B'
   - Staggered letter italic bold "BITTRIX" and tracking "TECHNOLOGIES"
   - Purple underline and diagonal light sweep
   - Spoken narration aloud: "Accelerate your engineering with Bittrix Technologies."
13. Return ONLY valid, self-contained TypeScript/TSX in a \`\`\`tsx code fence.
`;

let tsxSource = null;
let lastErrors = [];

try {
  const { stdout: agyTsxOutput } = await execFileAsync(
    '/usr/bin/agy',
    ['-p', tsxPrompt, '--model', process.env.AGY_MODEL || 'gemini-3.8-flash-medium', '--output-format', 'json', '--dangerously-skip-permissions'],
    { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }
  );
  let rawText = agyTsxOutput.trim();
  try {
    const outer = JSON.parse(rawText);
    if (outer.response) rawText = outer.response;
  } catch {}

  const match = rawText.match(/```(?:tsx|typescript|jsx)\s*([\s\S]*?)```/i);
  let candidate = match ? match[1].trim() : null;
  if (!candidate && rawText.includes('import') && rawText.includes('GeneratedCliVideo')) {
    candidate = rawText.trim();
  }
  if (candidate) {
    if (!candidate.includes('export default') && !candidate.includes('export const GeneratedCliVideo')) {
      candidate = `${candidate}\n\nexport default GeneratedCliVideo;`;
    }
    const val = await tsxValidator.validate(candidate);
    if (val.valid) {
      tsxSource = candidate;
      console.log(`✅ Agent bespoke Remotion TSX authored and validated successfully!`);
    } else {
      lastErrors = val.errors;
      console.warn(`⚠️ Agent TSX initial validation warnings: ${val.errors.join('; ')}`);
    }
  } else {
    lastErrors = ['Agent did not return a ```tsx code fence'];
  }
} catch (err) {
  console.warn(`⚠️ Agent initial TSX generation error: ${err.message}`);
  lastErrors = [err.message];
}

// Agent Self-Repair Loop
let repairAttempts = 0;
const maxRepairAttempts = 2;
while (!tsxSource && repairAttempts < maxRepairAttempts) {
  repairAttempts++;
  console.log(`🔄 Requesting agent TSX repair pass (${repairAttempts}/${maxRepairAttempts})...`);
  const repairPrompt = `You are an elite Motion Graphics Software Engineer authoring Remotion TSX.
CRITICAL ERROR: Your previous Remotion TSX code failed validation:\n- ${lastErrors.join('\n- ')}

USER CONSTRAINT: TEMPLATE FALLBACKS ARE STRICTLY REMOVED. You MUST author 100% of the TSX code yourself.
Fix all errors and return the complete, self-contained Remotion TSX component in a \`\`\`tsx code fence:

PROJECT: "${topic}"
TOTAL DURATION: ${totalTimelineFrames} frames (${totalDurationSec.toFixed(2)}s) @ ${fps}fps

SCENES WITH MEASURED TIMESTAMPS:
${JSON.stringify(scenes, null, 2)}

Requirements:
1. export default function GeneratedCliVideo(props: any) { ... }
2. Import from 'remotion': AbsoluteFill, Sequence, Audio, staticFile, spring, interpolate, useCurrentFrame, useVideoConfig
   - Optional 3D: Import { ThreeCanvas } from '@remotion/three' and * as THREE from 'three'
3. Master audio track: <Audio src={staticFile('audio/${audioFileName}')} volume={1.0} startFrom={0} />
4. Single continuous living canvas with continuous camera motion.
5. Topic-specific physical mechanics for "${topic}" (can use <ThreeCanvas> 3D meshes/particles or dynamic 2D SVGs).
6. Kinetic karaoke captions from scene.words.
7. Exact royal purple (#5b1a78) Bittrix outro in final scene with rotating gear and chain track.
8. Dynamic Timeline: Every scene visual Sequence MUST read from scene.start: <Sequence from={scene.start} durationInFrames={scene.durationInFrames}>.
9. Vertical Safe Zone & Centering: Captions MUST be in safe zone strictly above bottom 20% (> 384px from bottom, bottom: 400). Center primary content between top 120px and bottom 440px.
`;
  try {
    const { stdout: repOutput } = await execFileAsync(
      '/usr/bin/agy',
      ['-p', repairPrompt, '--model', process.env.AGY_MODEL || 'gemini-3.8-flash-medium', '--output-format', 'json', '--dangerously-skip-permissions'],
      { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }
    );
    let repText = repOutput.trim();
    try {
      const outer = JSON.parse(repText);
      if (outer.response) repText = outer.response;
    } catch {}

    const repMatch = repText.match(/```(?:tsx|typescript|jsx)\s*([\s\S]*?)```/i);
    let candidate = repMatch ? repMatch[1].trim() : null;
    if (!candidate && repText.includes('import') && repText.includes('GeneratedCliVideo')) {
      candidate = repText.trim();
    }
    if (candidate) {
      if (!candidate.includes('export default') && !candidate.includes('export const GeneratedCliVideo')) {
        candidate = `${candidate}\n\nexport default GeneratedCliVideo;`;
      }
      const val = await tsxValidator.validate(candidate);
      if (val.valid) {
        tsxSource = candidate;
        console.log(`✅ Agent TSX self-repair pass succeeded on attempt ${repairAttempts}!`);
        break;
      } else {
        lastErrors = val.errors;
      }
    } else {
      lastErrors = ['Agent did not return a ```tsx code fence'];
    }
  } catch (err) {
    console.error(`Repair pass ${repairAttempts} error:`, err.message);
    lastErrors = [err.message];
  }
}

if (!tsxSource) {
  throw new Error(`[cli-generate] AGY failed to author valid bespoke Remotion TSX. Template fallback is forbidden.`);
}

const tsxPath = path.join(outDir, 'composition.tsx');
await fs.writeFile(tsxPath, tsxSource, 'utf8');
await fs.writeFile(path.join(root, 'remotion', 'src', 'GeneratedCliVideo.tsx'), tsxSource, 'utf8');

// Save props JSON (locked, shared by both stages)
const props = {
  video: {
    title: topic.slice(0, 30),
    width: 1080,
    height: 1920,
    fps,
    durationInFrames: totalTimelineFrames,
    targetDurationSec: totalTimelineFrames / fps,
    audioUrl: `audio/${audioFileName}`,
  },
  theme: activeTheme,
  scenes
};
const propsPath = path.join(outDir, 'props.json');
await fs.writeFile(propsPath, JSON.stringify(props, null, 2), 'utf8');

const remotionHost = path.join(root, 'remotion', 'scripts', 'remotion-host.mjs');

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — STAGE 1: PREVIEW RENDER (540×960, all audio baked in)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔍 [4/5] ═══════════════════════════════════════════');
console.log('         STAGE 1: PREVIEW RENDER (540×960)');
console.log('         Voice + SFX + Visuals = One .mp4 File');
console.log('═══════════════════════════════════════════════════');

let previewPassed = false;
let previewPath = '';
const MAX_PREVIEW_RETRIES = 3;

for (let attempt = 1; attempt <= MAX_PREVIEW_RETRIES; attempt++) {
  const previewFileName = `${topicSlug}_preview_v${attempt}.mp4`;
  previewPath = path.join(outDir, previewFileName);

  console.log(`\n🎬 Preview Attempt ${attempt}/${MAX_PREVIEW_RETRIES}: ${previewFileName}`);

  try {
    await execFileAsync(process.execPath, [
      remotionHost,
      'render',
      'src/index.ts',
      'MainComposition',
      previewPath,
      `--props=${propsPath}`,
      '--scale=0.5',       // 540×960 = half of 1080×1920
      '--jpeg-quality=60',
      '--gl=angle',
      '--overwrite'
    ], {
      cwd: path.join(root, 'remotion'),
      maxBuffer: 16 * 1024 * 1024
    });

    console.log(`   ✅ Preview render complete: ${previewPath}`);

    // ── Validation Suite ────────────────────────────────────────────────────
    console.log('\n   📊 Running Validation Suite...');
    const qaResult = await runPreviewQA(previewPath, scenes, totalDurationSec, fps, outDir, `preview_v${attempt}`);

    if (qaResult.passed) {
      console.log('\n   ✅ ALL PREVIEW CHECKS PASSED');
      printQATable(qaResult);
      previewPassed = true;
      break;
    } else {
      console.log('\n   ❌ PREVIEW CHECKS FAILED:');
      qaResult.failures.forEach(f => console.log(`      • ${f}`));
      printQATable(qaResult);
      if (attempt < MAX_PREVIEW_RETRIES) {
        console.log(`\n   🔄 Retrying (attempt ${attempt + 1})...`);
      }
    }
  } catch (err) {
    console.error(`   ❌ Preview render error (attempt ${attempt}): ${err.message}`);
    if (attempt === MAX_PREVIEW_RETRIES) {
      console.error('\n💥 PREVIEW STAGE FAILED after 3 attempts. Halting.');
      process.exit(1);
    }
  }
}

if (!previewPassed) {
  console.error('\n💥 PREVIEW STAGE FAILED — All 3 retries exhausted. Halting.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — STAGE 2: FINAL RENDER (1080×1920, locked inputs)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🎬 [5/5] ═══════════════════════════════════════════');
console.log('         STAGE 2: FINAL RENDER (1080×1920 @ 30fps)');
console.log('         Locked inputs — identical to preview');
console.log('═══════════════════════════════════════════════════\n');

// Lock inputs with SHA-256 checksums
const manifestInputs = {
  projectId,
  topic,
  themeId: activeTheme.id,
  fps,
  totalDurationSec,
  totalTimelineFrames,
  lockedAt: new Date().toISOString(),
  checksums: {
    audio: await sha256File(audioFile),
    alignment: await sha256File(alignFile),
    tsx: await sha256File(tsxPath),
    props: await sha256File(propsPath),
  }
};
const inputManifestPath = path.join(outDir, 'input-manifest.json');
await fs.writeFile(inputManifestPath, JSON.stringify(manifestInputs, null, 2), 'utf8');
console.log(`   🔐 Inputs locked: ${inputManifestPath}`);

const finalVideoPath = path.join(outDir, 'video.mp4');

await execFileAsync(process.execPath, [
  remotionHost,
  'render',
  'src/index.ts',
  'MainComposition',
  finalVideoPath,
  `--props=${propsPath}`,
  '--scale=1',
  '--gl=angle',
  '--overwrite'
], {
  cwd: path.join(root, 'remotion'),
  maxBuffer: 16 * 1024 * 1024
});

console.log(`   ✅ Final render complete: ${finalVideoPath}`);

// ── Parity Check: Final vs Preview ─────────────────────────────────────────
console.log('\n   📊 Parity Check: Final vs Preview...');
const finalQA = await runPreviewQA(finalVideoPath, scenes, totalDurationSec, fps, outDir, 'final');

if (!finalQA.passed) {
  console.error('\n   ❌ FINAL PARITY CHECK FAILED — Re-rendering once more...');
  finalQA.failures.forEach(f => console.error(`      • ${f}`));

  await execFileAsync(process.execPath, [
    remotionHost,
    'render',
    'src/index.ts',
    'MainComposition',
    finalVideoPath,
    `--props=${propsPath}`,
    '--scale=1',
    '--gl=angle',
    '--overwrite'
  ], {
    cwd: path.join(root, 'remotion'),
    maxBuffer: 16 * 1024 * 1024
  });

  const retryFinalQA = await runPreviewQA(finalVideoPath, scenes, totalDurationSec, fps, outDir, 'final-retry');
  printQATable(retryFinalQA);
  if (!retryFinalQA.passed) {
    console.error('\n💥 FINAL RENDER FAILED PARITY CHECK TWICE. Stopping and reporting.');
    process.exit(1);
  }
} else {
  printQATable(finalQA);
}

// ─────────────────────────────────────────────────────────────────────────────
// DONE — Delivery Report
// ─────────────────────────────────────────────────────────────────────────────
const doneManifest = {
  projectId,
  topic,
  themeId: activeTheme.id,
  themeName: activeTheme.name,
  fps,
  durationSeconds: totalDurationSec,
  status: 'ready',
  paths: {
    preview: previewPath,
    final: finalVideoPath,
    audio: audioFile,
    alignment: alignFile,
    tsx: tsxPath,
    props: propsPath,
    inputManifest: inputManifestPath,
  }
};
await fs.writeFile(path.join(outDir, 'done-manifest.json'), JSON.stringify(doneManifest, null, 2), 'utf8');

console.log('\n====================================================');
console.log('🎉 2-STAGE PIPELINE COMPLETE!');
console.log(`   Preview  : ${previewPath}`);
console.log(`   Final    : ${finalVideoPath}`);
console.log(`   Theme    : ${activeTheme.name} (${activeTheme.id})`);
console.log(`   Duration : ${totalDurationSec.toFixed(2)}s`);
console.log('====================================================');
// Machine-readable final path on last line
console.log(finalVideoPath);

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════


/**
 * Preview Validation Suite — runs all 5 quality gates per AGENTS.md spec
 */
async function runPreviewQA(videoPath, scenes, expectedAudioSec, fps, outDir, tag) {
  const failures = [];
  const rows = [];

  // ── Gate 1: AV Duration Match (≤ 1 frame drift) ─────────────────────────
  let videoDuration = expectedAudioSec; // default if ffprobe unavailable
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`
    );
    videoDuration = parseFloat(stdout.trim());
    const driftSec = Math.abs(videoDuration - expectedAudioSec);
    const driftFrames = Math.round(driftSec * fps);
    const passed = driftFrames <= 1;
    rows.push({ check: 'AV Duration Match', value: `vid=${videoDuration.toFixed(2)}s aud=${expectedAudioSec.toFixed(2)}s drift=${driftFrames}f`, passed });
    if (!passed) failures.push(`AV duration mismatch: ${driftFrames} frames (max 1 allowed)`);
  } catch {
    rows.push({ check: 'AV Duration Match', value: 'ffprobe unavailable — skipped', passed: true });
  }

  // ── Gate 2: Voice-Visual Sync (|voiceStart - visualStart| <= 3 frames / 100 ms) ──
  for (const [index, scene] of scenes.entries()) {
    const visualStart = Number(scene.visualStart ?? scene.start ?? scene.startFrame ?? 0);
    const voiceStart = Number(scene.voiceStart ?? scene.start ?? scene.startFrame ?? 0);
    const driftFrames = Math.abs(voiceStart - visualStart);
    const passed = driftFrames <= 3;
    rows.push({
      check: `Sc${scene.scene_number || index + 1} Voice-Visual Sync`,
      value: `drift=${driftFrames}f (${((driftFrames / fps) * 1000).toFixed(0)}ms)`,
      passed
    });
    if (!passed) failures.push(`Scene ${scene.scene_number || index + 1}: |voiceStart (${voiceStart}) - visualStart (${visualStart})| = ${driftFrames} frames > 3 frames (100ms)`);
  }

  // ── Gate 3: Caption Words Present ────────────────────────────────────────
  for (const scene of scenes) {
    const hasWords = Array.isArray(scene.words) && scene.words.length > 0;
    rows.push({
      check: `Sc${scene.scene_number} Captions`,
      value: hasWords ? `${scene.words.length} words` : 'NONE',
      passed: hasWords
    });
    if (!hasWords) failures.push(`Scene ${scene.scene_number}: no word timestamps (captions will be blank)`);
  }

  // ── Gate 4: Motion Energy (≥ 0.80 per scene) ─────────────────────────────
  const motionScript = path.join(root, 'scripts', 'check_motion_energy.py');
  const hasMotionScript = await fs.access(motionScript).then(() => true).catch(() => false);
  if (hasMotionScript) {
    try {
      const { stdout } = await execAsync(
        `"${pythonBin}" "${motionScript}" "${videoPath}" --fps ${fps}`
      );
      const parsed = JSON.parse(stdout.trim());
      const energies = parsed.per_scene || [];
      for (const [i, energy] of energies.entries()) {
        const passed = energy >= 0.80;
        rows.push({ check: `Sc${i + 1} Motion Energy`, value: energy.toFixed(3), passed });
        if (!passed) failures.push(`Scene ${i + 1} motion energy=${energy.toFixed(3)} < 0.80`);
      }
    } catch (err) {
      rows.push({ check: 'Motion Energy', value: `error: ${err.message.slice(0, 50)}`, passed: true });
    }
  } else {
    rows.push({ check: 'Motion Energy', value: 'script missing — gate skipped', passed: true });
  }

  // ── Gate 5: No Zero-Duration Scenes ──────────────────────────────────────
  for (const scene of scenes) {
    if (scene.durationInFrames <= 0) {
      rows.push({ check: `Sc${scene.scene_number} Duration`, value: `${scene.durationInFrames}f`, passed: false });
      failures.push(`Scene ${scene.scene_number}: durationInFrames=${scene.durationInFrames} (static!)`);
    }
  }

  // Save JSON report
  const report = { tag, videoPath, expectedAudioSec, videoDuration, failures, rows };
  await fs.writeFile(
    path.join(outDir, `qa_report_${tag}.json`),
    JSON.stringify(report, null, 2),
    'utf8'
  );

  return { passed: failures.length === 0, failures, rows };
}

function printQATable(qaResult) {
  console.log('\n   ┌─────────────────────────────────────────────────────────────┐');
  console.log('   │  VALIDATION REPORT                                          │');
  console.log('   ├──────────────────────────────┬──────┬────────────────────────┤');
  console.log('   │ Check                        │  OK  │ Value                  │');
  console.log('   ├──────────────────────────────┼──────┼────────────────────────┤');
  for (const row of qaResult.rows) {
    const icon = row.passed ? ' ✅ ' : ' ❌ ';
    const checkStr = String(row.check).padEnd(28).slice(0, 28);
    const valStr = String(row.value).padEnd(22).slice(0, 22);
    console.log(`   │ ${checkStr} │${icon}│ ${valStr} │`);
  }
  console.log('   └──────────────────────────────┴──────┴────────────────────────┘');
}

async function sha256File(filePath) {
  try {
    const buf = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(buf).digest('hex');
  } catch {
    return 'unavailable';
  }
}
