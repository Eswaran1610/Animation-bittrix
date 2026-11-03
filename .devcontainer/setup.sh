#!/usr/bin/env bash
set -e

echo "===================================================="
echo "SETTING UP ANIMATION BITTRIX IN GITHUB CODESPACES"
echo "===================================================="

# 1. Install system audio and headless Chromium dependencies
echo "--> Installing ffmpeg and Chromium dependencies..."
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends \
  ffmpeg \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpango-1.0-0 \
  libxshmfence1

# 2. Create environment files from examples if not present
echo "--> Initializing environment files..."
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env"
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "Created frontend/.env"
fi

# Ensure edge-tts is default in Codespaces to save compute
if ! grep -q "TTS_PROVIDER" backend/.env; then
  echo "TTS_PROVIDER=edge-tts" >> backend/.env
  echo "EDGE_TTS_VOICE=en-US-JennyNeural" >> backend/.env
fi

# 3. Install project dependencies (backend, frontend, remotion, python venv)
echo "--> Installing npm dependencies and python venv..."
npm run install:all

# 4. Start database through Docker Compose
echo "--> Starting PostgreSQL database..."
npm run db:start

echo "===================================================="
echo "CODESPACES SETUP COMPLETE!"
echo ""
echo "To start the application, open two terminals and run:"
echo "  Terminal 1: npm run backend:dev"
echo "  Terminal 2: npm run frontend:dev"
echo "===================================================="
