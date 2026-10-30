#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PGDATA="$DIR/pgdata"
LOGFILE="$DIR/postgres.log"

if pg_ctl -D "$PGDATA" status > /dev/null 2>&1; then
    echo "PostgreSQL is already running on port 5433."
else
    echo "Starting PostgreSQL on port 5433..."
    pg_ctl -D "$PGDATA" -o "-p 5433 -k /tmp" -l "$LOGFILE" start
    echo "PostgreSQL started successfully."
fi
