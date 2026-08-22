#!/usr/bin/env bash
# Príklad volania externého cronu (cron-job.org, GitHub Actions, atď.)
# Nahraď BASE_URL a CRON_SECRET skutočnými hodnotami.

BASE_URL="${BASE_URL:-https://tvoja-domena.vercel.app}"
CRON_SECRET="${CRON_SECRET:?Set CRON_SECRET env var}"

curl -fsS \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${BASE_URL}/api/cron/poll-rss"

echo ""
