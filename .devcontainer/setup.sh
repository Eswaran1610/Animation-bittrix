#!/usr/bin/env bash
set -e

echo "===================================================="
echo "SETTING UP DEDICATED REMOTION CLOUD RENDER WORKER"
echo "===================================================="

# 1. Install ffmpeg and Chromium dependencies needed by Remotion
echo "--> Installing ffmpeg and Chromium libraries..."
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

# 2. Install only Remotion dependencies
echo "--> Installing Remotion dependencies..."
npm --prefix remotion install

echo "===================================================="
echo "REMOTION RENDER WORKER IS READY!"
echo "Starting render worker on port 5050..."
echo "===================================================="
