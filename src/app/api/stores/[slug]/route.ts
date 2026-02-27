import { stores as staticStores } from "@/data/stores";
import { fetchStoreBySlug } from "@/lib/supabase/dal";
import { NextRequest, NextResponse } from "next/server";

// ISR: Revalidate individual store every 10 minutes
export const revalidate = 600;

const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    let store;
    if (USE_SUPABASE) {
        store = await fetchStoreBySlug(slug);
    } else {
        store = staticStores.find((s) => s.slug === slug) ?? null;
    }

    if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json(
        { store },
        {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
                "Vercel-CDN-Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
            },
        }
    );
}
