# Lootmart — Supabase Local Development Setup

## Prerequisites

```bash
# 1. Install Supabase CLI (macOS)
brew install supabase/tap/supabase

# 2. Ensure Docker Desktop is running (Supabase local uses Docker)
open -a "Docker"

# 3. Verify installation
supabase --version
```

## Initialize & Start

```bash
# Navigate to the project root
cd /Users/asjad/clone-1

# Initialize Supabase (creates supabase/ folder with config.toml)
# Skip if supabase/config.toml already exists
supabase init

# Start local Supabase (Postgres, Auth, Storage, Realtime, PostgREST)
supabase start
```

After `supabase start`, you'll see output like:

```
API URL:            http://127.0.0.1:54321
GraphQL URL:        http://127.0.0.1:54321/graphql/v1
DB URL:             postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL:         http://127.0.0.1:54323
anon key:           eyJ...
service_role key:   eyJ...
```

Save these values in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from above>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from above>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## Working with Migrations

```bash
# Create a new migration file (generates timestamped file in supabase/migrations/)
supabase migration new <migration_name>

# Apply all pending migrations to local database
supabase db reset    # Drops and recreates DB, runs all migrations + seed.sql

# Or apply without reset (if DB is already running)
supabase migration up

# Check migration status
supabase migration list
```

## Running the Initial Schema Migration

The complete schema lives in:

```
supabase/migrations/00001_initial_schema.sql
```

To apply it:

```bash
# Option A: Reset (recommended for first setup — clean slate)
supabase db reset

# Option B: Apply migration on running instance
supabase migration up
```

## Seeding Test Data

After migrations are applied, seed data is loaded from:

```
supabase/seed.sql
```

This runs automatically with `supabase db reset`, or manually:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed.sql
```

## Accessing the Database

```bash
# Direct psql access
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Or use Supabase Studio (GUI)
open http://127.0.0.1:54323
```

## Useful Commands

```bash
# Stop local Supabase
supabase stop

# View logs
supabase logs

# Generate TypeScript types from your schema (for use in Next.js)
supabase gen types typescript --local > src/types/supabase.ts

# Push migrations to production (when ready)
supabase link --project-ref <your-project-ref>
supabase db push

# Diff local schema against remote
supabase db diff
```

## Testing RLS Policies

Use Supabase Studio's SQL Editor or psql to test policies:

```sql
-- Test as an anonymous/customer user
SET request.jwt.claims = '{"sub": "customer-uuid-123", "role": "customer"}';
SET role = 'authenticated';

SELECT * FROM stores;  -- Should see only active stores
SELECT * FROM orders;  -- Should see only own orders

-- Test as a merchant
SET request.jwt.claims = '{"sub": "merchant-uuid-456", "role": "merchant", "store_id": "1"}';
SET role = 'authenticated';

SELECT * FROM store_products WHERE store_id = 1;  -- Should work
SELECT * FROM store_products WHERE store_id = 2;  -- Should return empty

-- Reset
RESET role;
```
