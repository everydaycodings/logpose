#!/bin/sh
set -e

# Migrations run in the dedicated one-shot `migrate` compose service, which
# app/worker wait on. This entrypoint just starts the server.
exec "$@"
