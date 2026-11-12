#!/usr/bin/env bash
set -e

echo "=========================================="
echo "  PULLING LATEST CODE & UPDATING DOCKER   "
echo "=========================================="

# 1. Pull latest git changes
echo "--> 1. Pulling latest git updates..."
git pull

# 2. Rebuild and restart Docker containers with latest code & dependencies
echo "--> 2. Building & updating Docker containers..."
docker compose build --pull
docker compose up -d

echo "=========================================="
echo "  UPDATE COMPLETE! SYSTEM IS UP TO DATE   "
echo "=========================================="
docker compose ps
