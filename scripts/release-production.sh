#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

PROJECT_ID="prj_IZuPhIVC8rI7nLzV1SdJifoaQaRp"
TEAM="tmdev"
LIVE_URL="https://royalpriesthood-two.vercel.app"
SHA="$(git rev-parse HEAD)"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Release requires a clean committed checkout." >&2
  git status --short >&2
  exit 1
fi

for tool in git node npm vercel; do
  command -v "$tool" >/dev/null || { echo "Missing required tool: $tool" >&2; exit 1; }
done

actual_project="$(node -p 'require("./.vercel/project.json").projectId')"
[[ "$actual_project" == "$PROJECT_ID" ]] || { echo "Linked Vercel project does not match $PROJECT_ID" >&2; exit 1; }

echo "Running release checks for $SHA"
npm ci
npm run check
npm test
npm run test:commerce

echo "Staging production deployment for verified database and payment checks"
deployment_json="$(vercel deploy --prod --skip-domain --project "$PROJECT_ID" --scope "$TEAM" --yes --json --build-env "COMMERCE_COMMIT=$SHA")"
DEPLOYMENT_URL="$(node --input-type=module -e 'const d=JSON.parse(process.argv[1]); const u=d.url??d.alias?.[0]; if(!u) throw Error("Vercel did not return a deployment URL"); console.log(u.startsWith("https://")?u:`https://${u}`)' "$deployment_json")"

DEPLOYMENT_URL="$DEPLOYMENT_URL" EXPECTED_SHA="$SHA" node --input-type=module <<'NODE'
const base = process.env.DEPLOYMENT_URL;
const expected = process.env.EXPECTED_SHA;
async function json(path) {
  const response = await fetch(new URL(path, base));
  if (!response.ok) throw Error(`${path} returned HTTP ${response.status}`);
  return response.json();
}
const release = await json('/commerce-release.json');
if (release.commit !== expected) throw Error(`Deployment commit ${release.commit} does not match ${expected}`);
const health = await json('/api/commerce/health');
if (!health.ok || health.paymentMode !== 'disabled') throw Error('Production commerce is not safely disabled for payment');
const { products } = await json('/api/commerce/products');
if (!Array.isArray(products) || products.length !== 16) throw Error('Unexpected production catalogue');
if (products.some((product) => product.variants?.length || product.purchaseMode !== 'quote')) {
  throw Error('Production catalogue has purchasable inventory; refusing automatic promotion');
}
console.log(JSON.stringify({deployment:base,commit:release.commit,databaseConfigured:health.databaseConfigured,products:products.length,paymentMode:health.paymentMode}));
NODE

echo "Promoting verified deployment"
vercel promote "$DEPLOYMENT_URL" --scope "$TEAM" --yes

LIVE_URL="$LIVE_URL" EXPECTED_SHA="$SHA" node --input-type=module <<'NODE'
const base = process.env.LIVE_URL;
const expected = process.env.EXPECTED_SHA;
const response = await fetch(new URL('/commerce-release.json', base));
if (!response.ok) throw Error(`Live release metadata returned HTTP ${response.status}`);
const release = await response.json();
if (release.commit !== expected) throw Error(`Live alias serves ${release.commit}, expected ${expected}`);
const healthResponse = await fetch(new URL('/api/commerce/health', base));
if (!healthResponse.ok) throw Error(`Live health endpoint returned HTTP ${healthResponse.status}`);
const health = await healthResponse.json();
if (!health.ok || health.paymentMode !== 'disabled') throw Error('Live payment mode is not disabled');
console.log(JSON.stringify({liveUrl:base,commit:release.commit,databaseConfigured:health.databaseConfigured,paymentMode:health.paymentMode}));
NODE
