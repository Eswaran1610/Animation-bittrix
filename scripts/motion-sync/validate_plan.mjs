#!/usr/bin/env node
// Fails fast (exit 1) before any render. Generic checks, not tuned to one video.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const [planPath, publicDir = "public"] = process.argv.slice(2);
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const errs = [];
const warn = [];

const KNOWN_SFX = new Set(["whoosh", "click", "pop", "impact", "glitch", "success"]);

plan.scenes.forEach((s, i) => {
  const tag = `scene ${i + 1} (${s.id})`;
  if (!s.narration?.trim()) errs.push(`${tag}: empty narration`);
  if (!existsSync(path.join(publicDir, s.voice ?? ""))) errs.push(`${tag}: voice file missing: ${s.voice}`);
  if (!s.events?.length) warn.push(`${tag}: no sfx events -> silent motion`);
  for (const e of s.events ?? []) {
    if (!KNOWN_SFX.has(e.type)) errs.push(`${tag}: unknown sfx type "${e.type}"`);
    if (e.atMs < 0) errs.push(`${tag}: negative sfx time`);
  }
  if (s.words?.length) {
    const spoken = s.words.map((w) => w.text).join(" ").toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "");
    const plain = s.narration.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim();
    if (spoken.replace(/\s+/g, " ").trim() !== plain) errs.push(`${tag}: caption words differ from narration text`);
    for (let k = 1; k < s.words.length; k++)
      if (s.words[k].startMs < s.words[k - 1].startMs) errs.push(`${tag}: word timings not increasing at word ${k}`);
  } else warn.push(`${tag}: no word timestamps -> captions will be ESTIMATED (get them from TTS/whisper)`);
});

warn.forEach((w) => console.warn("warn:", w));
if (errs.length) { errs.forEach((e) => console.error("error:", e)); process.exit(1); }
console.log("plan ok");
