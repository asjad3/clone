import { products } from "@/data/products";
import { NextRequest, NextResponse } from "next/server";

// ISR: Revalidate products every 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "8");
    const search = searchParams.get("search")?.toLowerCase();
    const categoryId = searchParams.get("categoryId");
    const inStockOnly = searchParams.get("inStockOnly") !== "false";

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

    // Cursor-based pagination
    let startIndex = 0;
    if (cursor) {
        const cursorId = parseInt(cursor);
        const cursorIndex = filtered.findIndex((p) => p.id === cursorId);
        if (cursorIndex !== -1) {
            startIndex = cursorIndex + 1;
        }
    }

    const paginatedProducts = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filtered.length;
    const nextCursor = hasMore ? paginatedProducts[paginatedProducts.length - 1]?.id : null;

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
