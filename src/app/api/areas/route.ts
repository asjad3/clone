import { areas as staticAreas } from "@/data/areas";
import { fetchAreas } from "@/lib/supabase/dal";
import { NextResponse } from "next/server";

// ISR: Revalidate areas every 1 hour (areas rarely change)
export const revalidate = 3600;

const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

export async function GET() {
    const areas = USE_SUPABASE ? await fetchAreas() : staticAreas;

    return NextResponse.json(
        { areas, total: areas.length },
        {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
                "CDN-Cache-Control": "public, s-maxage=3600",
                "Vercel-CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
        }
    );
}
