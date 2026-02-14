import { products } from "@/data/products";
import { NextRequest, NextResponse } from "next/server";

// ISR: Revalidate products every 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug") ?? searchParams.get("store");
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "8");
    const search = searchParams.get("search")?.toLowerCase();
    const categoryId = searchParams.get("categoryId");
    const inStockOnly = searchParams.get("inStockOnly") !== "false";
    const sortBy = searchParams.get("sortBy") || "relevance";

    // Simulate server processing delay for realism
    await new Promise((resolve) => setTimeout(resolve, 100));

    let filtered = [...products];

    // Filter by store
    if (storeSlug) {
        filtered = filtered.filter((p) => p.store_slug === storeSlug);
    }

    // Filter by search query
    if (search) {
        filtered = filtered.filter((p) =>
            p.name.toLowerCase().includes(search)
        );
    }

    // Filter by category
    if (categoryId) {
        filtered = filtered.filter((p) => p.category_id === parseInt(categoryId));
    }

    // Filter by stock status
    if (inStockOnly) {
        filtered = filtered.filter((p) => p.in_stock);
    }

    // Sorting
    if (sortBy === "price-asc") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Cursor-based pagination (cursor is an index offset)
    let startIndex = 0;
    if (cursor) {
        const parsedCursor = parseInt(cursor);
        if (!Number.isNaN(parsedCursor) && parsedCursor >= 0) {
            startIndex = parsedCursor;
        }
    }

    if (filtered.length === 0) {
        return NextResponse.json(
            {
                products: [],
                nextCursor: null,
                hasMore: false,
                total: 0,
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

    // Demo mode: cycle sample items infinitely while moving cursor forward
    const paginatedProducts = Array.from({ length: limit }, (_, i) => {
        const idx = (startIndex + i) % filtered.length;
        return filtered[idx];
    });
    const hasMore = true;
    const nextCursor = startIndex + limit;

    return NextResponse.json(
        {
            products: paginatedProducts,
            nextCursor,
            hasMore,
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
