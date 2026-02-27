import { stores as staticStores } from "@/data/stores";
import { fetchStores } from "@/lib/supabase/dal";
import { NextRequest, NextResponse } from "next/server";

// ISR: Revalidate stores every 30 minutes
export const revalidate = 1800;

const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get("areaId");

    // Validate areaId
    let areaIdNum: number | undefined;
    if (areaId) {
        areaIdNum = parseInt(areaId, 10);
        if (!Number.isFinite(areaIdNum) || areaIdNum < 1) {
            return NextResponse.json({ error: "Invalid areaId" }, { status: 400 });
        }
    }

    let filteredStores;

    if (USE_SUPABASE) {
        filteredStores = await fetchStores(areaIdNum);
    } else {
        filteredStores = staticStores;
        if (areaIdNum) {
            filteredStores = staticStores.filter((s) => s.areas.includes(areaIdNum));
        }
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
