#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PGDATA="$DIR/pgdata"
LOGFILE="$DIR/postgres.log"
PGPORT="${PGPORT:-5434}"

if pg_ctl -D "$PGDATA" status > /dev/null 2>&1; then
    echo "PostgreSQL is already running on port $PGPORT."
else
    echo "Starting PostgreSQL on port $PGPORT..."
    pg_ctl -D "$PGDATA" -o "-p $PGPORT -k /tmp" -l "$LOGFILE" start
    echo "PostgreSQL started successfully."
fi
