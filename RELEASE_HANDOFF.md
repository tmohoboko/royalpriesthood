# Dah Print — production handoff (17 October 2026)

## Account decision

- GitHub source owner **tmohoboko** (dedicated `dahprint` repo desired; not yet created).
- Vercel hosting may remain in the existing **tmdev** team for now. Migrating the four existing projects is explicitly deferred.
- This is a new, isolated project. Never link to or redeploy `moya-glow-commerce` or `software-delivery-portfolio`.

## Release scope

React 19 + Vite + Tailwind 4 + Three.js + GSAP storefront; 33 tee positions, exactly 1 approved `ROOTED` visual system with 5 views, 32 clearly unreleased placeholder tees; hero/About/lookbook/shop/contact/enquiry bag. No real payment processing, prices, stocks or completed order submissions. Contact e-mail must be configured before a real enquiry can be delivered; otherwise brief may be copied/downloaded locally.

## Verification

`node scripts/preflight.mjs` verifies the inventory, required sections, scene and images (static checks only).

With working npm registry connection:

1. `npm install --no-audit --no-fund` and commit generated `package-lock.json`.
2. `npm run build`.
3. `npx playwright install chromium` then `npm test`.
4. Link Vercel to **only** a new project named `dahprint`, account scope `tmdev`. Inspect `.vercel/project.json` and Vercel dashboard before deployment.
5. `bash scripts/release-vercel.sh` runs `npm ci`, build, tests and deploys through authenticated Vercel CLI.
6. Run hosted `BASE_URL=https://<actual-production-url> npm test` and record deployed source SHA, immutable deployment URL, date and test evidence.

No GitHub repository creation, hosted build, Vercel production deployment, or live URL is claimed here. As of this handoff, the Vercel ChatGPT plugin still reports `installed: false` and no deploy command could be run.
