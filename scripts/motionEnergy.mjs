#!/usr/bin/env node
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const [videoPath, propsPath] = process.argv.slice(2);
const SAMPLE_FPS = 6;
const WIDTH = 96;
const HEIGHT = 170;
const FRAME_BYTES = WIDTH * HEIGHT;
const MIN_SCENE_ENERGY = Number(process.env.MOTION_ENERGY_MIN || '0.8');

if (!videoPath || !propsPath) {
  console.error('Usage: node scripts/motionEnergy.mjs <video.mp4> <render-data.json>');
  process.exit(2);
}

const props = JSON.parse(await fs.readFile(propsPath, 'utf8'));
const scenes = Array.isArray(props.scenes) ? props.scenes : [];
if (!scenes.length) throw new Error('Motion energy check requires at least one scene.');

const { stdout: raw } = await execFileAsync('ffmpeg', [
  '-v', 'error', '-i', videoPath,
  '-vf', `fps=${SAMPLE_FPS},scale=${WIDTH}:${HEIGHT},format=gray`,
  '-f', 'rawvideo', 'pipe:1',
], { maxBuffer: 64 * 1024 * 1024, timeout: 120000, encoding: 'buffer' });

const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'binary');
const frameCount = Math.floor(bytes.length / FRAME_BYTES);
if (frameCount < 2) throw new Error('Motion energy check could not decode at least two sampled frames.');

const sceneStarts = [];
let cursor = 0;
scenes.forEach((scene, index) => {
  sceneStarts.push(cursor);
  cursor += Number(scene.durationInFrames || 0) - (index < scenes.length - 1 ? Number(scene.transitionOutFrames || 12) : 0);
});

const buckets = scenes.map(() => []);
for (let frame = 1; frame < frameCount; frame += 1) {
  const previous = bytes.subarray((frame - 1) * FRAME_BYTES, frame * FRAME_BYTES);
  const current = bytes.subarray(frame * FRAME_BYTES, (frame + 1) * FRAME_BYTES);
  let difference = 0;
  for (let index = 0; index < FRAME_BYTES; index += 1) difference += Math.abs(current[index] - previous[index]);
  const videoFps = Number(props.fps || 60);
  const timelineFrame = Math.round((frame / SAMPLE_FPS) * videoFps);
  let sceneIndex = sceneStarts.length - 1;
  for (let index = 0; index < sceneStarts.length; index += 1) {
    const sceneEnd = sceneStarts[index] + Number(scenes[index].durationInFrames || 0);
    if (timelineFrame >= sceneStarts[index] && timelineFrame < sceneEnd) {
      sceneIndex = index;
      break;
    }
  }
  buckets[sceneIndex].push(difference / FRAME_BYTES);
}

const scores = buckets.map((values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
console.log(`Motion energy threshold: ${MIN_SCENE_ENERGY.toFixed(2)} mean grayscale delta`);
scores.forEach((score, index) => console.log(`scene ${index + 1}: ${score.toFixed(3)}`));
const failures = scores.map((score, index) => score < MIN_SCENE_ENERGY ? `scene ${index + 1} motion energy ${score.toFixed(3)} is below ${MIN_SCENE_ENERGY.toFixed(2)}` : null).filter(Boolean);
if (failures.length) {
  console.error(`MOTION ENERGY FAIL: ${failures.join('; ')}`);
  process.exit(1);
}
console.log('MOTION ENERGY PASS');
