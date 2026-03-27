# Backend and Database Decision Rationale

## Purpose
This document explains the key backend and database choices in this project, where they are implemented, and why each choice was made.

It is intended for engineering handoff, onboarding, and production operations.

## 1) System of Record: Postgres (Supabase)
- Decision: PostgreSQL in Supabase is the single transactional source of truth.
- Why: Strong consistency, ACID transactions, constraints, triggers, and RLS are required for orders, pricing, stock, ownership, and reviews.
- Where: `supabase/migrations/00001_initial_schema.sql`, `supabase/migrations/00002_hardening_metafields.sql`.

## 2) Read/Write Separation by Trust Level
- Decision: Public storefront APIs read through constrained DAL methods; admin APIs can write through admin DAL but are protected at route layer.
- Why: Keep read paths fast and simple while ensuring privileged write paths have strict authorization and validation.
- Where:
  - Public DAL: `src/lib/supabase/dal.ts`
  - Admin DAL: `src/lib/supabase/admin-dal.ts`
  - Admin route controls: `src/lib/api/admin-route.ts`, `src/lib/api/admin-validations.ts`, `src/app/api/admin/**`

## 3) Admin Authorization is App-Layer Mandatory
- Decision: Every `/api/admin/*` route must pass `ensureAdmin()` checks and returns no-store responses.
- Why: Admin DAL uses service role (RLS bypass), so route-level authorization is non-negotiable.
- Where:
  - Guard: `src/lib/api/admin-guard.ts`
  - Wrapper/response policy: `src/lib/api/admin-route.ts`
  - Applied to all handlers in: `src/app/api/admin/**`

## 4) Role Model: Profiles as Canonical DB Role Source
- Decision: `profiles.role` is canonical for DB-side logic; JWT/session claims are treated as cache hints.
- Why: JWT drift is possible; table-backed role is auditable and governable.
- Where:
  - DB helper function hardening: `supabase/migrations/00002_hardening_metafields.sql`
  - App auth checks: `src/auth.ts`, `src/lib/auth/admin-access.ts`

## 5) Order Lifecycle is Enforced as a State Machine
- Decision: Order status transitions are constrained by explicit legal edges.
- Why: Prevent invalid jumps that break operational, financial, and fulfillment invariants.
- Where:
  - DB trigger/state logic: `supabase/migrations/00002_hardening_metafields.sql`
  - API pre-check: `src/app/api/admin/orders/[id]/route.ts`

## 6) Terminal Order Immutability
- Decision: Delivered/cancelled/refunded orders have strict immutability rules.
- Why: Historical financial correctness and audit integrity must not be mutable by accident.
- Where: `supabase/migrations/00001_initial_schema.sql` and stricter redefinition in `supabase/migrations/00002_hardening_metafields.sql`.

## 7) Product Model: Global Catalog + Store Overrides + Custom Local Products
- Decision: `store_products` supports:
  - global reference rows (`global_product_id` set), and
  - custom local rows (`global_product_id` null with `custom_*` fields).
- Why: Real merchant workflows need both standard catalog import and local flexibility.
- Where:
  - Core schema: `supabase/migrations/00001_initial_schema.sql`
  - Uniqueness fix for globals only: `supabase/migrations/00002_hardening_metafields.sql`

## 8) Soft Delete Policy for Global Products
- Decision: Global products are archived (`is_active=false`) instead of hard deleted.
- Why: Protect dependent references and avoid accidental catalog corruption.
- Where:
  - DB hard-delete blocker trigger: `supabase/migrations/00002_hardening_metafields.sql`
  - App delete behavior changed to archive: `src/lib/supabase/admin-dal.ts`

## 9) Category Hierarchy Uses LTREE Materialized Paths
- Decision: Categories use `ltree` path + `parent_id` with triggers.
- Why: Fast subtree queries and manageable admin writes.
- Hardening added:
  - cycle prevention
  - root slug uniqueness
  - ltree-safe slug checks
  - descendant path rebuild on parent/slug change
- Where:
  - Base: `supabase/migrations/00001_initial_schema.sql`
  - Hardening: `supabase/migrations/00002_hardening_metafields.sql`

## 10) Money/Stock Safety Constraints in DB
- Decision: Non-negative and formula constraints enforced at DB level.
- Why: Prevents invalid monetary values and arithmetic drift from app bugs.
- Where: `supabase/migrations/00002_hardening_metafields.sql`.

## 11) Reviews Must Map to Legitimate Order Participants
- Decision: Review inserts are validated against orders and order_items.
- Why: Prevent fabricated or mismatched reviews.
- Where: `supabase/migrations/00002_hardening_metafields.sql`.

## 12) Metafields Strategy: Governed and Entity-Scoped
- Decision: Use `metafield_definitions` plus scoped value tables (`store_product_metafields`, `store_metafields`, `category_metafields`) with real foreign keys.
- Why:
  - better referential integrity than polymorphic `entity_type/entity_id`
  - cleaner RLS and ownership checks
  - safer evolution for flexible business attributes
- Where: `supabase/migrations/00002_hardening_metafields.sql`.

## 13) SECURITY DEFINER Hardening
- Decision: Security-definer helper functions set explicit `search_path`.
- Why: Prevents function hijacking via search path manipulation.
- Where: `supabase/migrations/00002_hardening_metafields.sql`.

## 14) API Validation Philosophy
- Decision: Validate and whitelist inputs in admin API routes before DAL writes.
- Why: Prevent mass-assignment, bad payloads, and fragile implicit coercion.
- Where:
  - Validators: `src/lib/api/admin-validations.ts`
  - Reusable parser/error utilities: `src/lib/api/admin-route.ts`

## 15) Cache Strategy
- Decision:
  - public read routes/pages use ISR and cache tags
  - admin responses force no-store
- Why:
  - storefront needs speed and resilience
  - admin data must be fresh and private
- Where:
  - Public cache/ISR: `src/lib/cache.ts`, public `src/app/api/*`
  - Admin no-store: `src/lib/api/admin-route.ts`

## 16) Auth Provider Fallback Policy
- Decision: Demo credential fallback is permitted only outside runtime production; production runtime must use real provider secrets.
- Why: Protect deployment from insecure auth fallback while keeping local/dev ergonomics.
- Where: `src/auth.ts`.

## 17) Known Trade-Offs
- Using service role in admin DAL increases blast radius if route auth is bypassed; this is mitigated by mandatory guard usage in all admin endpoints.
- Trigger-heavy integrity improves safety but increases migration/test complexity.
- Metafields improve flexibility but require governance discipline on namespace/key ownership.

## 18) Operational Rules
- Always run migrations in staging clone first.
- Keep rollback scripts for each migration stage.
- Treat lint/build/type checks as required pre-deploy gates.
- Never expose service role keys to the browser.

## 19) Future Improvements (Recommended)
- Introduce dedicated checkout transactional RPC endpoint and migrate cart demo flow to real order creation.
- Add integration tests for role matrix, order transitions, and review validity.
- Add schema drift gate in CI with generated Supabase types.
