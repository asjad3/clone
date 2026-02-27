import { products as staticProducts } from "@/data/products";
import { fetchProducts } from "@/lib/supabase/dal";
import { NextRequest, NextResponse } from "next/server";

// ISR: Revalidate products every 5 minutes
export const revalidate = 300;

const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug") ?? searchParams.get("store");
    const cursor = searchParams.get("cursor");
    const rawLimit = parseInt(searchParams.get("limit") || "8", 10);
    const limit = Math.min(Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 8), MAX_LIMIT);
    const search = searchParams.get("search")?.trim().slice(0, 100).toLowerCase() || undefined;
    const categoryId = searchParams.get("categoryId");
    const inStockOnly = searchParams.get("inStockOnly") !== "false";
    const sortBy = searchParams.get("sortBy") || "relevance";

    // Validate slug (alphanumeric + hyphens only)
    if (storeSlug && !/^[a-z0-9-]+$/.test(storeSlug)) {
        return NextResponse.json({ error: "Invalid store slug" }, { status: 400 });
    }

    // Validate sortBy against allowed values
    const allowedSorts = ["relevance", "price-asc", "price-desc", "name-asc"];
    if (!allowedSorts.includes(sortBy)) {
        return NextResponse.json({ error: "Invalid sortBy value" }, { status: 400 });
    }

    // Validate categoryId
    let parsedCategoryId: number | undefined;
    if (categoryId) {
        parsedCategoryId = parseInt(categoryId, 10);
        if (!Number.isFinite(parsedCategoryId) || parsedCategoryId < 1) {
            return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 });
        }
    }

    let startIndex = 0;
    if (cursor) {
        const parsedCursor = parseInt(cursor, 10);
        if (!Number.isNaN(parsedCursor) && parsedCursor >= 0) {
            startIndex = Math.min(parsedCursor, 100_000); // prevent absurd offsets
        }
    }

    // ─── Supabase path: real database query ───
    if (USE_SUPABASE) {
        const result = await fetchProducts({
            storeSlug: storeSlug ?? undefined,
            cursor: startIndex,
            limit,
            search,
            categoryId: parsedCategoryId,
            inStockOnly,
            sortBy,
        });

        return NextResponse.json(result, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
        });
    }

    // ─── Fallback: static data (demo mode) ───
    await new Promise((resolve) => setTimeout(resolve, 100));

    let filtered = [...staticProducts];

    if (storeSlug) {
        filtered = filtered.filter((p) => p.store_slug === storeSlug);
    }
    if (search) {
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(search));
    }
    if (categoryId) {
        filtered = filtered.filter((p) => p.category_id === parsedCategoryId);
    }
    if (inStockOnly) {
        filtered = filtered.filter((p) => p.in_stock);
    }
    if (sortBy === "price-asc") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (filtered.length === 0) {
        return NextResponse.json(
            { products: [], nextCursor: null, hasMore: false, total: 0 },
            {
                status: 200,
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                    "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                },
            }
        );
    }

    // Demo mode: cycle sample items infinitely
    const paginatedProducts = Array.from({ length: limit }, (_, i) => {
        const idx = (startIndex + i) % filtered.length;
        return filtered[idx];
    });

    return NextResponse.json(
        {
            products: paginatedProducts,
            nextCursor: startIndex + limit,
            hasMore: true,
            total: filtered.length,
        },
        {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
        }
    );
}
