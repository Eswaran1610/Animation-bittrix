#!/usr/bin/env bash
# Post-render checks. Usage: bash scripts/audit_video.sh out/final.mp4
set -euo pipefail
V="${1:?video path}"; OUT="${2:-audit}"; mkdir -p "$OUT"

echo "== streams"
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,duration \
  -of default=nw=1 "$V"

echo "== loudness (target ~ -16..-14 LUFS, true peak < -1 dBTP)"
ffmpeg -hide_banner -nostats -i "$V" -af ebur128=peak=true -f null - 2>&1 | tail -n 12 | grep -E "I:|LRA:|Peak:" || true

echo "== silence gaps >0.4s at -45dB (voice-only parts should have natural gaps)"
ffmpeg -hide_banner -nostats -i "$V" -af silencedetect=n=-45dB:d=0.4 -f null - 2>&1 | grep silence_ || echo "none"

echo "== hard cuts (scene score >0.25); smooth transitions show none"
ffmpeg -hide_banner -nostats -i "$V" -vf "select='gt(scene,0.25)',showinfo" -f null - 2>&1 \
  | grep -o "pts_time:[0-9.]*" | tr '\n' ' ' || true; echo

echo "== contact sheet every 2s -> $OUT/sheet.png  (LOOK at it: spacing, empty space, reflow)"
ffmpeg -v error -i "$V" -vf "fps=1/2,scale=270:480,tile=8x3" -frames:v 1 "$OUT/sheet.png" -y

echo "== spectrogram -> $OUT/spec.png  (speech = broadband bursts; SFX = short vertical streaks)"
ffmpeg -v error -i "$V" -lavfi "showspectrumpic=s=1400x500:legend=1:scale=log" "$OUT/spec.png" -y
echo done
