# 🚀 Hooking Up Supabase to Lootmart — Beginner's Guide

> This guide walks you through connecting your Next.js app to a real Supabase database, step by step. No prior Supabase experience needed.

---

## What We Changed (The Big Picture)

Your app used to work like this:

```
Browser → API Route → static arrays in /data/*.ts → JSON response
```

Now it works like this:

```
Browser → API Route → Supabase PostgreSQL database → JSON response
         (with a feature flag to fall back to the old static data)
```

**Nothing breaks.** We added a feature flag (`NEXT_PUBLIC_USE_SUPABASE`) so the app gracefully uses old static data when Supabase isn't configured.

---

## Step 0: Prerequisites

You need two things installed:

```bash
# 1. Supabase CLI
brew install supabase/tap/supabase

# 2. Docker Desktop (Supabase runs locally inside Docker)
# Download from: https://www.docker.com/products/docker-desktop/
# Make sure it's running (you should see the whale icon in your menu bar)
```

Verify both work:

```bash
supabase --version    # Should print something like "1.x.x"
docker --version      # Should print something like "Docker version 27.x.x"
```

---

## Step 1: Initialize Supabase in Your Project

```bash
cd /Users/asjad/clone-1
supabase init
```

This creates a `supabase/config.toml` file. We've already created the `supabase/migrations/` folder and seed files for you.

> **Note:** If `supabase init` says the folder already exists, that's fine — skip it.

---

## Step 2: Start Local Supabase

```bash
supabase start
```

**First time?** This downloads Docker images (~2 min). After that it starts in seconds.

You'll see output like this:

```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
        anon key: eyJ...long-string...
service_role key: eyJ...another-long-string...
```

**Copy the `anon key` and `service_role key`.** You'll need them next.

---

## Step 3: Set Up Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Now edit `.env.local` and paste in your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=paste-your-service-role-key-here
NEXT_PUBLIC_USE_SUPABASE=true
```

> **"What are these keys?"**
> - `anon key` = A public key that browsers use. It's safe to expose — RLS policies protect the data.
> - `service_role key` = A private admin key that bypasses all security. NEVER put this in browser code.

---

## Step 4: Run Database Migrations

This creates all the tables, indexes, RLS policies, and seed data:

```bash
supabase db reset
```

**What just happened:**
1. Dropped and recreated the local database
2. Ran `supabase/migrations/00001_initial_schema.sql` — creates 15+ tables
3. Ran `supabase/seed.sql` — inserts areas, brands, categories, and 30 global products

---

## Step 5: Run the Full Seed Script

The SQL seed creates the "catalog" (areas, brands, categories, global products). But stores and users need Supabase Auth, so we have a TypeScript script for that:

```bash
# Install tsx (a fast TypeScript runner) if you don't have it
npm install -D tsx

# Run the seeder
npx tsx scripts/seed-local.ts
```

You should see:

```
🌱 Starting Lootmart seed...

👤 Creating test users...
  ✅ admin@lootmart.pk → a1b2c3d4...
  ✅ merchant1@royal.pk → e5f6g7h8...
  ...

🏪 Creating stores...
  ✅ Store: Royal Cash & Carry (id: 1)
  ✅ Store: Hash Mart (id: 2)

📦 Creating store products...
  ✅ Royal Cash & Carry: 15 products linked
  ✅ Hash Mart: 20 products linked

🎉 Seed complete!
```

---

## Step 6: Start the App

```bash
npm run dev
```

Open http://localhost:3000. You should see your stores and products — now served from a real PostgreSQL database!

---

## Step 7: Verify It Works

Open Supabase Studio to see your data visually:

```bash
open http://127.0.0.1:54323
```

Click on **Table Editor** in the left sidebar. You should see all your tables with data.

### Quick Smoke Test

1. **Homepage** → Shows stores from the `stores` table
2. **Click a store** → Shows products from `v_storefront_products` view
3. **Search** → Queries products via the API → Supabase
4. **Infinite scroll** → Pagination hits Supabase with `range()` queries

---

## The Feature Flag (How to Switch Back)

In `.env.local`, change:

```env
NEXT_PUBLIC_USE_SUPABASE=false
```

Restart the dev server. The app now uses the old static data from `/data/*.ts` — zero database needed. This is your safety net.

---

## File Map: What Changed and Why

| File | What Changed |
|---|---|
| `src/lib/supabase/client.ts` | **NEW** — Browser-side Supabase client |
| `src/lib/supabase/server.ts` | **NEW** — Server-side Supabase client |
| `src/lib/supabase/dal.ts` | **NEW** — Data Access Layer (all queries in one place) |
| `src/types/supabase.ts` | **NEW** — TypeScript types for all DB tables |
| `src/lib/cache.ts` | **UPDATED** — Calls DAL when flag is on, static data when off |
| `src/app/api/areas/route.ts` | **UPDATED** — Fetches from Supabase or static |
| `src/app/api/stores/route.ts` | **UPDATED** — Same pattern |
| `src/app/api/stores/[slug]/route.ts` | **UPDATED** — Same pattern |
| `src/app/api/products/route.ts` | **UPDATED** — Same pattern |
| `src/app/page.tsx` | **UPDATED** — Fetches stores from Supabase for SSR |
| `src/app/store/[slug]/page.tsx` | **UPDATED** — Uses Supabase for static params |
| `supabase/migrations/00001_initial_schema.sql` | **NEW** — Full database schema |
| `supabase/seed.sql` | **NEW** — Catalog seed data |
| `scripts/seed-local.ts` | **NEW** — Creates users, stores, links products |
| `.env.local.example` | **NEW** — Template for env vars |

### Files NOT changed (on purpose)

| File | Why |
|---|---|
| `src/components/*` | Components don't care where data comes from — they receive props |
| `src/store/cart.ts` | Cart is client-side (Zustand + localStorage) — no DB needed yet |
| `src/store/area.ts` | Area selection is client-side — no DB needed |
| `src/types/index.ts` | Original types kept as-is. Components still use `Product`, `Store`, etc. |
| `src/data/*.ts` | **Kept for fallback.** Never deleted. |
| `src/auth.ts` | Auth stays with NextAuth. Supabase Auth is used for DB-level RLS only. |

---

## Architecture: How the Data Flows

```
                    ┌─────────────┐
                    │   Browser   │
                    └──────┬──────┘
                           │ fetch("/api/products?storeSlug=hash-mart")
                           ▼
                    ┌─────────────┐
                    │  API Route  │  src/app/api/products/route.ts
                    └──────┬──────┘
                           │ USE_SUPABASE === true?
                    ┌──────┴──────┐
                    ▼             ▼
            ┌─────────────┐  ┌─────────────┐
            │  Supabase   │  │ Static Data │  (fallback)
            │    DAL      │  │ /data/*.ts  │
            └──────┬──────┘  └─────────────┘
                   │
                   │ supabase.from("v_storefront_products").select(...)
                   ▼
            ┌─────────────┐
            │  PostgreSQL  │  (local Docker or Supabase Cloud)
            └─────────────┘
```

---

## Deploying to Production (Supabase Cloud)

When your supervisor gives the green light:

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com), create a new project. Note your:
- Project URL (`https://abc123.supabase.co`)
- Anon Key
- Service Role Key

### 2. Link Your Project

```bash
supabase link --project-ref abc123
```

### 3. Push Migrations to Production

```bash
supabase db push
```

This runs all migration files against your production database.

### 4. Seed Production Data

```bash
# Update the URL and key in your env, then run:
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key \
npx tsx scripts/seed-local.ts
```

### 5. Update Vercel Environment Variables

In your Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
NEXT_PUBLIC_USE_SUPABASE=true
```

### 6. Deploy

```bash
git add -A
git commit -m "feat: hook up Supabase database"
git push
```

Vercel auto-deploys. Done! 🎉

---

## Common Issues & Fixes

| Problem | Fix |
|---|---|
| `supabase start` fails | Make sure Docker Desktop is running |
| "relation does not exist" | Run `supabase db reset` to apply migrations |
| Empty product list | Run `npx tsx scripts/seed-local.ts` |
| Types don't match | Run `supabase gen types typescript --local > src/types/supabase.ts` |
| Want to go back to static data | Set `NEXT_PUBLIC_USE_SUPABASE=false` in `.env.local` |
| Port 54321 already in use | Run `supabase stop` then `supabase start` |

---

## Quick Reference Commands

```bash
supabase start              # Start local Supabase
supabase stop               # Stop local Supabase
supabase db reset           # Reset DB + run migrations + seed
supabase migration new xyz  # Create new migration file
supabase gen types typescript --local > src/types/supabase.ts  # Regenerate types
npx tsx scripts/seed-local.ts  # Seed test users, stores, products
npm run dev                 # Start Next.js dev server
```
