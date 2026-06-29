#!/bin/sh
set -e

# Apply database migrations before the server accepts traffic.
echo "Running database migrations..."
node_modules/.bin/prisma migrate deploy

exec "$@"
