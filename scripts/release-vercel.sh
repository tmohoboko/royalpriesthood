#!/usr/bin/env bash
# Deploy ONLY a dedicated Royal Priesthood Vercel project; never re-link an existing project.
set -euo pipefail
cd "$(dirname "$0")/.."
VERCEL_SCOPE="${VERCEL_SCOPE:-tmdev}"
PROJECT_NAME="royalpriesthood"
if [[ ! -e package.json || "$(node -p "require('./package.json').name")" != 'royal-priesthood-storefront' ]]; then
  echo 'ABORT: not in Royal Priesthood source root' >&2; exit 2
fi
if [[ ! -f package-lock.json ]]; then
  echo 'ABORT: package-lock.json missing. Run npm install locally and commit lockfile first.' >&2; exit 2
fi
if ! command -v vercel >/dev/null 2>&1; then
  echo 'ABORT: Vercel CLI unavailable. Install the CLI in an authenticated environment.' >&2; exit 2
fi
if ! vercel whoami >/dev/null; then
  echo 'ABORT: Vercel CLI unauthenticated. Connect your intended Vercel account first.' >&2; exit 2
fi
if [[ -f .vercel/project.json ]]; then
  project="$(node -p "require('./.vercel/project.json').projectName || ''")"
  if [[ "$project" != "$PROJECT_NAME" ]]; then
    echo "ABORT: checkout is linked to '$project' instead of '$PROJECT_NAME'" >&2; exit 2
  fi
else
  echo "Project not linked. Please use 'vercel link --project royalpriesthood --scope ${VERCEL_SCOPE}' once, and verify team/project identity." >&2
  exit 2
fi
npm ci --no-audit --no-fund
npm run build
npx playwright install chromium
npm test
printf 'Verified local checks. Deploying dedicated project %s under %s...\n' "$PROJECT_NAME" "$VERCEL_SCOPE"
vercel deploy --prod --yes --scope "$VERCEL_SCOPE"
echo 'NEXT: Run BASE_URL=https://ACTUAL_DEPLOYED_URL npm test and record deployed SHA / Vercel project identity.'
