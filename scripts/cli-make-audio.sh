#!/usr/bin/env bash
set -euo pipefail

# CLI Audio & Voiceover Generator
# Usage: ./scripts/cli-make-audio.sh "<narration text>" "<output_name>" [voice] [speed]
TEXT="${1:?Missing narration text}"
NAME="${2:-voiceover}"
VOICE="${3:-en-US-ChristopherNeural}"
SPEED="${4:-1.0}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/remotion/public/audio"
mkdir -p "${OUT_DIR}"

AUDIO_PATH="${OUT_DIR}/${NAME}.mp3"
ALIGN_PATH="${OUT_DIR}/${NAME}_alignment.json"

PYTHON_BIN="${ROOT_DIR}/.venv-motion-checks/bin/python"
if [ ! -x "${PYTHON_BIN}" ]; then
  PYTHON_BIN="python3"
fi

"${PYTHON_BIN}" "${ROOT_DIR}/backend/src/modules/audio/edgeTtsAlign.py" \
  --text "${TEXT}" \
  --audio "${AUDIO_PATH}" \
  --alignment "${ALIGN_PATH}" \
  --voice "${VOICE}" \
  --speed "${SPEED}"

echo "[AUDIO CLI] Generated voiceover: ${AUDIO_PATH}"
echo "[AUDIO CLI] Generated word alignment: ${ALIGN_PATH}"
