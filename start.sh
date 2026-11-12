#!/usr/bin/env bash
set -e

# Change to the project root directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo "  STARTING ANIMATION BITTRIX (DB + SERVER + CLIENT)       "
echo "=========================================================="

# 1. Start the Database
echo "--> 1. Starting PostgreSQL Database..."
node scripts/db.mjs start

# Trap Ctrl+C (SIGINT) and exit signals to terminate all child processes cleanly
cleanup() {
  echo ""
  echo "--> Shutting down Backend and Frontend..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 2. Start the Backend Server (Express on port 5000)
echo "--> 2. Starting Backend Server on http://localhost:5000..."
npm --prefix backend run dev &

# 3. Start the Frontend Client (Vite on http://localhost:5173)
echo "--> 3. Starting Frontend Client on http://localhost:5173..."
npm --prefix frontend run dev &

echo "=========================================================="
echo "  ALL SERVICES RUNNING:                                   "
echo "  - Client:   http://localhost:5173                       "
echo "  - Backend:  http://localhost:5000                       "
echo "  - Database: Port 5434 (PostgreSQL)                      "
echo "  Press Ctrl+C to stop all services.                      "
echo "=========================================================="

# Wait for background processes
wait
