import { stores } from "@/data/stores";
import { NextRequest, NextResponse } from "next/server";

// ISR: Revalidate individual store every 10 minutes
export const revalidate = 600;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const store = stores.find((s) => s.slug === slug);

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
