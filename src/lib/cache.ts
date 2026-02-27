import { unstable_cache } from "next/cache";

// ─── Static data (fallback when Supabase is not configured) ───
import { products as staticProducts } from "@/data/products";
import { stores as staticStores } from "@/data/stores";
import { areas as staticAreas } from "@/data/areas";

// ─── Supabase DAL (the real database) ───
import { fetchAreas, fetchStores, fetchStoreBySlug, fetchProducts } from "@/lib/supabase/dal";

// ============================================================================
// Feature flag: should we use Supabase or static data?
//
//   In .env.local, set NEXT_PUBLIC_USE_SUPABASE=true to use the database.
//   If it's missing or "false", the old static JSON arrays are used.
//   This lets you develop without Docker/Supabase running.
// ============================================================================
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

/**
 * Cached function to get products with computed fields
 * Uses unstable_cache with tags for selective invalidation
 */
export const getCachedProducts = unstable_cache(
    async (storeSlug: string, page: number = 0, limit: number = 8) => {
        if (USE_SUPABASE) {
            return fetchProducts({
                storeSlug,
                cursor: page * limit,
                limit,
            });
        }

        // ── Fallback: static data ──
        const storeProducts = staticProducts.filter((p) => p.store_slug === storeSlug);
        const start = page * limit;
        const paginated = storeProducts.slice(start, start + limit);
        const hasMore = start + limit < storeProducts.length;
        const total = storeProducts.length;

        return {
            products: paginated,
            hasMore,
            total,
            nextCursor: hasMore ? start + limit : null,
            page,
        };
    },
    ["products-cache"],
    {
        tags: ["products"],
        revalidate: 300, // 5 minutes
    }
);

/**
 * Cached function to get store with computed delivery info
 */
export const getCachedStore = unstable_cache(
    async (slug: string) => {
        if (USE_SUPABASE) {
            return fetchStoreBySlug(slug);
        }

        // ── Fallback: static data ──
        const store = staticStores.find((s) => s.slug === slug);
        if (!store) return null;

        return {
            ...store,
            productCount: staticProducts.filter((p) => p.store_slug === slug).length,
            areaNames: staticAreas
                .filter((a) => store.areas.includes(a.id))
                .map((a) => a.name),
        };
    },
    ["store-detail-cache"],
    {
        tags: ["stores"],
        revalidate: 600, // 10 minutes
    }
);

/**
 * Cached function to get area statistics
 */
export const getCachedAreaStats = unstable_cache(
    async () => {
        if (USE_SUPABASE) {
            const [areas, stores] = await Promise.all([
                fetchAreas(),
                fetchStores(),
            ]);
            return areas.map((area) => ({
                ...area,
                storeCount: stores.filter((s) => s.areas.includes(area.id)).length,
            }));
        }

        // ── Fallback: static data ──
        return staticAreas.map((area) => ({
            ...area,
            storeCount: staticStores.filter((s) => s.areas.includes(area.id)).length,
        }));
    },
    ["area-stats-cache"],
    {
        tags: ["areas", "stores"],
        revalidate: 3600, // 1 hour
    }
);
