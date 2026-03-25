# Final Implementation Plan (Amended and Execution-Ready)

## Objective
Implement a safe, adaptable, and production-ready data architecture by:
1. Preserving strict transactional guarantees in Supabase/Postgres.
2. Introducing governed metafields for flexible business attributes.
3. Adding DuckDB as a read-only analytics sidecar.
4. Closing all high-impact integrity, authorization, and lifecycle failure modes.

## Plan Review Findings and Amendments
This amended plan resolves issues found in the prior version:
1. Metafields integrity gap: polymorphic entity_type/entity_id without true FK guarantees.
2. Enforceability gap: soft-delete policy needed hard DB controls, not convention only.
3. Role source ambiguity: JWT role and profiles.role needed a single canonical source.
4. Stage ordering risk: reliability gates were too late in the plan.
5. DuckDB governance gap: tenant isolation and freshness controls needed explicit controls.

## Final Architecture Decisions (Locked)

## Decision 1: System of Record
- Postgres remains the sole transactional write authority.
- DuckDB is read-only and non-authoritative.

## Decision 2: Canonical Identity and Role Source
- `profiles.role` is canonical for DB authorization logic.
- JWT role claims are derived/synced and treated as cached identity hints.

## Decision 3: Metafields Model
- Use a governed model with:
  1. Global `metafield_definitions` registry.
  2. Entity-scoped value tables with real FKs (not a single polymorphic table for all entities).
- Rationale: preserves relational integrity, simplifies RLS, and reduces orphan risk.

## Decision 4: Global Product Lifecycle
- Global products are soft-deleted (`is_active=false`) by default.
- Hard deletes are DB-restricted unless a controlled admin procedure is used.

## Decision 5: Order Correctness
- Checkout and order-item creation happen through controlled transactional functions.
- Status transitions are validated by DB trigger state machine.

## Decision 6: DuckDB Scope
- DuckDB serves BI, analytics, and heavy faceting/search acceleration.
- It never decides authorization and never becomes the write path.

---

## Locked Solutions for the 20 Failure Modes

1. Custom products uniqueness bug:
- Replace current uniqueness behavior with partial unique index on `(store_id, global_product_id)` where `global_product_id IS NOT NULL`.

2. Orphaning from global product delete:
- Enforce soft-delete by default and restrict hard-delete at DB level.

3. Review target mismatch:
- Add DB trigger validation linking review targets to real order participants/items.
- Tighten RLS predicates for insert checks.

4. Post-placement order_items insertion:
- Remove direct customer insert path for `order_items`.
- Route through checkout transaction function only.

5. Incomplete terminal immutability:
- Implement status-based mutable allowlist for order columns.

6. Missing order transition state machine:
- Add transition-graph validation trigger.
- Add explicit transition RPC endpoints in app layer.

7. Role drift (JWT vs profiles):
- DB reads and policies rely on `profiles.role`.
- Add reconciliation process for JWT claim freshness.

8. Cross-customer default address risk:
- Add trigger ensuring `customers.default_address_id` belongs to that customer.

9. Category path stale descendants:
- Introduce controlled category mutation procedure that rebuilds descendant paths.

10. Category cycles:
- Add cycle-prevention trigger on parent change.

11. Duplicate root slugs:
- Add partial unique index for root-level slugs (`parent_id IS NULL`).

12. LTREE-unsafe slug format:
- Add CHECK constraint for ltree-safe slug format.

13. Role-agnostic inserts into riders/customers/merchants:
- Add role-alignment triggers for identity-linked inserts/updates.

14. Store owner role not enforced:
- Add owner-role trigger guard (merchant/sysadmin policy).

15. Formula consistency for totals:
- Enforce `order_items.line_total` invariant.
- Centralize order total recompute in transactional function.

16. Negative values allowed:
- Add non-negative CHECK constraints for stock and monetary fields.

17. Multiple primary barcodes:
- Add partial unique index for one primary barcode per global product.

18. Non-orderable store checkout:
- Validate orderability in checkout transaction function.
- Add baseline DB policy guard for store status.

19. SECURITY DEFINER hardening:
- Set explicit `search_path` on all SECURITY DEFINER helpers.

20. Type drift/nullability mismatch:
- Add CI type generation from DB schema.
- Add runtime boundary validation for critical DAL outputs.

---

## Metafields Implementation (Amended)

## Data Model (Chosen)
1. `metafield_definitions`:
- `id`, `entity_type`, `namespace`, `key`, `value_type`, `validation_json`, `is_indexed`, `status`, `owner_team`, timestamps.

2. Entity-scoped value tables (initially):
- `product_metafields` with FK to `store_products`.
- `store_metafields` with FK to `stores`.
- `category_metafields` with FK to `categories`.

3. Shared invariants:
- Unique `(entity_id, namespace, key)` per table.
- Validation trigger enforcing type and definition constraints.

## Why this over one polymorphic value table
- Real FK guarantees and cascade behavior.
- Cleaner tenant-aware RLS.
- Less chance of orphaned or mismatched entity references.

## Governance Rules
1. Namespace required.
2. Definition required for shared/production keys.
3. Promotion path for hot keys to indexed relational projections.

## Strict vs Flexible Boundary (Locked)
Never in metafields:
- Identity links, role assignments, order status, payment status, monetary truth fields, stock source-of-truth.

Allowed in metafields:
- Product/store/category descriptive and experimental attributes.

---

## DuckDB Implementation (Amended)

## Phase 1 (Chosen)
- Scheduled snapshot export to parquet.
- Build BI and faceting marts only.

## Phase 2 (Conditional)
- Upgrade to CDC if freshness SLO is not met.

## Mandatory Controls
1. Freshness SLO and alerting.
2. Row-count and checksum parity checks against Postgres source slices.
3. Tenant-isolation filters in serving layer.
4. PII minimization in marts by default.

## Serving Policy
- Postgres is authoritative for transactional/API correctness.
- DuckDB-backed results are allowed for analytics and non-authoritative discovery views.
- On mismatch, serve Postgres and raise an alert.

---

## Execution Plan (Reordered with Quality Gates)

## Stage 0: Pre-flight and Test Harness (Gate 0)
1. Backup and migration rehearsal in staging clone.
2. Baseline data audits (duplicates, negatives, slug validity, total mismatches, review linkage anomalies).
3. Add migration and invariant test harness before schema changes.
4. Define rollback SQL scripts skeleton for each migration set.

Gate 0 exit criteria:
- All baseline audits completed.
- Failing rows cataloged with remediation scripts prepared.

## Stage 1: Immediate Integrity Fixes (Gate 1)
1. Fix `store_products` uniqueness behavior.
2. Add non-negative constraints.
3. Add primary barcode uniqueness.
4. Add root slug uniqueness and ltree-safe slug checks.
5. Harden SECURITY DEFINER function `search_path`.

Gate 1 exit criteria:
- No new migration-time lock incidents in rehearsal.
- Constraints validated with no production-blocking dirty data.

## Stage 2: Lifecycle and Authorization Hardening (Gate 2)
1. Add order transition trigger.
2. Implement immutable allowlist by status.
3. Lock `order_items` creation to checkout transaction function.
4. Add review-target validation and RLS tightening.
5. Add role-alignment and owner-role triggers.
6. Add default address ownership guard.
7. Enforce soft-delete/hard-delete restriction for global products.

Gate 2 exit criteria:
- Transition and immutability tests pass.
- Authorization tests pass for all actor roles.

## Stage 3: Category Integrity (Gate 3)
1. Add cycle-prevention trigger.
2. Add category mutation procedure with descendant path rebuild.
3. Route all category writes through procedure path.

Gate 3 exit criteria:
- Tree integrity tests pass for reparent and rename scenarios.

## Stage 4: Metafields Foundation (Gate 4)
1. Create `metafield_definitions`.
2. Create entity-scoped metafield tables with FKs.
3. Add validation triggers and RLS.
4. Integrate DAL helper methods.
5. Add first promoted indexed projections for known hot keys.

Gate 4 exit criteria:
- Metafield writes validated by definition/type rules.
- RLS ownership tests pass for each entity type.

## Stage 5: DuckDB Sidecar (Gate 5)
1. Build Postgres -> parquet snapshot pipeline.
2. Build BI/faceting marts.
3. Add freshness/parity monitoring.
4. Add optional read-routing only for approved non-authoritative endpoints.

Gate 5 exit criteria:
- Freshness and parity SLOs stable.
- Fallback to Postgres verified.

## Stage 6: Drift and Reliability Controls (Gate 6)
1. CI type generation and schema drift gate.
2. RLS regression tests by actor role.
3. Invariant tests for triggers/constraints.
4. Runbooks for incident handling and rollback.

Gate 6 exit criteria:
- CI blocks schema/type drift.
- On-call runbook drill completed.

---

## Acceptance Criteria (Implementation Sign-off)

## Data Integrity
1. Negative stock/money inserts fail.
2. Invalid order transitions fail.
3. `order_items` cannot be inserted outside checkout flow.
4. Reviews cannot reference unrelated participants/items.

## Authorization
1. Role alignment enforced in identity-linked tables.
2. Owner/profile mismatch writes fail.
3. RLS matrix passes for customer/merchant/rider/sysadmin.

## Catalog Correctness
1. Multiple custom products per store are supported.
2. Hard-delete orphaning path for global products is blocked.
3. Category path consistency is preserved after move/rename.

## Adaptability
1. New flexible attributes can be added through definitions without table migration.
2. Hot attributes can be promoted with documented process.

## Analytics
1. DuckDB mart freshness meets agreed SLO.
2. Parity checks detect drift; fallback behavior works.

---

## Risks and Mitigations
1. Migration lock/contention risk:
- Mitigation: stage rehearsal, low-traffic windows, online-safe index strategy.

2. Trigger complexity risk:
- Mitigation: invariant tests and strict trigger ownership docs.

3. Metafield governance drift:
- Mitigation: definition approval workflow and namespace ownership.

4. DuckDB freshness/consistency risk:
- Mitigation: monitoring, alerting, and authoritative fallback to Postgres.

5. Implementation drift across teams:
- Mitigation: PR checklist, gate-based rollout, architecture guardrails.

---

## Scope Boundaries

## In Scope
1. Migrations, constraints, triggers, RLS, checkout/order RPCs.
2. Governed metafields schema and DAL integration.
3. DuckDB snapshot pipeline and marts.

## Out of Scope (First Rollout)
1. Full event-sourced order redesign.
2. Splitting `store_products` into separate physical tables.
3. External authorization system replacing RLS.

---

## Rollout and Rollback

## Rollout
1. Feature-flag behavior changes.
2. Apply migration sets stage-by-stage with gate checks.
3. Enable DuckDB read usage only after parity SLO is green.

## Rollback
1. Reversible SQL for each stage where technically possible.
2. Snapshot restore path documented before execution.
3. Automatic read fallback to Postgres if DuckDB anomalies detected.

---

## Final Go-Forward Statement
We will implement a hybrid architecture: strict transactional Postgres core, governed entity-scoped metafields, and a read-only DuckDB analytics sidecar. This amended plan removes identified ambiguity and enforceability gaps, and is the implementation baseline going forward.
