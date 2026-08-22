#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .deploy-secrets ]]; then
  echo "Missing .deploy-secrets — run: node scripts/generate-deploy-secrets.mjs"
  exit 1
fi

VERCEL_SCOPE="${VERCEL_SCOPE:-h4ck3d}"

echo "Syncing Vercel env vars..."
node scripts/push-vercel-env.mjs

echo "Deploying to production..."
vercel deploy --prod --yes --scope "$VERCEL_SCOPE"
