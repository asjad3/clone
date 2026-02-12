import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

// On-Demand ISR Revalidation API Route
// Enables webhook-triggered cache invalidation

export async function POST(request: NextRequest) {
    const secret = request.headers.get("x-revalidation-secret");

    if (secret !== process.env.REVALIDATION_SECRET) {
        return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { tag, path, type = "tag" } = body;

        if (type === "tag" && tag) {
            // Next.js 16: revalidateTag requires cacheLife profile
            revalidateTag(tag, "max");
            return NextResponse.json({
                revalidated: true,
                type: "tag",
                tag,
                timestamp: Date.now(),
            });
        }

        if (type === "path" && path) {
            revalidatePath(path, "page");
            return NextResponse.json({
                revalidated: true,
                type: "path",
                path,
                timestamp: Date.now(),
            });
        }

        return NextResponse.json({ error: "Missing tag or path" }, { status: 400 });
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
