#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PGDATA="$DIR/pgdata"

if pg_ctl -D "$PGDATA" status > /dev/null 2>&1; then
    echo "Stopping PostgreSQL..."
    pg_ctl -D "$PGDATA" stop
    echo "PostgreSQL stopped."
else
    echo "PostgreSQL is not running."
fi
