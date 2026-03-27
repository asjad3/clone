# Deployment Runbook

This runbook is the operational checklist for deploying this project safely.

## 1) Deployment Targets
- App hosting: Vercel
- Database/auth/storage: Supabase
- Runtime mode: `NEXT_PUBLIC_USE_SUPABASE=true`

## 2) Prerequisites
- Access to:
  - Vercel project (Owner or Admin)
  - Supabase project (Owner or Admin)
  - Google Cloud OAuth credentials
- Local tools:
  - Node 20+
  - `npm`
  - Supabase CLI (`supabase`)

## 3) Required Environment Variables

Set these in Vercel (Production and Preview as needed):

Core:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_USE_SUPABASE=true`

Auth:
- `AUTH_SECRET` (strong random value)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAILS` (comma-separated allowlist)

Cache/revalidation:
- `REVALIDATION_SECRET` (strong random value)

Optional:
- `NEXTAUTH_URL` (production app URL)

Generate secrets:
```bash
openssl rand -base64 32
openssl rand -hex 32
```

## 4) Pre-Deployment Checks (Required)

From repo root:
```bash
npm ci
npm run lint
npm run build
```

Expected:
- `lint`: zero errors (warnings can be tolerated if known)
- `build`: success

## 5) Database Migration Procedure

### 5.1 Link local CLI to target Supabase project
```bash
supabase link --project-ref <your-project-ref>
```

### 5.2 Apply migrations
```bash
supabase db push
```

### 5.3 Optional seed (only if needed)
```bash
npx tsx scripts/seed-local.ts
```

Notes:
- Use seed only for initial baseline data.
- Do not run seed blindly on an established production dataset.

## 6) Application Deployment (Vercel)

1. Push branch to GitHub.
2. Open Vercel and confirm env vars are present for target environment.
3. Trigger deployment (or rely on auto-deploy for connected branch).
4. Wait for build + health checks to pass.

## 7) Post-Deploy Smoke Tests

### 7.1 Public API checks
```bash
curl -i https://<your-domain>/api/areas
curl -i https://<your-domain>/api/stores
curl -i "https://<your-domain>/api/products?store_slug=royal-cash-and-carry&limit=5"
```

### 7.2 Admin auth checks
- Unauthenticated request should be rejected:
```bash
curl -i https://<your-domain>/api/admin/products
```
Expected: `401` or `403`.

- Logged-in non-admin should be rejected in browser/API.
- Logged-in admin should be able to access `/admin` and admin APIs.

### 7.3 Behavior checks
- Product delete in admin archives product (does not hard delete).
- Order status update rejects invalid transitions.
- Admin routes return no-store cache headers.

## 8) Rollback Plan

Use this order: **App rollback first**, then **DB rollback strategy** if required.

### 8.1 App rollback (fast)
- In Vercel, redeploy the last known good deployment.
- Or revert commit and redeploy from Git.

### 8.2 DB rollback (safe strategy)

Important:
- Do not edit old migrations already applied in production.
- Prefer a forward fix migration over destructive rollback SQL.

Recommended options:
1. Restore from Supabase backup / PITR to a recovery project and swap traffic when needed.
2. Apply a new corrective migration that reintroduces prior behavior safely.

Before each production migration run, capture at least one rollback artifact:
- Managed backup snapshot (preferred), or
- table-level exports for critical entities (`orders`, `order_items`, `stores`, `store_products`, `global_products`, `categories`).

## 9) Incident Procedure

If deployment is degraded:
1. Freeze further deploys.
2. Roll back app in Vercel.
3. Validate public routes and admin access.
4. If issue is schema-level, apply corrective migration or restore backup strategy.
5. Create incident notes with timeline, root cause, and follow-up actions.

## 10) Known Operational Notes
- If you see Next.js workspace-root lockfile warning, set `turbopack.root` in `next.config.ts`.
- Admin APIs depend on valid OAuth + `AUTH_SECRET` in runtime production.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## 11) Release Checklist (Quick Copy)

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Supabase project linked
- [ ] `supabase db push` completed
- [ ] Vercel env vars validated
- [ ] Deploy completed
- [ ] Public API smoke tests passed
- [ ] Admin auth/authorization checks passed
- [ ] Archive + order transition behavior verified
