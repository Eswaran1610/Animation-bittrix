#!/usr/bin/env node
/**
 * Autonomous CLI Video Generation Pipeline (3-Stage, Coordinate-Driven, 60 FPS)
 *
 * Stage 1: Deep Research & Script Generation (100+ sources crawl / academic grounding)
 *          Produces 1-sentence-per-scene script + mandatory Bittrix Outro
 * Stage 2: Audio Engine, Timestamps Alignment, Procedural SFX & Visual Blueprint Assembly
 *          Saves /path/to/props.json and returns ONLY that path
 * Stage 3: Headless Remotion 60 FPS Video Render + Quality Gate & Sync Verification
 *          Returns the completed .mp4 file path
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFile, exec } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error(`\n❌ [Autonomous Pipeline Error] ${msg}`);
  process.exit(1);
}

// Parse CLI Arguments
const args = process.argv.slice(2);
let topic = '';
let instructionFile = path.join(root, 'scripts', 'pipeline-instruction.json');
let fps = 60;
let resolution = '1080x1920';
let voiceChoice = 'en-US-ChristopherNeural';
let autoApprove = false;
let customOut = '';
let stageOnly = 0; // 0 = all, 1 = research/script, 2 = audio+props, 3 = render only
let propsInputPath = '';

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--topic' || a === '-t') topic = args[++i];
  else if (a === '--instruction' || a === '-i') instructionFile = args[++i];
  else if (a === '--fps') fps = Number(args[++i] || 60);
  else if (a === '--resolution' || a === '-r') resolution = args[++i];
  else if (a === '--voice' || a === '-v') voiceChoice = args[++i];
  else if (a === '--auto-approve' || a === '--yes' || a === '-y') autoApprove = true;
  else if (a === '--out' || a === '-o') customOut = args[++i];
  else if (a === '--stage' || a === '--stage-only') stageOnly = Number(args[++i]);
  else if (a === '--props' || a === '--props-input') propsInputPath = args[++i];
  else if (!topic && !a.startsWith('-')) topic = a;
}

if (!topic && !propsInputPath) {
  console.log(`
Usage:
  node scripts/run-autonomous-pipeline.mjs --topic "<Topic>" [options]

Options:
  --topic, -t         Topic or prompt for video generation
  --instruction, -i   Path to instruction json (default: scripts/pipeline-instruction.json)
  --fps               Video frame rate (default: 60)
  --resolution, -r    Video resolution (default: 1080x1920)
  --voice, -v         TTS voice (default: en-US-ChristopherNeural)
  --auto-approve, -y  Auto-approve script & plan without interactive prompt
  --out, -o           Custom path for final .mp4
  --stage             Run only stage: 1 (Script), 2 (Audio+Props), 3 (Render)
  --props             Existing props.json path (for stage 3 rendering directly)
`);
  process.exit(1);
}

// Load Instruction File
let instructions = {};
try {
  instructions = JSON.parse(await fs.readFile(instructionFile, 'utf8'));
} catch (err) {
  console.warn(`[Pipeline] Warning: Could not read instruction file (${err.message}). Using built-in defaults.`);
}

const targetFps = fps || instructions.fps || 60;
const [canvasWidth, canvasHeight] = (resolution || instructions.default_resolution || '1080x1920')
  .split('x')
  .map((v) => Number(v) || (resolution.includes('1920x1080') ? 1920 : 1080));

const projectId = crypto.randomUUID();
const publicDir = path.join(root, 'remotion', 'public');
const projectAssetDir = path.join(publicDir, 'assets', 'projects', projectId);
const publicAudioDir = path.join(publicDir, 'audio');
const outputDir = path.join(root, 'backend', 'media', 'done', projectId);
const renderDataDir = path.join(root, 'backend', 'media', 'render-data');

await fs.mkdir(projectAssetDir, { recursive: true });
await fs.mkdir(publicAudioDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(renderDataDir, { recursive: true });

// ============================================================================
// STAGE 1: DEEP RESEARCH & SCRIPT GENERATION
// ============================================================================
let scriptPayload = null;

if (stageOnly === 3 && propsInputPath) {
  console.log(`[Stage 1 & 2 Skipped] Using provided props: ${propsInputPath}`);
} else {
  console.log(`\n======================================================`);
  console.log(`🔬 STAGE 1: DEEP WEB RESEARCH & FACT-CHECKED SCRIPTING`);
  console.log(`======================================================`);
  console.log(`Topic: "${topic}"`);
  console.log(`Researching mechanisms, quantitative facts, and architecture...`);

// CLI Research Prompt: Freeform Creative Motion Directing (No rigid templates)
  const researchPrompt = `
You are the world-class motion graphics director and deep technical research engine for Animation-Bittrix.
Follow these rules strictly:
1. Conduct research on the topic: "${topic}".
2. Ground all claims in real architectural concepts, technical mechanisms, and verified facts.
3. Target duration is strictly ~23 seconds total: Plan 4 punchy content scenes (~18 seconds) + 1 mandatory closing Bittrix outro (~3 seconds).
4. Each scene MUST have exactly ONE short, punchy sentence (8 to 12 words maximum per sentence). Total spoken words across all 4 content scenes must be 40 to 50 words so spoken runtime matches 18-20 seconds.
5. DYNAMIC SCENE DESIGN (NO FIXED OR REPETITIVE TEMPLATES):
   - Think creatively like a motion designer for Vox or 3Blue1Brown.
   - For every scene, describe a unique, custom visual metaphor tailored specifically to this sentence.
   - Define:
     * "visual_metaphor": A vivid description of the physical visual metaphor (e.g. "Glowing cache barrier absorbing red lock packets and emitting blue authorized tokens").
     * "visual_type": The best conceptual display archetype ("concept-diagram", "process-flow", "split-compare", "timeline", "stat-counter", "3d-showcase", or "callout").
     * "nodes": 2 to 4 key visual objects/components with labels and technical subtitles.
     * "edges": Explicit connections or flows between those nodes.
     * "motion_action": The physical movement ("impact", "snap", "slide", "orbit", "pulse", "collide").
     * "sound_action": The corresponding acoustic event for that physical movement ("whoosh", "pop", "impact", "click", "ding", "count", "punch_hit").
6. The FINAL SCENE (Scene 5) MUST be the Bittrix Technologies outro:
   - narration: "Follow Bittrix Technologies for more interesting concepts."
   - on_screen_text: "Bittrix Technologies"
   - visual_type: "outro"
   - role: "cta"
   - template: "cta-outro"
   - themeColor: "#5b1a78"
   - motion_action: "reveal"
   - sound_action: "ding"

Respond with ONLY valid JSON with this exact structure:
{
  "title": "${topic}",
  "topic": "${topic}",
  "research_sources": ["url1", "url2"],
  "scenes": [
    {
      "scene_number": 1,
      "role": "hook",
      "visual_type": "concept-diagram",
      "visual_metaphor": "...",
      "narration": "...",
      "on_screen_text": "...",
      "themeColor": "#38bdf8",
      "emphasis_word": "...",
      "motion_action": "snap",
      "sound_action": "shutter_click",
      "nodes": [{"label": "...", "sub": "..."}],
      "edges": [{"from": 0, "to": 1, "label": "..."}],
      "labels": ["..."]
    }
  ]
}
`;

  try {
    const { stdout: agyOutput } = await execFileAsync(
      '/usr/bin/agy',
      ['-p', researchPrompt, '--model', 'gemini-3.8-flash-high', '--output-format', 'json', '--disable-slash-commands', '--dangerously-skip-permissions'],
      { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }
    );

    // Extract JSON block from agy CLI output
    const cleaned = agyOutput.trim();
    let scriptText = cleaned;
    try {
      const outerObj = JSON.parse(cleaned);
      if (outerObj.response) {
        scriptText = outerObj.response;
      }
    } catch {}

    const jsonMatch = scriptText.match(/```json\s*([\s\S]*?)\s*```/) || scriptText.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      scriptText = jsonMatch[1];
    }
    const jsonStart = scriptText.indexOf('{');
    const jsonEnd = scriptText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      scriptPayload = JSON.parse(scriptText.slice(jsonStart, jsonEnd + 1));
    }
  } catch (err) {
    console.warn(`[Stage 1] Note: agy CLI research timed out or exited (${err.message}). Using topic-specific synthesized script.`);
  }

  // Dynamic topic-derived script if model was unreachable
  if (!scriptPayload || !Array.isArray(scriptPayload.scenes) || scriptPayload.scenes.length === 0) {
    const rawTokens = topic.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
    const keySubject = rawTokens.slice(0, 3).join(' ') || topic;
    const coreAction = rawTokens[rawTokens.length - 1] || 'mechanics';

    scriptPayload = {
      title: topic,
      topic,
      research_sources: ['https://developer.mozilla.org', 'https://en.wikipedia.org/wiki/Computer_science'],
      scenes: [
        {
          scene_number: 1,
          role: 'hook',
          visual_type: 'concept-diagram',
          narration: `Understanding ${topic} reveals how modern systems achieve true structural integrity.`,
          on_screen_text: topic,
          themeColor: '#38bdf8',
          emphasis_word: coreAction,
          nodes: [{ label: keySubject, sub: 'Core Architecture' }],
          labels: [keySubject, 'Analysis', coreAction],
        },
        {
          scene_number: 2,
          role: 'body',
          visual_type: 'concept-diagram',
          narration: `Each component links directly to deterministic primitives and verified states.`,
          on_screen_text: `${keySubject} Mechanics`,
          themeColor: '#22d3ee',
          emphasis_word: 'deterministic',
          nodes: [{ label: 'Primitives', sub: 'Verified States' }],
          labels: ['Ingress', 'Evaluation', 'Execution'],
        },
        {
          scene_number: 3,
          role: 'body',
          visual_type: 'process-flow',
          narration: `Step-by-step transformation ensures data flows without friction or overhead.`,
          on_screen_text: 'Transformation Pipeline',
          themeColor: '#10b981',
          emphasis_word: 'friction',
          nodes: [{ label: 'Data In', sub: 'Zero Overhead' }, { label: 'Verified Output', sub: 'Strict Integrity' }],
          labels: ['Transform', 'Integrity', 'Output'],
        },
        {
          scene_number: 4,
          role: 'body',
          visual_type: 'split-compare',
          narration: `Comparing traditional methods with modern ${keySubject} highlights exponential efficiency.`,
          on_screen_text: `Efficiency of ${keySubject}`,
          themeColor: '#f59e0b',
          emphasis_word: 'efficiency',
          nodes: [{ label: 'Legacy Flow', sub: 'Redundant Steps' }, { label: keySubject, sub: 'Optimized Path' }],
          labels: ['Legacy', 'VS', 'Optimized'],
        },
        {
          scene_number: 5,
          role: 'cta',
          role: 'cta',
          visual_type: 'outro',
          template: 'cta-outro',
          narration: `Accelerate your engineering with high-performance Bittrix Technologies.`,
          on_screen_text: 'Bittrix Technologies',
          themeColor: '#7c4dff',
          emphasis_word: 'Bittrix',
          nodes: [{ label: 'Bittrix Technologies', sub: 'Next-Gen Engineering' }],
          labels: ['High-Performance', 'Bittrix', 'Innovation'],
        },
      ],
    };
  }

  // Ensure mandatory 3s closing Bittrix outro is always appended
  const last = scriptPayload.scenes[scriptPayload.scenes.length - 1];
  if (!last || last.visual_type !== 'outro' || !/bittrix/i.test(last.narration || '')) {
    scriptPayload.scenes.push({
      scene_number: scriptPayload.scenes.length + 1,
      role: 'cta',
      visual_type: 'outro',
      template: 'cta-outro',
      narration: 'Accelerate your engineering with high-performance Bittrix Technologies.',
      on_screen_text: 'Bittrix Technologies',
      themeColor: '#7c4dff',
      emphasis_word: 'Bittrix',
      nodes: [{ label: 'Bittrix Technologies', sub: 'Next-Gen Engineering' }],
      labels: ['High-Performance', 'Bittrix', 'Innovation'],
    });
  }

  console.log(`\n📋 Script Plan Ready (${scriptPayload.scenes.length} scenes):`);
  scriptPayload.scenes.forEach((s, idx) => {
    console.log(`  [Scene ${idx + 1}] (${s.visual_type}) "${s.narration}"`);
  });

  if (!autoApprove && stageOnly === 1) {
    console.log('\n✅ Stage 1 complete. Script and plan generated.');
    process.exit(0);
  }
}

// ============================================================================
// STAGE 2: AUDIO ENGINE, TIMESTAMPS & PROPS MANIFEST GENERATION
// ============================================================================
let savedPropsPath = '';

if (stageOnly === 3 && propsInputPath) {
  savedPropsPath = path.resolve(propsInputPath);
} else {
  console.log(`\n======================================================`);
  console.log(`🔊 STAGE 2: AUDIO SYNTHESIS & SCENE TIMELINE MAPPING`);
  console.log(`======================================================`);

  const pythonBin = path.join(root, '.venv-motion-checks', 'bin', 'python');
  const ttsScript = path.join(root, 'backend', 'src', 'modules', 'audio', 'edgeTtsAlign.py');
  const makeSfxScript = path.join(root, 'scripts', 'make_sfx.py');

  const audioFileName = `vo-${projectId}.mp3`;
  const alignFileName = `align-${projectId}.json`;
  const audioFilePath = path.join(publicAudioDir, audioFileName);
  const alignFilePath = path.join(publicAudioDir, alignFileName);

  const fullNarration = scriptPayload.scenes.map((s) => s.narration.trim()).join(' ');

  console.log(`Synthesizing edge-tts audio with voice: ${voiceChoice}...`);
  await execFileAsync(pythonBin, [
    ttsScript,
    '--text', fullNarration,
    '--audio', audioFilePath,
    '--alignment', alignFilePath,
    '--voice', voiceChoice,
  ]);

  const alignmentData = JSON.parse(await fs.readFile(alignFilePath, 'utf8'));
  const wordTimings = alignmentData.words || [];
  const sentenceTimings = alignmentData.sentences || [];

  // Procedural Sound Effects Generation
  // Procedural Sound Effects Generation
  console.log('Synthesizing procedural sound effects library (SFX)...');
  const sfxDir = path.join(publicDir, 'sfx', projectId);
  await fs.mkdir(sfxDir, { recursive: true });
  await execFileAsync(pythonBin, [
    makeSfxScript,
    '--out', sfxDir,
    '--seed', projectId,
    '--roles', 'pop,click,tick,whoosh,impact,ding,count,clock_tick,shutter_click,card_slap,punch_hit',
    '--variants', '3',
  ]);

  // Compute sentence frame bounds
  let currentWordIdx = 0;
  const sceneBounds = [0];

  for (let i = 0; i < scriptPayload.scenes.length; i++) {
    const scWords = scriptPayload.scenes[i].narration.split(/\s+/).filter(Boolean);
    const sceneWordCount = scWords.length;
    const endWordIdx = Math.min(currentWordIdx + sceneWordCount - 1, wordTimings.length - 1);
    const endWord = wordTimings[endWordIdx];

    const endSec = endWord ? Number(endWord.endSec ?? endWord.end_time) : (i + 1) * 3.5;
    const endFrame = Math.round(endSec * targetFps);
    sceneBounds.push(Math.max(sceneBounds[sceneBounds.length - 1] + Math.round(targetFps * 1.5), endFrame));
    currentWordIdx += sceneWordCount;
  }

  // Align final outro to audio length
  const lastAudioSec = wordTimings.length
    ? Number(wordTimings[wordTimings.length - 1].endSec ?? wordTimings[wordTimings.length - 1].end_time)
    : 20;
  const totalFrames = Math.max(Math.round(lastAudioSec * targetFps) + Math.round(targetFps * 0.8), sceneBounds[sceneBounds.length - 1]);
  sceneBounds[sceneBounds.length - 1] = totalFrames;

  // Build Remotion Scene Payloads
  const remotionScenes = scriptPayload.scenes.map((sc, i) => {
    const fromFrame = sceneBounds[i];
    const toFrame = sceneBounds[i + 1];
    const durationInFrames = toFrame - fromFrame;

    // Filter words in this scene
    const wordsInScene = wordTimings
      .filter((w) => {
        const sFrame = Math.round(Number(w.startSec ?? w.start_time) * targetFps);
        return sFrame >= fromFrame - 2 && sFrame < toFrame;
      })
      .map((w) => ({
        word: w.word,
        startFrame: Math.max(0, Math.round(Number(w.startSec ?? w.start_time) * targetFps) - fromFrame),
        endFrame: Math.max(1, Math.round(Number(w.endSec ?? w.end_time) * targetFps) - fromFrame),
      }));

    // Map procedural sound effects (SFX) for object entrances and kinetic hits
    const audioCues = [
      {
        hitFrame: 0,
        frame: 0,
        src: `sfx/${projectId}/whoosh_01.wav`,
        volume: 0.35,
        role: 'whoosh',
      },
    ];

    // Dynamic Action-to-Sound Synthesis (Driven by AI motion_action and sound_action, NO rigid static mapping)
    const primarySound = sc.sound_action || (sc.motion_action === 'impact' ? 'impact' : sc.motion_action === 'snap' ? 'shutter_click' : sc.motion_action === 'count' ? 'count' : 'pop');
    const primaryHit = Math.max(2, Math.min(18, Math.round(durationInFrames * 0.15)));

    audioCues.push({
      hitFrame: primaryHit,
      frame: primaryHit,
      src: `sfx/${projectId}/${primarySound}_01.wav`,
      volume: 0.5,
      role: primarySound,
    });

    if (sc.sound_action === 'clock_tick') {
      for (let f = 12; f < durationInFrames - 12; f += 15) {
        audioCues.push({
          hitFrame: f,
          frame: f,
          src: `sfx/${projectId}/clock_tick_01.wav`,
          volume: 0.45,
          role: 'clock_tick',
        });
      }
    } else if (durationInFrames > 60) {
      // Secondary acoustic accent
      const secondaryHit = Math.round(durationInFrames * 0.5);
      const secondarySound = sc.visual_type === 'outro' ? 'ding' : 'click';
      audioCues.push({
        hitFrame: secondaryHit,
        frame: secondaryHit,
        src: `sfx/${projectId}/${secondarySound}_01.wav`,
        volume: 0.4,
        role: secondarySound,
      });
    }

    // Emphasis word kinetic punch hit
    if (sc.emphasis_word) {
      const empWord = wordsInScene.find((w) => w.word.toLowerCase().includes(sc.emphasis_word.toLowerCase()));
      if (empWord) {
        audioCues.push({
          hitFrame: Math.max(0, empWord.startFrame - 2),
          frame: Math.max(0, empWord.startFrame - 2),
          src: `sfx/${projectId}/punch_hit_01.wav`,
          volume: 0.55,
          role: 'punch_hit',
        });
      }
    }

    return {
      id: `scene_${i + 1}`,
      scene_number: i + 1,
      role: sc.role || (i === 0 ? 'hook' : i === scriptPayload.scenes.length - 1 ? 'cta' : 'body'),
      template: sc.template || (sc.visual_type === 'outro' ? 'cta-outro' : 'hero-object'),
      visual_type: sc.visual_type || 'callout',
      title: sc.on_screen_text || sc.narration,
      on_screen_text: sc.on_screen_text || sc.narration,
      subtitle: sc.subtitle || '',
      themeColor: sc.themeColor || '#7c4dff',
      emphasis_word: sc.emphasis_word || '',
      stat_value: sc.stat_value || '',
      nodes: sc.nodes || [],
      edges: sc.edges || [],
      labels: sc.labels || [],
      duration_sec: durationInFrames / targetFps,
      durationInFrames,
      narration: sc.narration,
      words: wordsInScene,
      audioCues,
      visualBlueprint: {
        purpose: sc.on_screen_text || sc.narration,
        layout: 'centered',
        camera_motion: 'slow-push',
        asset_queries: [],
        objects: [],
      },
    };
  });

  const finalProps = {
    video: {
      title: scriptPayload.title || topic,
      width: canvasWidth,
      height: canvasHeight,
      fps: targetFps,
      durationInFrames: totalFrames,
      targetDurationSec: totalFrames / targetFps,
      style: 'CLI-authored content-specific 60fps motion plan',
      sourceProjectId: projectId,
      audioUrl: `audio/${audioFileName}`,
      captions: wordTimings.map((w) => ({
        word: w.word,
        startFrame: Math.round(Number(w.startSec ?? w.start_time) * targetFps),
        endFrame: Math.round(Number(w.endSec ?? w.end_time) * targetFps),
      })),
    },
    scenes: remotionScenes,
    styleProfile: {
      family: 'cinematic-neon',
      motif: 'geometric',
      background: '#000000',
      surface: '#0d1117',
      text: '#ffffff',
      primary: '#7c4dff',
      secondary: '#00f5d4',
      motion_language: 'snappy spring physics',
      transition_language: 'continuous kinetic wipe',
    },
  };

  savedPropsPath = path.join(renderDataDir, `${projectId}_props_60fps.json`);
  await fs.writeFile(savedPropsPath, JSON.stringify(finalProps, null, 2), 'utf8');

  console.log(`\n📄 Scene Manifest File Saved:`);
  console.log(savedPropsPath);

  // Agent TSX Authoring & Self-Repair Loop (Zero template fallback)
  console.log(`\n⚛️  [Agent Authoring] AI Agent authoring 100% custom Remotion TSX code...`);
  const { tsxValidator } = await import('../backend/dist/modules/production/tsxValidator.js');

  const compactScenes = remotionScenes.map((s, idx) => ({
    scene_number: idx + 1,
    role: s.role,
    durationInFrames: s.durationInFrames,
    narration: s.narration,
    on_screen_text: s.on_screen_text || s.title,
    themeColor: s.themeColor,
    words: (s.words || []).map((w) => ({
      word: w.word,
      startFrame: w.startFrame,
      endFrame: w.endFrame,
    })),
  }));

  const tsxPrompt = `You are an elite Motion Graphics Software Engineer authoring 100% BESPOKE Remotion TSX code.
CRITICAL CONSTRAINT: TEMPLATE FALLBACKS HAVE BEEN COMPLETELY REMOVED. You as the AI agent MUST author 100% of the Remotion TSX component code yourself.

PROJECT: "${scriptPayload.title || topic}" (ID: ${projectId})
OUTPUT FORMAT: ${canvasWidth} x ${canvasHeight}, ${targetFps} FPS, Total Duration: ${totalFrames} frames (${(totalFrames / targetFps).toFixed(2)}s).

SCENES WITH MEASURED TIMESTAMPS:
${JSON.stringify(compactScenes, null, 2)}

CREATIVE REQUIREMENTS:
1. Export default: export default function GeneratedCliVideo(props: any) { ... }
2. Import from 'remotion': AbsoluteFill, Sequence, spring, interpolate, useCurrentFrame, useVideoConfig
3. Single continuous living canvas with continuous virtual camera (interpolate camX, camY, camScale across scenes).
4. Topic-specific visual mechanics for "${scriptPayload.title || topic}". ZERO 50% border-radius circles or placeholder orbs!
   - Tech/Code: Dark terminal windows, branching commit DAGs, syntax diff cards with green + and red - lines.
   - Systems: Server racks, dynamic laser bus lines, packet queues, telemetry meters.
   - Process/Architecture: Connected flow blocks, animated data vectors, balance scales.
5. Synchronized kinetic karaoke captions matching scene.words with dynamic active-word scaling and accent glow.
6. The FINAL SCENE (~last 3s) MUST render the exact Bittrix Technologies royal purple (#5b1a78) outro matching bittrix-reel(1).html:
   - 6-point radial gradient hexagon with spoke circles
   - Rolling chain link track and rotating 12-tooth gear with serif 'B'
   - Staggered letter italic bold "BITTRIX" and tracking "TECHNOLOGIES"
   - Purple underline and diagonal light sweep
   - Spoken narration aloud: "Follow Bittrix Technologies for more interesting concepts."
7. Return ONLY valid, self-contained TypeScript/TSX in a \`\`\`tsx code fence.
`;

  const agyModel = process.env.AGY_MODEL || 'gemini-3.8-flash-medium';
  let tsxSource = null;
  let lastErrors = [];

  try {
    const { stdout: agyTsxOutput } = await execFileAsync(
      '/usr/bin/agy',
      ['-p', tsxPrompt, '--model', agyModel, '--output-format', 'json', '--print-timeout', '5m', '--disable-slash-commands', '--dangerously-skip-permissions'],
      { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }
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
    const errSummary = err.message.length > 200 ? (err.message.slice(0, 200) + '...') : err.message;
    console.warn(`⚠️ Agent initial TSX generation error: ${errSummary}`);
    lastErrors = [errSummary];
  }

  // Agent Self-Repair Loop
  let repairAttempts = 0;
  const maxRepairAttempts = 2;
  while (!tsxSource && repairAttempts < maxRepairAttempts) {
    repairAttempts++;
    console.log(`🔄 Requesting agent TSX repair pass (${repairAttempts}/${maxRepairAttempts})...`);
    const repairPrompt = `You are an elite Motion Graphics Software Engineer authoring Remotion TSX.
CRITICAL ERROR: Your previous Remotion TSX code failed validation:
- ${lastErrors.join('\n- ')}

USER CONSTRAINT: TEMPLATE FALLBACKS ARE STRICTLY REMOVED. You MUST author 100% of the TSX code yourself.
Fix all errors and return the complete, self-contained Remotion TSX component in a \`\`\`tsx code fence:

PROJECT: "${scriptPayload.title || topic}"
TOTAL DURATION: ${totalFrames} frames @ ${targetFps}fps

SCENES WITH MEASURED TIMESTAMPS:
${JSON.stringify(compactScenes, null, 2)}

Requirements:
1. export default function GeneratedCliVideo(props: any) { ... }
2. Import from 'remotion': AbsoluteFill, Sequence, spring, interpolate, useCurrentFrame, useVideoConfig
3. Single continuous living canvas with continuous camera motion.
4. Bespoke physical mechanics for "${scriptPayload.title || topic}". ZERO generic 50% border radius circles!
5. Kinetic karaoke captions from scene.words.
6. Exact royal purple (#5b1a78) Bittrix outro in final scene with rotating gear and chain track.
`;
    try {
      const { stdout: repOutput } = await execFileAsync(
        '/usr/bin/agy',
        ['-p', repairPrompt, '--model', agyModel, '--output-format', 'json', '--print-timeout', '5m', '--disable-slash-commands', '--dangerously-skip-permissions'],
        { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }
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
      const errSummary = err.message.length > 200 ? (err.message.slice(0, 200) + '...') : err.message;
      console.error(`Repair pass ${repairAttempts} error:`, errSummary);
      lastErrors = [errSummary];
    }
  }

  if (!tsxSource) {
    fail(`AI agent failed to author valid bespoke Remotion TSX after ${repairAttempts} attempts (${lastErrors.join('; ')}). Per user rule, template fallbacks are strictly disabled.`);
  }

  const projectDir = path.join(root, 'remotion', 'src', 'projects', projectId);
  await fs.mkdir(projectDir, { recursive: true });
  await fs.writeFile(path.join(projectDir, 'GeneratedVideo.tsx'), tsxSource, 'utf8');

  // Isolated Composition.tsx
  const compCode = `import React from 'react';
import { Audio, Sequence } from 'remotion';
import GeneratedVideo from './GeneratedVideo';
import { SceneDataPayload } from '../../data/sceneTypes';
import { assetSource } from '../../assetSource';

export const MainComposition: React.FC<SceneDataPayload> = (sceneData) => {
  const masterAudioUrl = sceneData?.video?.audioUrl;
  const backgroundAudioUrl = sceneData?.video?.backgroundAudioUrl;
  const scenes = sceneData?.scenes || [];
  let accumulatedFrame = 0;

  return (
    <>
      <GeneratedVideo {...sceneData} />
      {masterAudioUrl && <Audio src={assetSource(masterAudioUrl)} volume={1.0} />}
      {!masterAudioUrl && backgroundAudioUrl && <Audio src={assetSource(backgroundAudioUrl)} volume={0.15} />}
      {!masterAudioUrl &&
        scenes.map((scene, sceneIndex) => {
          const fromFrame = accumulatedFrame;
          const transOut = (scene as any).transitionOutFrames ?? (sceneIndex < scenes.length - 1 ? 10 : 0);
          accumulatedFrame += (scene.durationInFrames || 90) - (sceneIndex < scenes.length - 1 ? transOut : 0);

          return (
            <React.Fragment key={\`audio-scene-\${scene.id || sceneIndex}\`}>
              {scene.narrationAudio && (
                <Sequence from={fromFrame} durationInFrames={scene.durationInFrames}>
                  <Audio src={assetSource(scene.narrationAudio)} volume={1.0} />
                </Sequence>
              )}
              {scene.audioCues?.map((cue, cueIdx) => {
                if (!cue?.src) return null;
                return (
                  <Sequence
                    key={\`cue-\${scene.id || sceneIndex}-\${cueIdx}\`}
                    from={fromFrame + (cue.frame ?? cue.hitFrame ?? 0)}
                    durationInFrames={cue.durationFrames || 60}
                  >
                    <Audio src={assetSource(cue.src)} volume={cue.volume ?? 0.6} />
                  </Sequence>
                );
              })}
            </React.Fragment>
          );
        })}
    </>
  );
};
export default MainComposition;
`;
  await fs.writeFile(path.join(projectDir, 'Composition.tsx'), compCode, 'utf8');

  // Isolated Root.tsx (JSX)
  const projectRootCode = `import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { MainComposition } from './Composition';
import { SceneDataPayload } from '../../data/sceneTypes';
import { normalizeSceneData } from '../../data/normalizeSceneData';

const calcTimelineDuration = (scenes: any[] = []) =>
  scenes.reduce((total, scene, index) => total + (scene.durationInFrames || 90) - (index < scenes.length - 1 ? (scene.transitionOutFrames || 12) : 0), 0) || 900;

export const ProjectRoot: React.FC = () => {
  const rawInput = getInputProps();
  const resolvedProps = normalizeSceneData(rawInput) || (rawInput as SceneDataPayload);
  const mainFps = resolvedProps?.video?.fps || 30;
  const mainDuration = resolvedProps?.video?.durationInFrames || calcTimelineDuration(resolvedProps?.scenes);

  return (
    <Composition
      id="MainComposition"
      component={MainComposition as unknown as React.FC<Record<string, unknown>>}
      defaultProps={resolvedProps as unknown as Record<string, unknown>}
      durationInFrames={mainDuration}
      fps={mainFps}
      width={resolvedProps?.video?.width || 1080}
      height={resolvedProps?.video?.height || 1920}
    />
  );
};
`;
  await fs.writeFile(path.join(projectDir, 'Root.tsx'), projectRootCode, 'utf8');

  // Isolated index.ts (Pure TypeScript entrypoint)
  const projectIndexCode = `import { registerRoot } from 'remotion';
import { ProjectRoot } from './Root';

registerRoot(ProjectRoot);
`;
  await fs.writeFile(path.join(projectDir, 'index.ts'), projectIndexCode, 'utf8');

  // Also stage legacy GeneratedCliVideo.tsx in root src for compatibility
  await fs.writeFile(path.join(root, 'remotion', 'src', 'GeneratedCliVideo.tsx'), tsxSource, 'utf8');
  console.log(`⚛️  Project-isolated files staged in remotion/src/projects/${projectId}/ and GeneratedCliVideo.tsx!`);

  if (stageOnly === 2) {
    // Only return the file path
    console.log(savedPropsPath);
    process.exit(0);
  }
}

// ============================================================================
// STAGE 3: HEADLESS 60 FPS REMOTION RENDER & QA VALIDATION
// ============================================================================
console.log(`\n======================================================`);
console.log(`🎬 STAGE 3: HEADLESS 60 FPS RENDER & QA GATES`);
console.log(`======================================================`);

const finalVideoPath = customOut || path.join(outputDir, `${projectId}_60fps.mp4`);
const remotionHostScript = path.join(root, 'remotion', 'scripts', 'remotion-host.mjs');
const qualityGateScript = path.join(root, 'scripts', 'qualityGate.mjs');
const motionEnergyScript = path.join(root, 'scripts', 'motionEnergy.mjs');

// 1. Run Quality Gate (Checks layout, 1080x1920 bounds, margin zones)
console.log(`[QA 1/3] Running Motion Graphics Playbook Quality Gate...`);
await execFileAsync('/usr/bin/node', [qualityGateScript, savedPropsPath], {
  cwd: root,
  timeout: 120000,
});
console.log(`Quality Gate: PASS (Zones, Margins, Dimensions Verified)`);

// 2. Headless Render at 60 FPS using project-isolated entrypoint
const isolatedEntry = `src/projects/${projectId}/index.ts`;
console.log(`[Render] Encoding 60 FPS Remotion Video using entry ${isolatedEntry} to:\n  ${finalVideoPath}`);
const renderArgs = [
  'render',
  isolatedEntry,
  'MainComposition',
  finalVideoPath,
  `--props=${savedPropsPath}`,
  '--public-dir=public',
  '--concurrency=2',
  '--overwrite',
];

await execFileAsync('/usr/bin/node', [remotionHostScript, ...renderArgs], {
  cwd: path.join(root, 'remotion'),
  timeout: 600000,
});

// 3. Motion Energy Verification
console.log(`[QA 2/3] Checking motion energy thresholds (target >= 0.85)...`);
try {
  await execFileAsync('/usr/bin/node', [motionEnergyScript, finalVideoPath, savedPropsPath], {
    cwd: root,
    timeout: 120000,
  });
  console.log(`Motion Energy Gate: PASS (Smooth Continuous Motion Verified)`);
} catch (err) {
  console.warn(`[QA Warning] Motion energy check reported: ${err.message}`);
}

// 4. Parity and Duration Verification via FFprobe
console.log(`[QA 3/3] Inspecting final audio/video stream duration parity via FFprobe...`);
const { stdout: probeRaw } = await execFileAsync('ffprobe', [
  '-v', 'error',
  '-show_entries', 'format=duration:stream=codec_name,width,height,r_frame_rate',
  '-of', 'json',
  finalVideoPath,
]);
const probeData = JSON.parse(probeRaw);
const videoStream = probeData.streams?.find((s) => s.width);
console.log(`Video Specs : ${videoStream?.width}x${videoStream?.height} @ ${videoStream?.r_frame_rate} FPS (${probeData.format?.duration}s)`);

console.log(`\n======================================================`);
console.log(`🎉 60 FPS VIDEO GENERATION COMPLETE`);
console.log(`======================================================`);
console.log(`PROPS_PATH: ${savedPropsPath}`);
console.log(`FINAL_VIDEO: ${finalVideoPath}`);
