/**
 * ============================================================================
 * Supabase Data Access Layer (DAL)
 * ============================================================================
 *
 * This is the SINGLE place where all Supabase queries live.
 * API routes and cache functions call these — never talk to Supabase directly.
 *
 * WHY a separate file?
 *   - One place to change if a query needs tuning
 *   - Easy to test / mock
 *   - Keeps API routes thin and clean
 * ============================================================================
 */

import { createCacheSafeClient } from "@/lib/supabase/server";
import type {
    AreaRow,
    StoreRow,
    StoreAreaRow,
    CategoryRow,
    StorefrontProductRow,
} from "@/types/supabase";
import type { Area, Store, Category, Product, PaginatedProducts } from "@/types";

// ─── Helpers to convert Supabase rows → existing app types ───
// This lets us swap the data source WITHOUT changing any component code.

/** Escape SQL LIKE/ILIKE wildcards to prevent pattern injection */
function escapeLikePattern(input: string): string {
    return input.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

function areaRowToArea(row: AreaRow): Area {
    return {
        id: row.id,
        name: row.name,
        city: row.city,
    };
}

function storeRowToStore(
    row: StoreRow,
    areaIds: number[]
): Store {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        store_type: row.store_type,
        same_day_delivery: row.same_day_delivery,
        delivery_charges: Number(row.delivery_charges),
        min_order_value: Number(row.min_order_value),
        free_delivery_threshold: Number(row.free_delivery_threshold),
        areas: areaIds,
        store_hours: row.store_hours ?? "",
        delivery_hours: row.delivery_hours ?? "",
    };
}

function storefrontRowToProduct(row: StorefrontProductRow): Product {
    return {
        id: row.store_product_id,
        name: row.product_name,
        weight: row.weight ?? "",
        price: Number(row.price),
        oldPrice: row.old_price ? Number(row.old_price) : null,
        category_id: row.category_id,
        image: row.image_url ?? "",
        in_stock: row.is_in_stock,
        store_slug: row.store_slug,
    };
}

function categoryRowToCategory(row: CategoryRow): Category {
    return {
        id: row.id,
        name: row.name,
        parent_id: row.parent_id,
    };
}

// ─── AREAS ───

export async function fetchAreas(): Promise<Area[]> {
    const supabase = createCacheSafeClient();
    const { data, error } = await supabase
        .from("areas")
        .select("*")
        .eq("is_active", true)
        .order("city")
        .order("name");

    if (error) {
        console.error("[DAL] fetchAreas failed");
        return [];
    }

    return (data ?? []).map(areaRowToArea);
}

// ─── STORES ───

export async function fetchStores(areaId?: number): Promise<Store[]> {
    const supabase = createCacheSafeClient();

    // 1. Get stores
    const { data: storeRows, error } = await supabase
        .from("stores")
        .select("*")
        .eq("status", "active")
        .order("name");

    if (error || !storeRows || storeRows.length === 0) {
        if (error) console.error("[DAL] fetchStores failed");
        return [];
    }

    // 2. Get store_areas for those stores
    const storeIds = storeRows.map((s: StoreRow) => s.id);
    const { data: storeAreaRows } = await supabase
        .from("store_areas")
        .select("*")
        .in("store_id", storeIds);

    // Build a map: storeId → [areaId, areaId, ...]
    const areaMap: Record<number, number[]> = {};
    (storeAreaRows ?? []).forEach((sa: StoreAreaRow) => {
        if (!areaMap[sa.store_id]) areaMap[sa.store_id] = [];
        areaMap[sa.store_id].push(sa.area_id);
    });

    // 3. Convert to app types
    let stores = storeRows.map((row: StoreRow) =>
        storeRowToStore(row, areaMap[row.id] ?? [])
    );

    // 4. Filter by area if requested
    if (areaId) {
        stores = stores.filter((s) => s.areas.includes(areaId));
    }

    return stores;
}

export async function fetchStoreBySlug(slug: string): Promise<(Store & { productCount: number; areaNames: string[] }) | null> {
    const supabase = createCacheSafeClient();

    // Get the store
    const { data: row, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error || !row) return null;

    const storeRow = row as StoreRow;

    // Get area IDs for this store
    const { data: storeAreaRows } = await supabase
        .from("store_areas")
        .select("area_id")
        .eq("store_id", storeRow.id);

    const areaIds = (storeAreaRows ?? []).map((sa: { area_id: number }) => sa.area_id);

    // Get area names
    const { data: areaRows } = await supabase
        .from("areas")
        .select("name")
        .in("id", areaIds.length > 0 ? areaIds : [-1]);

    const areaNames = (areaRows ?? []).map((a: { name: string }) => a.name);

    // Count products for this store
    const { count } = await supabase
        .from("store_products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeRow.id)
        .eq("is_active", true);

    const store = storeRowToStore(storeRow, areaIds);

    return {
        ...store,
        productCount: count ?? 0,
        areaNames,
    };
}

// ─── CATEGORIES ───

export async function fetchCategories(): Promise<Category[]> {
    const supabase = createCacheSafeClient();
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .order("name");

    if (error) {
        console.error("[DAL] fetchCategories failed");
        return [];
    }

    return (data ?? []).map(categoryRowToCategory);
}

// ─── PRODUCTS (via storefront view) ───

export async function fetchProducts(opts: {
    storeSlug?: string;
    cursor?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    inStockOnly?: boolean;
    sortBy?: string;
}): Promise<PaginatedProducts> {
    const {
        storeSlug,
        cursor = 0,
        limit = 8,
        search,
        categoryId,
        inStockOnly = true,
        sortBy = "relevance",
    } = opts;

    const supabase = createCacheSafeClient();

    let query = supabase
        .from("v_storefront_products")
        .select("*", { count: "exact" })
        .eq("is_active", true);

    // Filter by store
    if (storeSlug) {
        query = query.eq("store_slug", storeSlug);
    }

    // Filter by search (escape wildcards to prevent pattern injection)
    if (search) {
        query = query.ilike("product_name", `%${escapeLikePattern(search)}%`);
    }

    // Filter by category
    if (categoryId) {
        query = query.eq("category_id", categoryId);
    }

    // Filter by stock
    if (inStockOnly) {
        query = query.eq("is_in_stock", true);
    }

    // Sorting
    if (sortBy === "price-asc") {
        query = query.order("price", { ascending: true });
    } else if (sortBy === "price-desc") {
        query = query.order("price", { ascending: false });
    } else if (sortBy === "name-asc") {
        query = query.order("product_name", { ascending: true });
    } else {
        query = query.order("store_product_id", { ascending: true });
    }

    // Pagination (offset-based using range)
    query = query.range(cursor, cursor + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error("[DAL] fetchProducts failed");
        return { products: [], nextCursor: null, hasMore: false, total: 0 };
    }

    const products = (data ?? []).map(storefrontRowToProduct);
    const total = count ?? 0;
    const hasMore = cursor + limit < total;
    const nextCursor = hasMore ? cursor + limit : null;

    return { products, nextCursor, hasMore, total };
}
