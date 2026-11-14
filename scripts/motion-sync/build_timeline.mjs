#!/usr/bin/env node
// plan.json + voice clips -> timeline.json (all times in frames, derived from MEASURED audio)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [planPath, outPath = "public/timeline.json", publicDir = "public"] = process.argv.slice(2);
if (!planPath) { console.error("usage: build_timeline.mjs plan.json [out.json] [publicDir]"); process.exit(1); }

const plan = JSON.parse(readFileSync(planPath, "utf8"));
const ms2f = (ms, fps) => Math.round((ms / 1000) * fps);

const audioMs = (file) => {
  const p = path.join(publicDir, file);
  if (!existsSync(p)) throw new Error(`missing voice file: ${p}`);
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1", p]).toString().trim();
  return Math.round(parseFloat(out) * 1000);
};

// Fallback only when the TTS gave no word timestamps: spread words by character length.
const estimateWords = (text, totalMs) => {
  const toks = text.trim().split(/\s+/);
  const weights = toks.map((t) => t.length + 1);
  const sum = weights.reduce((a, b) => a + b, 0);
  let t = 0;
  return toks.map((w, i) => {
    const d = (weights[i] / sum) * totalMs;
    const o = { text: w, startMs: t, endMs: t + d };
    t += d;
    return o;
  });
};

let cursor = 0;
const scenes = plan.scenes.map((s) => {
  const vMs = audioMs(s.voice);
  const voiceFrames = ms2f(vMs, plan.fps);
  const durationInFrames = voiceFrames + ms2f(plan.tailMs, plan.fps);
  const words = (s.words?.length ? s.words : estimateWords(s.narration, vMs)).map((w) => ({
    text: w.text,
    startFrame: ms2f(w.startMs, plan.fps),
    endFrame: Math.max(ms2f(w.endMs, plan.fps), ms2f(w.startMs, plan.fps) + 1),
  }));
  const sfx = (s.events ?? []).map((e) => ({
    type: e.type,
    atFrame: ms2f(e.atMs, plan.fps),
    volume: e.volume ?? 0.6,
  }));
  const scene = { id: s.id, fromFrame: cursor, durationInFrames, voice: s.voice, voiceFrames, words, sfx };
  cursor += durationInFrames;
  return scene;
});

const timeline = {
  fps: plan.fps, width: plan.width, height: plan.height,
  totalFrames: cursor, music: plan.music, scenes,
};
writeFileSync(outPath, JSON.stringify(timeline, null, 2));
console.log(`timeline: ${scenes.length} scenes, ${cursor} frames (${(cursor / plan.fps).toFixed(1)}s) -> ${outPath}`);
