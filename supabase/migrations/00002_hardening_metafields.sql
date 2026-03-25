-- ============================================================================
-- LOOTMART — HARDENING + METAFIELDS FOUNDATION
-- ============================================================================
-- Goals:
-- 1) Close critical integrity/authorization gaps
-- 2) Enforce safer order lifecycle rules
-- 3) Introduce governed metafields foundation
-- 4) Keep Postgres as transactional source of truth
-- ============================================================================

-- --------------------------------------------------------------------------
-- 0) PREP
-- --------------------------------------------------------------------------

SET lock_timeout = '10s';
SET statement_timeout = '0';

-- --------------------------------------------------------------------------
-- 0.1) PREFLIGHT DATA QUALITY CHECKS (FAIL FAST WITH ACTIONABLE ERRORS)
-- --------------------------------------------------------------------------

DO $$
DECLARE
    bad_count BIGINT;
BEGIN
    -- Duplicate imported products would block partial unique index creation.
    SELECT COUNT(*) INTO bad_count
    FROM (
        SELECT store_id, global_product_id
        FROM store_products
        WHERE global_product_id IS NOT NULL
        GROUP BY store_id, global_product_id
        HAVING COUNT(*) > 1
    ) d;

    IF bad_count > 0 THEN
        RAISE EXCEPTION
            'Preflight failed: % duplicate (store_id, global_product_id) pairs found in store_products where global_product_id IS NOT NULL. Resolve duplicates before running migration.',
            bad_count;
    END IF;

    -- Root slug duplicates would block root-level unique index.
    SELECT COUNT(*) INTO bad_count
    FROM (
        SELECT slug
        FROM categories
        WHERE parent_id IS NULL
        GROUP BY slug
        HAVING COUNT(*) > 1
    ) d;

    IF bad_count > 0 THEN
        RAISE EXCEPTION
            'Preflight failed: % duplicate root category slugs found. Resolve duplicates before running migration.',
            bad_count;
    END IF;

    -- Existing invalid slugs would block ltree-safe CHECK.
    SELECT COUNT(*) INTO bad_count
    FROM categories
    WHERE slug !~ '^[A-Za-z_][A-Za-z0-9_]*$';

    IF bad_count > 0 THEN
        RAISE EXCEPTION
            'Preflight failed: % category slugs are not ltree-safe. Resolve invalid slugs before running migration.',
            bad_count;
    END IF;
END;
$$;

-- --------------------------------------------------------------------------
-- 1) STORE PRODUCTS UNIQUENESS FIX
-- --------------------------------------------------------------------------
-- Existing unique NULLS NOT DISTINCT blocks multiple custom products per store.
-- Replace with partial uniqueness for imported global products only.

ALTER TABLE store_products
    DROP CONSTRAINT IF EXISTS uq_store_global_product;

CREATE UNIQUE INDEX IF NOT EXISTS ux_store_products_store_global_nonnull
    ON store_products (store_id, global_product_id)
    WHERE global_product_id IS NOT NULL;

-- --------------------------------------------------------------------------
-- 2) GLOBAL PRODUCT DELETE SAFETY (SOFT-DELETE ENFORCEMENT)
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_block_global_product_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Hard delete blocked for global_products. Use is_active=false to archive.';
END;
$$;

DROP TRIGGER IF EXISTS trg_block_global_product_hard_delete ON global_products;
CREATE TRIGGER trg_block_global_product_hard_delete
    BEFORE DELETE ON global_products
    FOR EACH ROW
    EXECUTE FUNCTION fn_block_global_product_hard_delete();

-- --------------------------------------------------------------------------
-- 3) CATEGORY INTEGRITY: ROOT SLUG UNIQUENESS + LTREE-SAFE SLUG
-- --------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS ux_categories_root_slug
    ON categories (slug)
    WHERE parent_id IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_categories_slug_ltree_safe'
          AND conrelid = 'categories'::regclass
    ) THEN
        ALTER TABLE categories
            ADD CONSTRAINT ck_categories_slug_ltree_safe
            CHECK (slug ~ '^[A-Za-z_][A-Za-z0-9_]*$');
    END IF;
END;
$$;

-- Prevent cycles in category hierarchy.
CREATE OR REPLACE FUNCTION fn_categories_prevent_cycles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    cycle_found BOOLEAN;
BEGIN
    IF NEW.parent_id IS NULL OR NEW.id IS NULL THEN
        RETURN NEW;
    END IF;

    WITH RECURSIVE ancestors AS (
        SELECT c.id, c.parent_id
        FROM categories c
        WHERE c.id = NEW.parent_id
        UNION ALL
        SELECT p.id, p.parent_id
        FROM categories p
        JOIN ancestors a ON p.id = a.parent_id
    )
    SELECT EXISTS(SELECT 1 FROM ancestors WHERE id = NEW.id) INTO cycle_found;

    IF cycle_found THEN
        RAISE EXCEPTION 'Category cycle detected for category_id %', NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_categories_prevent_cycles ON categories;
CREATE TRIGGER trg_categories_prevent_cycles
    BEFORE UPDATE OF parent_id ON categories
    FOR EACH ROW
    EXECUTE FUNCTION fn_categories_prevent_cycles();

-- Rebuild descendant paths after parent/slug changes on a node.
CREATE OR REPLACE FUNCTION fn_categories_rebuild_descendant_paths()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If path did not change, no descendant updates needed.
    IF NEW.path IS NOT DISTINCT FROM OLD.path THEN
        RETURN NEW;
    END IF;

    UPDATE categories c
       SET path = NEW.path || subpath(c.path, nlevel(OLD.path)),
           depth = nlevel(NEW.path || subpath(c.path, nlevel(OLD.path))) - 1,
           updated_at = now()
     WHERE c.id <> NEW.id
       AND c.path <@ OLD.path;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_categories_rebuild_descendants ON categories;
CREATE TRIGGER trg_categories_rebuild_descendants
    AFTER UPDATE OF parent_id, slug ON categories
    FOR EACH ROW
    EXECUTE FUNCTION fn_categories_rebuild_descendant_paths();

-- --------------------------------------------------------------------------
-- 4) ROLE SOURCE OF TRUTH + SECURITY DEFINER HARDENING
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()),
        'customer'::user_role
    );
$$;

CREATE OR REPLACE FUNCTION public.merchant_store_ids()
RETURNS SETOF BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT m.store_id
    FROM public.merchants m
    WHERE m.profile_id = auth.uid()
      AND m.is_active = TRUE;
$$;

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT c.id
    FROM public.customers c
    WHERE c.profile_id = auth.uid();
$$;

-- --------------------------------------------------------------------------
-- 5) ROLE-ALIGNMENT GUARDS FOR IDENTITY-LINKED TABLES
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_enforce_profile_role_alignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    actual_role user_role;
BEGIN
    IF TG_TABLE_NAME = 'stores' THEN
        SELECT role INTO actual_role FROM profiles WHERE id = NEW.owner_id;
        IF actual_role IS NULL OR actual_role NOT IN ('merchant', 'sysadmin') THEN
            RAISE EXCEPTION 'stores.owner_id must reference a merchant or sysadmin profile';
        END IF;
        RETURN NEW;
    END IF;

    IF TG_TABLE_NAME = 'merchants' THEN
        SELECT role INTO actual_role FROM profiles WHERE id = NEW.profile_id;
        IF actual_role IS NULL OR actual_role NOT IN ('merchant', 'sysadmin') THEN
            RAISE EXCEPTION 'merchants.profile_id must reference merchant/sysadmin profile';
        END IF;
        RETURN NEW;
    END IF;

    IF TG_TABLE_NAME = 'riders' THEN
        SELECT role INTO actual_role FROM profiles WHERE id = NEW.profile_id;
        IF actual_role IS NULL OR actual_role <> 'rider' THEN
            RAISE EXCEPTION 'riders.profile_id must reference rider profile';
        END IF;
        RETURN NEW;
    END IF;

    IF TG_TABLE_NAME = 'customers' THEN
        SELECT role INTO actual_role FROM profiles WHERE id = NEW.profile_id;
        IF actual_role IS NULL OR actual_role <> 'customer' THEN
            RAISE EXCEPTION 'customers.profile_id must reference customer profile';
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stores_owner_role_alignment ON stores;
CREATE TRIGGER trg_stores_owner_role_alignment
    BEFORE INSERT OR UPDATE OF owner_id ON stores
    FOR EACH ROW
    EXECUTE FUNCTION fn_enforce_profile_role_alignment();

DROP TRIGGER IF EXISTS trg_merchants_role_alignment ON merchants;
CREATE TRIGGER trg_merchants_role_alignment
    BEFORE INSERT OR UPDATE OF profile_id ON merchants
    FOR EACH ROW
    EXECUTE FUNCTION fn_enforce_profile_role_alignment();

DROP TRIGGER IF EXISTS trg_riders_role_alignment ON riders;
CREATE TRIGGER trg_riders_role_alignment
    BEFORE INSERT OR UPDATE OF profile_id ON riders
    FOR EACH ROW
    EXECUTE FUNCTION fn_enforce_profile_role_alignment();

DROP TRIGGER IF EXISTS trg_customers_role_alignment ON customers;
CREATE TRIGGER trg_customers_role_alignment
    BEFORE INSERT OR UPDATE OF profile_id ON customers
    FOR EACH ROW
    EXECUTE FUNCTION fn_enforce_profile_role_alignment();

-- --------------------------------------------------------------------------
-- 6) CUSTOMERS DEFAULT ADDRESS OWNERSHIP GUARD
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_validate_customer_default_address()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    addr_customer_id BIGINT;
BEGIN
    IF NEW.default_address_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT customer_id INTO addr_customer_id
    FROM customer_addresses
    WHERE id = NEW.default_address_id;

    IF addr_customer_id IS NULL THEN
        RAISE EXCEPTION 'default_address_id % does not exist', NEW.default_address_id;
    END IF;

    IF addr_customer_id <> NEW.id THEN
        RAISE EXCEPTION 'default_address_id % does not belong to customer %', NEW.default_address_id, NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_default_address_guard ON customers;
CREATE TRIGGER trg_customers_default_address_guard
    BEFORE INSERT OR UPDATE OF default_address_id ON customers
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_customer_default_address();

-- --------------------------------------------------------------------------
-- 7) MONEY/STOCK SAFETY + FORMULA INVARIANTS
-- --------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_store_products_stock_non_negative'
          AND conrelid = 'store_products'::regclass
    ) THEN
        ALTER TABLE store_products
            ADD CONSTRAINT ck_store_products_stock_non_negative
            CHECK (stock_quantity >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_store_products_price_non_negative'
          AND conrelid = 'store_products'::regclass
    ) THEN
        ALTER TABLE store_products
            ADD CONSTRAINT ck_store_products_price_non_negative
            CHECK (
                (price_override IS NULL OR price_override >= 0) AND
                (old_price_override IS NULL OR old_price_override >= 0) AND
                (custom_price IS NULL OR custom_price >= 0) AND
                (custom_old_price IS NULL OR custom_old_price >= 0)
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_global_products_price_non_negative'
          AND conrelid = 'global_products'::regclass
    ) THEN
        ALTER TABLE global_products
            ADD CONSTRAINT ck_global_products_price_non_negative
            CHECK (
                base_price >= 0 AND
                (weight_value IS NULL OR weight_value >= 0)
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_orders_money_non_negative'
          AND conrelid = 'orders'::regclass
    ) THEN
        ALTER TABLE orders
            ADD CONSTRAINT ck_orders_money_non_negative
            CHECK (
                subtotal >= 0 AND
                delivery_fee >= 0 AND
                discount >= 0 AND
                tax >= 0 AND
                total >= 0
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_orders_discount_bound'
          AND conrelid = 'orders'::regclass
    ) THEN
        ALTER TABLE orders
            ADD CONSTRAINT ck_orders_discount_bound
            CHECK (discount <= subtotal + delivery_fee + tax);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_order_items_money_non_negative'
          AND conrelid = 'order_items'::regclass
    ) THEN
        ALTER TABLE order_items
            ADD CONSTRAINT ck_order_items_money_non_negative
            CHECK (unit_price >= 0 AND line_total >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_order_items_line_total_match'
          AND conrelid = 'order_items'::regclass
    ) THEN
        ALTER TABLE order_items
            ADD CONSTRAINT ck_order_items_line_total_match
            CHECK (line_total = round(unit_price * quantity, 2));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ck_stores_money_non_negative'
          AND conrelid = 'stores'::regclass
    ) THEN
        ALTER TABLE stores
            ADD CONSTRAINT ck_stores_money_non_negative
            CHECK (
                delivery_charges >= 0 AND
                min_order_value >= 0 AND
                free_delivery_threshold >= 0
            );
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION fn_orders_recompute_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.total := round((NEW.subtotal + NEW.delivery_fee + NEW.tax - NEW.discount), 2);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_recompute_total ON orders;
CREATE TRIGGER trg_orders_recompute_total
    BEFORE INSERT OR UPDATE OF subtotal, delivery_fee, discount, tax ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_orders_recompute_total();

-- --------------------------------------------------------------------------
-- 8) ORDER LIFECYCLE HARDENING
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_validate_order_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- No change in status is always fine.
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    IF OLD.status = 'pending' AND NEW.status IN ('confirmed', 'cancelled') THEN
        RETURN NEW;
    ELSIF OLD.status = 'confirmed' AND NEW.status IN ('preparing', 'cancelled') THEN
        RETURN NEW;
    ELSIF OLD.status = 'preparing' AND NEW.status IN ('ready_for_pickup', 'cancelled') THEN
        RETURN NEW;
    ELSIF OLD.status = 'ready_for_pickup' AND NEW.status IN ('picked_up', 'cancelled') THEN
        RETURN NEW;
    ELSIF OLD.status = 'picked_up' AND NEW.status IN ('in_transit', 'cancelled') THEN
        RETURN NEW;
    ELSIF OLD.status = 'in_transit' AND NEW.status IN ('delivered', 'cancelled') THEN
        RETURN NEW;
    ELSIF OLD.status IN ('delivered', 'cancelled') AND NEW.status = 'refunded' THEN
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'Invalid order status transition: % -> % (order_id: %)', OLD.status, NEW.status, OLD.id;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_validate_transition ON orders;
CREATE TRIGGER trg_orders_validate_transition
    BEFORE UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_order_transition();

CREATE OR REPLACE FUNCTION fn_guard_order_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IN ('delivered', 'cancelled', 'refunded') THEN
        -- Allowed changes on terminal orders: status to refunded, payment_status, updated_at
        IF NEW.status <> OLD.status AND NEW.status <> 'refunded' THEN
            RAISE EXCEPTION 'Cannot modify terminal order status: % (order_id: %)', OLD.status, OLD.id;
        END IF;

        IF NEW.customer_id <> OLD.customer_id
           OR NEW.store_id <> OLD.store_id
           OR NEW.rider_id IS DISTINCT FROM OLD.rider_id
           OR NEW.status_history IS DISTINCT FROM OLD.status_history
           OR NEW.delivery_address IS DISTINCT FROM OLD.delivery_address
           OR NEW.delivery_lat IS DISTINCT FROM OLD.delivery_lat
           OR NEW.delivery_lng IS DISTINCT FROM OLD.delivery_lng
           OR NEW.store_name_snapshot IS DISTINCT FROM OLD.store_name_snapshot
           OR NEW.subtotal <> OLD.subtotal
           OR NEW.delivery_fee <> OLD.delivery_fee
           OR NEW.discount <> OLD.discount
           OR NEW.tax <> OLD.tax
           OR NEW.total <> OLD.total
           OR NEW.payment_method <> OLD.payment_method
           OR NEW.placed_at <> OLD.placed_at
           OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at
           OR NEW.picked_up_at IS DISTINCT FROM OLD.picked_up_at
           OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at
           OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
           OR NEW.rider_name_snapshot IS DISTINCT FROM OLD.rider_name_snapshot
           OR NEW.rider_phone_snapshot IS DISTINCT FROM OLD.rider_phone_snapshot
           OR NEW.order_number <> OLD.order_number
           OR NEW.created_at <> OLD.created_at THEN
            RAISE EXCEPTION 'Terminal order fields are immutable (order_id: %)', OLD.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_immutability ON orders;
CREATE TRIGGER trg_orders_immutability
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_guard_order_immutability();

-- Keep existing order_items immutability behavior for updates.
CREATE OR REPLACE FUNCTION fn_guard_order_items_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Order items are immutable and cannot be modified after creation';
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_immutability ON order_items;
CREATE TRIGGER trg_order_items_immutability
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION fn_guard_order_items_immutability();

-- --------------------------------------------------------------------------
-- 9) REVIEW TARGET VALIDATION
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_validate_store_review_target()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    o_store_id BIGINT;
    o_customer_id BIGINT;
BEGIN
    SELECT store_id, customer_id INTO o_store_id, o_customer_id
    FROM orders
    WHERE id = NEW.order_id;

    IF o_store_id IS NULL THEN
        RAISE EXCEPTION 'Invalid order_id % for store review', NEW.order_id;
    END IF;

    IF NEW.store_id <> o_store_id THEN
        RAISE EXCEPTION 'store_reviews.store_id must match orders.store_id';
    END IF;

    IF NEW.customer_id <> o_customer_id THEN
        RAISE EXCEPTION 'store_reviews.customer_id must match orders.customer_id';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_validate_rider_review_target()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    o_rider_id BIGINT;
    o_customer_id BIGINT;
BEGIN
    SELECT rider_id, customer_id INTO o_rider_id, o_customer_id
    FROM orders
    WHERE id = NEW.order_id;

    IF o_customer_id IS NULL THEN
        RAISE EXCEPTION 'Invalid order_id % for rider review', NEW.order_id;
    END IF;

    IF o_rider_id IS NULL THEN
        RAISE EXCEPTION 'Order % has no assigned rider for rider review', NEW.order_id;
    END IF;

    IF NEW.rider_id <> o_rider_id THEN
        RAISE EXCEPTION 'rider_reviews.rider_id must match orders.rider_id';
    END IF;

    IF NEW.customer_id <> o_customer_id THEN
        RAISE EXCEPTION 'rider_reviews.customer_id must match orders.customer_id';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_validate_product_review_target()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    o_customer_id BIGINT;
    in_order BOOLEAN;
BEGIN
    SELECT customer_id INTO o_customer_id
    FROM orders
    WHERE id = NEW.order_id;

    IF o_customer_id IS NULL THEN
        RAISE EXCEPTION 'Invalid order_id % for product review', NEW.order_id;
    END IF;

    IF NEW.customer_id <> o_customer_id THEN
        RAISE EXCEPTION 'product_reviews.customer_id must match orders.customer_id';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM order_items oi
        WHERE oi.order_id = NEW.order_id
          AND oi.store_product_id = NEW.store_product_id
    ) INTO in_order;

    IF NOT in_order THEN
        RAISE EXCEPTION 'store_product_id % was not part of order %', NEW.store_product_id, NEW.order_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_store_review_target ON store_reviews;
CREATE TRIGGER trg_validate_store_review_target
    BEFORE INSERT OR UPDATE ON store_reviews
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_store_review_target();

DROP TRIGGER IF EXISTS trg_validate_rider_review_target ON rider_reviews;
CREATE TRIGGER trg_validate_rider_review_target
    BEFORE INSERT OR UPDATE ON rider_reviews
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_rider_review_target();

DROP TRIGGER IF EXISTS trg_validate_product_review_target ON product_reviews;
CREATE TRIGGER trg_validate_product_review_target
    BEFORE INSERT OR UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_product_review_target();

-- --------------------------------------------------------------------------
-- 10) BARCODE PRIMARY UNIQUENESS
-- --------------------------------------------------------------------------

-- Normalize historical data so index creation is deterministic:
-- keep only the oldest primary barcode per global_product_id.
WITH ranked AS (
    SELECT
        id,
        global_product_id,
        ROW_NUMBER() OVER (PARTITION BY global_product_id ORDER BY id) AS rn
    FROM product_barcodes
    WHERE is_primary = TRUE
)
UPDATE product_barcodes pb
   SET is_primary = FALSE
  FROM ranked r
 WHERE pb.id = r.id
   AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_barcodes_single_primary
    ON product_barcodes (global_product_id)
    WHERE is_primary = TRUE;

-- --------------------------------------------------------------------------
-- 11) RLS HARDENING FOR ORDERS / ORDER_ITEMS / REVIEWS
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS orders_insert_customer ON orders;
CREATE POLICY orders_insert_customer ON orders
    FOR INSERT WITH CHECK (
        customer_id = current_customer_id()
        AND store_id IN (SELECT id FROM stores WHERE status = 'active')
    );

DROP POLICY IF EXISTS oi_insert_customer ON order_items;
CREATE POLICY oi_insert_customer ON order_items
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM orders
            WHERE customer_id = current_customer_id()
              AND status = 'pending'
        )
    );

DROP POLICY IF EXISTS store_reviews_insert ON store_reviews;
CREATE POLICY store_reviews_insert ON store_reviews
    FOR INSERT WITH CHECK (
        customer_id = current_customer_id()
        AND order_id IN (
            SELECT id FROM orders
            WHERE customer_id = current_customer_id()
              AND status = 'delivered'
        )
    );

DROP POLICY IF EXISTS rider_reviews_insert ON rider_reviews;
CREATE POLICY rider_reviews_insert ON rider_reviews
    FOR INSERT WITH CHECK (
        customer_id = current_customer_id()
        AND order_id IN (
            SELECT id FROM orders
            WHERE customer_id = current_customer_id()
              AND status = 'delivered'
              AND rider_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS product_reviews_insert ON product_reviews;
CREATE POLICY product_reviews_insert ON product_reviews
    FOR INSERT WITH CHECK (
        customer_id = current_customer_id()
        AND order_id IN (
            SELECT id FROM orders
            WHERE customer_id = current_customer_id()
              AND status = 'delivered'
        )
    );

-- --------------------------------------------------------------------------
-- 12) METAFIELDS FOUNDATION (ENTITY-SCOPED WITH REAL FKs)
-- --------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'metafield_entity_type'
    ) THEN
        CREATE TYPE metafield_entity_type AS ENUM ('store_product', 'store', 'category');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'metafield_value_type'
    ) THEN
        CREATE TYPE metafield_value_type AS ENUM ('text', 'number', 'boolean', 'json');
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS metafield_definitions (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entity_type     metafield_entity_type NOT NULL,
    namespace       TEXT                  NOT NULL,
    key             TEXT                  NOT NULL,
    value_type      metafield_value_type  NOT NULL,
    validation_json JSONB                 NOT NULL DEFAULT '{}',
    is_indexed      BOOLEAN               NOT NULL DEFAULT FALSE,
    owner_team      TEXT,
    status          TEXT                  NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ           NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ           NOT NULL DEFAULT now(),
    CONSTRAINT uq_metafield_definition UNIQUE (entity_type, namespace, key)
);

CREATE INDEX IF NOT EXISTS idx_metafield_def_entity ON metafield_definitions(entity_type);
CREATE INDEX IF NOT EXISTS idx_metafield_def_ns_key ON metafield_definitions(namespace, key);

CREATE TABLE IF NOT EXISTS store_product_metafields (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_product_id BIGINT                 NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
    definition_id    BIGINT                 NOT NULL REFERENCES metafield_definitions(id) ON DELETE RESTRICT,
    namespace        TEXT                   NOT NULL,
    key              TEXT                   NOT NULL,
    value_text       TEXT,
    value_num        NUMERIC,
    value_bool       BOOLEAN,
    value_json       JSONB,
    created_at       TIMESTAMPTZ            NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ            NOT NULL DEFAULT now(),
    CONSTRAINT uq_store_product_metafield UNIQUE (store_product_id, namespace, key)
);

CREATE TABLE IF NOT EXISTS store_metafields (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id    BIGINT                 NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    definition_id BIGINT               NOT NULL REFERENCES metafield_definitions(id) ON DELETE RESTRICT,
    namespace   TEXT                   NOT NULL,
    key         TEXT                   NOT NULL,
    value_text  TEXT,
    value_num   NUMERIC,
    value_bool  BOOLEAN,
    value_json  JSONB,
    created_at  TIMESTAMPTZ            NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ            NOT NULL DEFAULT now(),
    CONSTRAINT uq_store_metafield UNIQUE (store_id, namespace, key)
);

CREATE TABLE IF NOT EXISTS category_metafields (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id BIGINT                 NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    definition_id BIGINT               NOT NULL REFERENCES metafield_definitions(id) ON DELETE RESTRICT,
    namespace   TEXT                   NOT NULL,
    key         TEXT                   NOT NULL,
    value_text  TEXT,
    value_num   NUMERIC,
    value_bool  BOOLEAN,
    value_json  JSONB,
    created_at  TIMESTAMPTZ            NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ            NOT NULL DEFAULT now(),
    CONSTRAINT uq_category_metafield UNIQUE (category_id, namespace, key)
);

CREATE INDEX IF NOT EXISTS idx_spm_store_product ON store_product_metafields(store_product_id);
CREATE INDEX IF NOT EXISTS idx_sm_store ON store_metafields(store_id);
CREATE INDEX IF NOT EXISTS idx_cm_category ON category_metafields(category_id);

CREATE OR REPLACE FUNCTION fn_validate_metafield_payload(
    p_definition_id BIGINT,
    p_namespace TEXT,
    p_key TEXT,
    p_value_text TEXT,
    p_value_num NUMERIC,
    p_value_bool BOOLEAN,
    p_value_json JSONB,
    p_expected_entity metafield_entity_type
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    def_entity metafield_entity_type;
    def_value_type metafield_value_type;
BEGIN
    SELECT entity_type, value_type
      INTO def_entity, def_value_type
      FROM metafield_definitions
     WHERE id = p_definition_id;

    IF def_entity IS NULL THEN
        RAISE EXCEPTION 'Metafield definition % not found', p_definition_id;
    END IF;

    IF def_entity <> p_expected_entity THEN
        RAISE EXCEPTION 'Metafield definition entity_type mismatch. expected %, got %', p_expected_entity, def_entity;
    END IF;

    -- Keep namespace/key aligned with definition.
    IF EXISTS (
        SELECT 1
        FROM metafield_definitions d
        WHERE d.id = p_definition_id
          AND (d.namespace <> p_namespace OR d.key <> p_key)
    ) THEN
        RAISE EXCEPTION 'Metafield namespace/key must match definition';
    END IF;

    IF def_value_type = 'text' THEN
        IF p_value_text IS NULL OR p_value_num IS NOT NULL OR p_value_bool IS NOT NULL OR p_value_json IS NOT NULL THEN
            RAISE EXCEPTION 'Text metafield requires only value_text';
        END IF;
    ELSIF def_value_type = 'number' THEN
        IF p_value_num IS NULL OR p_value_text IS NOT NULL OR p_value_bool IS NOT NULL OR p_value_json IS NOT NULL THEN
            RAISE EXCEPTION 'Number metafield requires only value_num';
        END IF;
    ELSIF def_value_type = 'boolean' THEN
        IF p_value_bool IS NULL OR p_value_text IS NOT NULL OR p_value_num IS NOT NULL OR p_value_json IS NOT NULL THEN
            RAISE EXCEPTION 'Boolean metafield requires only value_bool';
        END IF;
    ELSIF def_value_type = 'json' THEN
        IF p_value_json IS NULL OR p_value_text IS NOT NULL OR p_value_num IS NOT NULL OR p_value_bool IS NOT NULL THEN
            RAISE EXCEPTION 'JSON metafield requires only value_json';
        END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION fn_validate_store_product_metafield()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM fn_validate_metafield_payload(
        NEW.definition_id,
        NEW.namespace,
        NEW.key,
        NEW.value_text,
        NEW.value_num,
        NEW.value_bool,
        NEW.value_json,
        'store_product'::metafield_entity_type
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_validate_store_metafield()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM fn_validate_metafield_payload(
        NEW.definition_id,
        NEW.namespace,
        NEW.key,
        NEW.value_text,
        NEW.value_num,
        NEW.value_bool,
        NEW.value_json,
        'store'::metafield_entity_type
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_validate_category_metafield()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM fn_validate_metafield_payload(
        NEW.definition_id,
        NEW.namespace,
        NEW.key,
        NEW.value_text,
        NEW.value_num,
        NEW.value_bool,
        NEW.value_json,
        'category'::metafield_entity_type
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_store_product_metafield ON store_product_metafields;
CREATE TRIGGER trg_validate_store_product_metafield
    BEFORE INSERT OR UPDATE ON store_product_metafields
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_store_product_metafield();

DROP TRIGGER IF EXISTS trg_validate_store_metafield ON store_metafields;
CREATE TRIGGER trg_validate_store_metafield
    BEFORE INSERT OR UPDATE ON store_metafields
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_store_metafield();

DROP TRIGGER IF EXISTS trg_validate_category_metafield ON category_metafields;
CREATE TRIGGER trg_validate_category_metafield
    BEFORE INSERT OR UPDATE ON category_metafields
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_category_metafield();

-- updated_at triggers for metafield tables
DROP TRIGGER IF EXISTS trg_metafield_definitions_updated_at ON metafield_definitions;
CREATE TRIGGER trg_metafield_definitions_updated_at
    BEFORE UPDATE ON metafield_definitions
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_store_product_metafields_updated_at ON store_product_metafields;
CREATE TRIGGER trg_store_product_metafields_updated_at
    BEFORE UPDATE ON store_product_metafields
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_store_metafields_updated_at ON store_metafields;
CREATE TRIGGER trg_store_metafields_updated_at
    BEFORE UPDATE ON store_metafields
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_category_metafields_updated_at ON category_metafields;
CREATE TRIGGER trg_category_metafields_updated_at
    BEFORE UPDATE ON category_metafields
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- RLS for metafields
ALTER TABLE metafield_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_product_metafields ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_metafields ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_metafields ENABLE ROW LEVEL SECURITY;

-- Definitions: everyone can read active definitions, sysadmin manages.
DROP POLICY IF EXISTS metafield_definitions_select ON metafield_definitions;
CREATE POLICY metafield_definitions_select ON metafield_definitions
    FOR SELECT USING (status = 'active' OR current_user_role() = 'sysadmin');

DROP POLICY IF EXISTS metafield_definitions_admin_all ON metafield_definitions;
CREATE POLICY metafield_definitions_admin_all ON metafield_definitions
    FOR ALL USING (current_user_role() = 'sysadmin');

-- Store product metafields
DROP POLICY IF EXISTS spm_select_public ON store_product_metafields;
CREATE POLICY spm_select_public ON store_product_metafields
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS spm_merchant_select ON store_product_metafields;
CREATE POLICY spm_merchant_select ON store_product_metafields
    FOR SELECT USING (
        store_product_id IN (
            SELECT sp.id
            FROM store_products sp
            WHERE sp.store_id IN (SELECT merchant_store_ids())
        )
    );

DROP POLICY IF EXISTS spm_merchant_insert ON store_product_metafields;
CREATE POLICY spm_merchant_insert ON store_product_metafields
    FOR INSERT WITH CHECK (
        store_product_id IN (
            SELECT sp.id
            FROM store_products sp
            WHERE sp.store_id IN (SELECT merchant_store_ids())
        )
    );

DROP POLICY IF EXISTS spm_merchant_update ON store_product_metafields;
CREATE POLICY spm_merchant_update ON store_product_metafields
    FOR UPDATE USING (
        store_product_id IN (
            SELECT sp.id
            FROM store_products sp
            WHERE sp.store_id IN (SELECT merchant_store_ids())
        )
    ) WITH CHECK (
        store_product_id IN (
            SELECT sp.id
            FROM store_products sp
            WHERE sp.store_id IN (SELECT merchant_store_ids())
        )
    );

DROP POLICY IF EXISTS spm_merchant_delete ON store_product_metafields;
CREATE POLICY spm_merchant_delete ON store_product_metafields
    FOR DELETE USING (
        store_product_id IN (
            SELECT sp.id
            FROM store_products sp
            WHERE sp.store_id IN (SELECT merchant_store_ids())
        )
    );

DROP POLICY IF EXISTS spm_admin_all ON store_product_metafields;
CREATE POLICY spm_admin_all ON store_product_metafields
    FOR ALL USING (current_user_role() = 'sysadmin');

-- Store metafields
DROP POLICY IF EXISTS sm_select_public ON store_metafields;
CREATE POLICY sm_select_public ON store_metafields
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS sm_merchant_select ON store_metafields;
CREATE POLICY sm_merchant_select ON store_metafields
    FOR SELECT USING (store_id IN (SELECT merchant_store_ids()));

DROP POLICY IF EXISTS sm_merchant_insert ON store_metafields;
CREATE POLICY sm_merchant_insert ON store_metafields
    FOR INSERT WITH CHECK (store_id IN (SELECT merchant_store_ids()));

DROP POLICY IF EXISTS sm_merchant_update ON store_metafields;
CREATE POLICY sm_merchant_update ON store_metafields
    FOR UPDATE USING (store_id IN (SELECT merchant_store_ids()))
    WITH CHECK (store_id IN (SELECT merchant_store_ids()));

DROP POLICY IF EXISTS sm_merchant_delete ON store_metafields;
CREATE POLICY sm_merchant_delete ON store_metafields
    FOR DELETE USING (store_id IN (SELECT merchant_store_ids()));

DROP POLICY IF EXISTS sm_admin_all ON store_metafields;
CREATE POLICY sm_admin_all ON store_metafields
    FOR ALL USING (current_user_role() = 'sysadmin');

-- Category metafields
DROP POLICY IF EXISTS cm_select_public ON category_metafields;
CREATE POLICY cm_select_public ON category_metafields
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS cm_admin_all ON category_metafields;
CREATE POLICY cm_admin_all ON category_metafields
    FOR ALL USING (current_user_role() = 'sysadmin');

-- --------------------------------------------------------------------------
-- DONE
-- --------------------------------------------------------------------------
