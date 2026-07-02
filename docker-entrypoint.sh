#!/bin/sh
set -e

# Apply database migrations before the server accepts traffic.
# Invoke Prisma via its real build entry (not node_modules/.bin/prisma, whose
# symlink gets dereferenced by Docker COPY, breaking WASM engine resolution).
echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

exec "$@"
