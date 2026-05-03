#!/bin/bash
set -e

# Post-merge setup for the Lingua HQ Leaderboard project.
# Runs after a task is merged. Must be idempotent and non-interactive.

# Install JS deps if package.json changed (npm ci is faster + reproducible
# when package-lock.json is in sync; fall back to npm install otherwise).
if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund
else
    npm install --no-audit --no-fund
fi
