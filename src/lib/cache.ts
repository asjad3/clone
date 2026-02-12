import { unstable_cache } from "next/cache";
import { products } from "@/data/products";
import { stores } from "@/data/stores";
import { areas } from "@/data/areas";

// ==================== ADVANCED CACHING WITH unstable_cache ====================
// unstable_cache allows us to cache expensive server-side computations
// with tag-based invalidation via revalidateTag()

/**
 * Cached function to get products with computed fields
 * Uses unstable_cache with tags for selective invalidation
 */
export const getCachedProducts = unstable_cache(
    async (storeSlug: string, page: number = 0, limit: number = 8) => {
        // Simulate expensive computation/DB query
        const storeProducts = products.filter((p) => p.store_slug === storeSlug);

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
        const store = stores.find((s) => s.slug === slug);
        if (!store) return null;

        // Add computed fields
        return {
            ...store,
            productCount: products.filter((p) => p.store_slug === slug).length,
            areaNames: areas
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
        return areas.map((area) => ({
            ...area,
            storeCount: stores.filter((s) => s.areas.includes(area.id)).length,
        }));
    },
    ["area-stats-cache"],
    {
        tags: ["areas", "stores"],
        revalidate: 3600, // 1 hour
    }
);
