# Tech Lead Brief: Database Hardening and Metafields Decisions

## Purpose
This document explains the implementation decisions taken in the hardening migration and why each decision was made.

Scope implemented in migration:
- supabase/migrations/00002_hardening_metafields.sql

## Executive Summary
The implementation prioritizes three outcomes:
1. Data correctness cannot silently drift.
2. Authorization cannot rely on app-layer assumptions alone.
3. Flexibility is added through governed metafields without weakening transactional integrity.

Postgres remains the source of truth for all transactional behavior. Metafields are added with strict governance and entity-level referential integrity. Order, review, and identity-linked flows are enforced at the database boundary, not only in application code.

## Core Architectural Decisions and Rationale

### 1) Keep Postgres as sole transactional authority
Decision:
- No transactional writes are delegated to analytics or sidecar systems.

Why:
- Prevents split-brain behavior between operational and analytical stores.
- Keeps correctness guarantees (constraints, triggers, RLS, ACID) centralized.

Trade-off:
- Some read-heavy analytics queries remain outside OLTP and should be served by sidecar marts.

### 2) Use profiles.role as DB authorization source of truth
Decision:
- Role helper functions read roles from profiles.role under SECURITY DEFINER with explicit search_path.

Why:
- JWT role claims can be stale; table-backed role is authoritative and mutable under governance.
- Explicit search_path hardens SECURITY DEFINER functions against path hijacking.

Trade-off:
- Requires consistent role maintenance in profiles.

### 3) Prefer entity-scoped metafield tables over one polymorphic table
Decision:
- Added metafield_definitions plus:
  - store_product_metafields
  - store_metafields
  - category_metafields

Why:
- Real foreign keys and cascade semantics per entity.
- Cleaner RLS policy authoring and auditability.
- Lower orphan and wrong-entity reference risk than generic entity_type/entity_id design.

Trade-off:
- More tables and repetitive policy/trigger setup.

### 4) Enforce soft-delete semantics for global products at DB layer
Decision:
- Added a hard-delete blocking trigger on global_products.

Why:
- Prevents accidental destructive deletes that would strand dependent data.
- Aligns with archival intent via is_active=false.

Trade-off:
- True hard delete now requires explicit controlled path.

### 5) Encode order lifecycle as a DB state machine
Decision:
- Added strict transition validation trigger for orders.status.
- Added terminal-state immutability guard for delivered/cancelled/refunded orders.

Why:
- Eliminates invalid transition paths and post-finalization mutation drift.
- Makes order workflow deterministic independent of client behavior.

Trade-off:
- Operational fixes must use allowed transition paths.

### 6) Keep order financial math DB-enforced
Decision:
- Added non-negative checks and line_total formula checks.
- Added total recompute trigger on orders.

Why:
- Prevents arithmetic divergence across clients/services.
- Ensures persisted totals are internally consistent.

Trade-off:
- Legacy inconsistent rows must be corrected before migration if present.

### 7) Tighten identity-linked relationship validity
Decision:
- Added role-alignment triggers for stores, merchants, riders, customers.
- Added default address ownership validation on customers.

Why:
- Stops role-table mismatch and cross-user linkage errors.
- Protects user/account integrity at write time.

Trade-off:
- Existing inconsistent identity records will now be rejected on change.

### 8) Make review legitimacy database-verifiable
Decision:
- Added review target validation triggers:
  - store review must match order store and order customer
  - rider review must match assigned order rider and customer
  - product review must reference a store_product present in order_items

Why:
- Prevents fabricated or mismatched reviews.
- Ensures review trust model is enforceable.

Trade-off:
- Any historical mismatches become visible and need cleanup.

### 9) Constrain category tree correctness
Decision:
- Added cycle prevention trigger.
- Added descendant path rebuild trigger on parent/slug changes.
- Added root slug uniqueness and ltree-safe slug check.

Why:
- Prevents invalid hierarchy states and stale path propagation.
- Keeps category path semantics query-safe.

Trade-off:
- Existing invalid slugs or duplicate roots must be remediated first.

### 10) Strengthen RLS for writes where abuse risk is high
Decision:
- Replaced/updated insert policies for:
  - orders
  - order_items
  - store_reviews
  - rider_reviews
  - product_reviews

Why:
- Enforces actor ownership and business-state requirements at insertion boundary.
- Reduces risk from direct API misuse or bypass attempts.

Trade-off:
- Legitimate edge workflows must pass these policy predicates.

## Second-Pass Decisions Added in This Go-Over

### A) Add preflight data-quality checks for deterministic migration behavior
Decision:
- Added fail-fast checks before constraints/indexes for:
  - duplicate (store_id, global_product_id) where global_product_id is not null
  - duplicate root category slugs
  - non-ltree-safe category slugs

Why:
- Prevents opaque DDL failures during index/constraint creation.
- Produces actionable error causes early.

Trade-off:
- Migration intentionally aborts until data is corrected.

### B) Normalize duplicate primary barcodes before unique index creation
Decision:
- Added deterministic cleanup: keep oldest primary barcode per product, demote the rest.

Why:
- Ensures unique partial index creation succeeds in environments with historical drift.
- Preserves one canonical primary per product without destructive delete.

Trade-off:
- Some rows have is_primary flipped to false automatically.

## Why Enforcement is DB-Centric Instead of App-Centric
Decision:
- Critical invariants are encoded in constraints, triggers, and RLS.

Why:
- Every write path (API, admin scripts, direct SQL, future services) is uniformly protected.
- App-only checks are easier to bypass and harder to keep consistent over time.

Trade-off:
- More migration complexity and stronger operational discipline required.

## Operational Risk Notes
1. Constraint/index additions may block on dirty legacy data.
2. Trigger-based strictness can reject previously tolerated writes.
3. RLS changes may break undocumented write paths that relied on looser checks.

Mitigations included:
- Preflight checks with explicit error messages.
- Deterministic barcode normalization before uniqueness enforcement.
- Object creation patterns using IF EXISTS / IF NOT EXISTS where appropriate.

## What Was Not Completed in This Session
1. Live migration execution in local Supabase instance.
2. Runtime verification against seeded data and end-to-end flows.

Reason:
- Supabase CLI is not installed in the current environment session.

## Recommended Rollout Sequence
1. Run migration in staging clone.
2. Resolve any preflight check failures with explicit data-fix scripts.
3. Re-run migration and execute role-based RLS smoke tests.
4. Validate checkout, order transitions, and review creation flows.
5. Promote to production with rollback script prepared.

## Files to Review
- supabase/migrations/00002_hardening_metafields.sql
- FINAL_IMPLEMENTATION_PLAN.md
- TECH_LEAD_DECISION_RATIONALE.md
