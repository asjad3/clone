import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { timingSafeEqual } from "crypto";

// On-Demand ISR Revalidation API Route
// Enables webhook-triggered cache invalidation

/** Constant-time string comparison to prevent timing attacks */
function safeCompare(a: string, b: string): boolean {
    try {
        const bufA = Buffer.from(a, "utf-8");
        const bufB = Buffer.from(b, "utf-8");
        if (bufA.length !== bufB.length) {
            // Compare against self to keep constant time, then return false
            timingSafeEqual(bufA, bufA);
            return false;
        }
        return timingSafeEqual(bufA, bufB);
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    const secret = request.headers.get("x-revalidation-secret");
    const expected = process.env.REVALIDATION_SECRET;

    if (!expected) {
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (!secret || !safeCompare(secret, expected)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { tag, path, type = "tag" } = body;

        if (type === "tag" && typeof tag === "string" && /^[a-zA-Z0-9_-]+$/.test(tag)) {
            revalidateTag(tag, "max");
            return NextResponse.json({
                revalidated: true,
                type: "tag",
                tag,
            });
        }

        if (type === "path" && typeof path === "string" && path.startsWith("/")) {
            revalidatePath(path, "page");
            return NextResponse.json({
                revalidated: true,
                type: "path",
                path,
            });
        }

        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
