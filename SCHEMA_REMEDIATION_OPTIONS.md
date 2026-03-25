# Schema Remediation Options (Revised): Metafields + DuckDB + Adaptable Model

## Executive Summary
Your boss's direction is valid if applied as a hybrid architecture, not a full replacement of transactional Postgres.

Best-fit target:
1. Keep Supabase/Postgres as source of truth for OLTP, integrity, and RLS.
2. Introduce a metafields subsystem for flexible attributes and evolving business schema.
3. Add DuckDB as an analytical/query acceleration layer (read-mostly), not as the write-path system of record.
4. Tighten hard invariants (orders, auth, money, ownership) while allowing adaptability at the edge via typed metafields.

This revised document covers all previously identified 20 failure modes and re-evaluates options with:
- Metafields implications
- DuckDB implications
- Pros and cons
- Recommended path

---

## Architecture Guardrails

## What DuckDB should do
- OLAP workloads: analytics, faceting, denormalized read models, heavy aggregate queries.
- Fast local/in-process reporting from replicated snapshots.
- Data quality scans and anomaly detection over exports/CDC streams.

## What DuckDB should not do here
- Core transactional writes (orders, payments, stock decrements, reviews).
- Multi-tenant RLS authorization source.
- Concurrency-critical checkout semantics.

## Metafields design principle
Use metafields for extensible domain data, not core invariants.

Good for metafields:
- Product/spec extensions, merchant custom descriptors, category-specific attributes.

Bad for metafields:
- Identity, ownership, order totals, lifecycle status, permissions, foreign key identity links.

---

## Proposed Adaptable Schema Pattern (High Level)

## Core rigid tables (strict)
- profiles, merchants, riders, customers
- stores, store_areas, areas
- orders, order_items
- payments and status fields
- review ownership references

## Flexible extension tables (metafields)
- metafield_definitions
- entity_metafields
- optional typed projections for high-traffic keys

### Suggested shape
- metafield_definitions: id, entity_type, namespace, key, value_type, validation_json, is_indexed, governance fields.
- entity_metafields: id, entity_type, entity_id, definition_id nullable, namespace, key, value_json, value_text, value_num, value_bool, updated_at.
- Unique: (entity_type, entity_id, namespace, key).
- Policy: entity-based ownership checks tied to core tables.

## DuckDB integration pattern
- CDC or periodic snapshot from Postgres -> object storage/parquet -> DuckDB.
- Build analytical marts for storefront filtering, merchandising, and BI.
- Keep API writes in Postgres; read APIs can selectively use DuckDB-backed caches/materializations.

---

## Decision Matrix: Model Options

### Option A: Strict relational only (current direction)
Pros:
- Strong integrity
- Simple operational model
Cons:
- Slower adaptation to changing product and merchant data requirements

### Option B: Hybrid strict core + metafields + DuckDB analytics (recommended)
Pros:
- Best balance of safety and adaptability
- Scales analytics without overloading OLTP
- Supports fast experimentation without schema churn
Cons:
- More moving parts (pipeline + governance)
- Requires clear contracts on what can be flexible

### Option C: Metafields-heavy with DuckDB as main serving path
Pros:
- Very adaptable
Cons:
- High integrity risk
- Complexity in correctness and authorization
- Poor fit for transaction-critical workloads

### Recommended
Option B.

---

## Failure-Mode-by-Failure-Mode Solutions (Revised)

## 1) Custom products limited to one per store
### Option A: Partial unique index on (store_id, global_product_id) WHERE global_product_id IS NOT NULL
Pros: minimal change, fixes core bug.
Cons: migration lock/care needed.

### Option B: Split tables for global-import vs custom products
Pros: clean model.
Cons: high refactor cost.

### Option C: Keep single table plus metafields for custom product extensions
Pros: adaptable custom catalog without schema churn.
Cons: does not fix uniqueness bug by itself.

### DuckDB angle
No direct fix. DuckDB can detect collisions/anomalies but cannot enforce OLTP constraint.

### Recommended
A + C.

---

## 2) Deleting global products can orphan store products
### Option A: ON DELETE RESTRICT
Pros: hard safety.
Cons: requires explicit archive lifecycle.

### Option B: Soft-delete global products (is_active=false), no hard delete
Pros: safest operationally.
Cons: table growth.

### Option C: Materialize fallback custom fields before delete
Pros: preserves rows.
Cons: complex trigger logic.

### Metafields angle
Store custom fallback values in metafields to ease transition.

### DuckDB angle
Use historical product snapshots in analytics, but OLTP still needs A/B.

### Recommended
B as default policy + A as guard.

---

## 3) Reviews not bound to true order participants/items
### Option A: Insert trigger validates review target against order/order_items
Pros: strongest integrity.
Cons: trigger complexity.

### Option B: Stronger RLS EXISTS checks
Pros: policy-level enforcement.
Cons: complexity/perf tuning.

### Option C: App-only checks
Pros: quick.
Cons: unsafe.

### Metafields angle
Keep review content extensible via metafields, but participant linkage must remain strict relational.

### DuckDB angle
Post-fact audits for invalid review associations.

### Recommended
A + targeted B.

---

## 4) Order items can be inserted after placement
### Option A: Allow insert only when order status='pending'
Pros: easy containment.
Cons: still leaky for race conditions.

### Option B: Remove direct customer insert; checkout via RPC/transactional function
Pros: strongest correctness.
Cons: implementation effort.

### Option C: Trigger with time/status gates
Pros: central guard.
Cons: brittle if policy changes.

### DuckDB angle
No enforcement role.

### Recommended
B (with A as interim).

---

## 5) Terminal order immutability incomplete
### Option A: Expand trigger-protected fields
Pros: direct patch.
Cons: logic sprawl.

### Option B: Status-based mutable allowlist matrix
Pros: maintainable and auditable.
Cons: upfront design work.

### Option C: Event-sourced redesign
Pros: maximum audit quality.
Cons: invasive.

### Metafields angle
Do not store critical money/status in metafields.

### Recommended
B.

---

## 6) No order transition state machine
### Option A: Trigger validates legal transitions
Pros: centralized rule enforcement.
Cons: migration coordination.

### Option B: Dedicated RPC transition endpoints
Pros: clear semantics and auditing.
Cons: more application integration.

### Option C: App-only
Pros: low effort.
Cons: weak.

### Recommended
A now, B over time.

---

## 7) Role drift between JWT and profiles
### Option A: JWT canonical
Pros: auth-centric.
Cons: drift windows remain.

### Option B: DB canonical role in profiles + JWT synchronization job
Pros: auditable source of truth.
Cons: helper functions need DB lookups.

### Option C: dual-source + deny-on-mismatch
Pros: strict safety.
Cons: operational friction.

### Recommended
B.

---

## 8) default_address_id can reference another customer's address
### Option A: Trigger validates ownership alignment
Pros: strong and local.
Cons: trigger maintenance.

### Option B: Remove pointer; compute default via address flag
Pros: cleaner model.
Cons: migration changes.

### Option C: composite relational redesign
Pros: strongest relational guarantee.
Cons: invasive.

### Recommended
A now, evaluate B later.

---

## 9) Category path not cascading to descendants
### Option A: recursive trigger/procedure updates descendants
Pros: maintains LTREE correctness.
Cons: expensive on large trees.

### Option B: procedure-only category mutations
Pros: controlled ops and observability.
Cons: requires discipline.

### Option C: abandon materialized path
Pros: simpler writes.
Cons: slower reads.

### Metafields angle
Category metadata can be flexible, but tree topology must remain strict.

### Recommended
B + safety trigger fallback.

---

## 10) Category cycles not prevented
### Option A: cycle-check trigger
Pros: standard, reliable.
Cons: write-time recursion check.

### Option B: procedure-only writes with cycle validation
Pros: governance.
Cons: operational discipline required.

### Option C: app-only
Pros: easy.
Cons: unsafe.

### Recommended
A.

---

## 11) Duplicate root slugs possible
### Option A: partial unique index slug WHERE parent_id IS NULL
Pros: precise, minimal.
Cons: cleanup may be needed.

### Option B: UNIQUE NULLS NOT DISTINCT on (slug,parent_id)
Pros: compact rule.
Cons: compatibility confidence needed.

### Option C: generated key normalization
Pros: portable.
Cons: complexity.

### Recommended
A.

---

## 12) Slug format not guaranteed LTREE-safe
### Option A: CHECK regex for LTREE-safe labels
Pros: strong data hygiene.
Cons: migration cleanup required.

### Option B: trigger slug sanitizer
Pros: user-friendly.
Cons: implicit behavior.

### Option C: app-only validation
Pros: easy.
Cons: weak.

### Recommended
A + explicit app normalization.

---

## 13) Role-specific tables not constrained by role
### Option A: role-alignment triggers
Pros: hard integrity.
Cons: trigger complexity.

### Option B: normalized role membership tables
Pros: explicit and scalable.
Cons: model refactor.

### Option C: app-only checks
Pros: quick.
Cons: unsafe.

### Recommended
A.

---

## 14) Store owner not constrained to merchant role
### Option A: owner-role trigger guard
Pros: direct fix.
Cons: minor maintenance.

### Option B: dedicated store_owners model
Pros: explicit governance.
Cons: additional complexity.

### Option C: app-only
Pros: easy.
Cons: weak.

### Recommended
A.

---

## 15) No formula constraints for totals
### Option A: check invariants at row level (line_total=unit_price*quantity)
Pros: strong integrity.
Cons: numeric precision handling.

### Option B: generated columns or transactional recompute function
Pros: less drift.
Cons: model rigidity.

### Option C: app-only formulas
Pros: simple.
Cons: unsafe.

### Recommended
A for order_items + transactional recompute for order totals.

---

## 16) Missing non-negative constraints
### Option A: CHECK >=0 on key numeric fields
Pros: low-risk, high-value.
Cons: requires cleanup of bad existing rows.

### Option B: domain types for non-negative values
Pros: reusable.
Cons: migration complexity.

### Option C: app-only
Pros: fast.
Cons: weak.

### Recommended
A.

---

## 17) Multiple primary barcodes possible
### Option A: partial unique index on (global_product_id) WHERE is_primary=true
Pros: standard fix.
Cons: cleanup may be needed.

### Option B: trigger auto-demotes prior primary
Pros: UX friendly.
Cons: hidden side-effects.

### Option C: remove primary concept
Pros: simpler model.
Cons: product ops ambiguity.

### Recommended
A (+ optional B).

---

## 18) Orders can be placed for non-orderable stores
### Option A: RLS WITH CHECK store status/hours/eligibility baseline
Pros: DB-level defense.
Cons: complex predicates.

### Option B: checkout RPC with full business validation
Pros: robust and testable.
Cons: effort.

### Option C: app-only
Pros: quick.
Cons: unsafe.

### DuckDB angle
Can provide recommendation/ranking, not authoritative orderability.

### Recommended
B + A baseline.

---

## 19) SECURITY DEFINER functions not search_path-hardened
### Option A: set explicit search_path in function definitions
Pros: security best practice.
Cons: minimal migration work only.

### Option B: convert to SECURITY INVOKER where possible
Pros: reduced privilege surface.
Cons: may alter behavior.

### Option C: no change
Pros: no effort.
Cons: residual risk.

### Recommended
A.

---

## 20) Type assumptions may mismatch nullable view outputs
### Option A: auto-generate types from schema in CI
Pros: strongest drift control.
Cons: pipeline setup needed.

### Option B: runtime validation in DAL boundaries
Pros: safer runtime behavior.
Cons: manual overhead.

### Option C: force not-null via stronger DB constraints
Pros: cleaner type contracts.
Cons: may require schema redesign.

### Recommended
A + targeted B.

---

## Metafields Implementation Options (Across the Board)

## Option A: JSONB-in-row only (current-style)
Pros:
- Minimal schema additions
- Fast initial rollout
Cons:
- Hard to govern field definitions
- Inconsistent validation and indexing strategy

## Option B: Central metafield registry + entity_metafields table (recommended)
Pros:
- Strong governance for flexible schema
- Per-field validation and lifecycle
- Easier indexing strategy
Cons:
- Added table joins
- Requires policy and tooling

## Option C: Hybrid: registry + selected promoted columns/materialized projections
Pros:
- Balanced flexibility and performance
- Hot keys can be indexed strongly
Cons:
- Requires observability to know what to promote

### Recommended
Start with B, evolve to C as query patterns stabilize.

---

## DuckDB Deployment Options

## Option A: BI-only sidecar (daily snapshot)
Pros:
- Simple and safe
Cons:
- Stale by up to snapshot interval

## Option B: Near-real-time CDC into DuckDB/parquet marts
Pros:
- Fresh analytics and faceting
Cons:
- Pipeline complexity and ops burden

## Option C: Dual-write transactional path to DuckDB
Pros:
- Unified query layer illusion
Cons:
- High consistency risk, not recommended

### Recommended
A initially, then B if product needs near-real-time analytical serving.

---

## Risks Introduced by Metafields + DuckDB (and Mitigations)

1. Governance sprawl (everyone adds keys).
Mitigation: approval workflow in metafield_definitions and ownership by domain.

2. Query unpredictability/perf regressions.
Mitigation: index policy for popular keys; promote hot keys to relational columns/materialized projections.

3. Semantic drift across teams.
Mitigation: namespace conventions, schema docs, contract tests.

4. Data freshness gaps in DuckDB.
Mitigation: freshness SLOs and fallback to Postgres for critical reads.

5. Security mismatch between Postgres RLS and analytics copies.
Mitigation: restrict DuckDB exposure to trusted backend services; enforce tenant filters in serving layer.

---

## Revised Rollout Plan

## Phase 1: Safety and correctness first
1. Fix uniqueness bug in store_products.
2. Add non-negative and arithmetic constraints.
3. Add review/order integrity guards.
4. Add order transition + immutability hardening.
5. Harden SECURITY DEFINER search_path.

## Phase 2: Flexible schema foundation
1. Introduce metafield_definitions and entity_metafields.
2. Add RLS/ownership checks for metafields.
3. Migrate non-critical flexible attributes from scattered JSONB into governed metafields where beneficial.

## Phase 3: DuckDB analytics sidecar
1. Build Postgres -> parquet snapshot pipeline.
2. Model DuckDB marts for catalog/search analytics and merchant BI.
3. Add monitoring for freshness, row-count parity, and anomaly checks.

## Phase 4: Performance tuning and standardization
1. Promote hot metafields to indexed relational projections.
2. Add CI for type generation and policy regression tests.
3. Define architecture decision records for when data belongs in core schema vs metafields.

---

## Final Recommendation
Use a hybrid strategy:
- Strict relational core for transactional correctness and authorization.
- Governed metafields for adaptability.
- DuckDB for analytical acceleration and derived read models.

This gives you maximum flexibility without sacrificing data integrity, security, or checkout correctness.
