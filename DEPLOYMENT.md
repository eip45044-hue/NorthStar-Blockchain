# Deployment

## Railway API

Deploy from the repository root so pnpm can see the workspace and lockfile. The API creates only missing tables from its checked-in schema before listening; existing tables and data are not dropped, renamed, or rewritten. Railway supplies `PORT` at runtime.

Set these Railway variables:

- `DATABASE_URL`: the complete Neon PostgreSQL URL. Keep Neon’s `sslmode=require` parameter; Neon hosts without that parameter are configured for TLS automatically.
- `CORS_ORIGINS`: comma-separated exact origins for the user app and admin app, such as `https://app.example.com,https://admin.example.com`. Do not include paths or trailing slashes.
- `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: Clerk backend credentials.
- `ADMIN_SECRET`: secret used by the admin panel login.
- `MARKET_API_KEY`: optional CoinGecko API key; without it the public endpoint is used.
- `PG_POOL_MAX`: optional PostgreSQL pool size; defaults to `10`.
- The API creates any missing tables from its checked-in schema at startup. This is additive (`CREATE TABLE IF NOT EXISTS`) and does not alter existing tables or data.

Do not commit production credentials. Existing profiles keep their stored verification status; approved KYC records are not reset during sign-in.

## Vercel User App

Keep the Vercel project root at the repository root. `vercel.json` builds `@workspace/blockchain-hub` and publishes its static output. Set:

- `VITE_API_URL`: Railway’s public API origin, for example `https://northstar-api.up.railway.app` (origin only, without `/api`).
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk frontend publishable key.
- `VITE_CLERK_PROXY_URL`: the Clerk proxy URL if the Clerk deployment uses one.

Add the deployed user app origin to Railway’s `CORS_ORIGINS`.

## Vercel Admin Panel

Create a separate Vercel project for `artifacts/admin-panel`, using the repository root as its project root. Set the build command to `pnpm --filter @workspace/admin-panel build` and the output directory to `artifacts/admin-panel/dist/public`. Set `VITE_API_URL` to the same Railway API origin, then add the admin app’s exact deployment origin to Railway’s `CORS_ORIGINS`.

For local development, both Vite servers default to ports `5173` and `5174` and proxy `/api` to `http://localhost:3000`. Set `VITE_API_URL` locally only when you want to use a remote API.

## Existing Netlify Projects

The existing Netlify projects must use the repository root as the base directory, not `zipFile` or the API URL. Set the user site build command to `pnpm install --frozen-lockfile && pnpm --filter @workspace/blockchain-hub build` and publish directory to `artifacts/blockchain-hub/dist/public`. Set the admin site build command to `pnpm install --frozen-lockfile && pnpm --filter @workspace/admin-panel build` and publish directory to `artifacts/admin-panel/dist/public`. Keep each site's existing `VITE_API_URL` set to the Railway API origin. The Netlify account currently reports build-credit exhaustion, so the production sites cannot publish until that limit is resolved.

## UptimeRobot

The database-aware health endpoint is `https://norhstar-api.onrender.com/api/health`; `/api/healthz` is an alias. Both run `SELECT 1` and return HTTP 503 if PostgreSQL is unavailable. To create or reuse five-minute monitors for the API and canonical Netlify sites, run `node scripts/uptimerobot-setup.mjs --dry-run` first, then provide `UPTIMEROBOT_API_KEY` in your local shell and run `node scripts/uptimerobot-setup.mjs`. The script never prints the key. The custom domains require the registrar nameservers to be delegated to Netlify before monitoring them; the canonical `netlify.app` URLs are used by default.