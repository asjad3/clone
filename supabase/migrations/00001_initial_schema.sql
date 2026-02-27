-- ============================================================================
-- LOOTMART — INITIAL SCHEMA MIGRATION
-- ============================================================================
-- Multi-tenant marketplace schema for Supabase (PostgreSQL 15+)
-- Supports: sysadmin, merchant, rider, customer roles
-- Features: LTREE categories, JSONB dynamic attributes, global/local products,
--           barcode mapping, immutable order history, RLS policies
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS ltree;          -- N-level category hierarchy
CREATE EXTENSION IF NOT EXISTS pgcrypto;       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- trigram similarity for search

-- ────────────────────────────────────────────────────────────────────────────
-- 1. CUSTOM ENUM TYPES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('sysadmin', 'merchant', 'rider', 'customer');

CREATE TYPE store_status AS ENUM ('pending', 'active', 'suspended', 'closed');

CREATE TYPE barcode_type AS ENUM ('EAN13', 'UPC_A', 'EAN8', 'CODE128', 'QR', 'OTHER');

CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'in_transit',
    'delivered',
    'cancelled',
    'refunded'
);

CREATE TYPE payment_method AS ENUM ('cod', 'card', 'jazzcash', 'easypaisa', 'wallet');

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- ────────────────────────────────────────────────────────────────────────────
-- 2. PROFILES (extends Supabase auth.users)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        user_role       NOT NULL DEFAULT 'customer',
    full_name   TEXT            NOT NULL DEFAULT '',
    phone       TEXT,
    avatar_url  TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);

COMMENT ON TABLE profiles IS 'Extends auth.users with app-specific role and profile data.';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. AREAS (delivery zones / geographic regions)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE areas (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT            NOT NULL,
    city        TEXT            NOT NULL,
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_areas_city ON areas(city);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. BRANDS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE brands (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT            NOT NULL UNIQUE,
    slug        TEXT            NOT NULL UNIQUE,
    logo_url    TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_slug ON brands(slug);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. CATEGORIES (LTREE-based N-level hierarchy)
-- ────────────────────────────────────────────────────────────────────────────
-- We keep parent_id for ORM-friendly parent lookup AND path for subtree queries.
-- A trigger keeps `path` in sync whenever parent_id changes.

CREATE TABLE categories (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT            NOT NULL,
    slug        TEXT            NOT NULL,
    parent_id   BIGINT          REFERENCES categories(id) ON DELETE SET NULL,
    path        LTREE,
    depth       INT             NOT NULL DEFAULT 0,
    sort_order  INT             NOT NULL DEFAULT 0,
    image_url   TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT uq_categories_slug_parent UNIQUE (slug, parent_id)
);

CREATE INDEX idx_categories_path_gist ON categories USING GIST (path);
CREATE INDEX idx_categories_path_btree ON categories USING BTREE (path);
CREATE INDEX idx_categories_parent ON categories(parent_id);

COMMENT ON COLUMN categories.path IS
    'Materialized LTREE path (e.g., grocery.hygiene.soap). Maintained by trigger.';

-- ── Trigger: auto-compute LTREE path from parent_id ──

CREATE OR REPLACE FUNCTION fn_categories_compute_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path LTREE;
BEGIN
    IF NEW.parent_id IS NULL THEN
        -- Root category: path is just its own slug
        NEW.path  := text2ltree(NEW.slug);
        NEW.depth := 0;
    ELSE
        SELECT path INTO parent_path FROM categories WHERE id = NEW.parent_id;
        IF parent_path IS NULL THEN
            RAISE EXCEPTION 'Parent category % not found or has no path', NEW.parent_id;
        END IF;
        NEW.path  := parent_path || text2ltree(NEW.slug);
        NEW.depth := nlevel(NEW.path) - 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categories_path
    BEFORE INSERT OR UPDATE OF parent_id, slug ON categories
    FOR EACH ROW
    EXECUTE FUNCTION fn_categories_compute_path();

-- ────────────────────────────────────────────────────────────────────────────
-- 6. STORES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE stores (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id                UUID            NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    name                    TEXT            NOT NULL,
    slug                    TEXT            NOT NULL UNIQUE,
    description             TEXT,
    logo_url                TEXT,
    banner_url              TEXT,
    store_type              TEXT            NOT NULL DEFAULT 'mart',
    status                  store_status    NOT NULL DEFAULT 'pending',
    same_day_delivery       BOOLEAN         NOT NULL DEFAULT FALSE,
    delivery_charges        NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    min_order_value         NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    free_delivery_threshold NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    store_hours             TEXT,
    delivery_hours          TEXT,
    contact_phone           TEXT,
    contact_email           TEXT,
    address                 TEXT,
    lat                     DOUBLE PRECISION,
    lng                     DOUBLE PRECISION,
    rating_avg              NUMERIC(3, 2)   NOT NULL DEFAULT 0,
    rating_count            INT             NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_type ON stores(store_type);

-- ── Store ↔ Area junction (many-to-many) ──

CREATE TABLE store_areas (
    store_id    BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    area_id     BIGINT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    PRIMARY KEY (store_id, area_id)
);

CREATE INDEX idx_store_areas_area ON store_areas(area_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. MERCHANTS (store staff — links profile to store)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE merchants (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id  UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    store_id    BIGINT          NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    is_owner    BOOLEAN         NOT NULL DEFAULT FALSE,
    permissions JSONB           NOT NULL DEFAULT '{}',
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT uq_merchant_profile_store UNIQUE (profile_id, store_id)
);

CREATE INDEX idx_merchants_store ON merchants(store_id);
CREATE INDEX idx_merchants_profile ON merchants(profile_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 8. RIDERS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE riders (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id  UUID            NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle     TEXT            NOT NULL DEFAULT 'motorcycle',
    license_no  TEXT,
    is_online   BOOLEAN         NOT NULL DEFAULT FALSE,
    rating_avg  NUMERIC(3, 2)   NOT NULL DEFAULT 0,
    rating_count INT            NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_riders_profile ON riders(profile_id);
CREATE INDEX idx_riders_online ON riders(is_online) WHERE is_online = TRUE;

-- ────────────────────────────────────────────────────────────────────────────
-- 9. CUSTOMERS (extended profile data)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE customers (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id  UUID            NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    default_address_id BIGINT,  -- FK added after customer_addresses table
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_profile ON customers(profile_id);

-- ── Customer Addresses ──

CREATE TABLE customer_addresses (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label       TEXT            NOT NULL DEFAULT 'Home',     -- Home, Work, Other
    address     TEXT            NOT NULL,
    area_id     BIGINT          REFERENCES areas(id) ON DELETE SET NULL,
    city        TEXT            NOT NULL,
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    phone       TEXT,
    instructions TEXT,
    is_default  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_cust_addr_customer ON customer_addresses(customer_id);

-- Add FK for default_address_id now that the table exists
ALTER TABLE customers
    ADD CONSTRAINT fk_customers_default_address
    FOREIGN KEY (default_address_id) REFERENCES customer_addresses(id)
    ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 10. GLOBAL PRODUCTS (sysadmin-managed central catalog)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE global_products (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            TEXT            NOT NULL,
    slug            TEXT            NOT NULL UNIQUE,
    description     TEXT,
    brand_id        BIGINT          REFERENCES brands(id) ON DELETE SET NULL,
    category_id     BIGINT          NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    base_price      NUMERIC(12, 2)  NOT NULL DEFAULT 0,
    weight          TEXT,                           -- display weight e.g. "1 kg", "500 ml"
    weight_value    NUMERIC(10, 3),                 -- numeric for comparison/sorting
    weight_unit     TEXT,                           -- g, kg, ml, L, pcs, etc.
    image_url       TEXT,
    images          TEXT[]          DEFAULT '{}',    -- additional images
    attributes      JSONB           NOT NULL DEFAULT '{}',
    tags            TEXT[]          DEFAULT '{}',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_gp_slug ON global_products(slug);
CREATE INDEX idx_gp_category ON global_products(category_id);
CREATE INDEX idx_gp_brand ON global_products(brand_id);
CREATE INDEX idx_gp_active ON global_products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_gp_attributes ON global_products USING GIN (attributes);
CREATE INDEX idx_gp_tags ON global_products USING GIN (tags);
CREATE INDEX idx_gp_name_trgm ON global_products USING GIN (name gin_trgm_ops);

-- Expression indexes on hot filterable attributes
CREATE INDEX idx_gp_attr_size
    ON global_products ((attributes->>'size'))
    WHERE attributes ? 'size';

CREATE INDEX idx_gp_attr_color
    ON global_products ((attributes->>'color'))
    WHERE attributes ? 'color';

CREATE INDEX idx_gp_attr_dosage
    ON global_products ((attributes->>'dosage_mg'))
    WHERE attributes ? 'dosage_mg';

COMMENT ON COLUMN global_products.attributes IS
    'Dynamic JSONB attributes. Keys vary by category (e.g., {"size": "XL", "material": "cotton"} or {"dosage_mg": 500, "form": "tablet"}).';

-- ────────────────────────────────────────────────────────────────────────────
-- 11. PRODUCT BARCODES (N barcodes → 1 global product)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE product_barcodes (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    global_product_id   BIGINT      NOT NULL REFERENCES global_products(id) ON DELETE CASCADE,
    barcode             TEXT        NOT NULL UNIQUE,
    barcode_format      barcode_type NOT NULL DEFAULT 'EAN13',
    is_primary          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_barcodes_product ON product_barcodes(global_product_id);
CREATE INDEX idx_barcodes_barcode ON product_barcodes(barcode);

COMMENT ON TABLE product_barcodes IS
    'Maps multiple barcodes (EAN-13, UPC-A, etc.) to a single global product for CSV/scan import resolution.';

-- ────────────────────────────────────────────────────────────────────────────
-- 12. STORE PRODUCTS (per-store: global overrides + custom local products)
-- ────────────────────────────────────────────────────────────────────────────
--
-- If global_product_id IS NOT NULL → Global product with optional overrides
-- If global_product_id IS NULL     → Custom local product (custom_* fields used)
--

CREATE TABLE store_products (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id            BIGINT          NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    global_product_id   BIGINT          REFERENCES global_products(id) ON DELETE SET NULL,

    -- Override fields (NULL = use global default)
    price_override      NUMERIC(12, 2),
    old_price_override  NUMERIC(12, 2),
    stock_quantity      INT             NOT NULL DEFAULT 0,
    is_in_stock         BOOLEAN         NOT NULL DEFAULT TRUE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order          INT             NOT NULL DEFAULT 0,

    -- Custom local product fields (used when global_product_id IS NULL)
    custom_name         TEXT,
    custom_slug         TEXT,
    custom_description  TEXT,
    custom_brand_name   TEXT,
    custom_category_id  BIGINT          REFERENCES categories(id) ON DELETE SET NULL,
    custom_price        NUMERIC(12, 2),
    custom_old_price    NUMERIC(12, 2),
    custom_weight       TEXT,
    custom_image_url    TEXT,
    custom_images       TEXT[]          DEFAULT '{}',
    custom_attributes   JSONB           NOT NULL DEFAULT '{}',
    custom_barcode      TEXT,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),

    -- A store can import a global product only once
    CONSTRAINT uq_store_global_product UNIQUE NULLS NOT DISTINCT (store_id, global_product_id)
);

CREATE INDEX idx_sp_store ON store_products(store_id);
CREATE INDEX idx_sp_global ON store_products(global_product_id) WHERE global_product_id IS NOT NULL;
CREATE INDEX idx_sp_store_active ON store_products(store_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sp_custom_name_trgm ON store_products USING GIN (custom_name gin_trgm_ops)
    WHERE custom_name IS NOT NULL;

COMMENT ON TABLE store_products IS
    'Universal store-product row. global_product_id NOT NULL = global override, NULL = custom local product.';

-- ────────────────────────────────────────────────────────────────────────────
-- 13. ORDERS (immutable order history)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE orders (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        TEXT            NOT NULL UNIQUE,
    customer_id         BIGINT          NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    store_id            BIGINT          NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    rider_id            BIGINT          REFERENCES riders(id) ON DELETE SET NULL,

    -- Status tracking
    status              order_status    NOT NULL DEFAULT 'pending',
    status_history      JSONB           NOT NULL DEFAULT '[]',

    -- Immutable address snapshot (not a FK — copied at order time)
    delivery_address    JSONB           NOT NULL,
    delivery_lat        DOUBLE PRECISION,
    delivery_lng        DOUBLE PRECISION,

    -- Immutable store snapshot
    store_name_snapshot TEXT            NOT NULL,

    -- Money (all amounts frozen at order time)
    subtotal            NUMERIC(12, 2)  NOT NULL DEFAULT 0,
    delivery_fee        NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    discount            NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    tax                 NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    total               NUMERIC(12, 2)  NOT NULL DEFAULT 0,

    -- Payment
    payment_method      payment_method  NOT NULL DEFAULT 'cod',
    payment_status      payment_status  NOT NULL DEFAULT 'pending',

    -- Timestamps
    placed_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),
    confirmed_at        TIMESTAMPTZ,
    picked_up_at        TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,

    -- Rider snapshot
    rider_name_snapshot TEXT,
    rider_phone_snapshot TEXT,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_rider ON orders(rider_id) WHERE rider_id IS NOT NULL;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_placed ON orders(placed_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

COMMENT ON COLUMN orders.delivery_address IS
    'JSONB snapshot of address at order time: {"label", "address", "city", "area", "lat", "lng", "phone", "instructions"}. Immutable after placement.';

-- ────────────────────────────────────────────────────────────────────────────
-- 14. ORDER ITEMS (immutable product snapshots)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE order_items (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id                UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    store_product_id        BIGINT          REFERENCES store_products(id) ON DELETE SET NULL,

    -- ── Immutable snapshot fields (frozen at order time) ──
    product_name_snapshot   TEXT            NOT NULL,
    product_image_snapshot  TEXT,
    product_weight_snapshot TEXT,
    product_attributes_snapshot JSONB       NOT NULL DEFAULT '{}',
    category_name_snapshot  TEXT,
    brand_name_snapshot     TEXT,

    -- Price at time of purchase (NEVER changes)
    unit_price              NUMERIC(12, 2)  NOT NULL,
    quantity                INT             NOT NULL DEFAULT 1 CHECK (quantity > 0),
    line_total              NUMERIC(12, 2)  NOT NULL,

    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_oi_order ON order_items(order_id);
CREATE INDEX idx_oi_store_product ON order_items(store_product_id) WHERE store_product_id IS NOT NULL;

COMMENT ON TABLE order_items IS
    'Immutable snapshot of products at time of purchase. Changes to product name/price/attributes do NOT affect historical orders.';

-- ────────────────────────────────────────────────────────────────────────────
-- 15. REVIEWS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE store_reviews (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    store_id    BIGINT          NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id BIGINT          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    rating      SMALLINT        NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT uq_store_review_per_order UNIQUE (order_id, store_id)
);

CREATE TABLE rider_reviews (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id    BIGINT          NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    customer_id BIGINT          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    rating      SMALLINT        NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT uq_rider_review_per_order UNIQUE (order_id, rider_id)
);

CREATE TABLE product_reviews (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id        UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    store_product_id BIGINT         NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
    customer_id     BIGINT          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    rating          SMALLINT        NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT uq_product_review_per_order UNIQUE (order_id, store_product_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 16. UTILITY: updated_at TRIGGER
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-updated_at to all relevant tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'profiles', 'brands', 'categories', 'stores', 'riders',
        'customers', 'global_products', 'store_products', 'orders'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION fn_set_updated_at()',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 17. UTILITY: order_number GENERATION
-- ────────────────────────────────────────────────────────────────────────────

CREATE SEQUENCE order_number_seq START 10001;

CREATE OR REPLACE FUNCTION fn_generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'LM-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('order_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_generate_order_number();

-- ────────────────────────────────────────────────────────────────────────────
-- 18. IMMUTABILITY GUARD: Prevent mutation of delivered/cancelled orders
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_guard_order_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow status transitions even on terminal orders (for refunds)
    IF OLD.status IN ('delivered', 'cancelled', 'refunded') THEN
        -- Only allow status change to 'refunded' and payment_status changes
        IF NEW.status != OLD.status AND NEW.status != 'refunded' THEN
            RAISE EXCEPTION 'Cannot modify a % order (order_id: %)', OLD.status, OLD.id;
        END IF;
        -- Block changes to financial fields
        IF NEW.subtotal != OLD.subtotal
           OR NEW.delivery_fee != OLD.delivery_fee
           OR NEW.total != OLD.total THEN
            RAISE EXCEPTION 'Cannot modify financial fields of a % order', OLD.status;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_immutability
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_guard_order_immutability();

-- Similarly guard order_items from any UPDATE
CREATE OR REPLACE FUNCTION fn_guard_order_items_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Order items are immutable and cannot be modified after creation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_items_immutability
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION fn_guard_order_items_immutability();


-- ============================================================================
-- 19. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Role resolution: auth.jwt()->'app_metadata'->>'role'
-- Store resolution for merchants: lookup merchants table
-- ============================================================================

-- ── Helper function: get current user's role ──

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT COALESCE(
        (auth.jwt()->'app_metadata'->>'role')::user_role,
        'customer'::user_role
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Helper function: get store IDs the current merchant has access to ──

CREATE OR REPLACE FUNCTION public.merchant_store_ids()
RETURNS SETOF BIGINT AS $$
    SELECT store_id FROM merchants
    WHERE profile_id = auth.uid()
      AND is_active = TRUE;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Helper function: get the customer row id for the current user ──

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS BIGINT AS $$
    SELECT id FROM customers WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PROFILES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
    FOR SELECT USING (id = auth.uid());

-- Sysadmin can read all profiles
CREATE POLICY profiles_select_admin ON profiles
    FOR SELECT USING (current_user_role() = 'sysadmin');

-- Users can update their own profile (but not role)
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Sysadmin can update any profile
CREATE POLICY profiles_update_admin ON profiles
    FOR UPDATE USING (current_user_role() = 'sysadmin');

-- Insert handled by auth trigger (or sysadmin)
CREATE POLICY profiles_insert ON profiles
    FOR INSERT WITH CHECK (
        id = auth.uid()
        OR current_user_role() = 'sysadmin'
    );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- AREAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- Everyone can read active areas
CREATE POLICY areas_select_all ON areas
    FOR SELECT USING (is_active = TRUE OR current_user_role() = 'sysadmin');

-- Only sysadmin can modify
CREATE POLICY areas_insert_admin ON areas
    FOR INSERT WITH CHECK (current_user_role() = 'sysadmin');

CREATE POLICY areas_update_admin ON areas
    FOR UPDATE USING (current_user_role() = 'sysadmin');

CREATE POLICY areas_delete_admin ON areas
    FOR DELETE USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- BRANDS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Everyone can read active brands
CREATE POLICY brands_select_all ON brands
    FOR SELECT USING (is_active = TRUE OR current_user_role() = 'sysadmin');

-- Only sysadmin can modify
CREATE POLICY brands_insert_admin ON brands
    FOR INSERT WITH CHECK (current_user_role() = 'sysadmin');

CREATE POLICY brands_update_admin ON brands
    FOR UPDATE USING (current_user_role() = 'sysadmin');

CREATE POLICY brands_delete_admin ON brands
    FOR DELETE USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CATEGORIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read active categories
CREATE POLICY categories_select_all ON categories
    FOR SELECT USING (is_active = TRUE OR current_user_role() = 'sysadmin');

-- Only sysadmin can modify
CREATE POLICY categories_insert_admin ON categories
    FOR INSERT WITH CHECK (current_user_role() = 'sysadmin');

CREATE POLICY categories_update_admin ON categories
    FOR UPDATE USING (current_user_role() = 'sysadmin');

CREATE POLICY categories_delete_admin ON categories
    FOR DELETE USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STORES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Everyone can read active stores
CREATE POLICY stores_select_active ON stores
    FOR SELECT USING (status = 'active' OR current_user_role() = 'sysadmin');

-- Merchants can read their own stores (even if not active yet)
CREATE POLICY stores_select_merchant ON stores
    FOR SELECT USING (id IN (SELECT merchant_store_ids()));

-- Sysadmin can do anything
CREATE POLICY stores_all_admin ON stores
    FOR ALL USING (current_user_role() = 'sysadmin');

-- Merchants (store owners) can update their own stores
CREATE POLICY stores_update_merchant ON stores
    FOR UPDATE USING (
        owner_id = auth.uid()
        AND current_user_role() = 'merchant'
    );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STORE_AREAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE store_areas ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY store_areas_select ON store_areas
    FOR SELECT USING (TRUE);

-- Merchants can manage their own store areas
CREATE POLICY store_areas_merchant ON store_areas
    FOR ALL USING (store_id IN (SELECT merchant_store_ids()));

-- Sysadmin can manage all
CREATE POLICY store_areas_admin ON store_areas
    FOR ALL USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MERCHANTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- Merchants see their own record
CREATE POLICY merchants_select_own ON merchants
    FOR SELECT USING (profile_id = auth.uid());

-- Sysadmin sees all
CREATE POLICY merchants_select_admin ON merchants
    FOR SELECT USING (current_user_role() = 'sysadmin');

-- Sysadmin can manage all merchant records
CREATE POLICY merchants_all_admin ON merchants
    FOR ALL USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RIDERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE riders ENABLE ROW LEVEL SECURITY;

-- Riders see their own record
CREATE POLICY riders_select_own ON riders
    FOR SELECT USING (profile_id = auth.uid());

-- Customers/merchants can see online riders (for tracking)
CREATE POLICY riders_select_online ON riders
    FOR SELECT USING (is_online = TRUE);

-- Sysadmin sees all
CREATE POLICY riders_select_admin ON riders
    FOR SELECT USING (current_user_role() = 'sysadmin');

-- Riders can update their own record
CREATE POLICY riders_update_own ON riders
    FOR UPDATE USING (profile_id = auth.uid());

-- Sysadmin can manage all
CREATE POLICY riders_all_admin ON riders
    FOR ALL USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CUSTOMERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Customers see only their own record
CREATE POLICY customers_select_own ON customers
    FOR SELECT USING (profile_id = auth.uid());

-- Customers can update their own record
CREATE POLICY customers_update_own ON customers
    FOR UPDATE USING (profile_id = auth.uid());

-- Sysadmin sees all
CREATE POLICY customers_all_admin ON customers
    FOR ALL USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CUSTOMER ADDRESSES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customers manage their own addresses
CREATE POLICY cust_addr_select_own ON customer_addresses
    FOR SELECT USING (customer_id = current_customer_id());

CREATE POLICY cust_addr_insert_own ON customer_addresses
    FOR INSERT WITH CHECK (customer_id = current_customer_id());

CREATE POLICY cust_addr_update_own ON customer_addresses
    FOR UPDATE USING (customer_id = current_customer_id());

CREATE POLICY cust_addr_delete_own ON customer_addresses
    FOR DELETE USING (customer_id = current_customer_id());

-- Sysadmin sees all
CREATE POLICY cust_addr_all_admin ON customer_addresses
    FOR ALL USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- GLOBAL PRODUCTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE global_products ENABLE ROW LEVEL SECURITY;

-- Everyone can read active global products
CREATE POLICY gp_select_active ON global_products
    FOR SELECT USING (is_active = TRUE OR current_user_role() = 'sysadmin');

-- Only sysadmin can modify
CREATE POLICY gp_insert_admin ON global_products
    FOR INSERT WITH CHECK (current_user_role() = 'sysadmin');

CREATE POLICY gp_update_admin ON global_products
    FOR UPDATE USING (current_user_role() = 'sysadmin');

CREATE POLICY gp_delete_admin ON global_products
    FOR DELETE USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PRODUCT BARCODES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;

-- Everyone can read barcodes (needed for import/scan)
CREATE POLICY barcodes_select_all ON product_barcodes
    FOR SELECT USING (TRUE);

-- Only sysadmin can modify
CREATE POLICY barcodes_insert_admin ON product_barcodes
    FOR INSERT WITH CHECK (current_user_role() = 'sysadmin');

CREATE POLICY barcodes_update_admin ON product_barcodes
    FOR UPDATE USING (current_user_role() = 'sysadmin');

CREATE POLICY barcodes_delete_admin ON product_barcodes
    FOR DELETE USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STORE PRODUCTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;

-- Customers can see active store products for active stores
CREATE POLICY sp_select_active ON store_products
    FOR SELECT USING (
        (is_active = TRUE AND store_id IN (
            SELECT id FROM stores WHERE status = 'active'
        ))
        OR current_user_role() = 'sysadmin'
    );

-- Merchants can see all their own store products
CREATE POLICY sp_select_merchant ON store_products
    FOR SELECT USING (store_id IN (SELECT merchant_store_ids()));

-- Merchants can insert/update/delete their own store products
CREATE POLICY sp_insert_merchant ON store_products
    FOR INSERT WITH CHECK (store_id IN (SELECT merchant_store_ids()));

CREATE POLICY sp_update_merchant ON store_products
    FOR UPDATE USING (store_id IN (SELECT merchant_store_ids()));

CREATE POLICY sp_delete_merchant ON store_products
    FOR DELETE USING (store_id IN (SELECT merchant_store_ids()));

-- Sysadmin can do anything
CREATE POLICY sp_all_admin ON store_products
    FOR ALL USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ORDERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers see their own orders
CREATE POLICY orders_select_customer ON orders
    FOR SELECT USING (customer_id = current_customer_id());

-- Merchants see orders for their stores
CREATE POLICY orders_select_merchant ON orders
    FOR SELECT USING (store_id IN (SELECT merchant_store_ids()));

-- Riders see orders assigned to them
CREATE POLICY orders_select_rider ON orders
    FOR SELECT USING (
        rider_id IN (SELECT id FROM riders WHERE profile_id = auth.uid())
    );

-- Customers can place orders
CREATE POLICY orders_insert_customer ON orders
    FOR INSERT WITH CHECK (customer_id = current_customer_id());

-- Merchants can update order status for their stores
CREATE POLICY orders_update_merchant ON orders
    FOR UPDATE USING (store_id IN (SELECT merchant_store_ids()));

-- Riders can update orders assigned to them (status transitions)
CREATE POLICY orders_update_rider ON orders
    FOR UPDATE USING (
        rider_id IN (SELECT id FROM riders WHERE profile_id = auth.uid())
    );

-- Sysadmin can do anything
CREATE POLICY orders_all_admin ON orders
    FOR ALL USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ORDER ITEMS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Customers see items from their own orders
CREATE POLICY oi_select_customer ON order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM orders WHERE customer_id = current_customer_id())
    );

-- Merchants see items from their store's orders
CREATE POLICY oi_select_merchant ON order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM orders WHERE store_id IN (SELECT merchant_store_ids()))
    );

-- Riders see items from their assigned orders
CREATE POLICY oi_select_rider ON order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM orders WHERE rider_id IN (SELECT id FROM riders WHERE profile_id = auth.uid()))
    );

-- Customers can insert items (when placing an order)
CREATE POLICY oi_insert_customer ON order_items
    FOR INSERT WITH CHECK (
        order_id IN (SELECT id FROM orders WHERE customer_id = current_customer_id())
    );

-- Sysadmin can do anything
CREATE POLICY oi_all_admin ON order_items
    FOR ALL USING (current_user_role() = 'sysadmin');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- REVIEWS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews
CREATE POLICY store_reviews_select ON store_reviews FOR SELECT USING (TRUE);
CREATE POLICY rider_reviews_select ON rider_reviews FOR SELECT USING (TRUE);
CREATE POLICY product_reviews_select ON product_reviews FOR SELECT USING (TRUE);

-- Customers can insert reviews for their own orders
CREATE POLICY store_reviews_insert ON store_reviews
    FOR INSERT WITH CHECK (
        customer_id = current_customer_id()
        AND order_id IN (SELECT id FROM orders WHERE customer_id = current_customer_id())
    );

CREATE POLICY rider_reviews_insert ON rider_reviews
    FOR INSERT WITH CHECK (
        customer_id = current_customer_id()
        AND order_id IN (SELECT id FROM orders WHERE customer_id = current_customer_id())
    );

CREATE POLICY product_reviews_insert ON product_reviews
    FOR INSERT WITH CHECK (
        customer_id = current_customer_id()
        AND order_id IN (SELECT id FROM orders WHERE customer_id = current_customer_id())
    );

-- Sysadmin can manage all reviews
CREATE POLICY store_reviews_admin ON store_reviews FOR ALL USING (current_user_role() = 'sysadmin');
CREATE POLICY rider_reviews_admin ON rider_reviews FOR ALL USING (current_user_role() = 'sysadmin');
CREATE POLICY product_reviews_admin ON product_reviews FOR ALL USING (current_user_role() = 'sysadmin');


-- ============================================================================
-- 20. STOREFRONT VIEW (convenient read view)
-- ============================================================================
-- This view resolves the Global vs Custom product logic with COALESCE.
-- Storefront queries hit this view instead of doing the JOIN manually.
-- ============================================================================

CREATE OR REPLACE VIEW v_storefront_products AS
SELECT
    sp.id                       AS store_product_id,
    sp.store_id,
    s.slug                      AS store_slug,
    s.name                      AS store_name,

    -- Resolved product fields (override > global > custom)
    COALESCE(sp.custom_name, gp.name)                       AS product_name,
    COALESCE(sp.custom_slug, gp.slug)                       AS product_slug,
    COALESCE(sp.custom_description, gp.description)         AS product_description,
    COALESCE(sp.price_override, sp.custom_price, gp.base_price) AS price,
    COALESCE(sp.old_price_override, sp.custom_old_price, NULL)  AS old_price,
    COALESCE(sp.custom_weight, gp.weight)                   AS weight,
    COALESCE(sp.custom_image_url, gp.image_url)             AS image_url,
    COALESCE(sp.custom_images, gp.images, '{}')             AS images,

    -- Category (custom override or global)
    COALESCE(sp.custom_category_id, gp.category_id)         AS category_id,
    cat.name                                                 AS category_name,
    cat.path                                                 AS category_path,

    -- Brand
    COALESCE(sp.custom_brand_name, b.name)                  AS brand_name,

    -- Attributes (merge: custom attrs override global attrs)
    CASE
        WHEN sp.global_product_id IS NULL THEN sp.custom_attributes
        ELSE gp.attributes || sp.custom_attributes  -- custom keys win in || merge
    END                                                      AS attributes,

    -- Stock & status
    sp.stock_quantity,
    sp.is_in_stock,
    sp.is_active,

    -- Source info
    sp.global_product_id,
    CASE WHEN sp.global_product_id IS NOT NULL THEN 'global' ELSE 'custom' END AS product_source

FROM store_products sp
LEFT JOIN global_products gp ON sp.global_product_id = gp.id
LEFT JOIN stores s ON sp.store_id = s.id
LEFT JOIN categories cat ON COALESCE(sp.custom_category_id, gp.category_id) = cat.id
LEFT JOIN brands b ON gp.brand_id = b.id;

COMMENT ON VIEW v_storefront_products IS
    'Resolved storefront view. COALESCE logic: override > custom > global defaults. Use this for all storefront queries.';


-- ============================================================================
-- DONE
-- ============================================================================
