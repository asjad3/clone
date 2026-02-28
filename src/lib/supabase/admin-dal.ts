/**
 * ============================================================================
 * Supabase Admin Data Access Layer (DAL)
 * ============================================================================
 *
 * Uses createAdminClient() (service_role key) to bypass RLS.
 * Only used by admin API routes — never exposed to the browser.
 * ============================================================================
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

// ─── DASHBOARD STATS ───

export async function fetchDashboardStats() {
    const sb = createAdminClient();

    const [products, stores, brands, categories, areas, orders] = await Promise.all([
        sb.from("global_products").select("id", { count: "exact", head: true }),
        sb.from("stores").select("id", { count: "exact", head: true }),
        sb.from("brands").select("id", { count: "exact", head: true }),
        sb.from("categories").select("id", { count: "exact", head: true }),
        sb.from("areas").select("id", { count: "exact", head: true }),
        sb.from("orders").select("id", { count: "exact", head: true }),
    ]);

    return {
        products: products.count ?? 0,
        stores: stores.count ?? 0,
        brands: brands.count ?? 0,
        categories: categories.count ?? 0,
        areas: areas.count ?? 0,
        orders: orders.count ?? 0,
    };
}

// ─── GLOBAL PRODUCTS ───

export async function fetchAdminProducts(opts?: {
    page?: number;
    limit?: number;
    search?: string;
}) {
    const { page = 0, limit = 20, search } = opts ?? {};
    const sb = createAdminClient();

    let query = sb
        .from("global_products")
        .select("*, brands(name), categories(name)", { count: "exact" })
        .order("id", { ascending: true })
        .range(page * limit, page * limit + limit - 1);

    if (search) {
        query = query.ilike("name", `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) {
        console.error("[AdminDAL] fetchAdminProducts:", error.message);
        return { data: [], total: 0 };
    }
    return { data: data ?? [], total: count ?? 0 };
}

export async function fetchAdminProductById(id: number) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("global_products")
        .select("*")
        .eq("id", id)
        .single();
    if (error) return null;
    return data;
}

export async function createAdminProduct(product: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("global_products")
        .insert(product)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateAdminProduct(id: number, updates: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("global_products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function deleteAdminProduct(id: number) {
    const sb = createAdminClient();
    const { error } = await sb.from("global_products").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

// ─── CATEGORIES ───

export async function fetchAdminCategories() {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("categories")
        .select("*")
        .order("path", { ascending: true });
    if (error) {
        console.error("[AdminDAL] fetchAdminCategories:", error.message);
        return [];
    }
    return data ?? [];
}

export async function createAdminCategory(cat: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("categories")
        .insert(cat)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateAdminCategory(id: number, updates: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function deleteAdminCategory(id: number) {
    const sb = createAdminClient();
    const { error } = await sb.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

// ─── BRANDS ───

export async function fetchAdminBrands() {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("brands")
        .select("*")
        .order("name", { ascending: true });
    if (error) {
        console.error("[AdminDAL] fetchAdminBrands:", error.message);
        return [];
    }
    return data ?? [];
}

export async function createAdminBrand(brand: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("brands")
        .insert(brand)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateAdminBrand(id: number, updates: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("brands")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function deleteAdminBrand(id: number) {
    const sb = createAdminClient();
    const { error } = await sb.from("brands").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

// ─── STORES ───

export async function fetchAdminStores() {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("stores")
        .select("*, store_areas(area_id, areas(name))")
        .order("name", { ascending: true });
    if (error) {
        console.error("[AdminDAL] fetchAdminStores:", error.message);
        return [];
    }
    return data ?? [];
}

export async function createAdminStore(store: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("stores")
        .insert(store)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateAdminStore(id: number, updates: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("stores")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function deleteAdminStore(id: number) {
    const sb = createAdminClient();
    const { error } = await sb.from("stores").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

// ─── AREAS ───

export async function fetchAdminAreas() {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("areas")
        .select("*")
        .order("city", { ascending: true })
        .order("name", { ascending: true });
    if (error) {
        console.error("[AdminDAL] fetchAdminAreas:", error.message);
        return [];
    }
    return data ?? [];
}

export async function createAdminArea(area: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("areas")
        .insert(area)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateAdminArea(id: number, updates: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("areas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function deleteAdminArea(id: number) {
    const sb = createAdminClient();
    const { error } = await sb.from("areas").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

// ─── STORE PRODUCTS ───

export async function fetchAdminStoreProducts(opts?: {
    storeId?: number;
    page?: number;
    limit?: number;
    search?: string;
}) {
    const { storeId, page = 0, limit = 20, search } = opts ?? {};
    const sb = createAdminClient();

    let query = sb
        .from("v_storefront_products")
        .select("*", { count: "exact" })
        .order("store_product_id", { ascending: true })
        .range(page * limit, page * limit + limit - 1);

    if (storeId) {
        query = query.eq("store_id", storeId);
    }

    if (search) {
        query = query.ilike("product_name", `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) {
        console.error("[AdminDAL] fetchAdminStoreProducts:", error.message);
        return { data: [], total: 0 };
    }
    return { data: data ?? [], total: count ?? 0 };
}

export async function fetchAdminStoreProductRaw(id: number) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("store_products")
        .select("*")
        .eq("id", id)
        .single();
    if (error) return null;
    return data;
}

export async function createAdminStoreProduct(product: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("store_products")
        .insert(product)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateAdminStoreProduct(id: number, updates: Record<string, unknown>) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("store_products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function deleteAdminStoreProduct(id: number) {
    const sb = createAdminClient();
    const { error } = await sb.from("store_products").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

// ─── ORDERS ───

export async function fetchAdminOrders(opts?: {
    page?: number;
    limit?: number;
    status?: string;
}) {
    const { page = 0, limit = 20, status } = opts ?? {};
    const sb = createAdminClient();

    let query = sb
        .from("orders")
        .select("*", { count: "exact" })
        .order("placed_at", { ascending: false })
        .range(page * limit, page * limit + limit - 1);

    if (status && status !== "all") {
        query = query.eq("status", status);
    }

    const { data, error, count } = await query;
    if (error) {
        console.error("[AdminDAL] fetchAdminOrders:", error.message);
        return { data: [], total: 0 };
    }
    return { data: data ?? [], total: count ?? 0 };
}

export async function fetchAdminOrderById(id: string) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .single();
    if (error) return null;
    return data;
}

export async function updateAdminOrderStatus(id: string, status: string) {
    const sb = createAdminClient();
    const { data, error } = await sb
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}
