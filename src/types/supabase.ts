/**
 * ============================================================================
 * Supabase Database Types for Lootmart
 * ============================================================================
 *
 * These types mirror the SQL migration (00001_initial_schema.sql).
 * In production, auto-generate these with:
 *   npx supabase gen types typescript --local > src/types/supabase.ts
 *
 * For now, these are hand-written to match our schema exactly.
 * ============================================================================
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ─── Enums ───

export type UserRole = "sysadmin" | "merchant" | "rider" | "customer";
export type StoreStatus = "pending" | "active" | "suspended" | "closed";
export type BarcodeType = "EAN13" | "UPC_A" | "EAN8" | "CODE128" | "QR" | "OTHER";
export type OrderStatus =
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready_for_pickup"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "refunded";
export type PaymentMethod = "cod" | "card" | "jazzcash" | "easypaisa" | "wallet";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

// ─── Table Row Types ───

export interface ProfileRow {
    id: string;              // UUID
    role: UserRole;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AreaRow {
    id: number;
    name: string;
    city: string;
    lat: number | null;
    lng: number | null;
    is_active: boolean;
    created_at: string;
}

export interface BrandRow {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CategoryRow {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    path: string | null;       // ltree stored as text
    depth: number;
    sort_order: number;
    image_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface StoreRow {
    id: number;
    owner_id: string;         // UUID
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    banner_url: string | null;
    store_type: string;
    status: StoreStatus;
    same_day_delivery: boolean;
    delivery_charges: number;
    min_order_value: number;
    free_delivery_threshold: number;
    store_hours: string | null;
    delivery_hours: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    address: string | null;
    lat: number | null;
    lng: number | null;
    rating_avg: number;
    rating_count: number;
    created_at: string;
    updated_at: string;
}

export interface StoreAreaRow {
    store_id: number;
    area_id: number;
}

export interface MerchantRow {
    id: number;
    profile_id: string;       // UUID
    store_id: number;
    is_owner: boolean;
    permissions: Json;
    is_active: boolean;
    created_at: string;
}

export interface RiderRow {
    id: number;
    profile_id: string;       // UUID
    vehicle: string;
    license_no: string | null;
    is_online: boolean;
    rating_avg: number;
    rating_count: number;
    created_at: string;
    updated_at: string;
}

export interface CustomerRow {
    id: number;
    profile_id: string;       // UUID
    default_address_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface CustomerAddressRow {
    id: number;
    customer_id: number;
    label: string;
    address: string;
    area_id: number | null;
    city: string;
    lat: number | null;
    lng: number | null;
    phone: string | null;
    instructions: string | null;
    is_default: boolean;
    created_at: string;
}

export interface GlobalProductRow {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    brand_id: number | null;
    category_id: number;
    base_price: number;
    weight: string | null;
    weight_value: number | null;
    weight_unit: string | null;
    image_url: string | null;
    images: string[];
    attributes: Json;
    tags: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductBarcodeRow {
    id: number;
    global_product_id: number;
    barcode: string;
    barcode_format: BarcodeType;
    is_primary: boolean;
    created_at: string;
}

export interface StoreProductRow {
    id: number;
    store_id: number;
    global_product_id: number | null;
    price_override: number | null;
    old_price_override: number | null;
    stock_quantity: number;
    is_in_stock: boolean;
    is_active: boolean;
    sort_order: number;
    custom_name: string | null;
    custom_slug: string | null;
    custom_description: string | null;
    custom_brand_name: string | null;
    custom_category_id: number | null;
    custom_price: number | null;
    custom_old_price: number | null;
    custom_weight: string | null;
    custom_image_url: string | null;
    custom_images: string[];
    custom_attributes: Json;
    custom_barcode: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrderRow {
    id: string;               // UUID
    order_number: string;
    customer_id: number;
    store_id: number;
    rider_id: number | null;
    status: OrderStatus;
    status_history: Json;
    delivery_address: Json;
    delivery_lat: number | null;
    delivery_lng: number | null;
    store_name_snapshot: string;
    subtotal: number;
    delivery_fee: number;
    discount: number;
    tax: number;
    total: number;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    placed_at: string;
    confirmed_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    cancelled_at: string | null;
    rider_name_snapshot: string | null;
    rider_phone_snapshot: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrderItemRow {
    id: number;
    order_id: string;         // UUID
    store_product_id: number | null;
    product_name_snapshot: string;
    product_image_snapshot: string | null;
    product_weight_snapshot: string | null;
    product_attributes_snapshot: Json;
    category_name_snapshot: string | null;
    brand_name_snapshot: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
    created_at: string;
}

// ─── Storefront View (v_storefront_products) ───

export interface StorefrontProductRow {
    store_product_id: number;
    store_id: number;
    store_slug: string;
    store_name: string;
    product_name: string;
    product_slug: string;
    product_description: string | null;
    price: number;
    old_price: number | null;
    weight: string | null;
    image_url: string | null;
    images: string[];
    category_id: number;
    category_name: string;
    category_path: string | null;
    brand_name: string | null;
    attributes: Json;
    stock_quantity: number;
    is_in_stock: boolean;
    is_active: boolean;
    global_product_id: number | null;
    product_source: "global" | "custom";
}

// ─── Database interface (used by createClient<Database>) ───

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: ProfileRow;
                Insert: Partial<ProfileRow> & { id: string };
                Update: Partial<ProfileRow>;
                Relationships: [];
            };
            areas: {
                Row: AreaRow;
                Insert: Omit<AreaRow, "id" | "created_at">;
                Update: Partial<Omit<AreaRow, "id">>;
                Relationships: [];
            };
            brands: {
                Row: BrandRow;
                Insert: Omit<BrandRow, "id" | "created_at" | "updated_at">;
                Update: Partial<Omit<BrandRow, "id">>;
                Relationships: [];
            };
            categories: {
                Row: CategoryRow;
                Insert: Omit<CategoryRow, "id" | "created_at" | "updated_at" | "path" | "depth">;
                Update: Partial<Omit<CategoryRow, "id" | "path" | "depth">>;
                Relationships: [];
            };
            stores: {
                Row: StoreRow;
                Insert: Omit<StoreRow, "id" | "created_at" | "updated_at" | "rating_avg" | "rating_count">;
                Update: Partial<Omit<StoreRow, "id">>;
                Relationships: [];
            };
            store_areas: {
                Row: StoreAreaRow;
                Insert: StoreAreaRow;
                Update: Partial<StoreAreaRow>;
                Relationships: [];
            };
            merchants: {
                Row: MerchantRow;
                Insert: Omit<MerchantRow, "id" | "created_at">;
                Update: Partial<Omit<MerchantRow, "id">>;
                Relationships: [];
            };
            riders: {
                Row: RiderRow;
                Insert: Omit<RiderRow, "id" | "created_at" | "updated_at" | "rating_avg" | "rating_count">;
                Update: Partial<Omit<RiderRow, "id">>;
                Relationships: [];
            };
            customers: {
                Row: CustomerRow;
                Insert: Omit<CustomerRow, "id" | "created_at" | "updated_at">;
                Update: Partial<Omit<CustomerRow, "id">>;
                Relationships: [];
            };
            customer_addresses: {
                Row: CustomerAddressRow;
                Insert: Omit<CustomerAddressRow, "id" | "created_at">;
                Update: Partial<Omit<CustomerAddressRow, "id">>;
                Relationships: [];
            };
            global_products: {
                Row: GlobalProductRow;
                Insert: Omit<GlobalProductRow, "id" | "created_at" | "updated_at">;
                Update: Partial<Omit<GlobalProductRow, "id">>;
                Relationships: [];
            };
            product_barcodes: {
                Row: ProductBarcodeRow;
                Insert: Omit<ProductBarcodeRow, "id" | "created_at">;
                Update: Partial<Omit<ProductBarcodeRow, "id">>;
                Relationships: [];
            };
            store_products: {
                Row: StoreProductRow;
                Insert: Omit<StoreProductRow, "id" | "created_at" | "updated_at">;
                Update: Partial<Omit<StoreProductRow, "id">>;
                Relationships: [];
            };
            orders: {
                Row: OrderRow;
                Insert: Omit<OrderRow, "id" | "created_at" | "updated_at" | "order_number">;
                Update: Partial<Omit<OrderRow, "id" | "order_number">>;
                Relationships: [];
            };
            order_items: {
                Row: OrderItemRow;
                Insert: Omit<OrderItemRow, "id" | "created_at">;
                Update: never; // order_items are immutable
                Relationships: [];
            };
        };
        Views: {
            v_storefront_products: {
                Row: StorefrontProductRow;
                Relationships: [];
            };
        };
        Functions: Record<string, never>;
        Enums: {
            user_role: UserRole;
            store_status: StoreStatus;
            barcode_type: BarcodeType;
            order_status: OrderStatus;
            payment_method: PaymentMethod;
            payment_status: PaymentStatus;
        };
        CompositeTypes: Record<string, never>;
    };
}
