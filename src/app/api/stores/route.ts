import { stores } from "@/data/stores";
import { NextRequest, NextResponse } from "next/server";

// ISR: Revalidate stores every 30 minutes
export const revalidate = 1800;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get("areaId");

    let filteredStores = stores;

    if (areaId) {
        const areaIdNum = parseInt(areaId);
        filteredStores = stores.filter((s) => s.areas.includes(areaIdNum));
    }

    return NextResponse.json(
        { stores: filteredStores, total: filteredStores.length },
        {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
                "Vercel-CDN-Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
            },
        }
    );
}
