#!/usr/bin/env bash
set -euo pipefail

# Standalone CLI Pipeline Runner
# Usage: ./scripts/pipeline-cli.sh "<Topic>" [DurationSec] [FPS]

TOPIC="${1:?Missing topic prompt, e.g. 'Explain Bitcoin and Blockchain'}"
DURATION="${2:-20}"
FPS="${3:-30}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ID="$(uuidgen || cat /proc/sys/kernel/random/uuid)"
OUTPUT_DIR="${ROOT_DIR}/backend/media/done/${PROJECT_ID}"
mkdir -p "${OUTPUT_DIR}"

PYTHON_BIN="${ROOT_DIR}/.venv-motion-checks/bin/python"
if [ ! -x "${PYTHON_BIN}" ]; then
  PYTHON_BIN="python3"
fi

echo "=========================================================="
echo "🎬 STARTING STANDALONE CLI VIDEO GENERATION PIPELINE"
echo "Project ID : ${PROJECT_ID}"
echo "Topic      : ${TOPIC}"
echo "Duration   : ${DURATION}s | Target FPS: ${FPS}"
echo "Output Dir : ${OUTPUT_DIR}"
echo "=========================================================="

# 1. Step 1 & 2: CLI generates research, script, and per-scene voiceover with word timestamps
# Execute standalone CLI video generator
node "${ROOT_DIR}/scripts/cli-generate.mjs" "$TOPIC" "$DURATION" "$FPS"

