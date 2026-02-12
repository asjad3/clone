import { areas } from "@/data/areas";
import { NextResponse } from "next/server";

// ISR: Revalidate areas every 1 hour (areas rarely change)
export const revalidate = 3600;

// Force static generation for this route
export const dynamic = "force-static";

export async function GET() {
    // Simulate server-side data fetching with caching
    const response = NextResponse.json(
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
    return response;
}
